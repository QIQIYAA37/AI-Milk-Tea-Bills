import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import bodyParser from 'body-parser';
import http from 'http';

const app = express();
const PORT = 3005;
const BACKUP_PORTS = [3006, 3007, 3008, 3009];

// 启用CORS和JSON解析
app.use(cors());
app.use(bodyParser.json());

// 创建DeepSeek API客户端
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-18ad8739c9054f5eb56a01cb7b8d5c48',
  defaultHeaders: {
    'Content-Type': 'application/json',
  }
});

// 会话存储 - 新增结果缓存
const sessions = new Map();
const analysisResults = new Map();

// 分析接口 - 调用DeepSeek API生成完整分析和推荐
app.post('/api/analyze', async (req, res) => {
  try {
    const userData = req.body;
    const sessionId = userData.sessionId || Date.now().toString();
    
    console.log(`接收到分析请求，会话ID: ${sessionId}`);
    
    // 保存会话数据
    sessions.set(sessionId, userData);
    
    // 构建提示词 - 包含分析和推荐两部分，但要求格式清晰分离
    const prompt = `
作为一名专业的奶茶健康分析师，请根据以下用户的消费和健康数据，提供严格分离的两部分内容：(1)健康分析报告和(2)奶茶推荐：

## 用户数据
- 本周卡路里摄入: ${userData.calories} 卡路里
- 本周糖分摄入: ${userData.sugar}g
- 本周咖啡因摄入: ${userData.caffeine}mg
- 本周消费金额: ¥${userData.cost}

## 用户设定的健康目标
- 预算目标: 每周不超过 ¥${userData.budgetGoal}
- 糖分目标: 每周不超过 ${userData.sugarGoal}g
- 咖啡因目标: 每周不超过 ${userData.caffeineGoal}mg

请严格按照以下格式响应，使用Markdown格式：

---HEALTH_ANALYSIS_START---
# 奶茶健康分析报告

## 当前状态分析

✅/⚠️/❌ **预算控制状态**：¥${userData.cost}/¥${userData.budgetGoal} (百分比)
✅/⚠️/❌ **糖分摄入状态**：${userData.sugar}g/${userData.sugarGoal}g (百分比)
✅/⚠️/❌ **咖啡因摄入状态**：${userData.caffeine}mg/${userData.caffeineGoal}mg (百分比)

## 综合建议

针对用户数据的1-2条健康建议，包括预算、糖分和咖啡因摄入的平衡等。
---HEALTH_ANALYSIS_END---

---RECOMMENDATIONS_START---
{
  "budgetFriendly": {
    "description": "基于用户消费习惯，推荐价格合理且符合预算的奶茶选项",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "具体价格和特点描述" },
      { "name": "品牌名 - 奶茶名", "description": "具体价格和特点描述" }
    ],
    "tip": "选择这些产品的好处"
  },
  "healthyBalance": {
    "description": "推荐健康平衡的奶茶选项，帮助控制糖分和卡路里摄入",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "具体健康特点描述" },
      { "name": "品牌名 - 奶茶名", "description": "具体健康特点描述" }
    ],
    "tip": "健康方面的好处"
  },
  "sleepFriendly": {
    "description": "推荐低咖啡因的奶茶选项，有助于改善睡眠质量",
    "recommendations": [
      { "name": "品牌名 - 奶茶名", "description": "咖啡因相关特点" },
      { "name": "品牌名 - 奶茶名", "description": "咖啡因相关特点" }
    ],
    "tip": "对睡眠的帮助"
  }
}
---RECOMMENDATIONS_END---
`;

    console.log('发送请求到DeepSeek API进行完整分析...');
    
    // 调用DeepSeek API
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一名专业的奶茶健康分析师，擅长根据用户数据提供个性化的健康分析和奶茶推荐。请严格按照指定格式返回结果。' },
        { role: 'user', content: prompt }
      ]
    });

    // 提取响应内容
    const content = response.choices[0].message.content;
    console.log('收到DeepSeek API完整响应，处理结果...');
    
    // 解析健康分析和推荐部分
    const healthAnalysisMatch = content.match(/---HEALTH_ANALYSIS_START---([\s\S]*?)---HEALTH_ANALYSIS_END---/);
    const recommendationsMatch = content.match(/---RECOMMENDATIONS_START---([\s\S]*?)---RECOMMENDATIONS_END---/);
    
    // 存储结果
    const result = {
      healthAnalysis: healthAnalysisMatch ? healthAnalysisMatch[1].trim() : '无法生成健康分析',
      recommendations: null
    };
    
    // 尝试解析推荐JSON
    if (recommendationsMatch) {
      const recommendationsText = recommendationsMatch[1].trim();
      try {
        result.recommendations = JSON.parse(recommendationsText);
        console.log('成功解析推荐JSON数据');
      } catch (e) {
        console.error('推荐数据解析错误:', e);
        result.recommendations = {
          error: "推荐数据格式错误，请重试",
          rawText: recommendationsText
        };
      }
    }
    
    // 缓存分析结果
    analysisResults.set(sessionId, result);
    
    // 返回成功响应和会话ID
    res.status(200).json({ success: true, sessionId });
  } catch (error) {
    console.error('DeepSeek API错误:', error);
    res.status(500).json({ error: '处理请求时出错' });
  }
});

// 流式输出健康分析接口
app.get('/api/stream', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    
    // 验证会话ID
    if (!sessionId || !sessions.has(sessionId)) {
      console.error(`无效的会话ID: ${sessionId}`);
      res.status(400).json({ error: '无效的会话ID' });
      return;
    }
    
    // 获取缓存的分析结果
    if (!analysisResults.has(sessionId)) {
      console.error(`未找到会话ID: ${sessionId} 的分析结果`);
      res.status(400).json({ error: '未找到分析结果，请重新请求分析' });
      return;
    }
    
    const result = analysisResults.get(sessionId);
    console.log(`找到会话数据: ${sessionId}，开始流式输出健康分析部分`);
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 将健康分析分成小块模拟流式输出
    const healthAnalysis = result.healthAnalysis;
    const chunkSize = 5; // 每次发送5个字符
    
    // 模拟流式输出
    for (let i = 0; i < healthAnalysis.length; i += chunkSize) {
      const chunk = healthAnalysis.slice(i, i + chunkSize);
      console.log('发送数据块:', chunk);
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      
      // 延迟一小段时间模拟流式传输
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // 发送完成标识
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('流式输出错误:', error);
    // 发送错误信息到前端
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// 获取智能推荐接口
app.post('/api/recommendations', async (req, res) => {
  try {
    const userData = req.body;
    const sessionId = userData.sessionId;
    
    console.log('收到推荐请求:', {
      sessionId,
      randomParams: userData._t || 'none',
      extraRandom: userData._r || 'none',
      preferences: userData.preferences || 'none',
      favoredBrand: userData.favoredBrand || 'none',
      healthGoal: userData.healthGoal || 'none',
      timeContext: userData.additionalParameters ? JSON.stringify(userData.additionalParameters) : 'none'
    });
    
    // 如果提供了会话ID，尝试使用缓存的结果，但添加随机变化
    if (sessionId && analysisResults.has(sessionId)) {
      const result = analysisResults.get(sessionId);
      if (result.recommendations) {
        console.log(`获取到会话数据，但添加随机性以避免重复结果: ${sessionId}`);
        
        // 随机品牌名称
        const teaBrands = ['星巴克', '喜茶', '奈雪的茶', '蜜雪冰城', '茶百道', 'COCO', '一点点', '沪上阿姨', '古茗', '益禾堂', '乐乐茶', '霸王茶姬'];
        
        // 随机奶茶名称
        const teaNames = {
          fruity: ['满杯红柚', '芝芝莓莓', '多肉葡萄', '满杯桃桃', '金凤茶王', '满杯橙橙', '葡萄冰', '满杯西瓜', '芒果椰椰', '百香双重奏', '杨枝甘露'],
          milky: ['珍珠奶茶', '波霸奶茶', '椰椰奶冻', '黑糖波波', '芋泥奶茶', '芝士奶盖', '布蕾奶茶', '焦糖奶茶', '红豆奶茶', '双皮奶', '牛乳茶'],
          coffee: ['拿铁咖啡', '美式咖啡', '摩卡咖啡', '焦糖玛奇朵', '冷萃咖啡', '香草拿铁', '冰美式', '卡布奇诺', '脏脏咖啡', '海盐咖啡', '椰云拿铁']
        };
        
        // 随机价格和描述
        const getRandomPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        // 偏好影响选择
        const hasPreference = (name) => {
          if (!userData.preferences) return false;
          return userData.preferences.some(p => p.preference === name && p.value === true);
        };
        
        // 获取用户健康目标 - 影响推荐策略
        const userHealthGoal = userData.healthGoal || null;
        
        // 时间上下文 - 影响推荐
        const timeContext = userData.additionalParameters || {
          timeOfDay: '下午',
          season: '夏',
          weekday: '工作日'
        };
        
        // 根据时间上下文调整推荐
        const adjustForTimeContext = (recommendations, type) => {
          // 根据时间调整推荐
          if (timeContext.timeOfDay === '晚上' && type === 'sleepFriendly') {
            // 晚上更强调无咖啡因
            recommendations.description = recommendations.description.replace('低咖啡因', '无咖啡因');
            recommendations.tip = '晚上8点后建议选择完全无咖啡因的饮品，有助于提高睡眠质量';
          }
          
          // 根据季节调整
          if (timeContext.season === '夏' && (type === 'healthyBalance' || type === 'sleepFriendly')) {
            // 夏季推荐更多果茶
            const newRecs = [];
            for (const rec of recommendations.recommendations) {
              if (rec.name.includes('冰') || rec.name.includes('果')) {
                newRecs.push(rec);
              } else {
                // 为非冰饮/果茶添加冰字或替换
                const fruitTea = teaNames.fruity[Math.floor(Math.random() * teaNames.fruity.length)];
                const brand = rec.name.split(' - ')[0];
                newRecs.push({
                  name: `${brand} - ${fruitTea}`,
                  description: rec.description + (Math.random() > 0.5 ? '，夏季清爽首选' : '，消暑解渴')
                });
              }
            }
            if (newRecs.length > 0) {
              recommendations.recommendations = newRecs;
            }
          }
          
          // 根据工作日/周末调整
          if (timeContext.weekday === '周末' && type === 'budgetFriendly') {
            // 周末可以适当放松预算
            recommendations.tip = '周末可以适当享受一些高品质饮品，犒赏自己的一周辛勤工作';
          }
          
          return recommendations;
        };
        
        // 生成随机化的推荐列表
        const randomizeRecommendations = (originalRecs, type) => {
          // 创建新的推荐对象，保留原始描述
          const newRecs = {
            description: originalRecs.description,
            recommendations: [],
            tip: originalRecs.tip
          };
          
          // 根据类型选择对应的茶名类别
          let teaType = 'milky';
          if (type === 'sleepFriendly') teaType = 'fruity';
          else if (type === 'budgetFriendly') teaType = Math.random() > 0.5 ? 'milky' : 'fruity';
          else if (hasPreference('喜欢清爽果茶')) teaType = 'fruity';
          else if (hasPreference('偏好奶茶')) teaType = 'milky';
          
          // 根据健康目标调整茶类型
          if (userHealthGoal === '减少糖分' && type === 'healthyBalance') {
            teaType = 'fruity'; // 果茶通常糖分较低
          } else if (userHealthGoal === '控制咖啡因' && type === 'sleepFriendly') {
            teaType = 'fruity'; // 避免咖啡和浓茶
          }
          
          // 随机推荐品牌，但给予用户偏好的品牌更高权重
          const preferredBrand = userData.favoredBrand;
          let selectedBrands = [];
          
          if (preferredBrand && Math.random() < 0.7) {
            // 70%概率包含用户偏好的品牌
            selectedBrands.push(preferredBrand);
          }
          
          // 添加其他品牌，确保不重复
          while (selectedBrands.length < 2) {
            const randomBrand = teaBrands[Math.floor(Math.random() * teaBrands.length)];
            if (!selectedBrands.includes(randomBrand)) {
              selectedBrands.push(randomBrand);
            }
          }
          
          // 创建具体推荐项目
          for (let i = 0; i < 2; i++) {
            const brand = selectedBrands[i];
            const namePool = teaNames[teaType];
            const name = namePool[Math.floor(Math.random() * namePool.length)];
            
            let price, description;
            
            // 根据推荐类型定制价格和描述
            if (type === 'budgetFriendly') {
              // 如果用户价格敏感，价格更低
              const minPrice = hasPreference('价格敏感') ? 6 : 9;
              const maxPrice = hasPreference('价格敏感') ? 16 : 19;
              price = getRandomPrice(minPrice, maxPrice);
              description = `¥${price}，${Math.random() > 0.5 ? '性价比极高' : '经济实惠'}的选择`;
            } else if (type === 'healthyBalance') {
              price = getRandomPrice(12, 28);
              const sugarReduction = getRandomPrice(25, 45);
              
              // 如果健康目标是减少糖分，更强调糖分减少
              if (userHealthGoal === '减少糖分') {
                description = `完全无糖选项，减少约${sugarReduction + 10}g糖分摄入，${hasPreference('注重健康') ? '符合健康饮食原则' : '口感清爽不腻'}`;
              } else {
                description = `${Math.random() > 0.5 ? '少糖' : '无糖'}选项，减少约${sugarReduction}g糖分摄入`;
              }
            } else if (type === 'sleepFriendly') {
              price = getRandomPrice(15, 30);
              
              // 如果健康目标是控制咖啡因，更强调无咖啡因
              if (userHealthGoal === '控制咖啡因') {
                description = `完全无咖啡因，${Math.random() > 0.5 ? '即使敏感体质饮用也安心' : '有助于改善睡眠质量'}`;
              } else {
                description = `${Math.random() > 0.5 ? '低咖啡因' : '无咖啡因'}，${Math.random() > 0.5 ? '晚上饮用也安心' : '不影响睡眠'}`;
              }
            }
            
            newRecs.recommendations.push({
              name: `${brand} - ${name}`,
              description: description
            });
          }
          
          // 根据健康目标调整提示语
          const tipVariants = {
            budgetFriendly: [
              `选择这些产品可以节省约¥${getRandomPrice(10, 25)}/周`,
              `长期选择这些选项，每月可节省超过¥${getRandomPrice(40, 100)}`,
              `在保持享受美味的同时，有效控制支出`
            ],
            healthyBalance: [
              `这些选择可以帮助您减少约${getRandomPrice(25, 40)}%的糖分和热量摄入`,
              `选择低糖或无糖选项，每周可减少${getRandomPrice(80, 150)}g糖分摄入`,
              `保持口感的同时，大幅降低热量摄入`
            ],
            sleepFriendly: [
              `晚上6点后尽量避免高咖啡因饮品，选择果茶或花草茶`,
              `这些低咖啡因选项可以改善睡眠质量，不影响夜间休息`,
              `选择这些产品，即使晚上饮用也不会影响睡眠`
            ]
          };
          
          // 根据健康目标调整提示
          if (userHealthGoal === '减少糖分' && type === 'healthyBalance') {
            newRecs.tip = `坚持选择低糖或无糖选项，配合适量运动，有助于控制体重和血糖`;
          } else if (userHealthGoal === '控制咖啡因' && type === 'sleepFriendly') {
            newRecs.tip = `完全避免含咖啡因的茶饮，特别是在下午4点后，可以明显改善睡眠质量`;
          } else if (userHealthGoal === '节省开支' && type === 'budgetFriendly') {
            newRecs.tip = `选择中杯而非大杯，或减少每周购买频次，可以更好地控制预算`;
          } else if (userHealthGoal === '均衡营养' && type === 'healthyBalance') {
            newRecs.tip = `搭配适量蛋白质和膳食纤维，使奶茶成为均衡饮食的一部分`;
          } else {
            newRecs.tip = tipVariants[type][Math.floor(Math.random() * tipVariants[type].length)];
          }
          
          // 根据时间上下文调整推荐
          return adjustForTimeContext(newRecs, type);
        };
        
        // 创建随机化的响应
        const randomizedResult = {
          budgetFriendly: randomizeRecommendations(result.recommendations.budgetFriendly, 'budgetFriendly'),
          healthyBalance: randomizeRecommendations(result.recommendations.healthyBalance, 'healthyBalance'),
          sleepFriendly: randomizeRecommendations(result.recommendations.sleepFriendly, 'sleepFriendly')
        };
        
        // 添加详细的推荐数据日志
        console.log('============ 随机化推荐数据 ============');
        console.log('预算友好型推荐:');
        console.log(`- 描述: ${randomizedResult.budgetFriendly.description}`);
        console.log(`- 推荐项目: ${randomizedResult.budgetFriendly.recommendations.map(r => r.name).join(', ')}`);
        console.log(`- 贴士: ${randomizedResult.budgetFriendly.tip}`);
        
        console.log('健康平衡型推荐:');
        console.log(`- 描述: ${randomizedResult.healthyBalance.description}`);
        console.log(`- 推荐项目: ${randomizedResult.healthyBalance.recommendations.map(r => r.name).join(', ')}`);
        console.log(`- 贴士: ${randomizedResult.healthyBalance.tip}`);
        
        console.log('有益睡眠型推荐:');
        console.log(`- 描述: ${randomizedResult.sleepFriendly.description}`);
        console.log(`- 推荐项目: ${randomizedResult.sleepFriendly.recommendations.map(r => r.name).join(', ')}`);
        console.log(`- 贴士: ${randomizedResult.sleepFriendly.tip}`);
        console.log('========================================');
        
        return res.json(randomizedResult);
      }
    }
    
    // 如果没有缓存结果，返回错误
    console.error('未找到推荐数据');
    res.status(400).json({ error: '未找到推荐数据，请先进行分析' });
  } catch (error) {
    console.error('推荐数据获取错误:', error);
    res.status(500).json({ error: '处理请求时出错' });
  }
});

// 营养分析API端点
app.post('/api/nutrition-analysis', async (req, res) => {
  try {
    const teaData = req.body;
    
    console.log('=============== 收到营养分析请求 ===============');
    console.log('奶茶名称:', teaData.name);
    console.log('品牌:', teaData.brand);
    console.log('规格:', teaData.size);
    console.log('甜度:', teaData.sweetness);
    console.log('配料:', teaData.toppings);
    
    if (teaData.nutrition) {
      console.log('营养成分:');
      console.log('- 热量:', teaData.nutrition.calories, '卡路里');
      console.log('- 糖分:', teaData.nutrition.sugar, 'g');
      console.log('- 脂肪:', teaData.nutrition.fat, 'g');
      console.log('- 咖啡因:', teaData.nutrition.caffeine, 'mg');
      console.log('- 热量百分比:', teaData.nutrition.caloriesPercentage, '%');
      console.log('- 糖分百分比:', teaData.nutrition.sugarPercentage, '%');
    } else {
      console.log('警告: 请求中没有营养成分数据!');
    }
    console.log('===============================================');
    
    // 构建提示词
    const prompt = `
作为一名专业的奶茶营养师，请针对以下奶茶的营养成分，提供专业的健康分析和建议：

## 奶茶信息
- 名称: ${teaData.name}
- 品牌: ${teaData.brand}
- 规格: ${teaData.size}
- 甜度: ${teaData.sweetness}%
- 添加配料: ${teaData.toppings.join(', ') || '无'}

## 营养成分
- 热量: ${teaData.nutrition?.calories || 0} 卡路里 (占每日推荐摄入的 ${teaData.nutrition?.caloriesPercentage || 0}%)
- 糖分: ${teaData.nutrition?.sugar || 0}g (占每日推荐摄入的 ${teaData.nutrition?.sugarPercentage || 0}%)
- 脂肪: ${teaData.nutrition?.fat || 0}g
- 咖啡因: ${teaData.nutrition?.caffeine || 0}mg

请提供5-7条专业且实用的健康小贴士，包括：
1. 这款奶茶对健康的影响
2. 如何调整搭配使其更健康
3. 适合搭配的食物或活动建议
4. 适合/不适合饮用的人群
5. 饮用时间和频率建议

请使用专业但通俗易懂的语言，每条建议控制在40字以内，不要重复信息。

格式要求：只需返回贴士内容列表，每条贴士用换行分隔，不要添加序号或其他格式。
`;

    console.log('发送请求到DeepSeek API...');
    
    // 调用DeepSeek API
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一名专业的奶茶营养师，擅长分析饮品的营养成分并提供健康建议。' },
        { role: 'user', content: prompt }
      ]
    });

    // 提取响应内容
    const content = response.choices[0].message.content.trim();
    
    // 处理返回的文本，分割成贴士数组
    const tips = content.split('\n').filter(tip => tip.trim().length > 0);
    
    console.log('生成了营养分析贴士:', tips.length, '条');
    console.log('贴士内容:');
    tips.forEach((tip, index) => {
      console.log(`${index + 1}. ${tip}`);
    });
    
    // 返回结果
    res.json({ tips });
  } catch (error) {
    console.error('营养分析API错误:', error);
    res.status(500).json({ error: '处理请求出错' });
  }
});

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

// 尝试启动服务器
async function startServer() {
  // 首先尝试默认端口
  if (await isPortAvailable(PORT)) {
    app.listen(PORT, () => {
      console.log(`模拟服务器运行在 http://localhost:${PORT}`);
      console.log('提供以下重构后的API:');
      console.log('- POST /api/analyze - 分析用户数据并生成完整结果');
      console.log('- GET /api/stream - 流式输出健康分析报告部分');
      console.log('- POST /api/recommendations - 获取智能推荐部分');
      console.log('- POST /api/nutrition-analysis - 获取营养分析建议');
    });
    return;
  }
  
  // 如果默认端口不可用，尝试备用端口
  for (const backupPort of BACKUP_PORTS) {
    if (await isPortAvailable(backupPort)) {
      app.listen(backupPort, () => {
        console.log(`默认端口 ${PORT} 被占用，使用备用端口 ${backupPort}`);
        console.log(`模拟服务器运行在 http://localhost:${backupPort}`);
        console.log('提供以下重构后的API:');
        console.log('- POST /api/analyze - 分析用户数据并生成完整结果');
        console.log('- GET /api/stream - 流式输出健康分析报告部分');
        console.log('- POST /api/recommendations - 获取智能推荐部分');
        console.log('- POST /api/nutrition-analysis - 获取营养分析建议');
      });
      return;
    }
  }
  
  // 如果所有端口都不可用
  console.error(`无法启动服务器，所有端口 [${PORT}, ${BACKUP_PORTS.join(', ')}] 均被占用`);
  process.exit(1);
}

// 启动服务器
startServer(); 