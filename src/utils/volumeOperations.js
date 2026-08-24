// Volume file operations answer in three shapes and the browser has to read
// all three, because two of them are not errors.
//
//   200 - the work finished inline, and the body is the result.
//   202 - the work outlived the node's inline deadline and continues as a job.
//         The body carries a jobId to poll; treating it as done reports success
//         while the file is still there.
//   503 - the node is busy, not broken. Either another operation is running for
//         this app (one at a time) or the node is still fetching the executor
//         image. Axios rejects on it, so without this it surfaces as
//         "Request failed with status code 503".
//
// The node's own contract is in FluxOS `ZelBack/src/services/utils/jobRegistry.js`
// and the routes above `/apps/operations/:jobId`.

// Canonical spelling comes from the node: one L in Canceled. Evicted is the
// node taking the work away, which is neither the caller's fault nor their
// request, and is reported as itself rather than folded into either.
const TERMINAL_STATUSES = ['Succeeded', 'Failed', 'Canceled', 'Evicted']

// What the node falls back to when a refusal carries no denominator to derive
// a wait from, and what it suggests between polls of a running job.
const DEFAULT_RETRY_SECONDS = 5
const DEFAULT_POLL_SECONDS = 2

// A job that outlives this has stopped being something to watch a spinner for.
const DEFAULT_POLL_TIMEOUT_MS = 10 * 60 * 1000

// How many polls may fail in a row before the job is given up on.
//
// A poll is a plain read against a node that is, by definition, busy doing the
// work. A proxy hiccup, a restart or a request that times out between two of
// them says nothing about the operation, and this window is minutes wide where
// the request it replaces was one round trip - so treating the first failure as
// the operation's failure reports a delete that is still running as broken, and
// leaves the entry listed. Consecutive, so a node that has genuinely gone is
// still an answer rather than something to wait out to the timeout.
const MAX_CONSECUTIVE_POLL_FAILURES = 3

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status)
}

// The node namespaces the kind as `fileoperation.copy`; the tail is the part
// worth showing someone.
export function operationKindLabel(operation) {
  if (!operation?.kind) return null

  return String(operation.kind).split('.').pop()
}

// Reads a thrown request. Returns null for anything that is not a 503, so a
// caller can fall through to its existing error handling unchanged.
export function describeRefusal(error) {
  const response = error?.response
  if (!response || response.status !== 503) return null

  const body = response.data?.data ?? {}
  const header = Number(response.headers?.['retry-after'])

  return {
    retryAfterSeconds: Number.isFinite(header) && header > 0 ? header : DEFAULT_RETRY_SECONDS,
    message: typeof body === 'string' ? body : body.message || '',

    // Present when the wait is another operation rather than an image fetch:
    // { jobId, kind, statusUrl }.
    operation: body.operation || null,
  }
}

// Returns a handle when the node kept the work, null when it finished inline.
export function startedJob(response) {
  if (response?.status !== 202) return null

  const data = response.data?.data
  if (!data?.jobId) return null

  return {
    jobId: data.jobId,
    statusUrl: data.statusUrl || `/apps/operations/${data.jobId}`,
  }
}

// Polls a job handle to a terminal state and returns the terminal view.
//
// Completion is read from the status field and never from the HTTP code: a job
// that failed is a 200 whose status says Failed. Returns null if `execute`
// returns nothing, which is how it reports a logout mid-poll. Throws only once
// the job can no longer be read at all - a single failed poll is a failed poll,
// not a failed operation.
//
// A view carrying `timedOut` is the one non-terminal thing returned: the job is
// still running and was simply watched for longer than anyone should be made to
// wait. It is not a failure and must not be reported as one.
export async function pollOperation(execute, job, options = {}) {
  const { timeoutMs = DEFAULT_POLL_TIMEOUT_MS, onProgress = null } = options
  const giveUpAt = Date.now() + timeoutMs

  let consecutiveFailures = 0

  for (;;) {
    let response
    try {
      response = await execute(job.statusUrl)
      consecutiveFailures = 0
    } catch (error) {
      consecutiveFailures += 1
      if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES || Date.now() >= giveUpAt) throw error

      await delay(DEFAULT_POLL_SECONDS * 1000)

      continue
    }

    if (!response) return null

    const view = response.data?.data ?? {}
    if (isTerminalStatus(view.status)) return view

    if (onProgress) onProgress(view)

    if (Date.now() >= giveUpAt) {
      return { ...view, status: 'Running', timedOut: true }
    }

    const header = Number(response.headers?.['retry-after'])
    const waitSeconds = Number.isFinite(header) && header > 0 ? header : DEFAULT_POLL_SECONDS

    await delay(waitSeconds * 1000)
  }
}

// The line worth putting in front of someone while a job runs.
//
// The node appends a step only when it changes, so the last one is the current
// one. A percentage is offered only where the node offered a denominator -
// which it does for the operations whose size is knowable, and deliberately
// does not for the ones whose size can only be guessed at.
export function operationProgressText(view) {
  const steps = view?.progress
  const message = Array.isArray(steps) && steps.length ? steps[steps.length - 1].message : ''

  const { bytesDone, bytesTotal } = view?.detail ?? {}
  if (!(bytesTotal > 0) || !(bytesDone >= 0)) return message || ''

  const percent = Math.min(100, Math.round((bytesDone / bytesTotal) * 100))

  return message ? `${message} (${percent}%)` : `${percent}%`
}
