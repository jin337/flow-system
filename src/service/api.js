import { localGetItem } from '@/utils/common'
import axios from 'axios'

const Http = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器
Http.interceptors.request.use(
  (config) => {
    const Authorization = localGetItem('LOGINUSER_INFO')
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
    if ([401, 404].includes(response?.data?.code)) {
      // 无效code,跳转至域名
      localStorage.clear()
      sessionStorage.clear()
      console.log(response?.data.message)
      setTimeout(() => {
        window.location.href = window.location.protocol + '//' + window.location.host + '/login'
      }, 1000)
    } else Promise.reject(error)
  },
)

export default Http
