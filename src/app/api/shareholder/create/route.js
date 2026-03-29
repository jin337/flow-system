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
    const mustFeields = ['create_by', 'motive', 'create_time', 'file_url', 'file_name']
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

    // 单独处理日期时间格式转换
    if (body.create_time !== undefined) {
      body.create_time = dayjs(body.create_time).format('YYYY-MM-DD HH:mm:ss')
    }

    // 新增
    const [rows] = await pool.execute(
      'INSERT INTO audit_shareholder (create_by, motive, remark, create_time, file_url,file_name) VALUES (?, ?, ?, ?, ?,?)',
      [body.create_by, body.motive, body.remark, body.create_time, body.file_url, body.file_name],
    )

    // 插入审核人
    const organization = 2
    const [userRowsT1] = await pool.execute('SELECT * FROM audit_user WHERE FIND_IN_SET(?, status) > 0', [organization])
    // 将用户数据转换为指定格式并插入 audit_shareholder_log 表
    for (const user of userRowsT1) {
      const logData = {
        trustee_id: rows.insertId,
        audit_id: user.id,
        audit_name: user.name,
        organization: organization,
        autograph: null,
        status: 1,
      }

      await pool.execute(
        'INSERT INTO audit_shareholder_log (audit_id, audit_name, organization, autograph, status, trustee_id,create_time) VALUES (?, ?, ?, ?, ?, ?,?)',
        [logData.audit_id, logData.audit_name, logData.organization, logData.autograph, logData.status, logData.trustee_id, null],
      )
    }

    if (rows.affectedRows > 0) {
      return NextResponse.json({
        code: 200,
        message: '新增成功',
        data: { id: rows.insertId },
      })
    } else {
      return NextResponse.json(
        {
          code: 500,
          message: '新增失败',
        },
        { status: 500 },
      )
    }
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
