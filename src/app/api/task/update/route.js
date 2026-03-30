import { pool } from '@/lib/db'
import dayjs from 'dayjs'
import { mkdir, writeFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

async function saveAutographImage(base64Data, logId) {
  try {
    // 移除 Base64 前缀（如：data:image/png;base64,）
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')

    // 解码 Base64
    const imageBuffer = Buffer.from(base64Image, 'base64')

    // 生成唯一文件名
    const timestamp = Date.now()
    const fileName = `autograph_${logId}_${timestamp}.png`

    // 创建保存目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'autograph')
    await mkdir(uploadDir, { recursive: true })

    // 保存文件
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, imageBuffer)

    // 返回访问 URL
    return `/uploads/autograph/${fileName}`
  } catch (error) {
    console.error('图片保存失败:', error)
    throw new Error('签名图片保存失败')
  }
}

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
    const qid = body?.organization === 1 ? 'trustee_id' : 'shareholder_id'
    const mustFeields = ['id', 'audit_id', 'organization', qid]
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

    // 处理 autograph 图片
    let autographUrl = null
    if (body.autograph) {
      autographUrl = await saveAutographImage(body.autograph, body.id)
    }

    // 更新内容
    const allowedFields = ['autograph', 'status', 'remark']
    const updateFields = []
    const updateValues = []

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'autograph') {
          updateFields.push(`${field} = ?`)
          updateValues.push(autographUrl) // 使用转换后的图片 URL
        } else {
          updateFields.push(`${field} = ?`)
          updateValues.push(body[field])
        }
      }
    }

    // 单独处理日期时间格式转换
    updateFields.push('create_time = ?')
    updateValues.push(dayjs().format('YYYY-MM-DD HH:mm:ss'))

    if (updateFields.length === 0) {
      return NextResponse.json({
        code: 200,
        message: '没有需要更新的字段',
      })
    }

    // WHERE 条件
    updateValues.push(body.id)

    const sql = `UPDATE ${body.organization === 1 ? 'audit_trustee_log' : 'audit_shareholder_log'} SET ${updateFields.join(', ')} WHERE id = ?`
    const [result] = await pool.execute(sql, updateValues)

    if (result.affectedRows === 0) {
      return NextResponse.json({ code: 404, message: '更新失败' }, { status: 404 })
    }

    // 查找全部用户是否都已经签批
    const [logs] = await pool.execute(
      `SELECT COUNT(1) as total FROM ${body.organization === 1 ? 'audit_trustee_log' : 'audit_shareholder_log'} WHERE trustee_id = ? AND status=1`,
      [body.trustee_id],
    )
    if (logs[0].total === 0) {
      await pool.execute(
        `UPDATE ${body.organization === 1 ? 'audit_trustee' : 'audit_shareholder'} SET status = 3 WHERE id = ?`,
        [body.trustee_id],
      )
    }

    return NextResponse.json({
      code: 200,
      message: '提交成功',
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
