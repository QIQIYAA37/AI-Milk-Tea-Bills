// 开发环境使用本地模拟服务器
// 添加备用端口支持
const PRIMARY_PORT = 3006; // 更新为当前运行的模拟服务器端口
const BACKUP_PORTS = [3005, 3007, 3008, 3009];
let currentPort = PRIMARY_PORT;

// 动态API基础URL
const getApiBaseUrl = () => `http://localhost:${currentPort}/api`;

// DeepSeek API配置
const DEEPSEEK_API_KEY = 'sk-18ad8739c9054f5eb56a01cb7b8d5c48';
const DEEPSEEK_API_URL = 'https://api.deepseek.com';

/**
 * 尝试不同端口发送请求
 * @param {String} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Response>} - 响应对象
 */
async function sendRequestWithRetry(endpoint, options) {
  // 初始已尝试的端口列表
  const triedPorts = [];
  let lastError = null;
  
  // 先尝试当前端口
  try {
    console.log(`尝试连接到端口 ${currentPort}`);
    const response = await fetch(`http://localhost:${currentPort}/api${endpoint}`, options);
    if (response.ok) {
      return response;
    }
    lastError = new Error(`API请求失败: ${response.status}`);
    triedPorts.push(currentPort);
  } catch (error) {
    console.error(`端口 ${currentPort} 连接失败:`, error);
    lastError = error;
    triedPorts.push(currentPort);
  }
  
  // 如果当前端口失败，循环尝试备用端口
  for (const port of BACKUP_PORTS) {
    // 跳过已尝试过的端口
    if (triedPorts.includes(port)) continue;
    
    try {
      console.log(`尝试备用端口 ${port}`);
      const response = await fetch(`http://localhost:${port}/api${endpoint}`, options);
      if (response.ok) {
        // 如果成功，更新当前端口
        currentPort = port;
        console.log(`成功连接到备用端口 ${port}`);
        return response;
      }
      triedPorts.push(port);
    } catch (error) {
      console.error(`备用端口 ${port} 连接失败:`, error);
      triedPorts.push(port);
    }
  }
  
  // 所有端口都失败
  throw lastError || new Error('所有API服务器端口连接都失败');
}

/**
 * 分析用户数据并返回个性化建议 - 直接使用DeepSeek API
 * @param {Object} userData - 用户数据
 * @param {Function} onChunk - 处理每个文本块的回调
 * @param {Function} onInit - 初始化事件回调
 * @param {Function} onError - 错误处理回调
 * @returns {Promise<String>} - 返回会话ID，可用于获取推荐
 */
export async function analyzeUserData(userData, onChunk, onInit, onError) {
  try {
    console.log('开始AI分析，准备建立连接...');
    
    // 先清空UI
    if (onInit) {
      console.log('触发初始化回调，清空UI');
      onInit();
    }
    
    // 生成唯一会话ID
    const sessionId = Date.now().toString();
    console.log('生成会话ID:', sessionId);
    
    // 构建提示词
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

## 营养成分摄入评价

请对用户的营养成分摄入情况进行评价，特别是糖分和咖啡因的摄入量。如果某项营养成分摄入过多，请给出具体的评价和改善建议。例如：

${userData.sugar > userData.sugarGoal * 0.9 ? '⚠️ **糖分摄入过多**：您本周的糖分摄入接近或超过了健康目标。长期过量摄入糖分可能导致肥胖、糖尿病等健康问题。' : ''}

${userData.caffeine > userData.caffeineGoal * 0.9 ? '⚠️ **咖啡因摄入过多**：您本周的咖啡因摄入接近或超过了健康目标。过量摄入咖啡因可能导致失眠、心悸等问题。' : ''}

## 营养成分摄入建议

${userData.sugar > userData.sugarGoal * 0.9 ? '- **减少糖分摄入**：推荐选择低糖或无糖饮品，如无糖绿茶、微糖奶茶等。每周减少一杯全糖奶茶可降低约20-30g的糖分摄入。' : ''}

${userData.caffeine > userData.caffeineGoal * 0.9 ? '- **减少咖啡因摄入**：推荐选择低咖啡因饮品，如果茶、花草茶或无咖啡因的水果茶。建议晚上6点后避免含咖啡因的饮品。' : ''}

## 综合建议

针对用户数据的1-2条健康建议，包括预算、糖分和咖啡因摄入的平衡等。
---HEALTH_ANALYSIS_END---
`;

    console.log('使用DeepSeek API进行流式分析...');
    
    // 直接使用DeepSeek API进行流式分析
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一名专业的奶茶健康分析师，擅长根据用户数据提供个性化的健康分析和奶茶推荐。请严格按照指定格式返回结果。' },
          { role: 'user', content: prompt }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let analysisText = '';
    let inAnalysisSection = false;

    // 流式处理响应
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      buffer += chunk;
      
      // 识别数据行，格式为：data: {...}
      const lines = buffer.split('\n');
      buffer = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const jsonStr = trimmedLine.slice(6); // 去掉 "data: "
          
          // 结束标记
          if (jsonStr === '[DONE]') {
            console.log('流式输出完成');
            break;
          }
          
          try {
            const data = JSON.parse(jsonStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              
              // 检测分析部分的开始和结束
              if (content.includes('---HEALTH_ANALYSIS_START---')) {
                inAnalysisSection = true;
                continue;
              } else if (content.includes('---HEALTH_ANALYSIS_END---')) {
                inAnalysisSection = false;
                continue;
              }
              
              // 在分析部分内，累积内容
              if (inAnalysisSection) {
                analysisText += content;
                // 每收到一块内容就更新UI
                if (onChunk) {
                  onChunk(content);
                }
              }
            }
          } catch (e) {
            console.error('解析DeepSeek流式响应出错:', e, jsonStr);
            continue;
          }
        } else if (trimmedLine) {
          buffer = trimmedLine; // 存储不完整的行数据到缓冲区
        }
      }
    }
    
    // 分析完成，存储会话数据
    console.log('分析完成，存储会话数据');
    // 这里可以存储会话数据到localStorage或其他地方
    localStorage.setItem(`analysis_${sessionId}`, analysisText);
    
    return sessionId;
  } catch (error) {
    console.error('AI分析失败:', error);
    if (onError) onError('分析过程发生错误: ' + error.message);
    
    // 提供备用分析结果
    const fallbackAnalysis = `
# 奶茶健康分析报告

## 当前状态分析

⚠️ **预算控制状态**：¥${userData.cost}/¥${userData.budgetGoal} (${Math.round(userData.cost/userData.budgetGoal*100)}%)
⚠️ **糖分摄入状态**：${userData.sugar}g/${userData.sugarGoal}g (${Math.round(userData.sugar/userData.sugarGoal*100)}%)
⚠️ **咖啡因摄入状态**：${userData.caffeine}mg/${userData.caffeineGoal}mg (${Math.round(userData.caffeine/userData.caffeineGoal*100)}%)

## 综合建议

建议控制每周奶茶摄入频次，选择低糖低咖啡因选项，有助于保持健康和控制预算。
锻炼和健康饮食习惯同样重要，可以帮助平衡偶尔的奶茶带来的额外摄入。
`;
    
    // 模拟流式输出
    if (onInit) onInit();
    const chunks = fallbackAnalysis.split('\n');
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (onChunk) onChunk(chunk + '\n');
    }
    
    return Date.now().toString(); // 返回一个模拟的会话ID
  }
}

/**
 * 获取智能推荐 - 直接使用DeepSeek API
 * @param {Object} userData - 用户数据
 * @param {String} sessionId - 会话ID
 * @returns {Promise<Object>} - 推荐结果
 */
export async function getSmartRecommendations(userData, sessionId) {
  try {
    console.log('获取智能推荐，使用会话ID:', sessionId);
    
    // 构建推荐提示词
    const prompt = `
作为一名专业的奶茶健康分析师，请为以下用户提供个性化的奶茶推荐：

## 用户数据
- 本周卡路里摄入: ${userData.calories} 卡路里
- 本周糖分摄入: ${userData.sugar}g
- 本周咖啡因摄入: ${userData.caffeine}mg
- 本周消费金额: ¥${userData.cost}

## 用户设定的健康目标
- 预算目标: 每周不超过 ¥${userData.budgetGoal}
- 糖分目标: 每周不超过 ${userData.sugarGoal}g
- 咖啡因目标: 每周不超过 ${userData.caffeineGoal}mg

${userData.preferences ? `## 用户偏好\n${userData.preferences.map(p => `- ${p.preference}: ${p.value}`).join('\n')}` : ''}
${userData.favoredBrand ? `## 偏好品牌\n- ${userData.favoredBrand}` : ''}
${userData.healthGoal ? `## 健康目标\n- ${userData.healthGoal}` : ''}

请以JSON格式返回三类奶茶推荐：预算友好型、健康平衡型和有助睡眠型。每类推荐2个具体奶茶选项，包含品牌、名称、描述和购买建议。

返回格式：
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
`;

    // 调用DeepSeek API获取推荐
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一名专业的奶茶健康分析师，擅长提供个性化奶茶推荐。请以JSON格式返回推荐结果。' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      // 解析JSON响应
      const recommendations = JSON.parse(content);
      console.log('成功获取智能推荐数据');
      return recommendations;
    } catch (e) {
      console.error('解析推荐JSON失败:', e);
      throw new Error('无法解析推荐数据');
    }
  } catch (error) {
    console.error('获取智能推荐失败:', error);
    // 返回备用推荐，避免UI阻塞
    return {
      budgetFriendly: {
        description: "价格实惠、性价比高的奶茶选择",
        recommendations: [
          { name: "蜜雪冰城 - 椰香奶茶", description: "¥12，经济实惠的选择" },
          { name: "茶百道 - 珍珠奶茶", description: "¥15，性价比极高的经典选择" }
        ],
        tip: "选择这些产品可以节省约¥20/周"
      },
      healthyBalance: {
        description: "健康平衡的奶茶选项，控制糖分和卡路里",
        recommendations: [
          { name: "喜茶 - 多肉葡萄", description: "无糖选项，减少约35g糖分摄入" },
          { name: "奈雪的茶 - 满杯红柚", description: "低糖选项，减少约30g糖分摄入" }
        ],
        tip: "这些选择可以帮助您减少约30%的糖分和热量摄入"
      },
      sleepFriendly: {
        description: "低咖啡因的奶茶选项，有助于改善睡眠质量",
        recommendations: [
          { name: "茶百道 - 芝士茉莉", description: "无咖啡因，晚上饮用也安心" },
          { name: "喜茶 - 多肉芒芒", description: "无咖啡因，不影响睡眠" }
        ],
        tip: "晚上6点后尽量避免高咖啡因饮品，选择果茶或花草茶"
      }
    };
  }
}

/**
 * 获取奶茶营养分析建议 - 标准版
 * @param {Object} teaData - 奶茶数据
 * @returns {Promise<Object>} - 分析结果
 */
export async function getNutritionAnalysis(teaData) {
  try {
    console.log('获取营养分析，奶茶数据:', teaData);
    
    const response = await sendRequestWithRetry('/nutrition-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(teaData),
    });

    const result = await response.json();
    console.log('成功获取营养分析数据:', result);
    return result;
  } catch (error) {
    console.error('获取营养分析失败:', error);
    // 返回备用分析结果
    return {
      tips: [
        `${teaData.name}的营养成分较为均衡，适量饮用对健康无明显影响。`,
        `建议每周饮用奶茶不超过2-3次，保持健康饮食习惯。`,
        `选择低糖或无糖选项可减少约30%的热量摄入。`,
        `饭后半小时再饮用奶茶，有助于减少对血糖的影响。`,
        `此款奶茶含有乳制品，乳糖不耐受者请谨慎选择。`
      ]
    };
  }
}

/**
 * 获取奶茶营养分析建议 - 流式输出版
 * @param {Object} teaData - 奶茶数据
 * @param {Function} onStart - 开始分析时的回调
 * @param {Function} onTip - 接收到新提示时的回调
 * @param {Function} onComplete - 分析完成时的回调
 * @param {Function} onError - 错误处理回调
 */
export async function getNutritionAnalysisStream(teaData, onStart, onTip, onComplete, onError) {
  try {
    console.log('开始流式营养分析，奶茶数据:', teaData);
    
    // 调用分析开始回调
    if (onStart) {
      onStart();
    }
    
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

## 分析要求
请基于上述信息，特别关注这款 ${teaData.name} 的特点和营养成分，提供5-7条专业且实用的健康小贴士。
考虑用户已选择的甜度(${teaData.sweetness}%)，以及计算得出的营养数据。

请覆盖以下方面：
1. 这款奶茶对健康的影响
2. 如何调整搭配使其更健康
3. 适合搭配的食物或活动建议
4. 适合/不适合饮用的人群
5. 饮用时间和频率建议

## 输出格式要求
- 每条建议控制在40字以内
- 使用简洁明了的语言
- 不要使用序号或标点符号结尾
- 每条建议必须独立成行，每条之间用双换行符分隔(\\n\\n)
- 不要在建议末尾添加句号或其他标点符号

示例格式（注意没有句号结尾，每条贴士之间有空行）：
这款奶茶含糖量适中，适量饮用对健康影响不大

建议选择少糖或无糖，可减少30%热量摄入

餐后半小时饮用有助于减轻对血糖的影响

搭配水果或坚果可增加膳食纤维，平衡营养

每周饮用次数建议不超过2次
`;

    // 直接从前端调用DeepSeek API，避免CORS
    console.log('直接使用DeepSeek API，创建流式请求...');
    
    // 使用fetch API创建流式响应
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一名专业的奶茶营养师，擅长分析饮品的营养成分并提供健康建议。请确保每条建议独立成行，并用空行分隔不同的建议。' },
          { role: 'user', content: prompt }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`);
    }

    // 完全重写流式处理逻辑
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let collectedTips = [];
    
    // 完全重写的内容处理逻辑
    let buffer = '';
    let fullResponse = '';

    console.log('开始读取流式响应...');
    
    // 处理流式响应
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 解码当前块
      const chunk = decoder.decode(value);
      
      // 分割成行进行处理（以"data: "为分隔）
      const dataStrings = chunk.split('\n').filter(line => line.trim());
      
      for (const dataLine of dataStrings) {
        // 仅处理data行
        if (!dataLine.startsWith('data: ')) continue;
        
        const jsonStr = dataLine.substring(6); // 去掉"data: "前缀
        
        // 处理结束标记
        if (jsonStr.trim() === '[DONE]') {
          console.log('流式输出完成');
          
          // 对完整响应进行最终处理
          processCompletedResponse(fullResponse);
          
          // 调用完成回调
          if (onComplete) {
            onComplete(collectedTips);
          }
          continue;
        }
        
        try {
          const data = JSON.parse(jsonStr);
          
          // 检查并提取内容
          if (data.choices && 
              data.choices[0].delta && 
              data.choices[0].delta.content) {
            
            // 获取当前内容块
            const content = data.choices[0].delta.content;
            
            // 累积到完整响应中
            fullResponse += content;
            buffer += content;
            
            // 当缓冲区中有双换行时，表示有完整的贴士
            if (buffer.includes('\n\n')) {
              const parts = buffer.split('\n\n');
              
              // 最后一部分可能不完整，保留在缓冲区
              buffer = parts.pop() || '';
              
              // 处理完整的贴士
              for (const part of parts) {
                const trimmedTip = part.trim();
                if (trimmedTip) {
                  // 清理标点和序号
                  const cleanedTip = cleanTip(trimmedTip);
                  if (cleanedTip) {
                    collectedTips.push(cleanedTip);
                    if (onTip) onTip(cleanedTip);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('解析DeepSeek流式响应出错:', e);
          continue;
        }
      }
    }
    
    // 处理最终完整响应的函数
    function processCompletedResponse(text) {
      // 先清空现有的贴士
      collectedTips = [];
      if (onStart) onStart();
      
      // 按双换行分割
      const tips = text.split('\n\n');
      
      // 处理每个贴士
      for (const tip of tips) {
        const trimmedTip = tip.trim();
        if (trimmedTip) {
          // 清理标点和序号
          const cleanedTip = cleanTip(trimmedTip);
          if (cleanedTip) {
            collectedTips.push(cleanedTip);
            if (onTip) onTip(cleanedTip);
          }
        }
      }
    }
    
    // 清理贴士的函数
    function cleanTip(tip) {
      // 移除末尾的标点符号
      let cleaned = tip.replace(/[.。!！?？]+$/, '').trim();
      
      // 移除开头的序号和点
      cleaned = cleaned.replace(/^[0-9]+[\.\、\:]?\s*/, '');
      
      // 移除中间的换行并替换为空格
      cleaned = cleaned.replace(/\n/g, ' ');
      
      return cleaned.trim();
    }
    
    console.log('流式响应处理完成，共收集到', collectedTips.length, '条提示');
    return { tips: collectedTips };
  } catch (error) {
    console.error('营养分析失败:', error);
    
    if (onError) {
      onError('API请求失败: ' + error.message);
    }
    
    // 返回空结果，不再使用备用数据
    return { tips: [] };
  }
}

/**
 * 使用AI搜索奶茶信息并分析其营养成分
 * @param {String} searchTerm - 搜索词
 * @returns {Promise<Object>} - 包含奶茶信息的对象
 */
/**
 * 根据品牌和规格生成合理的奶茶价格
 * @param {String} brand - 奶茶品牌
 * @param {String} size - 奶茶规格
 * @returns {Number} - 生成的价格
 */
function generateReasonablePrice(brand, size) {
  // 高端品牌价格区间
  const premiumBrands = ['喜茶', '奈雪的茶', 'HEYTEA', '奈雪', '星巴克', 'Starbucks', '茶百道', '乐乐茶', 'LELECHA'];
  // 中端品牌价格区间
  const midRangeBrands = ['COCO', 'CoCo', '一点点', '贡茶', '益禾堂', '沪上阿姨', '古茗'];
  // 平价品牌价格区间
  const budgetBrands = ['蜜雪冰城', '书亦烧仙草', '甘茗城', '茶颜悦色'];
  
  // 基础价格
  let basePrice = 18;
  
  // 根据品牌调整价格
  const brandLower = brand.toLowerCase();
  const isPremium = premiumBrands.some(b => brandLower.includes(b.toLowerCase()));
  const isMidRange = midRangeBrands.some(b => brandLower.includes(b.toLowerCase()));
  const isBudget = budgetBrands.some(b => brandLower.includes(b.toLowerCase()));
  
  if (isPremium) {
    basePrice = 25 + Math.floor(Math.random() * 8); // 25-32元
  } else if (isMidRange) {
    basePrice = 18 + Math.floor(Math.random() * 7); // 18-24元
  } else if (isBudget) {
    basePrice = 9 + Math.floor(Math.random() * 6);  // 9-14元
  } else {
    basePrice = 15 + Math.floor(Math.random() * 10); // 15-24元（未知品牌）
  }
  
  // 根据规格调整价格
  const sizeLower = size.toLowerCase();
  if (sizeLower.includes('大') || sizeLower.includes('large') || sizeLower.includes('l')) {
    basePrice += 4 + Math.floor(Math.random() * 3); // 大杯加价4-6元
  } else if (sizeLower.includes('小') || sizeLower.includes('small') || sizeLower.includes('s')) {
    basePrice -= 2 + Math.floor(Math.random() * 3); // 小杯减价2-4元
  }
  
  // 确保价格合理
  basePrice = Math.max(6, basePrice); // 最低6元
  
  // 返回保留一位小数的价格
  return parseFloat(basePrice.toFixed(1));
}

export async function searchMilkTeaWithAI(searchTerm) {
  try {
    console.log('使用AI搜索奶茶信息:', searchTerm);
    
    // 构建提示词
    const prompt = `
作为一名奶茶营养专家，请提供以下奶茶的详细营养信息和介绍：${searchTerm}

请分析该款奶茶的营养成分和详细介绍，并以JSON格式返回以下信息：
- 名称 (name)
- 品牌 (brand)
- 规格 (size)：默认使用中杯
- 价格 (price)：单位为元，应该是一个合理的数字，例如中杯奶茶通常在15-30元之间
- 热量 (baseCalories)：单位为卡路里，应该是一个整数
- 糖分 (baseSugar)：单位为克，应该是一个整数或小数
- 脂肪 (baseFat)：单位为克，应该是一个整数或小数
- 咖啡因 (baseCaffeine)：单位为毫克，应该是一个整数
- 介绍 (introduction)：包含以下内容的对象:
  - 简介 (summary): 简短描述该奶茶的特点和风味
  - 材料 (ingredients): 数组，每项包含名称(name)和描述(description)
  - 特点 (features): 数组，每项包含标题(title)和描述(description)

请基于你对市场上奶茶产品的了解，提供最准确的估计值。数据应尽量精确，特别是糖分含量需要合理估计，避免过高或过低。标准中杯奶茶的糖分通常在30-50克之间，热量在300-450卡路里之间，请参考这个范围。价格应根据品牌定位合理估计，高端品牌如喜茶、奈雪的茶通常在25-35元，中端品牌如COCO、一点点通常在18-25元，平价品牌如蜜雪冰城通常在10-15元。

请严格按照以下JSON格式响应，不要包含任何额外的文字解释:
{
  "name": "奶茶名称",
  "brand": "品牌名称",
  "size": "中杯/大杯/小杯",
  "price": 数字,
  "baseCalories": 数字,
  "baseSugar": 数字,
  "baseFat": 数字,
  "baseCaffeine": 数字,
  "introduction": {
    "summary": "简介文字",
    "ingredients": [
      {"name": "材料名称1", "description": "材料描述1"},
      {"name": "材料名称2", "description": "材料描述2"},
      {"name": "材料名称3", "description": "材料描述3"}
    ],
    "features": [
      {"title": "特点标题1", "description": "特点描述1"},
      {"title": "特点标题2", "description": "特点描述2"},
      {"title": "特点标题3", "description": "特点描述3"}
    ]
  }
}
`;

    // 处理API请求错误的函数
    const handleApiError = (error) => {
      console.error('DeepSeek API请求失败:', error);
      
      // 返回错误信息
      return {
        success: false,
        error: error.message || '搜索奶茶信息失败',
        data: null  // 不再提供备用数据
      };
    };
    
    // 尝试使用DeepSeek API
    try {
      const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一名专业的奶茶营养师，擅长分析各种奶茶的营养成分和提供详细的产品介绍。请以JSON格式提供准确的数据和丰富的描述。' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        return handleApiError(new Error(`请求失败 (${response.status}): ${response.statusText}`));
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message || !result.choices[0].message.content) {
        return handleApiError(new Error('API返回数据格式不正确，无法提取内容'));
      }
      
      const content = result.choices[0].message.content;
      
      // 解析JSON数据
      try {
        // 由于使用了response_format: { type: "json_object" }，内容应该是纯JSON
        const teaData = JSON.parse(content);
        
        // 创建奶茶对象
        const milkTea = {
          id: Date.now(),
          name: teaData.name || searchTerm,
          brand: teaData.brand || '未知品牌',
          size: teaData.size || '中杯',
          baseCalories: Number(teaData.baseCalories) || 350,
          baseSugar: Number(teaData.baseSugar) || 35,
          baseFat: Number(teaData.baseFat) || 4,
          baseCaffeine: Number(teaData.baseCaffeine) || 30,
          // 使用API返回的价格，如果没有则生成合理的价格
          price: Number(teaData.price) || generateReasonablePrice(teaData.brand || '未知品牌', teaData.size || '中杯'),
          isAIGenerated: true,
          introduction: teaData.introduction || {
            summary: `${teaData.name || searchTerm}是一款深受喜爱的奶茶饮品。`,
            ingredients: [
              {name: "茶底", description: "使用优质茶叶精心冲泡而成"},
              {name: "奶制品", description: "加入新鲜牛奶或奶精"},
              {name: "甜度", description: "可根据个人喜好调整"}
            ],
            features: [
              {title: "口感", description: "香醇顺滑，回味甘甜"},
              {title: "特色", description: "独特配方，经典口味"},
              {title: "健康建议", description: "适量饮用，每周不超过3次"}
            ]
          }
        };
        
        console.log('AI成功生成奶茶信息:', milkTea);
        
        return {
          success: true,
          data: milkTea
        };
      } catch (jsonError) {
        console.error('解析AI返回的奶茶数据失败:', jsonError, '原始内容:', content);
        return handleApiError(new Error('无法解析返回的数据格式，请尝试更明确的搜索词'));
      }
    } catch (apiError) {
      return handleApiError(apiError);
    }
  } catch (error) {
    console.error('搜索奶茶时发生未知错误:', error);
    
    // 返回错误信息
    return {
      success: false,
      error: '发生未知错误: ' + (error.message || String(error)),
      data: null
    };
  }
}