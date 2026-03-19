import LayoutBody from './layoutBody.js'

import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const font = Bricolage_Grotesque({
  weight: '400',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Demo App',
  description: 'this is a demo app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${font.className} w-screen h-screen bg-white`}>
        <LayoutBody>{children}</LayoutBody>
      </body>
    </html>
  )
}
