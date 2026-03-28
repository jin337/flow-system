import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // 从请求头获取中间件传递的用户信息
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 })
    }
    // 查询用户信息
    const [userRows] = await pool.execute('SELECT * FROM sys_user WHERE id = ?', [userId])
    const user = userRows[0]

    if (!user) {
      return NextResponse.json({ code: 404, message: '用户不存在' }, { status: 404 })
    }
    if (user.del_flag === 1) {
      return NextResponse.json({ code: 401, message: '用户已注销' }, { status: 401 })
    }
    if (user.status === 0) {
      return NextResponse.json({ code: 401, message: '用户已禁用' }, { status: 401 })
    }

    const body = await request.json()

    // 判断必填字段
    const mustFeields = ['page', 'page-size']
    const missingFields = mustFeields.filter((field) => !(field in body))
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: 400,
          message: `缺少必填字段: ${missingFields.join(', ')}`,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: body,
    })
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
      },
      { status: 500 },
    )
  }
}
