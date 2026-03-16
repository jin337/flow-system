'use client'
import { IconBell, IconGithubLogo } from '@douyinfe/semi-icons'
import { IconColorPlatte } from '@douyinfe/semi-icons-lab'
import { Avatar, Nav, Space, Tooltip } from '@douyinfe/semi-ui'
export default function Home() {
  const systemItems = [
    { itemKey: 'dash', text: '首页' },
    { itemKey: 'user', text: '流程模块' },
    { itemKey: 'system', text: '系统管理' },
  ]

  return (
    <section className="w-full h-full flex flex-col">
      <header className="h-15 px-6 border-b border-neutral-200 bg-white/75 flex items-center justify-between">
        <Nav
          mode="horizontal"
          items={systemItems}
          header={{
            logo: <IconGithubLogo style={{ fontSize: 36 }} />,
            text: 'GitHub',
          }}
        />
        <Space spacing="loose">
          <Tooltip content="主题切换" position="bottom">
            <IconColorPlatte size="large" />
          </Tooltip>
          <Tooltip content="消息" position="bottom">
            <IconBell size="large" style={{ color: 'rgba(var(--semi-amber-5), 1)' }} />
          </Tooltip>
          <Avatar size="small" color="blue" alt="Admin">
            Admin
          </Avatar>
        </Space>
      </header>
      <main className="flex-1">1</main>
    </section>
  )
}
