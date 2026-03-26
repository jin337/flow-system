'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { setUserInfo } from '@/store/reducers/common'

import { IconBell, IconGithubLogo, IconUserCircle } from '@douyinfe/semi-icons'
import { IconColorPlatte, IconConfig, IconMarkdown, IconPopover, IconSkeleton, IconTreeSelect } from '@douyinfe/semi-icons-lab'
import { Dropdown, Nav, Space, Tooltip } from '@douyinfe/semi-ui'

import { localClear, localGetItem } from '@/utils/common'

// 导航数据
const navItems = [
  {
    pid: '0',
    id: '1',
    itemKey: 'dashboard',
    text: '首页',
    path: '/main/dashboard',
  },
  {
    pid: '0',
    id: '2',
    itemKey: 'workflow',
    text: '流程中心',
    items: [
      {
        pid: '2',
        id: '2-1',
        itemKey: 'flow-process',
        text: '流程模块管理',
        icon: <IconPopover />,
        path: '/main/workflow/flow-process',
      },
      {
        pid: '2',
        id: '2-2',
        itemKey: 'form-element',
        text: '表单元素管理',
        icon: <IconSkeleton />,
        path: '/main/workflow/form-element',
      },
    ],
  },
  {
    pid: '0',
    id: '3',
    itemKey: 'system',
    text: '系统管理',
    items: [
      {
        pid: '3',
        id: '3-1',
        itemKey: 'organization',
        text: '组织架构',
        icon: <IconTreeSelect />,
        items: [
          {
            pid: '3-1',
            id: '3-1-1',
            itemKey: 'company',
            text: '公司管理',
            path: '/main/system/organization/company',
          },
          {
            pid: '3-1',
            id: '3-1-2',
            itemKey: 'department',
            text: '部门管理',
            path: '/main/system/organization/department',
          },
          {
            pid: '3-1',
            id: '3-1-3',
            itemKey: 'position',
            text: '岗位管理',
            path: '/main/system/organization/position',
          },
          {
            pid: '3-1',
            id: '3-1-4',
            itemKey: 'user',
            text: '用户管理',
            path: '/main/system/organization/user',
          },
        ],
      },
      {
        pid: '3',
        id: '3-2',
        itemKey: 'access-control',
        text: '权限控制',
        icon: <IconMarkdown />,
        items: [
          {
            pid: '3-2',
            id: '3-2-1',
            itemKey: 'role',
            text: '角色管理',
            path: '/main/system/access-control/role',
          },
          {
            pid: '3-2',
            id: '3-2-2',
            itemKey: 'menu',
            text: '菜单管理',
            path: '/main/system/access-control/menu',
          },
          {
            pid: '3-2',
            id: '3-2-3',
            itemKey: 'home-settings',
            text: '首页配置',
            path: '/main/system/access-control/home-settings',
          },
        ],
      },
      {
        pid: '3',
        id: '3-3',
        itemKey: 'system-config',
        text: '系统配置',
        icon: <IconConfig />,
        items: [
          {
            pid: '3-3',
            id: '3-3-1',
            itemKey: 'dict',
            text: '字典管理',
            path: '/main/system/system-config/dict',
          },
          {
            pid: '3-3',
            id: '3-3-2',
            itemKey: 'operation-log',
            text: '操作日志',
            path: '/main/system/system-config/operation-log',
          },
          {
            pid: '3-3',
            id: '3-3-3',
            itemKey: 'login-log',
            text: '登录记录',
            path: '/main/system/system-config/login-log',
          },
          {
            pid: '3-3',
            id: '3-3-4',
            itemKey: 'database-viewer',
            text: '数据库表',
            path: '/main/system/system-config/database-viewer',
          },
        ],
      },
    ],
  },
]

// 递归查找多维数组中的菜单项
const findMenuItem = (items, options = {}) => {
  const { targetItemKey, targetPath, findFirst = false } = options

  if (!Array.isArray(items)) return null

  for (const item of items) {
    // 查找第一个有 path 的项
    if (findFirst && item.path) {
      return item
    }

    // 根据 path 查找
    if (targetPath && item.path === targetPath) {
      return item
    }

    // 根据 itemKey 查找
    if (targetItemKey && item.itemKey === targetItemKey) {
      return item
    }

    // 递归查找子菜单
    if (item.items && item.items.length > 0) {
      const found = findMenuItem(item.items, options)
      if (found) {
        return found
      }
    }
  }
  return null
}

// 获取最顶级的父级
const findTopLevelParent = (data, targetItem) => {
  let currentId = targetItem.pid
  const allNodesMap = new Map()

  // 递归构建一个所有节点的映射表，方便快速查找
  const buildMap = (items) => {
    for (const item of items) {
      allNodesMap.set(item.id, item)
      if (item.items) {
        buildMap(item.items)
      }
    }
  }

  buildMap(data)

  // 如果 targetItem 本身就是顶级节点（pid 为 '0'），直接返回
  if (currentId === '0') {
    return targetItem
  }

  // 循环向上查找，直到找到顶级节点（pid 为 '0'）
  let topLevelNode = null
  while (currentId && currentId !== '0') {
    const parentNode = allNodesMap.get(currentId)
    if (!parentNode) {
      break
    }
    topLevelNode = parentNode // 保存当前找到的节点
    currentId = parentNode.pid
  }

  // 返回最终的顶级父节点
  return topLevelNode || allNodesMap.get(currentId) || null
}

export default function LayoutBody({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()

  const userInfo = localGetItem('LOGINUSER_INFO')
  const [currentItem, setCurrentItem] = useState({})

  // 顶部导航数据
  const systemItems = useMemo(() => navItems.map((e) => ({ ...e, items: [] })), [])

  // 侧边栏导航数据
  const siderItems = useMemo(() => navItems.find((e) => e.itemKey === currentItem.itemKey)?.items || [], [currentItem])

  // 登录用户信息
  useMemo(() => {
    if (!userInfo) {
      router.push('/login')
    }
    dispatch(setUserInfo(userInfo))
  }, [userInfo])

  // 监控路由变化
  useMemo(() => {
    const siderItem = findMenuItem(navItems, { targetPath: pathname })

    if (siderItem) {
      const topLevelItem = findTopLevelParent(navItems, siderItem)
      setCurrentItem({ ...topLevelItem, siderItem })
    }
  }, [pathname])

  // 退出
  const onExit = () => {
    localClear.all()
    router.push('/login')
  }
  // 系统导航点击
  const handleNavClick = (item) => {
    const selectItem = navItems.find((e) => e.itemKey === item.itemKey)
    const siderItem = findMenuItem(selectItem.items, { findFirst: true }) || {}

    setCurrentItem({ ...selectItem, siderItem })
    if (selectItem.path) {
      router.push(selectItem.path)
    } else {
      router.push(siderItem.path)
    }
  }

  // 侧边栏导航点击
  const handleSiderClick = (item) => {
    const siderItem = findMenuItem(siderItems, { targetItemKey: item.itemKey })
    setCurrentItem((prev) => ({ ...prev, siderItem }))
    router.push(siderItem.path)
  }

  return (
    <section className="w-full h-full flex flex-col">
      <header className="h-15 px-6 border-b border-neutral-200 bg-white/75 flex items-center justify-between">
        <Nav
          mode="horizontal"
          items={systemItems}
          selectedKeys={[currentItem?.itemKey]}
          onSelect={handleNavClick}
          header={{
            logo: <IconGithubLogo style={{ fontSize: 36 }} />,
            text: 'GitHub',
            link: '/main/dashboard',
          }}
        />
        <Space spacing="loose">
          <Tooltip content="主题切换" position="bottom">
            <IconColorPlatte size="large" />
          </Tooltip>
          <Tooltip content="消息" position="bottom">
            <IconBell size="large" style={{ color: 'rgba(var(--semi-amber-5), 1)' }} />
          </Tooltip>
          <Dropdown
            position={'bottomRight'}
            menu={[
              { node: 'item', name: '个人设置' },
              { node: 'item', name: '退出登录', onClick: () => onExit() },
            ]}>
            <IconUserCircle style={{ fontSize: 30, color: 'rgba(var(--semi-blue-4), 1)' }} />
          </Dropdown>
        </Space>
      </header>
      <section className="flex-1 h-full flex">
        {siderItems?.length > 0 && (
          <aside className="h-full">
            <Nav
              className="h-full"
              items={siderItems}
              footer={{ collapseButton: true }}
              selectedKeys={[currentItem?.siderItem?.itemKey]}
              onSelect={handleSiderClick}
            />
          </aside>
        )}
        <main className="h-full p-4 flex-1">{children}</main>
      </section>
    </section>
  )
}
