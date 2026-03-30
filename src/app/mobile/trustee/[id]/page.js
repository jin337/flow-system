'use client'

import Http from '@/service/api'
import { Avatar, Button, Descriptions, Form, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import ExitButton from '@/components/ExitButton'
import PdfViewer from '@/components/PdfViewer'
import SignaturePad from '@/components/SignaturePad'

export default function Page({ params }) {
  const signatureRef = useRef(null)
  const formApiRef = useRef(null)
  const { LOG_STATUS_MAP, ORDER_STATUS_MAP, userInfoMobile } = useSelector((state) => state.common)

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
    const log = taskInfo?.logs.find((item) => item.audit_id === userInfoMobile.id)
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
  // ✅ 加载状态
  if (loading || !taskInfo) {
    return <div className="py-3 text-center">加载中...</div>
  }

  return (
    <>
      <ExitButton organization={1} />
      <div className="py-3">
        <div className="bg-white p-3 mx-3 rounded mb-3  relative">
          <div className="absolute right-[5%] top-[18%]">
            <Avatar size={'52px'} color={'light-blue'}>
              <span className="text-xs">{ORDER_STATUS_MAP[taskInfo.status]}</span>
            </Avatar>
          </div>
          <div className="font-bold mb-2">{taskInfo.motive}</div>
          <div className="mb-1">
            {userInfoMobile.name}（{transPeople(userInfoMobile)}）
          </div>
          <div className="text-sm text-neutral-400">单号：{taskInfo.order_id}</div>
          <div className="text-sm text-neutral-400 mb-3">日期：{dayjs(taskInfo.create_time).format('YYYY-MM-DD')}</div>
          <Descriptions
            data={[
              {
                key: '文件',
                value: <PdfViewer list={taskInfo.files} type="mobile" />,
              },
              { key: '备注', value: taskInfo.remark },
            ]}
          />
        </div>
        <div className="bg-white p-3 mx-3 rounded">
          <h3 className="text-base font-semibold mt-3">签批</h3>
          {taskInfo?.logs?.map((item, index) => (
            <div key={index}>
              {userInfoMobile.id === item.audit_id &&
                (item?.status === 1 ? (
                  <Form autoComplete="off" getFormApi={(api) => (formApiRef.current = api)} onSubmit={handleSubmit}>
                    <Form.RadioGroup
                      rules={[{ required: true, message: '请选择签批状态' }]}
                      label={item.audit_name + `（${LOG_STATUS_MAP[item?.status]}）`}
                      field="status"
                      options={[
                        { label: '同意', value: 2 },
                        { label: '不同意', value: 3 },
                        { label: '弃权', value: 4 },
                      ]}
                    />
                    <Form.TextArea field="remark" label="说明" rows={2} />
                    <Form.Slot label="签名" field="autograph">
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
                  </Form>
                ) : item?.status == 3 ? (
                  <div>
                    <div>
                      {item.audit_name}（{LOG_STATUS_MAP[item?.status]}）
                    </div>
                    <div className="flex gap-1">
                      <div className=" break-keep">签名：</div>
                      <img src={item.autograph} alt="签名" className="h-22 w-auto flex-1" />
                    </div>
                    <div>说明：{item.remark}</div>
                  </div>
                ) : null)}
            </div>
          ))}
        </div>
        {/* <div className='bg-white p-3 mx-3 rounded"'>
          <h3 className="text-base font-semibold mt-3">签批流程</h3>
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
                  <div className="text-(--semi-color-text-2)">{ORGANIZATION_MAP[item?.organization]}签批</div>
                  <div>{item?.create_time && dayjs(item?.create_time).format('YYYY-MM-DD')}</div>
                </div>
                {userInfoMobile.id === item.audit_id && item?.status === 1 ? (
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
                    <Form.Slot label="签名" field="autograph">
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
        </div> */}
      </div>
    </>
  )
}
