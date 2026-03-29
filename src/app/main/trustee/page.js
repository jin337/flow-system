'use client'

import Http from '@/service/api'
import { IconUpload } from '@douyinfe/semi-icons'
import { Button, Col, Descriptions, Form, Modal, Row, SideSheet, Space, Table, Timeline, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import PdfViewer from '@/components/PdfViewer'

export default function Page() {
  const formApiRef = useRef(null)
  const { LOG_STATUS_MAP, ORDER_STATUS_MAP, ORGANIZATION_MAP, userInfo } = useSelector((state) => state.common)

  const [tableData, setTableData] = useState([])

  const [visible, setVisible] = useState(false)
  const [rowInfo, setRowInfo] = useState({})

  const [visibleView, setVisibleView] = useState(false)
  const [viewInfo, setViewInfo] = useState({})

  const columns = [
    {
      title: '序号',
      dataIndex: '',
      width: 70,
      align: 'center',
      render: (text, record, index) => index + 1,
    },
    {
      title: '主题',
      dataIndex: 'motive',
      ellipsis: true,
    },
    {
      title: '文件',
      dataIndex: 'file',
      width: 70,
      render: (text, record) => <PdfViewer url={record.file_url} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (text) => ORDER_STATUS_MAP[text] || '未知',
    },
    {
      title: '发起人',
      width: 100,
      dataIndex: 'create_by_name',
    },
    {
      title: '发起日期',
      dataIndex: 'create_time',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 270,
      render: (text, record) => (
        <Space>
          {record.status === 2 && (
            <Button theme="borderless" type="primary" onClick={() => resetRow(record)}>
              撤回
            </Button>
          )}
          {[1, 4].includes(record.status) && (
            <Button theme="borderless" type="primary" onClick={() => EditRow(record)}>
              编辑
            </Button>
          )}
          {[1, 4].includes(record.status) && (
            <Button theme="borderless" type="primary" onClick={() => SubmitRow(record)}>
              提交
            </Button>
          )}
          {record.status !== 1 && (
            <Button theme="borderless" type="primary" onClick={() => ViewRow(record)}>
              查看
            </Button>
          )}
          {[1, 4].includes(record.status) && (
            <Button theme="borderless" type="danger" onClick={() => DeleteRow(record)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  useEffect(() => {
    getTableData()
  }, [])
  // 获取表格列表
  const getTableData = async () => {
    const { code, data, message } = await Http.post('/api/trustee/list', { page: 1, page_size: 10000 })
    if (code === 200) {
      setTableData(data?.list || [])
    } else {
      Toast.error(message)
    }
  }

  // 删除
  const DeleteRow = (record) => {
    Modal.warning({
      title: '提醒',
      content: (
        <span>
          是否确认 <b className="text-red-500">删除</b> 当前数据？
        </span>
      ),
      centered: true,
      onOk: async () => {
        const { code, message } = await Http.post('/api/trustee/delete', { id: record.id })
        if (code === 200) {
          Toast.success(message)
          getTableData()
        } else {
          Toast.error(message)
        }
        Modal.destroyAll()
      },
    })
  }

  // 提交
  const SubmitRow = (record) => {
    Modal.info({
      title: '提醒',
      content: (
        <span>
          是否确认 <b className="text-blue-500">提交</b> 当前数据？
        </span>
      ),
      centered: true,
      onOk: async () => {
        const { code, message } = await Http.post('/api/trustee/update/status', { id: record.id, status: 2 })
        if (code === 200) {
          Toast.success(message)
          getTableData()
        } else {
          Toast.error(message)
        }
        Modal.destroyAll()
      },
    })
  }
  // 撤回
  const resetRow = (record) => {
    Modal.info({
      title: '提醒',
      content: (
        <span>
          是否确认 <b className="text-blue-500">撤回</b> 当前数据？
        </span>
      ),
      centered: true,
      onOk: async () => {
        const { code, message } = await Http.post('/api/trustee/update/status', { id: record.id, status: 4 })
        if (code === 200) {
          Toast.success(message)
          getTableData()
        } else {
          Toast.error(message)
        }
        Modal.destroyAll()
      },
    })
  }

  // 查看
  const ViewRow = (record) => {
    setViewInfo(record)
    setVisibleView(true)
  }

  // 新建/编辑
  const EditRow = (record) => {
    setVisible(true)

    const value = record?.id
      ? {
          ...record,
          files: [
            {
              name: record.file_name,
              url: record.file_url,
            },
          ],
          loglist: record?.logs?.map((e) => e.id) || [],
        }
      : { create_by_name: userInfo.name }
    setRowInfo(value)
    setTimeout(() => {
      formApiRef.current.setValues(value)
    }, 100)
  }

  // 文件上传
  const onSuccess = ({ data }) => {
    setRowInfo({
      ...rowInfo,
      files: [
        {
          name: data.name,
          url: data.url,
        },
      ],
    })
    Toast.success('上传成功')
  }

  // 上传失败
  const onError = () => {
    Toast.error('上传失败')
  }
  // 提交
  const handleSubmit = () => {
    formApiRef.current?.validate().then(async (values) => {
      const files = values?.files[0]?.response?.data || values.files[0]
      const params = {
        ...rowInfo,
        ...values,
        file_name: files?.name,
        file_url: files?.url,
      }
      let url = '/api/trustee/create'
      if (rowInfo?.id) {
        params.id = rowInfo.id
        url = '/api/trustee/update'
      } else {
        params.create_by = userInfo.id
      }
      delete params.files
      delete params.loglist
      const { code, message } = await Http.post(url, params)
      if (code === 200) {
        Toast.success(message)
        getTableData()
      } else {
        Toast.error(message)
      }
      setVisible(false)
    })
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button type="primary" theme="solid" onClick={() => EditRow()}>
          新增审批
        </Button>
      </div>
      <Table columns={columns} dataSource={tableData} bordered pagination={false} />

      <Modal
        title={rowInfo?.id ? '编辑' : '新建'}
        centered
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={handleSubmit}>
        <Form autoComplete="off" getFormApi={(api) => (formApiRef.current = api)} onSubmit={handleSubmit}>
          <Row>
            <Col span={10}>
              <Form.Input field="create_by_name" label="发起人" disabled={true} />
            </Col>
            <Col span={12} offset={2}>
              <Form.DatePicker
                type="dateTime"
                field="create_time"
                label="发起时间"
                rules={[{ required: true, message: '请选择时间' }]}
              />
            </Col>
          </Row>
          <Form.TextArea
            field="motive"
            label="主题"
            autosize={{ minRows: 1, maxRows: 3 }}
            rules={[{ required: true, message: '请输入主题' }]}
          />
          <Form.Upload
            field="files"
            label="文件"
            action="/api/update/pdf"
            limit={1}
            accept={'.pdf,.PDF'}
            headers={{ token: userInfo.token }}
            dragMainText={'点击上传文件或拖拽文件到这里'}
            dragSubText="仅支持pdf"
            rules={[{ required: true, message: '请上传文件' }]}
            name="file"
            onSuccess={onSuccess}
            onError={onError}>
            <Button icon={<IconUpload />} theme="light">
              点击上传
            </Button>
          </Form.Upload>
          <Form.TextArea field="remark" label="备注" rows={5} />
        </Form>
      </Modal>

      <SideSheet title="基本信息" width={600} visible={visibleView} onCancel={() => setVisibleView(false)}>
        {/* 基本信息 */}
        <div className="mb-6">
          <Descriptions
            data={[
              { key: '发起人', value: viewInfo.create_by_name },
              { key: '发起日期', value: dayjs(viewInfo.create_time).format('YYYY-MM-DD HH:mm:ss') },
              { key: '状态', value: ORDER_STATUS_MAP[viewInfo.status] },
              { key: '主题', value: viewInfo.motive },
              {
                key: '文件',
                value: <PdfViewer url={viewInfo.file_url} />,
              },
              { key: '备注', value: viewInfo.remark },
            ]}
          />
        </div>

        {/* 审批流程 */}
        <>
          <h3 className="text-lg font-semibold mb-3">审批流程</h3>
          {viewInfo?.logs?.length ? (
            <Timeline mode="left">
              {viewInfo?.logs?.map((item, index) => (
                <Timeline.Item
                  key={index}
                  extra={
                    item.autograph && (
                      <div className="flex wrap-normal">
                        签名：
                        <img src={item.autograph} alt="签名" className="h-25 w-auto" />
                      </div>
                    )
                  }>
                  <div className="flex items-center justify-between">
                    <div className="text-(--semi-color-text-2)">{ORGANIZATION_MAP[item?.organization]}审批</div>
                    <div>{dayjs(viewInfo.create_time).format('YYYY-MM-DD HH:mm:ss')}</div>
                  </div>
                  <div>
                    {item.audit_name}（{LOG_STATUS_MAP[item?.status]}）
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <div className="text-(--semi-color-text-2)">暂无内容</div>
          )}
        </>
      </SideSheet>
    </>
  )
}
