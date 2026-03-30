'use client'

import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import Http from '@/service/api'

import { IconUpload } from '@douyinfe/semi-icons'
import { Button, Col, Descriptions, Form, Modal, Row, SideSheet, Space, Table, Timeline, Toast } from '@douyinfe/semi-ui'

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
      title: '单据号',
      dataIndex: 'order_id',
      width: 190,
    },
    {
      title: '主题',
      dataIndex: 'motive',
      ellipsis: true,
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
      render: (text) => text && dayjs(text).format('YYYY-MM-DD'),
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
    const { code, data, message } = await Http.post('/api/shareholder/list', { page: 1, page_size: 10000 })
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
        const { code, message } = await Http.post('/api/shareholder/delete', { id: record.id })
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
        const { code, message } = await Http.post('/api/shareholder/update/status', { id: record.id, status: 2 })
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
        const { code, message } = await Http.post('/api/shareholder/update/status', { id: record.id, status: 4 })
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
          files: record.files.map((e) => ({ ...e, url: e.file_url, name: e.file_name })),
          loglist: record?.logs?.map((e) => e.id) || [],
        }
      : {
          create_by_name: userInfo.name,
          create_by: userInfo.id,
          create_time: dayjs().format('YYYY-MM-DD'),
        }

    setRowInfo(value)
    setTimeout(() => {
      formApiRef.current.setValues(value)
    }, 100)
  }

  // 文件上传
  const onChange = (file, fileList) => {
    setRowInfo({
      ...rowInfo,
      files: fileList,
    })
  }

  // 提交
  const handleSubmit = () => {
    formApiRef.current?.validate().then(async (values) => {
      let list = []
      // 文件内容
      values?.files.forEach((element) => {
        if (element.response) {
          list.push({
            name: element.response?.data.name,
            url: element.response?.data.url,
          })
        } else {
          list.push({
            name: element.file_name,
            url: element.file_url,
          })
        }
      })

      const params = {
        ...rowInfo,
        ...values,
        file_list: list,
      }

      let url = '/api/shareholder/create'
      if (rowInfo?.id) {
        url = '/api/shareholder/update'
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
          新增签批
        </Button>
      </div>
      <Table columns={columns} dataSource={tableData} bordered pagination={false} />

      {/* 编辑弹窗 */}
      <Modal
        title={rowInfo?.id ? '编辑' : '新增'}
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
                field="create_time"
                label="发起日期"
                rules={[{ required: true, message: '请选择日期' }]}
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
            dragMainText={'点击上传文件或拖拽文件到这里'}
            dragSubText="仅支持pdf"
            rules={[{ required: true, message: '请上传文件' }]}
            action="/api/update/pdf"
            headers={{ token: userInfo?.token }}
            accept={'.pdf,.PDF'}
            name="file"
            multiple
            onChange={onChange}>
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
              { key: '单据号', value: viewInfo.order_id },
              { key: '发起人', value: viewInfo.create_by_name },
              { key: '发起日期', value: viewInfo?.create_time && dayjs(viewInfo.create_time).format('YYYY-MM-DD') },
              { key: '状态', value: ORDER_STATUS_MAP[viewInfo.status] },
              { key: '主题', value: viewInfo.motive },
              {
                key: '文件',
                value: <PdfViewer list={viewInfo.files} />,
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
                    <div>{item?.create_time && dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss')}</div>
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
