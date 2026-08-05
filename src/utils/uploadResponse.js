// Readers for the streamed body of a FluxOS upload response
// (`POST /ioutils/fileupload/...`). The endpoint writes fragments as the
// transfer proceeds, with nothing separating them: `[received,expected]`
// progress arrays, the form field name of each file once it has landed, and a
// Flux error envelope if the transfer is refused. Refusals carry HTTP 200, so
// the body is the only signal that an upload did not happen.

const progressFragment = /^\[\d+,\d+\]/
const partialProgressFragment = /^\[\d*,?\d*$/
const errorEnvelope = /\{"status"\s*:\s*"error"/

/**
 * Reads the JSON object starting at `start`, ignoring braces inside strings.
 *
 * @param {string} body Response text.
 * @param {number} start Index of the object's opening brace.
 * @returns {string|null} The object's source text, or null while it is incomplete.
 */
const readObject = (body, start) => {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < body.length; i += 1) {
    const character = body[i]

    if (escaped) {
      escaped = false
    } else if (inString && character === '\\') {
      escaped = true
    } else if (character === '"') {
      inString = !inString
    } else if (!inString && character === '{') {
      depth += 1
    } else if (!inString && character === '}') {
      depth -= 1
      if (depth === 0) {
        return body.slice(start, i + 1)
      }
    }
  }

  return null
}

/**
 * Finds the failure an upload response reports in its body.
 *
 * @param {string} body Response text.
 * @returns {{ message: string }|null} The failure, or null when the body reports none.
 */
export const findUploadFailure = body => {
  if (!body) return null

  const envelope = errorEnvelope.exec(body)
  if (!envelope) return null

  const source = readObject(body, envelope.index)
  if (!source) return { message: '' }

  try {
    const parsed = JSON.parse(source)

    return { message: parsed?.data?.message ?? '' }
  } catch {
    return { message: '' }
  }
}

/**
 * Counts the files a batch upload has finished writing. Names are matched in
 * the order they were sent, so a name that is a substring of a later one cannot
 * be credited early. A body that stops matching is no longer readable and the
 * caller falls back to whole-batch completion.
 *
 * @param {string} body Response text received so far.
 * @param {string[]} names Form field names, in the order they were sent.
 * @param {{ cursor: number, completed: number }} state Position reached by the previous read.
 * @returns {{ cursor: number, completed: number, readable: boolean }} Position reached by this read.
 */
export const readCompletedUploads = (body, names, state) => {
  let { cursor, completed } = state

  while (cursor < body.length && completed < names.length) {
    const rest = body.slice(cursor)
    const fragment = progressFragment.exec(rest)

    if (fragment) {
      cursor += fragment[0].length
      continue
    }

    const name = names[completed]
    if (!name) {
      return { cursor, completed, readable: false }
    }

    if (rest.startsWith(name)) {
      cursor += name.length
      completed += 1
      continue
    }

    // A fragment or a name split across two reads; the rest of it follows.
    if (name.startsWith(rest) || partialProgressFragment.test(rest)) {
      break
    }

    return { cursor, completed, readable: false }
  }

  return { cursor, completed, readable: true }
}
