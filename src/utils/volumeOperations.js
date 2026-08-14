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
// returns nothing, which is how it reports a logout mid-poll.
export async function pollOperation(execute, job, options = {}) {
  const { timeoutMs = DEFAULT_POLL_TIMEOUT_MS, onProgress = null } = options
  const giveUpAt = Date.now() + timeoutMs

  for (;;) {
    const response = await execute(job.statusUrl)
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
