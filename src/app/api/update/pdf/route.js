import { pool } from '@/lib/db'
import { mkdir, writeFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

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

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ code: 400, message: '未找到上传文件' }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = ['application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ code: 400, message: '仅支持 PDF 文件' }, { status: 400 })
    }

    // 验证文件扩展名
    const fileName = file.name
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ code: 400, message: '文件扩展名必须是 .pdf' }, { status: 400 })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const newFileName = `${timestamp}_${randomStr}_${fileName}`

    // 创建保存目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdf')
    await mkdir(uploadDir, { recursive: true })

    // 保存文件
    const filePath = join(uploadDir, newFileName)
    const fileBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(fileBuffer))

    // 生成访问 URL
    const fileUrl = `/uploads/pdf/${newFileName}`

    return NextResponse.json({
      code: 200,
      message: '上传成功',
      data: {
        name: fileName,
        url: fileUrl,
        size: file.size,
      },
    })
  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
      },
      { status: 500 },
    )
  }
}
