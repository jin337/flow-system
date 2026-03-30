'use client'

import ExitButton from '@/components/ExitButton'
import Http from '@/service/api'
import { localGetItem } from '@/utils/common'
import { Avatar, Button, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

export default function Page() {
  const router = useRouter()
  const { ORDER_STATUS_MAP, userInfoMobile } = useSelector((state) => state.common)
  const [taskList, setTaskList] = useState([])

  useEffect(() => {
    getTableData()
  }, [])
  // 获取表格列表
  const getTableData = async () => {
    const userInfo = localGetItem('LOGINUSER_INFO_MOBILE')
    const params = { page: 1, page_size: 1000, audit_id: userInfo?.id }
    let url = '/api/trustee/list'
    const { code, data, message } = await Http.post(url, params)
    if (code === 200) {
      const list = (data?.list || []).filter((e) => [2, 3].includes(e.status))
      setTaskList(list)
    } else {
      Toast.error(message)
    }
  }

  const openInfo = (item) => {
    router.push(`/mobile/trustee/${item.id}`)
  }

  const transPeople = (item) => {
    const status = item.status.split(',')
    if (status.includes('1')) {
      return item.trustee_type == 1 ? '董事' : '董事长'
    }
    if (status?.length === 1 && status[0] === '2') {
      return '股东'
    }
    return ''
  }

  return (
    <div>
      <ExitButton type={'exit'} organization={1} />
      <div className="flex flex-col gap-3 py-3">
        {taskList.map((item) => (
          <div className="bg-white p-3 pb-5 mx-3 rounded relative" key={item.id}>
            <div className="absolute right-[5%] top-[22%]">
              <Avatar size={'52px'} color={'light-blue'}>
                <span className="text-xs">{ORDER_STATUS_MAP[item.status]}</span>
              </Avatar>
            </div>
            <div className="font-bold mb-2">{item.motive}</div>
            <div className="mb-1">
              {userInfoMobile.name}（{transPeople(userInfoMobile)}）
            </div>
            <div className="text-sm text-neutral-400">单号：{item.order_id}</div>
            <div className="text-sm text-neutral-400 mb-3">日期：{dayjs(item.create_time).format('YYYY-MM-DD')}</div>
            <Button className="mt-3 rounded-3xl!" theme="solid" type="primary" size="large" block onClick={() => openInfo(item)}>
              签批
            </Button>
          </div>
        ))}
        {taskList.length === 0 && <div className="text-center mt-[20vh] text-gray-500">暂无数据</div>}
      </div>
    </div>
  )
}
