'use client'

import { Modal } from '@douyinfe/semi-ui'
import { useState } from 'react'

const PdfViewer = ({ url, name, list, type }) => {
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState(null)

  // 检测是否为移动端
  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 验证 url 是否有效
  const isValidUrl = (str) => {
    if (!str || typeof str !== 'string') return false
    // 检查是否为 http/https 开头的链接，或相对路径
    const pattern = /^(https?:\/\/|\/|\.\/|\.\.\/)/i
    return pattern.test(str.trim())
  }

  const handleClick = (link) => {
    // 优先校验 url
    if (!isValidUrl(link)) {
      Toast.warning('PDF 链接无效，无法预览')
      return
    }
    setView(link)
    // 预览
    if (isMobile()) {
      window.open(link, '_blank')
    } else {
      setVisible(true)
    }
  }
  // 渲染列表
  const renderList = () => {
    if (!Array.isArray(list) || list.length === 0) {
      return null
    }
    return list.map((item) => (
      <div
        key={item.id}
        className={`cursor-pointer ${type === 'mobile' ? 'mb-2' : ''}`}
        onClick={() => handleClick(item.file_url)}>
        <span className="text-(--semi-color-primary)">{item.file_name}</span>
      </div>
    ))
  }

  return (
    <>
      {isValidUrl(url) ? (
        <span className="cursor-pointer" onClick={() => handleClick(url)}>
          {name ? (
            <span className="text-(--semi-color-primary)">{name}</span>
          ) : (
            <svg viewBox="0 0 1024 1024" width="30" height="30">
              <path
                fill="#D93838"
                d="M910.2336 1024H113.7664C51.2 1024 0 972.8 0 910.2336V113.7664C0 51.2 51.2 0 113.7664 0h796.4672C972.8 0 1024 51.2 1024 113.7664v796.4672C1024 972.8 972.8 1024 910.2336 1024zM155.2128 555.4432h44.672c35.9936 1.2032 66.0224-8.704 89.984-29.6704 24.0128-20.9664 36.0192-48.3328 36.0192-82.1248 0-33.28-10.24-58.9568-30.7712-76.8768-20.5312-17.92-49.3568-26.88-86.5536-26.88h-97.792v344.2432h44.4416v-128.6912z m0-176.4352h45.3376c52.48 0 78.6688 22.1184 78.6688 66.432 0 22.8096-7.04 40.3456-21.12 52.5824-14.08 12.1856-34.6624 18.304-61.7728 18.304H155.2128v-137.3184z m234.0352 305.1008h94.6432c54.528 0 99.072-16.0768 133.6576-48.2048 34.6112-32.1536 51.8912-74.9056 51.8912-128.256 0-51.0976-17.28-91.8528-51.8912-122.2144-34.56-30.336-77.952-45.568-130.0992-45.568h-98.2016v344.2432z m44.416-304.6656h51.9936c41.0624 0 74.1632 10.8032 99.328 32.4608 25.216 21.6064 37.7856 53.888 37.7856 96.8704 0 43.008-12.2368 76.3392-36.7872 100.224-24.5248 23.8592-58.624 35.7632-102.3232 35.7632H433.664V379.4432z m479.5648 0v-39.5776h-177.3312v344.2432h44.4416v-150.4512h123.1104V494.592h-123.136v-115.1232h132.9152z"></path>
            </svg>
          )}
        </span>
      ) : (
        renderList()
      )}

      <Modal centered title="PDF预览" width={'80%'} visible={visible} onCancel={() => setVisible(false)} footer={null}>
        <iframe src={view} className="w-full h-[70vh] pb-5" title="预览PDF" />
      </Modal>
    </>
  )
}

export default PdfViewer
