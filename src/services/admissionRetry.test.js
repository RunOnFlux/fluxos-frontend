import test from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'

// node --test resolves an ES module path only with its extension.
// eslint-disable-next-line import/extensions
import { ADMISSION_RETRIES, isAdmissionUnavailable, retryAdmission } from './admissionRetry.js'

const UNAVAILABLE = {
  status: 503,
  data: { status: 'error', data: { name: 'AdmissionUnavailable', message: 'This Flux node cannot admit app messages now: it holds authenticated links to 2 of the 3 nodes it needs. Try another node.' } },
}
const NOT_SUPPORTED = {
  status: 501,
  data: { status: 'error', data: { name: 'AdmissionNotSupported', message: 'This Flux node does not take app registrations or updates: only ArcaneOS nodes do. Submit to an ArcaneOS node.' } },
}
const SUCCESS = { status: 200, data: { status: 'success', data: 'txid' } }

// An axios client whose transport answers each request with the next reply,
// with the admission retry in its error interceptor, as ApiClient installs it.
function clientAnswering(...answers) {
  const sent = []
  const client = axios.create({
    adapter: async config => {
      sent.push(config.data)
      const answer = answers[Math.min(sent.length, answers.length) - 1]
      const response = { ...answer, statusText: '', headers: {}, config }
      if (answer.status >= 400)
        throw new axios.AxiosError(`Request failed with status code ${answer.status}`, 'ERR_BAD_RESPONSE', config, null, response)

      return response
    },
  })

  client.interceptors.response.use(response => response, error => (isAdmissionUnavailable(error) ? retryAdmission(client, error) : Promise.reject(error)))

  return { client, sent }
}

test('a refusal by a node short of its quorum is sent again until a node admits it', async () => {
  const { client, sent } = clientAnswering(UNAVAILABLE, UNAVAILABLE, SUCCESS)
  const response = await client.post('/apps/appregister', '{"signed":true}')

  assert.equal(response.data.data, 'txid')
  assert.equal(sent.length, 3)
  sent.forEach(body => assert.equal(body, '{"signed":true}'))
})

test('after ADMISSION_RETRIES more refusals it fails with the refusal', async () => {
  const { client, sent } = clientAnswering(UNAVAILABLE)

  await assert.rejects(() => client.post('/apps/appupdate', '{}'), error => error.response.data.data.name === 'AdmissionUnavailable')
  assert.equal(sent.length, 1 + ADMISSION_RETRIES)
})

test('no other refusal is sent again', async () => {
  for (const answer of [NOT_SUPPORTED, { status: 503, data: '<html>busy</html>' }]) {
    const { client, sent } = clientAnswering(answer, SUCCESS)

    await assert.rejects(() => client.post('/apps/appregister', '{}'))
    assert.equal(sent.length, 1)
  }
})
