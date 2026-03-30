import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // 从请求头获取中间件传递的用户信息
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 })
    }
    // 查询用户信息
    const [userRows] = await pool.execute('SELECT * FROM audit_user WHERE id = ?', [userId])
    const user = userRows[0]

    if (!user) {
      return NextResponse.json({ code: 404, message: '用户不存在' }, { status: 404 })
    }
    if (user.deleted === 1) {
      return NextResponse.json({ code: 401, message: '用户已注销' }, { status: 401 })
    }

    const body = await request.json()

    // 判断必填字段
    const mustFeields = ['username', 'name', 'password', 'status', 'is_admin']
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

    // 检查用户名是否已存在
    const [existUsers] = await pool.execute('SELECT * FROM audit_user WHERE username = ?', [body.username])
    if (existUsers.length > 0) {
      return NextResponse.json(
        {
          code: 409,
          message: '用户名已存在',
        },
        { status: 409 },
      )
    }

    // 密码加密
    body.password = await bcrypt.hash(body.password, 10)

    // 新增
    const [rows] = await pool.execute(
      'INSERT INTO audit_user (username, name, password, status, is_admin, create_by, create_time,trustee_type) VALUES (?, ?, ?, ?, ?, ?, ?,?)',
      [body.username, body.name, body.password, body.status, body.is_admin, userId, new Date(), body.trustee_type],
    )

    if (rows.affectedRows > 0) {
      return NextResponse.json({
        code: 200,
        message: '新增成功',
        data: { id: rows.insertId },
      })
    } else {
      return NextResponse.json(
        {
          code: 500,
          message: '新增失败',
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
      },
      { status: 500 },
    )
  }
}
