'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { setUserInfoMobile } from '@/store/reducers/common'
import { localGetItem } from '@/utils/common'
import { usePathname, useRouter } from 'next/navigation'

export default function LayoutBody({ children }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const userInfo = localGetItem('LOGINUSER_INFO_MOBILE')

  // 登录用户信息
  useEffect(() => {
    if (!userInfo) {
      if (pathname.includes('/mobile/trustee')) {
        router.push('/mobile/login-trustee')
      }
      if (pathname.includes('/mobile/shareholder')) {
        router.push('/mobile/login-shareholder')
      }
    }
    dispatch(setUserInfoMobile(userInfo))
  }, [userInfo])

  return <div className="w-screen min-h-screen bg-[#f5f5f5] relative">{children}</div>
}
