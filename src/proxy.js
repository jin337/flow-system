import { verifyToken } from '@/utils/common'
import { NextResponse } from 'next/server'

export function proxy(request) {
  const { pathname } = request.nextUrl

  // 公开路径，不需要认证
  const publicPaths = ['/api/login', '/api/register', '/public']
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 获取 token
  const token = request.headers.get('token')

  // 没有 token，返回 401
  if (!token) {
    return NextResponse.json(
      { code: 401, message: '未授权，请先登录' },
      { status: 401 }
    )
  }

  // 验证 token
  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json(
      { code: 401, message: 'Token 已过期或无效' },
      { status: 401 }
    )
  }

  // 验证通过，将用户信息添加到请求头
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', String(decoded.userId))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
