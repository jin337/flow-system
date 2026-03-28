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
    const mustFeields = ['id', 'status']
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

    //验证ID是否存在
    const [idRows] = await pool.execute('SELECT * FROM sys_company WHERE id = ?', [body.id])
    if (idRows.length === 0) {
      return NextResponse.json(
        {
          code: 400,
          message: '公司不存在',
        },
        { status: 400 },
      )
    }

    // 根据id更新公司信息
    const [result] = await pool.execute('UPDATE sys_company SET status=?, updated_at = ?, updated_by = ? WHERE id = ?', [
      body.status,
      new Date(),
      userId,
      body.id,
    ])

    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '更新失败' }, { status: 404 })
    }

    // 返回结果
    return NextResponse.json({
      code: 200,
      message: '更新成功',
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
