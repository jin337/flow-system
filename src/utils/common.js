import jwt from 'jsonwebtoken'

// 设置数据并附加过期时间戳
export const localSetItem = (key, value, time) => {
  if (typeof window === 'undefined') return null // 服务端直接返回

  const now = Date.now()
  const item = {
    value: value,
  }
  if (time) {
    item.expiry = now + time
  }
  localStorage.setItem(key, JSON.stringify(item))
}

// 获取数据，如果数据已过期则返回null
export const localGetItem = (key) => {
  if (typeof window === 'undefined') return null // 服务端直接返回

  const itemStr = localStorage.getItem(key)
  if (!itemStr) {
    return null
  }
  const item = JSON.parse(itemStr)
  const now = Date.now()
  if (now > item.expiry) {
    // 数据已过期，删除它
    localStorage.removeItem(key)
    return null
  }
  return item.value
}

// 清空本地数据
export const localClear = (key) => {
  if (typeof window === 'undefined') return null // 服务端直接返回

  localStorage.removeItem(key)
}
localClear.all = () => {
  localStorage.clear()
}

// 排除指定字段（支持对象和数组）
export const omit = (obj, keys) => {
  // 如果是数组，遍历处理每个元素
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      const result = { ...item }
      keys.forEach((key) => delete result[key])
      return result
    })
  }

  // 如果是对象，直接排除指定字段
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

// 生成 token
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

// 验证 token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}
