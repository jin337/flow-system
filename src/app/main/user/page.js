'use client'

import Http from '@/service/api'
import { Button, Form, Modal, Space, Table, Toast } from '@douyinfe/semi-ui'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'

export default function Page() {
  const formApiRef = useRef(null)
  const [tableData, setTableData] = useState([])

  const [visible, setVisible] = useState(false)
  const [rowInfo, setRowInfo] = useState({})

  const columns = [
    {
      title: '序号',
      dataIndex: '',
      width: 70,
      align: 'center',
      render: (text, record, index) => index + 1,
    },
    {
      title: '用户名',
      dataIndex: 'name',
    },
    {
      title: '登录账号',
      dataIndex: 'username',
    },
    {
      title: '身份类型',
      dataIndex: 'status',
      render: (text) => {
        const statusMap = { 0: '管理员', 1: '董事会成员', 2: '股东会成员', 3: '董秘' }

        // 处理空值
        if (!text && text !== 0) return '-'

        // 统一转换为字符串
        const statusStr = String(text)

        // 分割并映射
        return statusStr
          .split(',')
          .map((item) => statusMap[item] || '未知')
          .join('，')
      },
    },
    {
      title: '董事会职务',
      dataIndex: 'trustee_type',
      render: (text) => {
        const statusMap = { 1: '董事', 2: '董事长' }
        return statusMap[text]
      },
    },
    {
      title: '是否管理员',
      dataIndex: 'is_admin',
      width: 110,
      align: 'center',
      render: (text) => (!!text ? '是' : '否'),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      width: 160,
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 140,
      render: (text, record) => (
        <Space>
          <Button theme="borderless" type="primary" onClick={() => EditRow(record)}>
            编辑
          </Button>
          <Button theme="borderless" type="primary" onClick={() => resetRow(record)}>
            重置密码
          </Button>
          {record.username !== 'admin' && (
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
    const { code, data, message } = await Http.post('/api/user/list', { page: 1, page_size: 10000000 })
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
        const { code, message } = await Http.post('/api/user/delete', { id: record.id })
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

  // 重置密码
  const resetRow = (record) => {
    Modal.info({
      title: '提醒',
      content: (
        <span>
          是否确认 <b className="text-blue-500">重置密码</b> 当前账号密码？
        </span>
      ),
      centered: true,
      onOk: async () => {
        const { code, message } = await Http.post('/api/user/reset-pass', { id: record.id })
        if (code === 200) {
          Toast.success(`${message},默认密码为：123456`)
        } else {
          Toast.error(message)
        }
        Modal.destroyAll()
      },
    })
  }

  // 新建/编辑
  const EditRow = (record) => {
    setVisible(true)

    const value = record?.id
      ? {
          ...record,
          status: record?.status?.split(',').map((e) => Number(e)),
        }
      : { is_admin: 0 }

    setRowInfo(value)

    setTimeout(() => {
      formApiRef.current.setValues(value)
    }, 100)
  }

  // 提交
  const handleSubmit = () => {
    formApiRef.current?.validate().then(async (values) => {
      const params = {
        ...values,
        status: values.username === 'admin' ? '0' : values?.status?.join(','),
      }
      let url = '/api/user/create'
      if (rowInfo?.id) {
        params.id = rowInfo.id
        url = '/api/user/update'
      }
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
          新增用户
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
          {({ formState }) => (
            <>
              <Form.Input field="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]} />
              <Form.Input
                field="username"
                label="登录账号"
                rules={[{ required: true, message: '请输入账号' }]}
                disabled={!!rowInfo?.id && rowInfo?.username === 'admin'}
              />
              {!rowInfo?.id && (
                <Form.Input field="password" label="密码" type="password" rules={[{ required: true, message: '请输入密码' }]} />
              )}
              {rowInfo?.username !== 'admin' && (
                <>
                  <Form.CheckboxGroup
                    label="身份类型"
                    field="status"
                    direction="horizontal"
                    options={[
                      { label: '董事会成员', value: 1 },
                      { label: '股东会成员', value: 2 },
                      { label: '董秘', value: 3 },
                    ]}
                    rules={[{ required: true }]}
                    validate={(e) => {
                      if (!e || e.length === 0) {
                        return '请选择身份类型'
                      }
                      if (e.includes(3) && e.length > 1) {
                        return '董秘不能与其他身份同时选择'
                      }
                      return null
                    }}
                    trigger={['blur', 'change']}
                  />
                  {formState.values?.status?.includes(1) ? (
                    <Form.RadioGroup
                      label="董事会职务"
                      field="trustee_type"
                      initValue={rowInfo?.trustee_type}
                      direction="horizontal"
                      disabled={[0, '0'].includes(rowInfo?.status)}
                      options={[
                        { value: 1, label: '董事' },
                        { value: 2, label: '董事长' },
                      ]}
                    />
                  ) : null}
                  <Form.RadioGroup
                    label="是否是管理员"
                    field="is_admin"
                    direction="horizontal"
                    disabled={[0, '0'].includes(rowInfo?.status)}
                    options={[
                      { value: 0, label: '否' },
                      { value: 1, label: '是' },
                    ]}
                  />
                </>
              )}
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}
