import { pool } from '@/lib/db'
import { omit } from '@/utils/common'
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
    const mustFeields = ['id', 'username', 'nick_name']
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

    // 更新用户信息
    const allowedFields = ['username', 'nick_name', 'email', 'phonenumber', 'avatar', 'sex', 'dept_id', 'role_id', 'status']
    const updateFields = []
    const updateValues = []

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== user[field]) {
        updateFields.push(`${field} = ?`)
        updateValues.push(body[field])
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        code: 200,
        message: '没有需要更新的字段',
        data: omit(user, ['password', 'del_flag', 'login_ip', 'login_date']),
      })
    }

    // 添加审计字段
    updateFields.push('updated_at = ?', 'updated_by = ?')
    updateValues.push(new Date(), userId)

    // WHERE 条件
    updateValues.push(body.id)

    const sql = `UPDATE sys_user SET ${updateFields.join(', ')} WHERE id = ?`
    const [result] = await pool.execute(sql, updateValues)

    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '更新失败，用户不存在' }, { status: 404 })
    }
    const [newUserRows] = await pool.execute('SELECT * FROM sys_user WHERE id = ?', [body.id])
    return NextResponse.json({
      code: 200,
      message: '更新成功',
      data: omit(newUserRows[0], ['password', 'del_flag', 'login_ip', 'login_date']),
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
