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
    const { id, role_id } = body

    // 执行更新角色
    await pool.execute('UPDATE sys_user SET role_id = ? WHERE id = ?', [role_id, id])

    // 更新用户信息
    const updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await pool.execute('UPDATE sys_user SET updated_by = ?, updated_at = ? WHERE id = ?', [id, updated_at, id])

    // 关联查询角色信息
    const [roleRows] = await pool.execute(
      'SELECT * FROM sys_role WHERE id IN (SELECT role_id FROM sys_user_role WHERE user_id = ?)',
      [id],
    )
    const roleInfo = omit(roleRows, ['del_flag', 'created_at'])
    user.roles = roleInfo

    // 登录成功，返回用户信息
    return NextResponse.json({
      code: 200,
      data: omit(user, ['password', 'del_flag', 'login_ip', 'login_date']),
      message: '角色更新成功',
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 })
  }
}
