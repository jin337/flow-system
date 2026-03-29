'use client'

import Http from '@/service/api'
import { Button, Descriptions, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import PdfViewer from '@/components/PdfViewer'

export default function Page() {
  const router = useRouter()
  const { ORDER_STATUS_MAP } = useSelector((state) => state.common)
  const [taskList, setTaskList] = useState([])

  useEffect(() => {
    getTableData()
  }, [])
  // 获取表格列表
  const getTableData = async () => {
    let url = '/api/shareholder/list'
    const { code, data, message } = await Http.post(url, { page: 1, page_size: 1000 })
    if (code === 200) {
      const list = (data?.list || []).filter((e) => [2, 3].includes(e.status))
      setTaskList(list)
    } else {
      Toast.error(message)
    }
  }

  const openInfo = (item) => {
    router.push(`/mobile/shareholder/${item.id}`)
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      {taskList.map((item) => (
        <div className="bg-white p-2 mx-3 rounded" key={item.id}>
          <Descriptions
            data={[
              { key: '发起人', value: item.create_by_name },
              { key: '发起日期', value: dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') },
              { key: '状态', value: ORDER_STATUS_MAP[item.status] },
              { key: '主题', value: item.motive },
              {
                key: '文件',
                value: <PdfViewer url={item.file_url} />,
              },
              { key: '备注', value: item.remark },
            ]}
          />
          <Button className="mt-3" theme="solid" type="primary" size="large" block onClick={() => openInfo(item)}>
            核验信息
          </Button>
        </div>
      ))}
      {taskList.length === 0 && <div className="text-center mt-[20vh] text-gray-500">暂无数据</div>}
    </div>
  )
}
