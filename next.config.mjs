/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.0.110', '192.168.0.*'],
  // 启用 React 18
  reactCompiler: true,
  // 需要转译的包
  transpilePackages: ['@douyinfe/semi-ui', '@douyinfe/semi-icons', '@douyinfe/semi-icons-lab', '@douyinfe/semi-illustrations'],
  // 添加重定向
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
