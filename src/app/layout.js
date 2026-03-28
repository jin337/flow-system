'use client'

import { store } from '@/store/index'
import { Provider } from 'react-redux'

import './globals.css'

export default function RootLayout({ children }) {
  return (
    <Provider store={store}>
      <html lang="en">
        <body className="w-screen h-screen bg-[#E2EEFF]">{children}</body>
      </html>
    </Provider>
  )
}
