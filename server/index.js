const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // 添加http模块引用
// 删除对不存在的deepseek-ai的引用
// const { DeepSeekAI } = require('deepseek-ai');
const app = express();
const port = 3001;
const BACKUP_PORTS = [3002, 3003, 3004, 3005]; // 添加备用端口
const db = require('./database');
const apiRoutes = require('./api-routes');

// 增强CORS配置以解决跨域问题
app.use(cors({
  origin: 'http://localhost:3000', // 允许前端域名，或者设置为 '*' 允许所有源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // 允许携带凭证
}));

// 添加预检请求处理中间件
app.options('*', cors());

// 添加请求体解析中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 简单的请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

// API路由
app.use('/api', apiRoutes);

// 根路径响应
app.get('/', (req, res) => {
  res.json({ message: '奶茶记账API服务器已启动', version: '1.0.0' });
});

// 注释掉AI分析相关代码，使用OpenAI包的方式参考mock-server.js
/*
const deepseek = new DeepSeekAI({
  apiKey: 'sk-18ad8739c9054f5eb56a01cb7b8d5c48'
});

// AI分析接口 - 流式响应
app.post('/api/analyze', async (req, res) => {
  try {
    const { userData } = req.body;
    
    // 设置响应头以支持流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 构建提示词
    const prompt = `
    你是一位专业的奶茶健康顾问，请根据以下用户数据提供个性化的健康建议：
    
    每周摄入数据:
    - 卡路里: ${userData.calories} 卡路里
    - 糖分: ${userData.sugar}g
    - 咖啡因: ${userData.caffeine}mg
    - 消费金额: ¥${userData.cost}
    
    健康目标:
    - 每周预算: ¥${userData.budgetGoal}
    - 每周糖分目标: ${userData.sugarGoal}g
    - 每周咖啡因目标: ${userData.caffeineGoal}mg
    
    请提供三类建议：
    1. 预算友好型建议：推荐2-3款价格实惠的奶茶选择，并说明可以节省多少费用
    2. 健康均衡型建议：推荐2-3款低糖低热量的选择，并说明可以减少多少糖分和热量
    3. 睡眠友好型建议：推荐2-3款低咖啡因的选择，并说明对睡眠的好处
    
    对于每个建议，请包含具体的品牌、产品名称、价格/糖分/咖啡因含量等信息。
    `;
    
    // 调用DeepSeek API进行流式输出
    const stream = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
    
    // 处理流式响应
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        // 发送数据到客户端
        res.write(`data: ${JSON.stringify({ content: chunk.choices[0].delta.content })}\n\n`);
      }
    }
    
    // 结束响应
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('DeepSeek API 错误:', error);
    res.status(500).json({ error: '分析过程中出现错误' });
  }
});
*/

// 检查端口是否被占用的函数
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => {
      // 端口被占用
      resolve(false);
    });
    server.once('listening', () => {
      // 端口可用，关闭测试服务器
      server.close(() => {
        resolve(true);
      });
    });
    server.listen(port);
  });
}

// 初始化数据库并启动服务器
async function startServer() {
  try {
    console.log('正在连接MySQL数据库...');
    // 初始化数据库
    await db.initDatabase();
    console.log('数据库初始化成功');
    
    // 尝试使用主端口启动
    if (await isPortAvailable(port)) {
      app.listen(port, () => {
        console.log(`服务器运行在 http://localhost:${port}`);
        console.log('已启用账单CRUD API接口:');
        console.log('- GET /api/bills - 获取所有账单');
        console.log('- GET /api/bills/filter - 按条件筛选账单');
        console.log('- POST /api/bills - 添加新账单');
        console.log('- PUT /api/bills/:id - 更新账单');
        console.log('- DELETE /api/bills/:id - 删除账单');
        console.log('- POST /api/bills/batch - 批量导入账单');
        console.log('- GET /api/health - 健康检查');
      });
      return;
    }
    
    // 如果主端口不可用，尝试备用端口
    console.log(`端口 ${port} 被占用，尝试使用备用端口...`);
    for (const backupPort of BACKUP_PORTS) {
      if (await isPortAvailable(backupPort)) {
        app.listen(backupPort, () => {
          console.log(`服务器运行在 http://localhost:${backupPort}`);
          console.log('已启用账单CRUD API接口:');
          console.log('- GET /api/bills - 获取所有账单');
          console.log('- GET /api/bills/filter - 按条件筛选账单');
          console.log('- POST /api/bills - 添加新账单');
          console.log('- PUT /api/bills/:id - 更新账单');
          console.log('- DELETE /api/bills/:id - 删除账单');
          console.log('- POST /api/bills/batch - 批量导入账单');
          console.log('- GET /api/health - 健康检查');
        });
        return;
      }
    }
    
    // 所有端口都被占用
    console.error(`无法启动服务器，所有端口 [${port}, ${BACKUP_PORTS.join(', ')}] 均被占用`);
    process.exit(1);
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

startServer();