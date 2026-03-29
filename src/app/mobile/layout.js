'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { setUserInfo } from '@/store/reducers/common'
import { localGetItem } from '@/utils/common'
export default function LayoutBody({ children }) {
  const dispatch = useDispatch()
  const userInfo = localGetItem('LOGINUSER_INFO')

  // 登录用户信息
  useEffect(() => {
    if (!userInfo) {
      router.push('/login')
    }
    dispatch(setUserInfo(userInfo))
  }, [userInfo])
  return <div className="w-screen min-h-screen bg-[#f5f5f5]">{children}</div>
}
