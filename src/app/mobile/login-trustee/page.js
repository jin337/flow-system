'use client'

import { IconKey, IconUser } from '@douyinfe/semi-icons'
import { Button, Form, Toast } from '@douyinfe/semi-ui'

import Http from '@/service/api'
import { localSetItem } from '@/utils/common'
import { useRouter } from 'next/navigation'

// logo

export default function Page() {
  const router = useRouter()
  const onSubmit = async (values) => {
    const { code, data, message } = await Http.post('/api/login', values)
    if (code === 200) {
      localSetItem('LOGINUSER_INFO_MOBILE', data)
      router.push('/mobile/trustee')
    } else {
      Toast.error(message || '登录失败')
    }
  }
  return (
    <>
      <div className="w-full h-screen flex justify-center overflow-hidden">
        <Form className="w-[80%] pt-[20vh]" autoComplete="off" onSubmit={onSubmit}>
          <div className="font-bold text-xl text-center mb-4">董事会文件签批</div>
          <Form.Input
            label="账号"
            size="large"
            field="username"
            placeholder={'请输入账号'}
            prefix={<IconUser />}
            rules={[{ required: true, message: '请输入账号' }]}
          />
          <Form.Input
            label="密码"
            size="large"
            field="password"
            mode="password"
            placeholder={'请输入密码'}
            prefix={<IconKey />}
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <Button size="large" className="mt-2.5" theme="solid" type="primary" block htmlType="submit">
            查看待办事项
          </Button>
        </Form>
      </div>
      <div className="text-sm mt-2 text-neutral-400 sticky bottom-5 text-center">中电桑达电子设备（江苏）有限公司</div>
    </>
  )
}
