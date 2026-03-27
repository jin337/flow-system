import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // 从请求头获取中间件传递的用户信息
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ code: 401, message: '未授权' }, { status: 401 })
    }

    const body = await request.json()

    // 判断必填字段
    const mustFeields = ['name', 'code']
    const missingFields = mustFeields.filter((field) => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: 400,
          data: null,
          message: `缺少必填字段: ${missingFields.join(', ')}`,
        },
        { status: 400 },
      )
    }


    // 新建公司
    const [result] = await pool.query(
      'INSERT INTO sys_company (name, code, status, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
      [body.name, body.code, 1, new Date(), new Date(), userId],
    )
    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '新增失败' }, { status: 404 })
    }

    // 返回结果
    return NextResponse.json({
      code: 200,
      message: '创建成功',
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      {
        code: 500,
        data: null,
        message: '服务器内部错误',
      },
      { status: 500 },
    )
  }
}
