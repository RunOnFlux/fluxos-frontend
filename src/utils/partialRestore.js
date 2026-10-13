// Restoring a PARTIAL backup: an archive that holds only some of a component's
// appdata.
//
// Why it needs its own path. FluxOS's appendrestoretask empties the whole of
// appdata before it unpacks, which is right for the full archive it was written
// for and wrong for one that only carries the world. Restored that way, a
// partial backup deletes everything it does not hold: for RuneScape:
// Dragonwilds, the 5.4 GB game install, which comes back only when the server
// downloads it again on start, and never when its version is frozen.
//
// Where partial backups come from. The FluxDrive backup middleware
// (fluxbackupmiddleware, config/backupProfiles.js) archives only the paths a
// game cannot rebuild by itself. It always adds an empty `.flux-backup/`
// directory at the root of appdata, which keeps the members appdata-relative
// (`RSDragonwilds/Saved/SaveGames/...`) exactly as in a full backup, and marks
// the archive: a full backup starts with `./`, never with that directory. The
// middleware also reports the profile in getbackuplist as `profile`; the marker
// is what an uploaded file or a remote URL, which carry no such field, are
// recognised by.
//
// What a partial restore does. Each top-level path the archive carries (its
// "roots", e.g. `RSDragonwilds/Saved/SaveGames`) is replaced as a whole, the
// same result a full restore gives for those paths, and everything else in
// appdata is left alone:
//
//   1. unpack into a staging folder under `backup/` while the app still runs,
//      which proves the archive is whole before anything is touched (`backup/`
//      is outside the container and kept out of Syncthing);
//   2. with the app stopped, delete each root from appdata;
//   3. move the staging folder onto appdata. A folder over a folder MERGES in
//      FluxOS, so this puts the roots back and keeps the rest;
//   4. start the app and tidy up.
//
// The games hub (runonflux.com/games, src/utils/partialRestore.js) restores
// these archives the same way.

import { describeRefusal, pollOperation, startedJob } from '@/utils/volumeOperations'

export const PARTIAL_MARKER = '.flux-backup'

// Where the archive is unpacked before it goes onto appdata. Under backup/,
// outside the container.
export const PARTIAL_STAGING = 'backup/partial-restore'

const BLOCK = 512
const MAX_BUSY_RETRIES = 12
const OPERATION_TIMEOUT_MS = 30 * 60 * 1000
const decoder = new TextDecoder()

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// Reads exact byte counts out of a stream of Uint8Array chunks.
function byteReader(stream) {
  const reader = stream.getReader()
  let buffer = new Uint8Array(0)
  let done = false

  const fill = async n => {
    while (buffer.length < n && !done) {
      const { value, done: finished } = await reader.read()
      if (finished) {
        done = true
      } else if (value?.length) {
        const next = new Uint8Array(buffer.length + value.length)

        next.set(buffer)
        next.set(value, buffer.length)
        buffer = next
      }
    }
  }

  return {
    // Exactly n bytes, or null when the stream ends first.
    async read(n) {
      await fill(n)
      if (buffer.length < n) return null
      const out = buffer.slice(0, n)

      buffer = buffer.slice(n)

      return out
    },
    async skip(n) {
      let left = n
      while (left > 0) {
        await fill(Math.min(left, 1 << 20))
        if (!buffer.length) return false
        const take = Math.min(left, buffer.length)

        buffer = buffer.slice(take)
        left -= take
      }

      return true
    },
    cancel: () => reader.cancel().catch(() => {}),
  }
}

const field = (block, start, length) => {
  const bytes = block.subarray(start, start + length)
  const end = bytes.indexOf(0)

  return decoder.decode(end === -1 ? bytes : bytes.subarray(0, end))
}

const octal = (block, start, length) => {
  const text = field(block, start, length).trim()

  return text ? parseInt(text, 8) : 0
}

// The `path` record of a pax extended header, if it has one.
const paxPath = bytes => {
  const match = decoder.decode(bytes).match(/(?:^|\n)\d+ path=([^\n]*)\n/)

  return match ? match[1] : null
}

const INCOMPLETE = 'The archive ends before its last entry: it is incomplete.'

// The entries of an uncompressed tar stream, in archive order:
// `{ name, isDirectory }`. GNU long names (`L`) and pax `path` records are
// applied to the entry that follows them. Ends at the end-of-archive block.
// Throws when the stream ends inside the archive.
export async function* tarEntries(stream) {
  const input = byteReader(stream)
  let longName = null
  try {
    for (;;) {
      const block = await input.read(BLOCK)
      if (!block) throw new Error(INCOMPLETE)
      if (block.every(b => b === 0)) return

      const size = octal(block, 124, 12)
      const type = String.fromCharCode(block[156] || 48)
      const padded = Math.ceil(size / BLOCK) * BLOCK

      if (type === 'L' || type === 'x' || type === 'g') {
        const data = await input.read(padded)
        if (!data) throw new Error(INCOMPLETE)
        if (type === 'L') longName = field(data, 0, size)
        else if (type === 'x') longName = paxPath(data.subarray(0, size)) ?? longName
        continue
      }

      const prefix = field(block, 345, 155)
      const plain = field(block, 0, 100)
      const name = longName ?? (prefix ? `${prefix}/${plain}` : plain)

      longName = null
      yield { name, isDirectory: type === '5' || name.endsWith('/') }

      if (padded && !(await input.skip(padded))) throw new Error(INCOMPLETE)
    }
  } finally {
    input.cancel()
  }
}

// `./a/b/` -> `a/b`; the archive's own root (`./`) -> ''.
export const normalizeEntry = name => String(name || '').replace(/^(\.\/)+/, '').replace(/\/+$/, '')

// The paths a partial archive replaces: every entry none of whose parent
// folders is itself in the archive, the marker aside. Refuses a path that could
// leave appdata, since each root is deleted before the archive lands.
export function rootsOf(names) {
  const entries = new Set(names.map(normalizeEntry).filter(name => name && name !== '.'))
  const roots = []
  for (const name of entries) {
    if (name === PARTIAL_MARKER || name.startsWith(`${PARTIAL_MARKER}/`)) continue
    const parts = name.split('/')
    if (name.startsWith('/') || parts.some(part => part === '..' || part === '.' || part === '')) {
      throw new Error(`The backup holds a path outside the app's data: ${name}`)
    }
    const nested = parts.slice(0, -1).some((_, i) => entries.has(parts.slice(0, i + 1).join('/')))
    if (!nested) roots.push(name)
  }

  return roots
}

// An error about an archive that did start with the marker: it is a partial
// backup, just not one that can be restored, so a caller must not hand it to
// appendrestoretask instead.
function markPartial(error) {
  error.partial = true

  return error
}

// Reads a .tar.gz stream and says whether it is a partial backup.
//
// Only the first entry decides: the middleware puts the marker first, and a
// full backup's first entry is `./`. So a multi-GB full archive costs one
// block, while a partial one (kilobytes) is read to the end to learn its roots,
// which also proves it is whole.
//
// @returns {Promise<{partial: false} | {partial: true, roots: string[]}>}
export async function inspectBackupArchive(stream) {
  let entries
  try {
    entries = tarEntries(stream.pipeThrough(new DecompressionStream('gzip')))
  } catch {
    throw new Error('This file is not a .tar.gz archive.')
  }
  const names = []
  try {
    for await (const entry of entries) {
      if (!names.length && normalizeEntry(entry.name) !== PARTIAL_MARKER) return { partial: false }
      names.push(entry.name)
    }
  } catch (error) {
    if (!names.length) throw new Error('This file is not a readable .tar.gz archive.')
    throw markPartial(error)
  }
  if (!names.length) throw new Error('This backup is empty.')
  let roots
  try {
    roots = rootsOf(names)
  } catch (error) {
    throw markPartial(error)
  }
  if (!roots.length) throw markPartial(new Error('This backup holds no files to restore.'))

  return { partial: true, roots }
}

// Whether the archive at a URL is a partial backup, read from the browser. A
// full archive is told apart by its first block, so a multi-GB one is not
// downloaded. null when it cannot be read at all (a remote URL without CORS, a
// server answering with an error), which leaves the caller to decide. Throws
// for an archive that starts as a partial backup but cannot be restored.
//
// @returns {Promise<{roots: string[]} | false | null>}
export async function partialArchiveAt(url) {
  let response
  try {
    response = await fetch(url, { cache: 'no-store' })
  } catch {
    return null
  }
  if (!response.ok || !response.body) return null
  try {
    const result = await inspectBackupArchive(response.body)

    return result.partial ? { roots: result.roots } : false
  } catch (error) {
    // A partial backup that cannot be restored is an answer, not "unreadable".
    if (error.partial) throw error

    return null
  }
}

const isMissing = data => {
  const payload = data?.data
  const code = payload?.code
  const message = typeof payload === 'string' ? payload : payload?.message || ''

  return code === 'ENOENT' || /ENOENT|no such file|does not exist|not found/i.test(message)
}

const errorMessage = data => {
  const payload = data?.data

  return typeof payload === 'string' ? payload : payload?.message || ''
}

/**
 * Sends one volume request and waits it out: a 503 is the node busy with
 * another operation on this app and is retried after its Retry-After, a 202 is
 * a job polled to its end. Returns the 200 body, or `{ status: 'success' }` for
 * a job that succeeded.
 *
 * @param {Function} execute (command, postObject) => axios response, or nothing after a logout
 */
async function settle(execute, command, postObject = null) {
  for (let attempt = 0; ; attempt += 1) {
    let response
    try {
      response = await execute(command, postObject)
    } catch (error) {
      const refusal = describeRefusal(error)
      if (refusal && attempt < MAX_BUSY_RETRIES) {
        await delay(refusal.retryAfterSeconds * 1000)
        continue
      }
      throw error
    }
    if (!response) throw new Error('The session ended before the restore finished.')

    const job = startedJob(response)
    if (!job) return response.data

    const view = await pollOperation(execute, job, { timeoutMs: OPERATION_TIMEOUT_MS })
    if (!view) throw new Error('The session ended before the restore finished.')
    if (view.status === 'Succeeded') return { status: 'success' }
    if (view.timedOut) throw new Error('The node is still working on the restore after 30 minutes.')

    return {
      status: 'error',
      data: { code: view.error?.code, message: view.error?.detail || view.error?.title || `The operation ended ${view.status}.` },
    }
  }
}

/**
 * Restores a partial archive that is already on the volume.
 *
 * @param {object} p
 * @param {Function} p.execute     the page's executeLocalCommand, bound to the instance
 * @param {string} p.appname
 * @param {string} p.component
 * @param {string} p.archivePath   the archive, relative to the volume root
 * @param {string[]} p.roots       from inspectBackupArchive
 * @param {(fn: () => Promise<void>) => Promise<void>} p.runStopped runs fn with the app
 *        stopped and starts it again afterwards (withAppStopped)
 * @param {(step: string) => void} [p.onStep] called with 'unpacking' and 'replacing'
 */
export async function restorePartialArchive({
  execute, appname, component, archivePath, roots, runStopped, onStep = () => {},
}) {
  const operate = async (route, source, destination) => {
    const data = await settle(execute, `/apps/${route}`, {
      appname, component, source, destination, overwrite: true,
    })
    if (data?.status !== 'success') throw new Error(errorMessage(data) || `The ${route} did not finish.`)
  }

  const remove = async path => {
    const data = await settle(execute, `/apps/removeobject/${appname}/${component}/${encodeURIComponent(path)}`)
    if (data?.status !== 'success' && !isMissing(data)) {
      throw new Error(errorMessage(data) || `Could not remove ${path}.`)
    }
  }

  onStep('unpacking')
  await remove(PARTIAL_STAGING)
  await operate('extractobject', archivePath, PARTIAL_STAGING)
  await remove(`${PARTIAL_STAGING}/${PARTIAL_MARKER}`)

  await runStopped(async () => {
    onStep('replacing')
    for (const root of roots) {
      await remove(`appdata/${root}`)
    }
    try {
      await operate('moveobject', PARTIAL_STAGING, 'appdata')
    } catch (error) {
      // The roots are already gone from appdata, so the unpacked copy is the
      // only one on the node. It is left where it is, outside the container,
      // and a retry starts over from the archive anyway.
      throw new Error(`${error.message} The unpacked backup was kept in ${PARTIAL_STAGING}; restoring again will put it back.`)
    }
  })

  // The move took the staging folder's contents; what is left is the empty folder.
  await remove(PARTIAL_STAGING).catch(() => {})
}

// Raised when the app is still running after the stop: files put back under a
// running game server are overwritten by the world it holds in memory on its
// next save, so nothing is changed.
export class AppNotStoppedError extends Error {
  constructor(appname) {
    super(`${appname} did not stop, so nothing was changed.`)
    this.name = 'AppNotStoppedError'
  }
}

/**
 * Whether the app runs on the addressed node: 'running', 'stopped' or 'unknown'.
 * Paused counts as running.
 */
export async function getAppRunState(execute, appname) {
  try {
    // Past FluxOS's apicache: a stale hit right after a stop reads as running.
    const response = await execute('/apps/listrunningapps', null, true)
    const data = response?.data
    if (data?.status !== 'success' || !Array.isArray(data.data)) return 'unknown'

    return data.data.some(container => container.Names?.[0]?.includes(appname)) ? 'running' : 'stopped'
  } catch {
    return 'unknown'
  }
}

async function startApp(execute, appname, schedule) {
  let observed = 'unknown'
  for (const wait of schedule) {
    if (wait > 0) await delay(wait)
    try {
      const response = await execute(`/apps/appstart/${appname}`)
      if (response?.data?.status === 'success') return 'running'
    } catch {
      // A node that blipped is checked below rather than taken at its word.
    }
    await delay(2000)
    observed = await getAppRunState(execute, appname)
    if (observed === 'running') return 'running'
  }

  return observed
}

async function stopApp(execute, appname) {
  try {
    await execute(`/apps/appstop/${appname}`)
  } catch {
    // Verified by the caller.
  }
}

/**
 * Run `fn` with the app stopped on the addressed node, then start it again.
 *
 * An app that is already stopped stays stopped: a deliberate stop is never
 * undone as a side effect of a restore. One that will not stop after a retry
 * makes it throw AppNotStoppedError WITHOUT running `fn`; a start is still
 * sent, because a stop FluxOS only accepted lands later as an operator lock
 * nothing else lifts.
 *
 * @param {{onPhase?: (phase: 'stopping'|'starting') => void}} [opts]
 * @returns {Promise<'running'|'stopped'|'unknown'>} the app's state afterwards
 */
export async function withAppStopped(execute, appname, fn, { onPhase = () => {}, settleMs = 5000 } = {}) {
  // 'unknown' is treated as running: starting an app that was already down is
  // harmless, leaving a running one down is not.
  if ((await getAppRunState(execute, appname)) === 'stopped') {
    await fn()

    return 'stopped'
  }

  onPhase('stopping')
  await stopApp(execute, appname)
  await delay(settleMs)
  if ((await getAppRunState(execute, appname)) === 'running') {
    await stopApp(execute, appname)
    await delay(settleMs)
  }
  if ((await getAppRunState(execute, appname)) !== 'stopped') {
    onPhase('starting')
    await startApp(execute, appname, [0, 5000, 15000])
    throw new AppNotStoppedError(appname)
  }

  let failure = null
  try {
    await fn()
  } catch (error) {
    failure = error
  }
  onPhase('starting')

  // FluxOS can be restarting when the first start lands, so this keeps trying
  // for about two minutes, whether or not the work succeeded.
  const startState = await startApp(execute, appname, [0, 5000, 15000, 30000, 60000])
  if (failure) throw failure

  return startState
}
