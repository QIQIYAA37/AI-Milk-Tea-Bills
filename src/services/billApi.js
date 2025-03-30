import axios from 'axios';

// 可能的API端口列表，按尝试优先级排序
const API_PORTS = [3001, 3002, 3003, 3004, 3005];
let currentPort = 3001;
let apiClient = null;

// 创建API客户端实例
function createApiClient(port) {
  const API_URL = `http://localhost:${port}/api`;
  console.log(`尝试连接API服务器: ${API_URL}`);
  
  return axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10秒超时
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 初始化默认API客户端
apiClient = createApiClient(currentPort);

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`发送请求: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`收到响应: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      // 连接被拒绝，可能是端口不对，尝试其他端口
      const currentIndex = API_PORTS.indexOf(currentPort);
      if (currentIndex < API_PORTS.length - 1) {
        // 尝试下一个端口
        currentPort = API_PORTS[currentIndex + 1];
        console.log(`当前端口连接失败，尝试备用端口: ${currentPort}`);
        
        // 创建新的客户端
        apiClient = createApiClient(currentPort);
        
        // 重新尝试请求
        try {
          const newConfig = { ...error.config };
          newConfig.baseURL = `http://localhost:${currentPort}/api`;
          return await axios(newConfig);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      }
    }
    
    if (error.response) {
      // 服务器返回错误状态码
      console.error(`服务器错误: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应，可能是网络问题或服务器未运行:', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 测试API连接
export async function testConnection() {
  try {
    const response = await apiClient.get('/health');
    console.log(`成功连接到端口 ${currentPort} 的API服务器`);
    return { success: true, data: response.data, port: currentPort };
  } catch (error) {
    console.error('API连接测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 获取所有账单
export async function getAllBills() {
  try {
    const response = await apiClient.get('/bills');
    return response.data;
  } catch (error) {
    console.error('获取账单失败:', error);
    throw error;
  }
}

// 根据条件筛选账单
export async function filterBills(startDate, endDate, brand) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (brand) params.brand = brand;

    const response = await apiClient.get('/bills/filter', { params });
    return response.data;
  } catch (error) {
    console.error('筛选账单失败:', error);
    throw error;
  }
}

// 添加账单
export async function addBill(bill) {
  // 最大重试次数
  const maxRetries = 2;
  let retries = 0;
  
  // 移除前端特有字段，确保与后端数据结构匹配
  const serverBill = { ...bill };
  // 如果存在cupSize字段但不是数据库需要的字段，则删除它
  if ('cupSize' in serverBill && !serverBill.size) {
    // 如果size字段不存在，将cupSize作为size
    serverBill.size = serverBill.cupSize;
  }
  delete serverBill.cupSize;
  
  while (retries <= maxRetries) {
    try {
      console.log(`尝试添加账单 (尝试 ${retries + 1}/${maxRetries + 1})`);
      const response = await apiClient.post('/bills', serverBill);
      console.log('账单添加成功:', response.data);
      return response.data;
    } catch (error) {
      console.error(`添加账单失败 (尝试 ${retries + 1}/${maxRetries + 1}):`, error);
      
      // 如果是服务器错误(5xx)，尝试重试
      if (error.response && error.response.status >= 500 && retries < maxRetries) {
        retries++;
        // 等待一段时间再重试
        const delay = retries * 1000; // 递增延迟
        console.log(`将在 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // 如果不是服务器错误或已达到最大重试次数，则抛出错误
        throw error;
      }
    }
  }
}

// 更新账单
export async function updateBill(id, bill) {
  try {
    const response = await apiClient.put(`/bills/${id}`, bill);
    return response.data;
  } catch (error) {
    console.error('更新账单失败:', error);
    throw error;
  }
}

// 删除账单
export async function deleteBill(id) {
  try {
    const response = await apiClient.delete(`/bills/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除账单失败:', error);
    throw error;
  }
}

// 批量导入账单（测试数据）
export async function batchImportBills(bills) {
  try {
    const response = await apiClient.post('/bills/batch', bills);
    return response.data;
  } catch (error) {
    console.error('批量导入账单失败:', error);
    throw error;
  }
}

// 获取健康数据
export async function getHealthData() {
  try {
    const response = await apiClient.get('/health-data');
    console.log('获取健康数据成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取健康数据失败:', error);
    throw error;
  }
}

// 获取健康目标
export async function getHealthGoals() {
  try {
    const response = await apiClient.get('/health-goals');
    console.log('获取健康目标成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取健康目标失败:', error);
    throw error;
  }
}

// 更新健康目标
export async function updateHealthGoals(goals) {
  try {
    const response = await apiClient.put('/health-goals', goals);
    console.log('更新健康目标成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('更新健康目标失败:', error);
    throw error;
  }
}