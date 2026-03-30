import { localGetItem } from '@/utils/common'
import axios from 'axios'

const Http = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器
Http.interceptors.request.use(
  (config) => {
    const Authorization = localGetItem('LOGINUSER_INFO') || localGetItem('LOGINUSER_INFO_MOBILE')
    if (Authorization) {
      config.headers.Token = Authorization.token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
Http.interceptors.response.use(
  (response) => {
    const { data } = response
    return Promise.resolve(data)
  },
  (error) => {
    const { response } = error
    return Promise.resolve(response.data)
  },
)

export default Http
