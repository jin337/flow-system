import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // 队列满时等待，而不是直接报错
  connectionLimit: 2,      // 最大连接数 (Serverless 环境建议设为 1-2)
  queueLimit: 0,            // 排队请求上限 (0 为无限制)
  enableKeepAlive: true,    // 保持长连接
  keepAliveInitialDelay: 0  // 立即开始
});

// 导出供全项目使用
export { pool };
