import axios from 'axios';

const API_URL = 'http://localhost:3006/api';

export const analyzeUserData = async (userData: any, callback: (data: string) => void, initCallback?: () => void, errorCallback?: (error: string) => void) => {
  try {
    if (initCallback) {
      initCallback();
    }
    
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorCallback) {
        errorCallback(errorText || '服务器错误');
      }
      return null;
    }

    // 获取会话ID
    const data = await response.json();
    if (!data.sessionId) {
      if (errorCallback) {
        errorCallback('未能获取会话ID');
      }
      return null;
    }
    
    // 使用会话ID获取流式内容
    const streamResponse = await fetch(`${API_URL}/stream?sessionId=${data.sessionId}`);
    const reader = streamResponse.body?.getReader();
    if (!reader) {
      if (errorCallback) {
        errorCallback('无法获取响应流');
      }
      return null;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // 处理SSE格式的数据
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            // 流结束
            break;
          }
          
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.content) {
              callback(parsedData.content);
            }
            if (parsedData.done) {
              // 流结束
              break;
            }
            if (parsedData.error && errorCallback) {
              errorCallback(parsedData.error);
            }
          } catch (e) {
            console.error('解析数据错误:', e);
          }
        }
      }
    }
    
    return data.sessionId;
  } catch (error: any) {
    console.error('API请求错误:', error);
    if (errorCallback) {
      errorCallback(error.message || '请求失败');
    }
    return null;
  }
};

/**
 * 获取智能推荐 
 * @param userData 用户数据
 * @param sessionId 分析会话ID
 * @returns 推荐数据
 */
export async function getSmartRecommendations(userData: any, sessionId: string): Promise<any> {
  try {
    // 添加随机性参数以及偏好信息
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 10000);
    
    // 从用户数据中提取偏好信息，如果存在则使用，否则随机生成
    let preferences = [];
    
    if (userData.userData && userData.userData.preferences) {
      // 使用用户数据中已有的偏好
      preferences = userData.userData.preferences;
      console.log('使用用户已有偏好数据:', preferences);
    } else {
      // 随机生成偏好
      preferences = [
        { preference: '偏好奶茶', value: Math.random() > 0.5 },
        { preference: '喜欢清爽果茶', value: Math.random() > 0.6 },
        { preference: '注重健康', value: Math.random() > 0.4 },
        { preference: '价格敏感', value: Math.random() > 0.5 }
      ];
      console.log('生成随机偏好数据:', preferences);
    }
    
    // 获取偏好品牌，如果用户数据中有则使用，否则随机选择
    let favoredBrand = null;
    if (userData.consumptionData && userData.consumptionData.favoredBrand) {
      favoredBrand = userData.consumptionData.favoredBrand;
      console.log('使用用户偏好品牌:', favoredBrand);
    } else {
      // 随机选择一个品牌作为偏好
      const brands = ['喜茶', '奈雪的茶', '蜜雪冰城', '星巴克', 'COCO', '一点点', '茶百道', '古茗', '沪上阿姨', '益禾堂'];
      favoredBrand = brands[Math.floor(Math.random() * brands.length)];
      console.log('随机选择偏好品牌:', favoredBrand);
    }
    
    // 扩展用户数据
    const extendedUserData = {
      ...userData,
      sessionId,
      _t: `${timestamp}_${randomSuffix}`,
      _r: Math.random(), // 额外随机因子
      preferences,
      favoredBrand,
      healthGoal: userData.userData ? userData.userData.healthGoal : null, // 传递健康目标
      additionalParameters: {
        timeOfDay: new Date().getHours() < 12 ? '上午' : (new Date().getHours() < 18 ? '下午' : '晚上'),
        season: ['春', '夏', '秋', '冬'][Math.floor((new Date().getMonth() / 12) * 4) % 4],
        weekday: new Date().getDay() === 0 || new Date().getDay() === 6 ? '周末' : '工作日'
      }
    };
    
    console.log('请求智能推荐，会话ID:', sessionId, '随机种子:', extendedUserData._t);
    
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extendedUserData),
    });

    if (!response.ok) {
      throw new Error(`获取推荐失败: ${response.status}`);
    }

    const recommendationData = await response.json();
    
    // 处理返回的推荐数据，添加一些额外信息
    if (recommendationData) {
      // 添加时间戳，方便前端判断推荐的新鲜度
      recommendationData._timestamp = timestamp;
      
      // 为每个推荐类别添加随机标签
      const addTagsToRecommendations = (category: any) => {
        if (category && category.recommendations) {
          category.recommendations.forEach((rec: any) => {
            // 随机生成1-3个标签
            const tags: string[] = [];
            const allTags = ['热门', '新品', '限时', '健康', '性价比高', '人气', '店长推荐', '季节限定'];
            const tagCount = 1 + Math.floor(Math.random() * 2); // 1-3个标签
            
            for (let i = 0; i < tagCount; i++) {
              const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
              if (!tags.includes(randomTag)) {
                tags.push(randomTag);
              }
            }
            
            rec.tags = tags;
          });
        }
      };
      
      // 为所有推荐类别添加标签
      if (recommendationData.budgetFriendly) addTagsToRecommendations(recommendationData.budgetFriendly);
      if (recommendationData.healthyBalance) addTagsToRecommendations(recommendationData.healthyBalance);
      if (recommendationData.sleepFriendly) addTagsToRecommendations(recommendationData.sleepFriendly);
    }
    
    return recommendationData;
  } catch (error) {
    console.error('获取智能推荐时出错:', error);
    throw error;
  }
}