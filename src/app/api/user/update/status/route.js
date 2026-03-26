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

    const body = await request.json()
    const { id, status } = body

    // 执行更新角色
    await pool.execute('UPDATE sys_user SET status = ? WHERE id = ?', [status, id])

    // 更新用户信息
    const updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await pool.execute('UPDATE sys_user SET updated_by = ?, updated_at = ? WHERE id = ?', [id, updated_at, id])

    return NextResponse.json({
      code: 200,
      data: null,
      message: '状态更新成功',
    })
  } catch (error) {
    return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 })
  }
}
