'use client'
import Image from 'next/image'

import { IconKey, IconUser } from '@douyinfe/semi-icons'
import { Button, Form, Toast } from '@douyinfe/semi-ui'

import Http from '@/service/api'
import { localSetItem } from '@/utils/common'
import { useRouter } from 'next/navigation'

// logo
import logo from '@/assets/images/logo.png'

export default function Page() {
  const router = useRouter()
  const onSubmit = async (values) => {
    const { code, data, message } = await Http.post('/api/login', values)
    if (code === 200) {
      localSetItem('LOGINUSER_INFO', data)
      router.push('/mobile/task')
    } else {
      Toast.error(message || '登录失败')
    }
  }
  return (
    <div className="w-full h-screen flex justify-center items-center bg-linear-to-br from-[#E2EEFF] to-[#B8D4FF]">
      <div>
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image src={logo} alt="logo" className="w-auto h-8" />
          <span className="text-xl font-bold">中电桑达电子设备（江苏）有限公司</span>
        </div>
        <Form className="" autoComplete="off" onSubmit={onSubmit}>
          <Form.Input
            label="账号"
            size="large"
            field="username"
            prefix={<IconUser />}
            rules={[{ required: true, message: '请输入账号' }]}
          />
          <Form.Input
            label="密码"
            size="large"
            field="password"
            mode="password"
            prefix={<IconKey />}
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <Button size="large" className="mt-2.5" theme="solid" type="primary" block htmlType="submit">
            查看待办事项
          </Button>
        </Form>
      </div>
    </div>
  )
}
