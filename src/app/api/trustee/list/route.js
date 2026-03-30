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
    const { page_size: pageSize, page, audit_id } = body
    const offset = (page - 1) * pageSize

    let sqlRow = `
      SELECT
        t.*,
        u.name AS create_by_name
      FROM audit_trustee t
      LEFT JOIN audit_user u ON t.create_by = u.id
      WHERE t.deleted = 0 ORDER BY create_time DESC
      LIMIT ?, ?`

    let field = [offset, pageSize]
    if (audit_id) {
      sqlRow = `
      select
      b.*
      from audit_trustee_log a
      inner join audit_trustee b on a.trustee_id=b.id
      where b.deleted=0  and  a.status=1 and  a.audit_id = ? ORDER BY create_time DESC
      LIMIT ?, ?`
      field = [audit_id, offset, pageSize]
    }

    // 查询主表列表
    const [rows] = await pool.execute(sqlRow, field)

    // 查询总数
    const [totalRows] = await pool.execute(`SELECT COUNT(*) AS total FROM audit_trustee WHERE deleted = 0`)

    // 为每条任务查询对应的审核人
    const list = await Promise.all(
      rows.map(async (task) => {
        const [logs] = await pool.execute(
          `SELECT * FROM audit_trustee_log WHERE trustee_id = ? AND deleted = 0 ORDER BY create_time ASC`,
          [task.id],
        )
        const [files] = await pool.execute(`SELECT * FROM audit_files WHERE mid = ? AND organization=1`, [task.id])
        return {
          ...task,
          logs: logs || [],
          files: files || [],
        }
      }),
    )

    // 返回结果
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: {
        total: totalRows[0].total,
        list: list,
        page: page,
        page_size: pageSize,
      },
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
