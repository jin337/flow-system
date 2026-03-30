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
    const mustFeields = ['id', 'username', 'name', 'status']
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

    // 检查用户名是否已存在（排除自身）
    const [existUsers] = await pool.execute('SELECT * FROM audit_user WHERE username = ? AND id != ?', [body.username, body.id])

    if (existUsers.length > 0) {
      return NextResponse.json(
        {
          code: 409,
          message: '用户名已存在',
        },
        { status: 409 },
      )
    }

    // 更新用户信息
    const allowedFields = ['username', 'name', 'status', 'is_admin', 'trustee_type']
    const updateFields = []
    const updateValues = []

    for (const field of allowedFields) {
      let fieldValue = body[field]

      // 当状态不是启用时，不包含1情况
      if (field === 'trustee_type' && !body.status.includes('1')) {
        fieldValue = 0
      }

      if (fieldValue !== undefined && fieldValue !== user[field]) {
        updateFields.push(`${field} = ?`)
        updateValues.push(fieldValue)
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        code: 200,
        message: '没有需要更新的字段',
      })
    }
    // 添加审计字段
    updateFields.push('update_time = ?', 'update_by = ?')
    updateValues.push(new Date(), userId)

    // WHERE 条件
    updateValues.push(body.id)

    const sql = `UPDATE audit_user SET ${updateFields.join(', ')} WHERE id = ?`
    const [result] = await pool.execute(sql, updateValues)

    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '更新失败，用户不存在' }, { status: 404 })
    }

    // 更新审核人员信息audit_name
    const auditTrusteeSql = `UPDATE audit_trustee_log SET audit_name = ? WHERE audit_id = ?`
    await pool.execute(auditTrusteeSql, [body.name, body.id])
    const auditshareholderSql = `UPDATE audit_shareholder_log SET audit_name = ? WHERE audit_id = ?`
    await pool.execute(auditshareholderSql, [body.name, body.id])

    return NextResponse.json({
      code: 200,
      message: '更新成功',
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
