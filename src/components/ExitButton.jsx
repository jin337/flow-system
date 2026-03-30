'use client'

import { useRouter } from 'next/navigation'

const ExitButton = ({ type, organization }) => {
  const router = useRouter()

  const onGoto = (e) => {
    if (e === 'back') {
      router.back()
    }
    if (e === 'exit') {
      if (organization === 1) {
        router.push('/mobile/login-trustee')
      }
      if (organization === 2) {
        router.push('/mobile/login-shareholder')
      }
      localStorage.removeItem('LOGINUSER_INFO_MOBILE')
    }
  }

  if (type === 'exit') {
    return (
      <div className="bg-(--semi-color-primary) py-4 px-4 flex justify-between sticky z-50 top-0 text-base text-white">
        <span></span>
        <span className="absolute left-[50%] top-[50%]" style={{ transform: 'translate(-50%, -50%)' }}>
          待办事项
        </span>
        <span onClick={() => onGoto('exit')}>退出</span>
      </div>
    )
  }

  return (
    <div className="bg-(--semi-color-primary) py-4 px-4 flex justify-between sticky z-50 top-0 text-base text-white">
      <span onClick={() => onGoto('back')}>返回</span>
      <span className="absolute left-[50%] top-[50%]" style={{ transform: 'translate(-50%, -50%)' }}>
        签批
      </span>
      <span></span>
    </div>
  )
}

export default ExitButton
