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
    const mustFeields = ['id']
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

    // 查询单条数据
    const [rows] = await pool.execute('SELECT * FROM audit_shareholder WHERE id = ?', [body.id])
    let info = rows[0]

    //查询单条数据
    if (info && info.create_by) {
      const [userRows] = await pool.execute('SELECT id, name FROM audit_user WHERE id = ?', [info.create_by])
      const createUser = userRows[0]
      info.create_by_name = createUser?.name || null
    }

    // 查询log
    const [logRows] = await pool.execute('SELECT * FROM audit_shareholder_log WHERE shareholder_id = ? ORDER BY id DESC', [body.id])
    info.logs = logRows

    const [files] = await pool.execute(`SELECT * FROM audit_files WHERE mid = ? AND organization=2`, [body.id])
    info.files = files

    // 返回结果
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: omit(info, ['password', 'deleted', 'update_time', 'update_by']),
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
