import { pool } from '@/lib/db'
import dayjs from 'dayjs'
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
    const mustFeields = ['id', 'motive', 'file_url', 'logs']
    const missingFields = mustFeields.filter((field) => !(field in body))
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: 400,
          message: `缺少必填字段：${missingFields.join(', ')}`,
        },
        { status: 400 },
      )
    }

    // 更新内容
    const allowedFields = ['motive', 'file_url', 'file_name', 'remark']
    const updateFields = []
    const updateValues = []

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`)
        updateValues.push(body[field])
      }
    }

    // 单独处理日期时间格式转换
    if (body.create_time !== undefined) {
      updateFields.push('create_time = ?')
      updateValues.push(dayjs(body.create_time).format('YYYY-MM-DD HH:mm:ss'))
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        code: 200,
        message: '没有需要更新的字段',
      })
    }

    // 添加审计字段
    updateFields.push('update_time = ?', 'update_by = ?')
    updateValues.push(dayjs().format('YYYY-MM-DD HH:mm:ss'), userId)

    // WHERE 条件
    updateValues.push(body.id)

    const sql = `UPDATE audit_shareholder SET ${updateFields.join(', ')} WHERE id = ?`
    const [result] = await pool.execute(sql, updateValues)

    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '更新失败' }, { status: 404 })
    }

    return NextResponse.json({
      code: 200,
      message: '更新成功',
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
      },
      { status: 500 },
    )
  }
}
