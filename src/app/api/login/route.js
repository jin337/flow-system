import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

import { generateToken, omit } from '@/utils/common'
export async function POST(request) {
  try {
    const body = await request.json()

    // 参数验证
    if (!body.username || !body.password) {
      return NextResponse.json(
        {
          code: 400,
          message: '用户名和密码不能为空',
        },
        { status: 400 },
      )
    }
    // 查询用户信息
    const [rows] = await pool.execute(`SELECT * FROM sys_user WHERE username = ?`, [body.username])

    if (rows.length === 0) {
      return NextResponse.json(
        {
          code: 401,
          message: '用户不存在',
        },
        { status: 401 },
      )
    }

    const user = rows[0]

    // 查询密码
    if (user.password !== body.password) {
      return NextResponse.json(
        {
          code: 401,
          message: '密码错误',
        },
        { status: 401 },
      )
    }

    // 检查用户状态
    if (user.status === 0) {
      return NextResponse.json(
        {
          code: 403,
          message: '用户已被禁用',
        },
        { status: 403 },
      )
    }

    // 更新用户登录信息
    const loginDate = new Date().toISOString().replace('T', ' ').substring(0, 19)
    let loginIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // 处理 IPv6 映射的 IPv4 地址（如 ::ffff:127.0.0.1）
    if (loginIp.startsWith('::ffff:')) {
      loginIp = loginIp.substring(7)
    }
    // 如果有多个 IP，取第一个
    loginIp = loginIp.split(',')[0].trim()

    await pool.execute('UPDATE sys_user SET login_ip = ?, login_date = ? WHERE id = ?', [loginIp, loginDate, user.id])

    // 关联查询角色信息
    const [roleRows] = await pool.execute(
      'SELECT * FROM sys_role WHERE id IN (SELECT role_id FROM sys_user_role WHERE user_id = ?)',
      [user.id],
    )
    const roleInfo = omit(roleRows, ['del_flag', 'created_at'])
    user.roles = roleInfo

    // 登录成功，返回用户信息
    const userInfo = omit(user, ['password', 'del_flag', 'updated_at', 'login_ip', 'login_date'])

    // 生成token
    userInfo.token = generateToken({ userId: user.id, roleId: user.role_id })

    return NextResponse.json({
      code: 200,
      message: '登录成功',
      data: userInfo,
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
