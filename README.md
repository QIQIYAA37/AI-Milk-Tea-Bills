# 奶茶记账与健康管理应用

## 功能特性

- 奶茶消费记录与统计
- 营养成分分析与健康建议
- 智能消费推荐
- 数据可视化
- MySQL数据库存储账单信息
- **纯AI智能搜索奶茶信息**（升级功能）

## 架构

- 前端：Vue 3 + Vite
- 后端：Express.js
- 数据库：MySQL
- AI服务：DeepSeek API (营养分析和健康建议)

## DeepSeek API集成

本应用使用DeepSeek API提供智能分析功能：

1. **营养分析**：分析奶茶的营养成分，提供健康建议
2. **健康报告**：基于用户的消费习惯生成个性化健康报告
3. **智能推荐**：根据用户偏好和健康目标推荐合适的奶茶选择
4. **纯AI奶茶搜索**：使用AI技术分析任意奶茶的营养成分信息（升级功能）

### 流式输出

应用使用DeepSeek API的流式输出功能，提供实时分析体验：

- 前端直接调用DeepSeek API，避免CORS问题
- 使用fetch API的流式处理能力接收分块响应
- 实时将AI生成的文本显示在界面上

### 纯AI奶茶搜索功能

升级后的纯AI奶茶搜索功能具有以下特点：

- 不再依赖预置数据库，用户可搜索任意奶茶产品
- 移除了传统搜索按钮，专注于AI智能分析
- 基于AI大模型的知识，提供奶茶的品牌、规格、营养成分等信息
- 实时分析搜索到的奶茶对健康的影响
- 简化用户界面，移除了配料选择功能，专注于甜度和冰量的调整
- 搜索框支持回车键快速搜索

## 快速开始

1. 安装依赖：
```
npm install
```

2. 配置数据库：
确保MySQL服务已运行，并创建milk_tea_db数据库：
```sql
CREATE DATABASE IF NOT EXISTS milk_tea_db;
```

3. 启动后端服务：
```
node server/index.js
```

4. 启动前端开发服务器：
```
npm run dev
```

5. 访问应用：
在浏览器中访问 http://localhost:3001

## API文档

### 账单API

- `GET /api/bills` - 获取所有账单
- `GET /api/bills/filter` - 按条件筛选账单
- `POST /api/bills` - 添加新账单
- `PUT /api/bills/:id` - 更新账单
- `DELETE /api/bills/:id` - 删除账单

### DeepSeek API (前端直接调用)

- 营养分析 - 分析特定奶茶的营养成分并提供健康建议
- 健康报告 - 根据用户消费数据生成健康分析
- 智能推荐 - 提供个性化奶茶推荐
- **纯AI奶茶搜索** - 搜索并分析任意奶茶的营养成分（升级功能）

## 配置说明

编辑 `server/database.js` 修改数据库连接信息：

```javascript
const rootPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: 3306
});
```

DeepSeek API密钥在`src/services/api.js`中配置：

```javascript
// DeepSeek API配置
const DEEPSEEK_API_KEY = 'sk-18ad8739c9054f5eb56a01cb7b8d5c48';
const DEEPSEEK_API_URL = 'https://api.deepseek.com';
```

## 使用纯AI奶茶搜索功能

1. 在营养分析页面的搜索框中输入任意奶茶名称
2. 点击"AI智能搜索"按钮或按回车键
3. 系统将自动使用DeepSeek API搜索该奶茶的营养信息
4. 搜索结果将在页面上显示
5. 可以调整甜度和冰量，并观察对营养成分的影响
6. 点击"开始AI分析"可获取更详细的健康建议

## 界面升级

新版本中我们对用户界面进行了以下优化：

1. 简化搜索体验，移除传统搜索按钮，专注于AI搜索
2. 增大搜索框尺寸，提升用户体验
3. 美化空状态提示，引导用户进行搜索
4. 移除配料选择功能，简化交互流程
5. 统一所有搜索结果为AI分析标记
6. 支持键盘回车快速搜索

## 注意事项

1. 确保MySQL服务已启动
2. 后端服务默认运行在端口3001
3. 前端开发服务器默认运行在端口3000
4. 确保有有效的DeepSeek API密钥

## 项目结构

```
src/
├── assets/              # 静态资源
│   ├── styles/          # 样式文件
│   │   └── bill.css     # 账单页面样式
│   └── main.css         # 主样式文件
├── components/          # 组件
│   └── bill/            # 账单相关组件
│       ├── BillStatsSummary.vue    # 统计卡片组件
│       ├── BillChartDisplay.vue    # 图表显示与切换组件
│       ├── BillBrandAnalysis.vue   # 品牌分析饼图组件
│       ├── BillSizeAnalysis.vue    # 规格分析条形图组件
│       └── BillTable.vue           # 账单表格组件
├── router/              # 路由配置
├── services/            # 服务 API
└── views/               # 页面视图
    ├── BillView.vue     # 原账单管理页面
    ├── BillViewNew.vue  # 重构后的账单管理页面
    ├── HomeView.vue     # 首页
    ├── NutritionView.vue # 营养分析页面
    └── HealthView.vue   # 健康管家页面
```

## 组件化设计

项目使用了组件化设计，将 BillView 拆分为多个独立组件：

1. **BillStatsSummary**: 显示月度消费、周度消费和平均单价的统计卡片
2. **BillChartDisplay**: 负责趋势图和月度图表的显示与切换，以及日期范围选择
3. **BillBrandAnalysis**: 品牌消费分析饼图
4. **BillSizeAnalysis**: 不同规格奶茶的消费分析条形图
5. **BillTable**: 账单数据表格，支持添加、编辑和删除功能

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Vue Composition API
- **图表库**: ECharts 5
- **路由**: Vue Router

## 图表渲染优化

为解决图表初始化问题（高度/宽度为0导致渲染失败），做了以下优化：

1. 使用绝对定位方式处理图表容器
2. 添加占位元素确保容器始终有固定高度
3. 改进图表切换逻辑，确保只有当前活跃图表被初始化和更新
4. 增加适当的延迟，确保DOM完全渲染后再初始化图表
5. 当bills数据变化时，智能更新当前可见的图表

## 组件通信方式

- 使用props向下传递数据（bills、filteredBills）
- 使用自定义事件向上传递操作（add、update、delete、update:dateRange）
- 保持状态提升，核心数据在父组件中管理

## 样式设计

- 统一的颜色方案，以紫色(#8e44ad)为主色调
- 响应式设计，支持移动端和桌面端
- 增强的用户交互体验（悬停效果、过渡动画）
- 清晰的数据可视化（标签、提示框、图例）

## 如何运行

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev-with-api

# 构建生产版本
npm run build
```

## 未来改进计划

- 添加用户账户系统，支持多用户
- 增加数据导出功能（Excel、PDF）
- 提供更多统计分析指标
- 增加智能推荐功能，根据消费习惯推荐健康选择
- 添加目标设置与提醒功能，帮助控制消费和摄入

## 数据持久化说明

本项目实现了账单数据的持久化存储，确保用户的账单数据不会因页面刷新或浏览器关闭而丢失：

1. 所有账单数据存储在MySQL数据库的`bills`表中
2. 账单的增删改查操作都会自动同步到数据库
3. 应用启动时会自动从数据库加载历史账单数据
4. 首次使用时，系统会自动导入一些示例数据

### 数据库结构

账单表（bills）字段说明：

| 字段名      | 类型           | 说明                   |
|------------|---------------|------------------------|
| id         | INT           | 自增主键                |
| date       | DATE          | 消费日期                |
| brand      | VARCHAR(100)  | 品牌名称                |
| name       | VARCHAR(100)  | 商品名称                |
| size       | VARCHAR(50)   | 规格大小                |
| price      | DECIMAL(10,2) | 价格                   |
| calories   | INT           | 热量（千卡）            |
| sugar      | DECIMAL(10,2) | 糖分（克）              |
| fat        | DECIMAL(10,2) | 脂肪（克）              |
| caffeine   | INT           | 咖啡因（毫克）          |
| created_at | TIMESTAMP     | 记录创建时间            |
| updated_at | TIMESTAMP     | 记录更新时间            |

## API接口说明

### 账单相关接口

| 接口                   | 请求方法 | 说明                     |
|------------------------|---------|-------------------------|
| /api/bills             | GET     | 获取所有账单             |
| /api/bills/filter      | GET     | 根据条件筛选账单         |
| /api/bills             | POST    | 添加账单                 |
| /api/bills/:id         | PUT     | 更新账单                 |
| /api/bills/:id         | DELETE  | 删除账单                 |
| /api/bills/batch       | POST    | 批量导入账单（测试数据）  |

### 健康分析接口

| 接口                   | 请求方法 | 说明                     |
|------------------------|---------|-------------------------|
| /api/analyze           | POST    | 分析用户消费数据         |

## 开发指南

### 目录结构

```
.
├── public/               # 静态资源
├── src/                  # 前端源代码
│   ├── assets/           # 样式和图片
│   ├── components/       # 组件
│   │   └── bill/         # 账单相关组件
│   ├── services/         # API服务
│   └── views/            # 页面视图
├── server/               # 后端服务
│   ├── sql/              # SQL脚本
│   └── database.js       # 数据库配置
└── README.md             # 说明文档
```

## 注意事项

- 请确保MySQL服务已启动，否则数据持久化功能无法正常工作
- 如果遇到数据库连接问题，请检查server/database.js中的连接配置
- 初次使用时，系统会自动创建数据库和表结构 