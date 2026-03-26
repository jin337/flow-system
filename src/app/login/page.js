'use client'
import { } from 'react'

import { IconKey, IconUser } from '@douyinfe/semi-icons'
import { Button, Form, Toast, Typography } from '@douyinfe/semi-ui'

import Http from '@/service/api'
import { localSetItem } from '@/utils/common'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const onSubmit = async (values) => {
    const { code, data, message } = await Http.post('/api/login', values)
    if (code === 200) {
      localSetItem('LOGINUSER_INFO', data)
      router.push('/main/dashboard')
    } else {
      Toast.error(message || '登录失败')
    }
  }
  return (
    <div className="w-full h-full flex justify-center items-center bg-neutral-50">
      <Form className="w-120 p-10 border border-neutral-200 rounded bg-white" autoComplete="off" onSubmit={onSubmit}>
        <Typography.Title heading={3} className="mb-6!">
          登录
        </Typography.Title>
        <Form.Input
          size="large"
          field="username"
          noLabel
          prefix={<IconUser />}
          rules={[{ required: true, message: '请输入用户名' }]}
        />
        <Form.Input
          size="large"
          field="password"
          mode="password"
          noLabel
          prefix={<IconKey />}
          rules={[{ required: true, message: '请输入密码' }]}
        />
        <Button size="large" className="mt-2.5" theme="solid" type="primary" block htmlType="submit">
          登录
        </Button>
      </Form>
    </div>
  )
}
