<template>
  <div class="nutrition-view">
    <h1>营养分析</h1>
    
    <div class="search-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="输入任意奶茶名称，使用AI搜索..."
          @keyup.enter="aiSearchMilkTea"
        >
        <button class="btn-ai-search" @click="aiSearchMilkTea" :disabled="isAiSearching || !searchQuery.trim()">
          {{ isAiSearching ? 'AI搜索中...' : 'AI智能搜索' }}
        </button>
      </div>
    </div>
    
    <!-- AI搜索结果提示 -->
    <div class="ai-search-status" v-if="isAiSearching">
      <div class="loading-spinner"></div>
      <p>AI正在搜索"{{searchQuery}}"的营养信息，请稍候...</p>
    </div>
    
    <div class="milk-tea-selection" v-if="searchResults.length > 0">
      <h2>搜索结果</h2>
      <div class="results-grid">
        <div 
          v-for="(tea, index) in searchResults" 
          :key="index"
          class="tea-card"
          @click="selectMilkTea(tea)"
        >
          <div class="tea-icon">🥤</div>
          <div class="tea-info">
            <h3>{{ tea.name }}</h3>
            <p>{{ tea.brand }} | {{ tea.size }} | <span class="tea-price-small">¥{{ tea.price }}</span></p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="selected-tea" v-if="selectedTea">
      <div class="tea-header">
        <h2>{{ selectedTea.name }}</h2>
        <div class="tea-meta">
          <span>{{ selectedTea.brand }}</span>
          <span>{{ cupSizes.find(size => size.value === selectedCupSize)?.label || '中杯' }}</span>
          <span class="tea-price">¥{{ calculatedPrice }}</span>
          <span class="ai-generated-badge">AI分析</span>
        </div>
        <button class="btn-add-to-bill" @click="addToBill" title="添加到账单">添加到账单</button>
        
        <!-- 添加账单错误提示 -->
        <div class="error-message" v-if="billError">
          <i>⚠️</i> {{ billError }}
          <div class="error-actions">
            <button class="error-retry" @click="addToBill">重试</button>
            <span class="error-hint">如果问题持续存在，请检查网络连接或联系管理员</span>
          </div>
        </div>
      </div>
      
      <!-- 奶茶介绍卡片 - 移动到这里 -->
      <div class="tea-introduction-card" v-if="selectedTea && selectedTea.introduction">
        <h3>产品详情</h3>
        <div class="tea-intro-content">
          <div class="intro-header">
            <div class="intro-icon">🍵</div>
            <div class="intro-title">
              <h4>{{ selectedTea.name }}</h4>
              <span class="intro-brand">{{ selectedTea.brand }}</span>
            </div>
          </div>
          
          <div class="intro-description">
            <p>{{ selectedTea.introduction.summary }}</p>
            
            <ul class="intro-ingredients" v-if="selectedTea.introduction.ingredients && selectedTea.introduction.ingredients.length > 0">
              <li v-for="(ingredient, idx) in selectedTea.introduction.ingredients" :key="'ing-'+idx">
                <strong>{{ ingredient.name }}：</strong>{{ ingredient.description }}
              </li>
            </ul>
            
            <h5>产品特点</h5>
            <ul class="intro-features" v-if="selectedTea.introduction.features && selectedTea.introduction.features.length > 0">
              <li v-for="(feature, idx) in selectedTea.introduction.features" :key="'feat-'+idx">
                <strong>{{ feature.title }}：</strong>{{ feature.description }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="customization">
        <h3>定制你的奶茶</h3>
        <div class="custom-options">
          <div class="option-group">
            <label>甜度</label>
            <div class="option-buttons">
              <button 
                v-for="level in sweetnessLevels" 
                :key="level.value"
                :class="['custom-btn', selectedSweetness === level.value ? 'active' : '']"
                @click="selectedSweetness = level.value"
              >
                {{ level.label }}
              </button>
            </div>
          </div>
          
          <div class="option-group">
            <label>冰量</label>
            <div class="option-buttons">
              <button 
                v-for="level in iceLevels" 
                :key="level.value"
                :class="['custom-btn', selectedIce === level.value ? 'active' : '']"
                @click="selectedIce = level.value"
              >
                {{ level.label }}
              </button>
            </div>
          </div>
          
          <div class="option-group">
            <label>杯型大小</label>
            <div class="option-buttons">
              <button 
                v-for="size in cupSizes" 
                :key="size.value"
                :class="['custom-btn', selectedCupSize === size.value ? 'active' : '']"
                @click="selectedCupSize = size.value"
              >
                {{ size.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="nutrition-info">
        <h3>营养成分</h3>
        <div class="nutrition-stats">
          <div class="nutrition-stat">
            <div class="stat-value">{{ calculatedNutrition.calories }}</div>
            <div class="stat-label">卡路里</div>
          </div>
          <div class="nutrition-stat">
            <div class="stat-value">{{ calculatedNutrition.sugar }}g</div>
            <div class="stat-label">糖分</div>
          </div>
          <div class="nutrition-stat">
            <div class="stat-value">{{ calculatedNutrition.fat }}g</div>
            <div class="stat-label">脂肪</div>
          </div>
          <div class="nutrition-stat">
            <div class="stat-value">{{ calculatedNutrition.caffeine }}mg</div>
            <div class="stat-label">咖啡因</div>
          </div>
        </div>
        
        <div class="daily-percentage">
          <h4>占每日推荐摄入量百分比</h4>
          <div class="percentage-bars">
            <div class="percentage-item">
              <div class="percentage-label">卡路里</div>
              <div class="percentage-bar-container">
                <div 
                  class="percentage-bar" 
                  :style="{width: `${calculatedNutrition.caloriesPercentage}%`}"
                  :class="{warning: calculatedNutrition.caloriesPercentage > 30}"
                ></div>
                <span>{{ calculatedNutrition.caloriesPercentage }}%</span>
              </div>
            </div>
            <div class="percentage-item">
              <div class="percentage-label">糖分</div>
              <div class="percentage-bar-container">
                <div 
                  class="percentage-bar" 
                  :style="{width: `${calculatedNutrition.sugarPercentage}%`}"
                  :class="{warning: calculatedNutrition.sugarPercentage > 30}"
                ></div>
                <span>{{ calculatedNutrition.sugarPercentage }}%</span>
              </div>
            </div>
            <div class="percentage-item">
              <div class="percentage-label">咖啡因</div>
              <div class="percentage-bar-container">
                <div 
                  class="percentage-bar" 
                  :style="{width: `${Math.min(100, Math.round((calculatedNutrition.caffeine / 400) * 100))}%`}"
                  :class="{warning: calculatedNutrition.caffeine > 200}"
                ></div>
                <span>{{ Math.min(100, Math.round((calculatedNutrition.caffeine / 400) * 100)) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="health-tips">
        <h3>健康小贴士</h3>
        <div class="tips-container" v-if="!isEmptyTips">
          <div class="tip" v-for="(tip, index) in displayTips" :key="index">
            <div class="tip-icon">{{ getTipIcon(index) }}</div>
            <div class="tip-content">{{ tip }}</div>
          </div>
        </div>
        
        <div class="loading-tips" v-if="isAnalyzing">
          <div class="loading-spinner"></div>
          <p>正在分析"{{ selectedTea?.name }}"，请稍候...</p>
        </div>
        
        <div class="ai-tags" v-if="aiTips.length > 0">
          <span class="ai-tag">AI生成</span>
          <span class="ai-tag">基于DeepSeek AI</span>
        </div>

        <div class="error-message" v-if="analysisError">
          <p>{{ analysisError }}</p>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-if="!selectedTea && searchResults.length === 0">
      <div class="empty-icon">🔍</div>
      <h2>AI智能奶茶营养分析</h2>
      <p>输入任意奶茶名称，使用AI智能分析其营养成分</p>
      <p>例如：尝试搜索"芝芝莓莓"、"霸气芝士芒芒"或"椰椰奶冻"等</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import '../assets/styles/nutrition.css';
import { getNutritionAnalysis, getNutritionAnalysisStream, searchMilkTeaWithAI } from '../services/api';

// 奶茶数据接口
interface MilkTea {
  id: number;
  name: string;
  brand: string;
  size: string;
  price: number;  // 添加价格字段
  baseCalories: number;
  baseSugar: number;
  baseFat: number;
  baseCaffeine: number;
  isAIGenerated?: boolean;
  introduction?: {
    summary: string;
    ingredients?: { name: string; description: string }[];
    features?: { title: string; description: string }[];
  };
}

// 甜度等级
const sweetnessLevels = [
  { value: 0, label: '无糖', factor: 0 },
  { value: 30, label: '微糖', factor: 0.3 },
  { value: 50, label: '半糖', factor: 0.5 },
  { value: 70, label: '少糖', factor: 0.7 },
  { value: 100, label: '全糖', factor: 1 },
];

// 冰量等级
const iceLevels = [
  { value: 0, label: '热饮' },
  { value: 30, label: '微冰' },
  { value: 50, label: '少冰' },
  { value: 100, label: '正常冰' },
];

// 杯型选项已移除，仅保留杯型尺寸

// 杯型尺寸选项
const cupSizes = [
  { value: 'super_large', label: '超大杯' },
  { value: 'large', label: '大杯' },
  { value: 'medium', label: '中杯' },
];

// 状态变量
const searchQuery = ref('');
const searchResults = ref<MilkTea[]>([]);
const selectedTea = ref<MilkTea | null>(null);
const selectedSweetness = ref(100); // 默认全糖
const selectedIce = ref(100); // 默认正常冰
// 杯型材质选项已移除，不再需要selectedCupType变量
const selectedCupSize = ref('medium'); // 默认中杯
const isAiSearching = ref(false); // AI搜索状态

// AI搜索功能
async function aiSearchMilkTea() {
  if (!searchQuery.value.trim() || isAiSearching.value) return;
  
  isAiSearching.value = true;
  searchResults.value = []; // 清空现有结果
  analysisError.value = ''; // 清空错误信息
  
  try {
    console.log('开始AI搜索奶茶信息:', searchQuery.value);
    
    // 使用服务层函数进行搜索
    const result = await searchMilkTeaWithAI(searchQuery.value);
    
    if (result.success && result.data) {
      // 搜索成功，添加到结果中
      searchResults.value = [result.data];
      console.log('AI搜索成功，获取到奶茶信息:', result.data);
    } else {
      // 搜索失败
      analysisError.value = result.error || '搜索失败，请尝试其他关键词';
      console.error('AI搜索失败:', result.error);
    }
  } catch (error) {
    console.error('AI搜索奶茶失败:', error);
    analysisError.value = '搜索失败: ' + (error instanceof Error ? error.message : String(error));
  } finally {
    isAiSearching.value = false;
  }
}

function selectMilkTea(tea: MilkTea) {
  selectedTea.value = tea;
  // 重置选项
  selectedSweetness.value = 100;
  selectedIce.value = 100;
  selectedCupSize.value = 'medium'; // 重置杯型尺寸为默认中杯
  // 清除之前的分析结果
  aiTips.value = [];
  
  // 自动开始分析
  setTimeout(() => {
    startAINutritionAnalysis();
  }, 500);
}

// 根据杯型尺寸计算价格
const calculatedPrice = computed(() => {
  if (!selectedTea.value) return 0;
  
  let basePrice = selectedTea.value.price;
  
  // 根据杯型尺寸调整价格
  if (selectedCupSize.value === 'super_large') {
    // 超大杯比中杯贵8元
    basePrice += 8;
  } else if (selectedCupSize.value === 'large') {
    // 大杯比中杯贵4元
    basePrice += 4;
  }
  
  return parseFloat(basePrice.toFixed(1));
});

// 当甜度、冰量或杯型尺寸改变时，重新分析
watch([selectedSweetness, selectedIce, selectedCupSize], () => {
  if (selectedTea.value) {
    // 延迟执行避免频繁调用
    if (analyzeDebounceTimer) clearTimeout(analyzeDebounceTimer);
    analyzeDebounceTimer = setTimeout(() => {
      startAINutritionAnalysis();
    }, 500);
  }
});

// 用于防抖的计时器
let analyzeDebounceTimer: number | null = null;

// 计算营养成分
const calculatedNutrition = computed(() => {
  if (!selectedTea.value) {
    return {
      calories: 0,
      sugar: 0,
      fat: 0,
      caffeine: 0,
      caloriesPercentage: 0,
      sugarPercentage: 0
    };
  }
  
  // 获取甜度系数
  const sweetnessFactor = sweetnessLevels.find(level => level.value === selectedSweetness.value)?.factor || 1;
  
  // 获取杯型尺寸系数
  let sizeFactor = 1.0; // 默认中杯系数
  if (selectedCupSize.value === 'super_large') {
    sizeFactor = 1.5; // 超大杯系数
  } else if (selectedCupSize.value === 'large') {
    sizeFactor = 1.3; // 大杯系数
  }
  
  console.log('计算调试:', {
    sweetness: selectedSweetness.value,
    sweetnessFactor: sweetnessFactor,
    cupSize: selectedCupSize.value,
    sizeFactor: sizeFactor,
    baseSugar: selectedTea.value.baseSugar,
    calculatedSugar: Number(selectedTea.value.baseSugar) * sweetnessFactor * sizeFactor
  });
  
  // 基础营养成分 - 调整糖分受甜度和杯型尺寸影响
  // 确保所有值都被转换为数字类型
  let calories = Number(selectedTea.value.baseCalories) || 0;
  calories = Math.round(calories * sizeFactor); // 根据杯型尺寸调整卡路里
  
  // 无糖特殊处理 - 当选择无糖时，糖分设为0，卡路里减少10%
  let sugar = 0;
  if (selectedSweetness.value === 0) { // 无糖
    sugar = 0;
    calories = Math.round(calories * 0.9); // 无糖通常卡路里会略微降低
  } else {
    // 正常甜度计算，同时考虑杯型尺寸
    sugar = Number(selectedTea.value.baseSugar) * sweetnessFactor * sizeFactor;
  }
  
  let fat = Number(selectedTea.value.baseFat) || 0;
  fat = fat * sizeFactor; // 根据杯型尺寸调整脂肪
  
  let caffeine = Number(selectedTea.value.baseCaffeine) || 0;
  caffeine = Math.round(caffeine * sizeFactor); // 根据杯型尺寸调整咖啡因
  
  // 计算每日摄入百分比
  // 假设每日推荐摄入：2000卡路里，25g糖
  const caloriesPercentage = Math.round((calories / 2000) * 100);
  const sugarPercentage = Math.round((sugar / 25) * 100);
  
  return {
    calories: Math.round(calories),
    sugar: Math.round(sugar * 10) / 10,  // 保留一位小数
    fat: Math.round(fat * 10) / 10,
    caffeine: Math.round(caffeine),
    caloriesPercentage,
    sugarPercentage
  };
});

// 健康小贴士状态
const staticTips = computed(() => {
  return []; // 不再使用静态贴士
});

// AI生成的健康小贴士
const aiTips = ref<string[]>([]);
const isAnalyzing = ref(false);
const isAIGenerated = ref(false);
const analysisError = ref('');

// 检查是否没有提示可显示
const isEmptyTips = computed(() => {
  return displayTips.value.length === 0;
});

// 显示的贴士（静态或AI生成）
const displayTips = computed(() => {
  return aiTips.value;
});

// 开始AI营养分析
async function startAINutritionAnalysis() {
  if (isAnalyzing.value || !selectedTea.value) return;
  
  isAnalyzing.value = true;
  analysisError.value = '';
  
  // 清空之前的AI提示
  aiTips.value = [];
  
  try {
    console.log('开始营养分析...');
    
    // 获取甜度标签
    const sweetnessLabel = sweetnessLevels.find(level => level.value === selectedSweetness.value)?.label || '全糖';
    
    // 注意：在JavaScript中访问计算属性时需要使用.value，但在模板中则不需要
    const nutritionData = {
      calories: calculatedNutrition.value.calories,
      sugar: calculatedNutrition.value.sugar,
      fat: calculatedNutrition.value.fat,
      caffeine: calculatedNutrition.value.caffeine,
      caloriesPercentage: calculatedNutrition.value.caloriesPercentage,
      sugarPercentage: calculatedNutrition.value.sugarPercentage
    };
    
    const teaData = {
      name: selectedTea.value.name,
      brand: selectedTea.value.brand,
      size: selectedTea.value.size,
      sweetness: selectedSweetness.value,
      cupSize: selectedCupSize.value,
      toppings: [],
      nutrition: nutritionData
    };
    
    console.log('准备发送的数据:', teaData);
    
    // 使用流式API获取营养分析
    await getNutritionAnalysisStream(
      teaData,
      // 开始分析
      () => {
        console.log('开始流式分析...');
        aiTips.value = [];
      },
      // 接收到新提示
      (tip) => {
        console.log('收到新提示:', tip);
        if (tip && tip.trim()) {
          aiTips.value.push(tip.trim());
        }
      },
      // 分析完成
      (allTips) => {
        console.log('分析完成，共', allTips.length, '条提示');
      },
      // 错误处理
      (error) => {
        console.error('营养分析失败:', error);
        analysisError.value = '分析请求失败: ' + error;
      }
    );
  } catch (error) {
    console.error('营养分析失败:', error);
    analysisError.value = '分析请求失败，请稍后再试';
  } finally {
    isAnalyzing.value = false;
  }
}

// 根据提示索引获取对应图标
function getTipIcon(index) {
  const icons = ['💡', '🍵', '🥗', '⏰', '👨‍👩‍👧‍👦', '❤️', '🏃‍♂️'];
  return icons[index % icons.length];
}

// 账单错误状态
const billError = ref('');

// 添加到账单功能
async function addToBill() {
  if (!selectedTea.value) return;
  
  // 清除之前的错误信息
  billError.value = '';
  
  // 显示加载状态
  const loadingToast = createLoadingToast('正在添加到账单...');
  
  try {
    // 从billApi.js导入addBill函数
    const { addBill } = await import('../services/billApi');
    
    // 构建账单对象
    const bill = {
      date: new Date().toISOString().split('T')[0], // 当前日期
      brand: selectedTea.value.brand || '未知品牌', // 确保品牌有值
      name: selectedTea.value.name || '未知产品', // 确保名称有值
      size: selectedTea.value.size || '标准', // 确保规格有值
      price: parseFloat(selectedTea.value.price) || 0, // 确保价格是数字
      calories: parseInt(calculatedNutrition.value.calories) || 0, // 确保是整数
      sugar: parseFloat(calculatedNutrition.value.sugar) || 0, // 确保是数字
      fat: parseFloat(calculatedNutrition.value.fat) || 0, // 确保是数字
      caffeine: parseInt(calculatedNutrition.value.caffeine) || 0, // 确保是整数
      cupSize: selectedCupSize.value // 添加杯型尺寸信息
    };
    
    console.log('准备添加账单数据:', bill);
    
    // 调用API添加账单
    const result = await addBill(bill);
    
    // 关闭加载提示
    if (loadingToast) loadingToast.close();
    
    // 显示成功提示
    alert(`已成功将 ${selectedTea.value.brand} ${selectedTea.value.name} 添加到账单！`);
    
    console.log('添加到账单成功:', result);
  } catch (error) {
    // 关闭加载提示
    if (loadingToast) loadingToast.close();
    
    console.error('添加到账单失败:', error);
    // 提取更详细的错误信息
    let errorMsg = '服务器连接异常';
    if (error.response) {
      // 服务器返回了错误状态码
      errorMsg = `服务器错误 (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      console.error('服务器返回的错误数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但未收到响应
      errorMsg = '未收到服务器响应，请检查网络连接';
    } else {
      // 请求配置出错
      errorMsg = error.message || '未知错误';
    }
    billError.value = `添加到账单失败: ${errorMsg}`;
  }
}

// 创建加载提示
function createLoadingToast(message) {
  // 如果项目中有Toast组件，可以使用它
  // 这里使用简单的DOM操作创建一个加载提示
  const toast = document.createElement('div');
  toast.className = 'loading-toast';
  toast.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-message">${message}</div>
  `;
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .loading-toast {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 9999;
    }
    .loading-spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-message {
      font-size: 14px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(toast);
  
  return {
    close: () => {
      document.body.removeChild(toast);
    }
  };
}
</script>

<style scoped>
/* 所有样式已移至 src/assets/styles/nutrition.css */

.error-message {
  background-color: #fff3f3;
  border-left: 4px solid #ff5252;
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  color: #cf0000;
}

.error-message i {
  margin-right: 10px;
  font-size: 18px;
}

.error-hint {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  margin-left: 28px;
}

/* AI搜索按钮样式 */
.btn-ai-search {
  background-color: #a67c52;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  margin-left: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  width: auto;
  min-width: 120px;
}
niuniu
niutn-ai-search:hover {
  background-color: #8c6744;
}

.btn-ai-search:disabled {
  background-color: #c9b393;
  cursor: not-allowed;
}

/* AI搜索状态 */
.ai-search-status {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f9f2ea;
  border-radius: 4px;
  margin: 10px 0;
}

.ai-search-status .loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #a67c52;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

.ai-generated-badge {
  background-color: #a67c52;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 8px;
}

.tea-price {
  background-color: #ff7675;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 8px;
  font-weight: bold;
}

/* 添加到账单按钮样式 */
.btn-add-to-bill {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  display: block;
  width: auto;
}

.btn-add-to-bill:hover {
  background-color: #3e8e41;
}

.tea-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* 增加搜索框大小 */
.search-box {
  display: flex;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: 12px 15px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.search-box input:focus {
  border-color: #6c5ce7;
  outline: none;
}

/* 美化空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 30px;
}

.empty-state .empty-icon {
  font-size: 50px;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
}

.empty-state p {
  color: #666;
  margin-bottom: 10px;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tea-price-small {
  color: #ff7675;
  font-weight: bold;
}
</style>