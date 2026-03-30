'use client'
import { store } from '@/store/index'
import '@douyinfe/semi-ui/react19-adapter'
import { Provider } from 'react-redux'

import './globals.css'

export default function RootLayout({ children }) {
  return (
    <Provider store={store}>
      <html lang="en">
        <head>
          <title>签批系统</title>
        </head>
        <body className="w-screen h-screen bg-white">{children}</body>
      </html>
    </Provider>
  )
}
