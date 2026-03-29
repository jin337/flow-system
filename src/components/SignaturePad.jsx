'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

const SignaturePad = forwardRef((props, ref) => {
  const signatureRef = useRef(null)

  useImperativeHandle(ref, () => ({
    // 获取签名图片（base64）
    getSignature: () => {
      return signatureRef.current?.toDataURL('image/png')
    },
    // 清空签名
    clear: () => {
      signatureRef.current?.clear()
    },
    // 判断是否为空
    isEmpty: () => {
      return signatureRef.current?.isEmpty()
    }
  }))

  return (
    <div className="w-full border border-gray-300 rounded bg-white">
      <SignatureCanvas
        ref={signatureRef}
        canvasProps={{
          className: 'signatureCanvas w-full h-25',
          style: { width: '100%', height: '100px' }
        }}
        {...props}
      />
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
