'use client'

import Http from '@/service/api'
import { Button, Descriptions, Form, Timeline, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import PdfViewer from '@/components/PdfViewer'
import SignaturePad from '@/components/SignaturePad'


export default function Page({ params }) {
  const signatureRef = useRef(null)
  const formApiRef = useRef(null)
  const { LOG_STATUS_MAP, ORDER_STATUS_MAP, ORGANIZATION_MAP, userInfo } = useSelector((state) => state.common)

  const [taskInfo, setTaskInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTaskInfo = async () => {
      try {
        const { id } = await params
        if (id) {
          await getTaskInfo(id)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchTaskInfo()
  }, [params])

  const getTaskInfo = async (id) => {
    let url = '/api/trustee/info'
    const { code, data, message } = await Http.post(url, { id })
    if (code === 200) {
      setTaskInfo(data || {})
    } else {
      Toast.error(message)
    }
  }

  // 提交
  const handleSubmit = async () => {
    const { id } = await params
    const log = taskInfo?.logs.find((item) => item.audit_id === userInfo.id)
    formApiRef.current?.validate().then(async (values) => {
      const signatureData = signatureRef.current?.getSignature()
      const type = signatureRef.current?.isEmpty()
      if (type) {
        return Toast.error('请签名后提交')
      }
      const params = {
        ...log,
        ...values,
        autograph: signatureData,
      }
      const { code, message } = await Http.post('/api/task/update', params)
      if (code === 200) {
        Toast.success(message)
        getTaskInfo(id)
      } else {
        Toast.error(message)
      }
    })
  }

  // ✅ 加载状态
  if (loading || !taskInfo) {
    return <div className="py-3 text-center">加载中...</div>
  }

  return (
    <div className="py-3">
      <div className="bg-white p-2 mx-3 rounded mb-3">
        <h3 className="text-base font-semibold mb-3">基本信息</h3>
        <Descriptions
          data={[
            { key: '发起人', value: taskInfo.create_by_name },
            { key: '发起日期', value: dayjs(taskInfo.create_time).format('YYYY-MM-DD HH:mm:ss') },
            { key: '状态', value: ORDER_STATUS_MAP[taskInfo.status] },
            { key: '主题', value: taskInfo.motive },
            {
              key: '文件',
              value: <PdfViewer url={taskInfo.file_url} />,
            },
            { key: '备注', value: taskInfo.remark },
          ]}
        />
      </div>
      <div className='bg-white p-2 mx-3 rounded"'>
        <h3 className="text-base font-semibold mt-3">审批流程</h3>
        <Timeline mode="left">
          {taskInfo?.logs?.map((item, index) => (
            <Timeline.Item
              key={index}
              extra={
                item.autograph && (
                  <div className="flex gap-1">
                    <div className=" break-keep">签名：</div>
                    <img src={item.autograph} alt="签名" className="h-22 w-auto flex-1" />
                  </div>
                )
              }>
              <div className="flex items-center justify-between">
                <div className="text-(--semi-color-text-2)">{ORGANIZATION_MAP[item?.organization]}审批</div>
                <div>{item?.create_time && dayjs(item?.create_time).format('YYYY-MM-DD HH:mm:ss')}</div>
              </div>
              {userInfo.id === item.audit_id && item?.status === 1 ? (
                <Form autoComplete="off" getFormApi={(api) => (formApiRef.current = api)} onSubmit={handleSubmit}>
                  <Form.RadioGroup
                    rules={[{ required: true, message: '请选择状态' }]}
                    label={item.audit_name + `（${LOG_STATUS_MAP[item?.status]}）`}
                    field="status"
                    options={[
                      { label: '同意', value: 2 },
                      { label: '不同意', value: 3 },
                      { label: '弃权', value: 4 },
                    ]}
                  />
                  <Form.Slot label="签字" field="autograph">
                    <SignaturePad ref={signatureRef} />
                    <div className="mt-2 flex justify-end">
                      <Button theme="light" size="small" onClick={() => signatureRef.current?.clear()}>
                        重写
                      </Button>
                    </div>
                  </Form.Slot>
                  <Button className="mt-3" theme="solid" type="primary" size="large" block onClick={handleSubmit}>
                    确认
                  </Button>
                  <Button className="mt-3" theme="light" type="danger" size="large" block>
                    取消
                  </Button>
                </Form>
              ) : (
                <div>
                  {item.audit_name}（{LOG_STATUS_MAP[item?.status]}）
                </div>
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </div>
  )
}
