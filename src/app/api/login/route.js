import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'
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
    const [rows] = await pool.execute(`SELECT * FROM audit_user WHERE username = ?`, [body.username])

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

    // 查询密码，使用 compare 比对
    const isMatch = await bcrypt.compare(body.password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        {
          code: 401,
          message: '密码错误',
        },
        { status: 401 },
      )
    }

    // 验证用户是否被删除
    if (user.deleted === 1) {
      return NextResponse.json(
        {
          code: 401,
          message: '用户已注销',
        },
        { status: 401 },
      )
    }

    // 登录成功，返回用户信息
    const userInfo = omit(user, ['password', 'create_time', 'create_by', 'update_time', 'update_by', 'deleted'])

    // 生成token
    userInfo.token = generateToken({ userId: user.id })

    return NextResponse.json({
      code: 200,
      message: '登录成功',
      data: userInfo,
    })
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
