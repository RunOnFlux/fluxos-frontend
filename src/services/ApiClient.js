import { getDetectedBackendURL } from '@/utils/backend'
import axios from 'axios'


const sourceCancelToken = axios.CancelToken.source()
export { sourceCancelToken }

export default function Api() {
  const baseURL = localStorage.getItem('backendURL') || getDetectedBackendURL()

  return axios.create({
    baseURL,
  })
}
