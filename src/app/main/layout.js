'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { IconUserCircle } from '@douyinfe/semi-icons'
import { Dropdown, Form, Modal, Nav, Toast } from '@douyinfe/semi-ui'

import logo from '@/assets/images/logo.png'

import Http from '@/service/api'
import { setUserInfo } from '@/store/reducers/common'
import { localClear, localGetItem } from '@/utils/common'

// 导航数据
const navItems = [
  {
    id: '1',
    itemKey: 'user',
    text: '用户管理',
    path: '/main/user',
  },
  {
    id: '2',
    itemKey: 'trustee',
    text: '董事会审批',
    path: '/main/trustee',
  },
  {
    id: '3',
    itemKey: 'shareholder',
    text: '股东会审批',
    path: '/main/shareholder',
  },
]

export default function LayoutBody({ children }) {
  const formApiRef = useRef(null)
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()

  const [currentItem, setCurrentItem] = useState({})

  const [visible, setVisible] = useState(false)

  // 顶部导航数据
  const systemItems = useMemo(() => navItems.map((e) => ({ ...e, items: [] })), [])

  const userInfo = localGetItem('LOGINUSER_INFO')

  // 登录用户信息
  useEffect(() => {
    if (!userInfo) {
      router.push('/login')
    }
    dispatch(setUserInfo(userInfo))
  }, [userInfo])

  // 监控路由变化
  useMemo(() => {
    const selectItem = navItems.find((e) => e.path === pathname)
    selectItem && setCurrentItem(selectItem)
  }, [pathname])
  // 系统导航点击
  const handleNavClick = (item) => {
    const selectItem = navItems.find((e) => e.itemKey === item.itemKey)

    setCurrentItem(selectItem)
    if (selectItem.path) {
      router.push(selectItem.path)
    }
  }

  // 退出
  const onExit = () => {
    localClear.all()
    router.push('/login')
  }

  // 修改密码
  const openReset = () => {
    setVisible(true)
    setTimeout(() => {
      formApiRef.current.reset()
    }, 100)
  }
  const handleSubmit = () => {
    formApiRef.current?.validate().then(async (values) => {
      const { code, message } = await Http.post('/api/edit-pass', values)
      if (code === 200) {
        Toast.success(message)
      } else {
        Toast.error(message)
      }

      setVisible(false)
    })
  }

  return (
    <section className="w-full h-full flex flex-col overflow-hidden">
      <header className="h-15 px-6 bg-[#3D6EE6] flex items-center justify-between">
        <Image src={logo} alt="logo" className="w-auto! h-[50%] cursor-pointer" onClick={() => router.push('/main/user')} />
        <Dropdown
          position={'bottomRight'}
          menu={[
            { node: 'item', name: '修改密码', onClick: () => openReset() },
            { node: 'item', name: '退出登录', onClick: () => onExit() },
          ]}>
          <IconUserCircle style={{ fontSize: 30, color: '#fff' }} />
        </Dropdown>
      </header>
      <section className="flex-1 h-[calc(100%-60px)] flex">
        <aside className="h-full">
          <Nav className="h-full" items={systemItems} selectedKeys={[currentItem?.itemKey]} onSelect={handleNavClick} />
        </aside>
        <main className="h-full p-4 flex-1 overflow-y-auto">{children}</main>
      </section>

      <Modal title="修改密码" centered visible={visible} onCancel={() => setVisible(false)} onOk={handleSubmit}>
        <Form autoComplete="off" getFormApi={(api) => (formApiRef.current = api)} onSubmit={handleSubmit}>
          <Form.Input field="password" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]} />
          <Form.Input
            field="newPassword"
            type="password"
            label="新密码"
            extraText="密码长度不少于6位，必须是英文字母，不包含特殊字符"
            rules={[{ required: true, message: '请输入新密码' }]}
            validate={(value) => {
              if (!value || value.length < 6) {
                return '密码长度不少于 6 位'
              }
              const regex = /^[A-Za-z0-9]+$/
              if (!regex.test(value)) {
                return '必须是英文字母，且不包含特殊字符'
              }
              return null
            }}
          />
          <Form.Input
            field="confirmPassword"
            type="password"
            label="确认密码"
            rules={[{ required: true, message: '请输入确认密码' }]}
            validate={(value) => {
              if (value !== formApiRef.current.getValue('newPassword')) {
                return '两次密码不一致'
              }
            }}
          />
        </Form>
      </Modal>
    </section>
  )
}
