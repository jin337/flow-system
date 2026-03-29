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
    const mustFeields = ['page', 'page_size']
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

    // 获取分页参数
    const { page_size: pageSize, page } = body
    const offset = (page - 1) * pageSize

    // 搜索条件
    let whereClause = 'WHERE deleted = 0'
    if (body.nick_name) {
      whereClause += ` AND nick_name LIKE '%${body.nick_name}%'`
    }

    // 查询用户列表
    const [rows] = await pool.execute(`SELECT * FROM audit_user ${whereClause} LIMIT ?, ?`, [offset, pageSize])

    // 查询总数
    const [totalRows] = await pool.execute(`SELECT COUNT(*) AS total FROM audit_user ${whereClause}`)

    // 返回结果
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: {
        total: totalRows[0].total,
        list: omit(rows, ['password', 'deleted', 'update_time', 'update_by']),
        page: page,
        page_size: pageSize,
      },
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
