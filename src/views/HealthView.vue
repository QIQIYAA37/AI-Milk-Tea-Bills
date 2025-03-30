<template>
  <div class="health-view">
    <h1>健康管家</h1>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载健康数据...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="loadingError" class="error-message">
      <p>{{ loadingError }}</p>
      <button @click="fetchHealthData" class="btn-retry">重试</button>
    </div>
    
    <div class="dashboard" v-if="!isLoading && !loadingError">
      <div class="summary-cards">
        <div class="summary-card">
          <h3>本周摄入</h3>
          <div class="summary-content">
            <div class="summary-value">{{ weeklyIntake.calories }}</div>
            <div class="summary-label">卡路里</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-content">
            <div class="summary-value">{{ weeklyIntake.sugar }}g</div>
            <div class="summary-label">糖分</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-content">
            <div class="summary-value">{{ weeklyIntake.caffeine }}mg</div>
            <div class="summary-label">咖啡因</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-content">
            <div class="summary-value">¥{{ weeklyIntake.cost }}</div>
            <div class="summary-label">消费</div>
          </div>
        </div>
      </div>
      
      <div class="health-goals">
        <h2>健康目标</h2>
        <div class="goals-grid">
          <div class="goal-card">
            <div class="goal-header">
              <h3>每周奶茶消费</h3>
              <div class="goal-actions">
                <button class="btn-edit" @click="editGoal('budget')">编辑</button>
              </div>
            </div>
            <div class="goal-progress">
              <div class="progress-bar-container">
                <div 
                  class="progress-bar" 
                  :style="{width: `${budgetProgress}%`}"
                  :class="{warning: budgetProgress > 80}"
                ></div>
              </div>
              <div class="progress-text">
                <span>¥{{ weeklyIntake.cost }}</span>
                <span>/</span>
                <span>¥{{ goals.budget }}</span>
              </div>
            </div>
          </div>
          
          <div class="goal-card">
            <div class="goal-header">
              <h3>每周糖分摄入</h3>
              <div class="goal-actions">
                <button class="btn-edit" @click="editGoal('sugar')">编辑</button>
              </div>
            </div>
            <div class="goal-progress">
              <div class="progress-bar-container">
                <div 
                  class="progress-bar" 
                  :style="{width: `${sugarProgress}%`}"
                  :class="{warning: sugarProgress > 80}"
                ></div>
              </div>
              <div class="progress-text">
                <span>{{ weeklyIntake.sugar }}g</span>
                <span>/</span>
                <span>{{ goals.sugar }}g</span>
              </div>
            </div>
          </div>
          
          <div class="goal-card">
            <div class="goal-header">
              <h3>每周咖啡因摄入</h3>
              <div class="goal-actions">
                <button class="btn-edit" @click="editGoal('caffeine')">编辑</button>
              </div>
            </div>
            <div class="goal-progress">
              <div class="progress-bar-container">
                <div 
                  class="progress-bar" 
                  :style="{width: `${caffeineProgress}%`}"
                  :class="{warning: caffeineProgress > 80}"
                ></div>
              </div>
              <div class="progress-text">
                <span>{{ weeklyIntake.caffeine }}mg</span>
                <span>/</span>
                <span>{{ goals.caffeine }}mg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI分析部分 - 在智能推荐之前 -->
      <div class="ai-analysis-section">
        <h2 class="no-line">AI深度分析</h2>
        <p>使用人工智能分析您的消费习惯和健康数据，获取个性化建议</p>
        <button class="btn-ai-analysis" @click="startAIAnalysis" :disabled="isAnalyzing">
          {{ isAnalyzing ? '分析中...' : '开始AI分析' }}
        </button>
        
        <!-- AI分析结果 -->
        <div class="ai-analysis-result" v-if="aiAnalysisResult">
          <div class="analysis-content" v-html="formattedAnalysisResult"></div>
        </div>
        
        <!-- 错误消息 -->
        <div class="error-message" v-if="analysisError">
          <p>{{ analysisError }}</p>
        </div>
      </div>
      
      <!-- 智能推荐部分 - 基于AI分析结果 -->
      <div class="recommendations" v-if="recommendations">
        <h2>智能推荐</h2>
        <div class="recommendation-cards">
          <!-- 预算友好型 -->
          <div class="recommendation-card" :class="{ loading: isAnalyzing }">
            <div class="recommendation-header">
              <h3>预算友好型</h3>
              <div class="recommendation-icon">💰</div>
            </div>
            <div class="recommendation-content">
              <p>{{ recommendations.budgetFriendly.description }}</p>
              <div v-if="recommendations.budgetFriendly.recommendations && recommendations.budgetFriendly.recommendations.length > 0">
                <ul>
                  <li v-for="(item, index) in recommendations.budgetFriendly.recommendations" :key="index">
                    <strong>{{ item.name }}</strong> ({{ item.description }})
                  </li>
                </ul>
                <p class="recommendation-tip">{{ recommendations.budgetFriendly.tip }}</p>
              </div>
              <div v-else-if="isAnalyzing" class="loading-indicator">
                <span>正在生成推荐...</span>
              </div>
            </div>
          </div>
          
          <!-- 健康均衡型 -->
          <div class="recommendation-card" :class="{ loading: isAnalyzing }">
            <div class="recommendation-header">
              <h3>健康均衡型</h3>
              <div class="recommendation-icon">🥗</div>
            </div>
            <div class="recommendation-content">
              <p>{{ recommendations.healthyBalance.description }}</p>
              <div v-if="recommendations.healthyBalance.recommendations && recommendations.healthyBalance.recommendations.length > 0">
                <ul>
                  <li v-for="(item, index) in recommendations.healthyBalance.recommendations" :key="index">
                    <strong>{{ item.name }}</strong> ({{ item.description }})
                  </li>
                </ul>
                <p class="recommendation-tip">{{ recommendations.healthyBalance.tip }}</p>
              </div>
              <div v-else-if="isAnalyzing" class="loading-indicator">
                <span>正在生成推荐...</span>
              </div>
            </div>
          </div>
          
          <!-- 睡眠友好型 -->
          <div class="recommendation-card" :class="{ loading: isAnalyzing }">
            <div class="recommendation-header">
              <h3>睡眠友好型</h3>
              <div class="recommendation-icon">😴</div>
            </div>
            <div class="recommendation-content">
              <p>{{ recommendations.sleepFriendly.description }}</p>
              <div v-if="recommendations.sleepFriendly.recommendations && recommendations.sleepFriendly.recommendations.length > 0">
                <ul>
                  <li v-for="(item, index) in recommendations.sleepFriendly.recommendations" :key="index">
                    <strong>{{ item.name }}</strong> ({{ item.description }})
                  </li>
                </ul>
                <p class="recommendation-tip">{{ recommendations.sleepFriendly.tip }}</p>
              </div>
              <div v-else-if="isAnalyzing" class="loading-indicator">
                <span>正在生成推荐...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 静态示例推荐（仅在未获取AI推荐时显示） -->
      <div class="recommendations" v-else>
        <h2>智能推荐（示例）</h2>
        <div class="recommendation-cards">
          <div class="recommendation-card">
            <div class="recommendation-header">
              <h3>预算友好型</h3>
              <div class="recommendation-icon">💰</div>
            </div>
            <div class="recommendation-content">
              <p>基于你的消费习惯，推荐以下预算友好的选择：</p>
              <ul>
                <li><strong>蜜雪冰城 - 椰椰奶冻</strong> (¥7)</li>
                <li><strong>茶百道 - 幽兰拿铁</strong> (半糖, ¥19)</li>
              </ul>
              <p class="recommendation-tip">选择这些选项可以节省约 ¥10-20/周</p>
            </div>
          </div>
          
          <div class="recommendation-card">
            <div class="recommendation-header">
              <h3>健康均衡型</h3>
              <div class="recommendation-icon">🥗</div>
            </div>
            <div class="recommendation-content">
              <p>为了保持健康平衡，建议尝试：</p>
              <ul>
                <li><strong>喜茶 - 满杯红柚</strong> (无糖, 减少 42g 糖分)</li>
                <li><strong>奈雪的茶 - 金凤茶王</strong> (少冰少糖, 减少咖啡因摄入)</li>
              </ul>
              <p class="recommendation-tip">这些选择可以帮助你减少约30%的糖分和热量摄入</p>
            </div>
          </div>
          
          <div class="recommendation-card">
            <div class="recommendation-header">
              <h3>睡眠友好型</h3>
              <div class="recommendation-icon">😴</div>
            </div>
            <div class="recommendation-content">
              <p>如果你晚上想喝奶茶又担心影响睡眠：</p>
              <ul>
                <li><strong>蜜雪冰城 - 椰椰奶冻</strong> (低咖啡因)</li>
                <li><strong>喜茶 - 满杯红柚</strong> (果茶类, 咖啡因含量低)</li>
              </ul>
              <p class="recommendation-tip">晚上6点后尽量避免高咖啡因饮品</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑目标表单 -->
    <div class="modal" v-if="showEditGoalForm">
      <div class="modal-content">
        <h2>编辑健康目标</h2>
        <form @submit.prevent="saveGoal">
          <div class="form-group">
            <label>{{ goalLabels[editingGoalType] }}</label>
            <div class="input-with-unit">
              <input 
                type="number" 
                v-model="editingGoalValue" 
                :min="goalMinValues[editingGoalType]" 
                :step="goalSteps[editingGoalType]" 
                required
              >
              <span class="input-unit">{{ goalUnits[editingGoalType] }}</span>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="cancelEditGoal">取消</button>
            <button type="submit" class="btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import '../assets/styles/health.css';
import { analyzeUserData, getSmartRecommendations } from '../services/api';
import { getHealthData, getHealthGoals, updateHealthGoals } from '../services/billApi';
import { marked } from 'marked';

// 每周摄入量数据
const weeklyIntake = ref({
  calories: 0,
  sugar: 0,
  caffeine: 0,
  cost: 0
});

// 健康目标
const goals = ref({
  budget: 200,  // 每周预算（元）
  sugar: 175,   // 每周糖分摄入（克）
  caffeine: 300 // 每周咖啡因摄入（毫克）
});

// 加载状态
const isLoading = ref(false);
const loadingError = ref('');

// 目标编辑
const showEditGoalForm = ref(false);
const editingGoalType = ref('');
const editingGoalValue = ref(0);

// 目标相关配置
const goalLabels = {
  budget: '每周预算',
  sugar: '每周糖分摄入',
  caffeine: '每周咖啡因摄入'
};

const goalUnits = {
  budget: '元',
  sugar: 'g',
  caffeine: 'mg'
};

const goalMinValues = {
  budget: 50,
  sugar: 50,
  caffeine: 100
};

const goalSteps = {
  budget: 10,
  sugar: 5,
  caffeine: 10
};

// 计算进度
const budgetProgress = computed(() => {
  return Math.min(100, Math.round((weeklyIntake.value.cost / goals.value.budget) * 100));
});

const sugarProgress = computed(() => {
  return Math.min(100, Math.round((weeklyIntake.value.sugar / goals.value.sugar) * 100));
});

const caffeineProgress = computed(() => {
  return Math.min(100, Math.round((weeklyIntake.value.caffeine / goals.value.caffeine) * 100));
});

// 编辑目标方法
function editGoal(type: string) {
  editingGoalType.value = type;
  editingGoalValue.value = goals.value[type as keyof typeof goals.value];
  showEditGoalForm.value = true;
}

async function saveGoal() {
  if (editingGoalType.value && editingGoalValue.value > 0) {
    goals.value[editingGoalType.value as keyof typeof goals.value] = editingGoalValue.value;
    
    try {
      // 保存到服务器
      await updateHealthGoals(goals.value);
      console.log('健康目标已保存到服务器');
    } catch (error) {
      console.error('保存健康目标失败:', error);
      // 继续关闭表单，但可以考虑显示错误提示
    }
  }
  cancelEditGoal();
}

function cancelEditGoal() {
  showEditGoalForm.value = false;
  editingGoalType.value = '';
  editingGoalValue.value = 0;
}

// AI分析相关
const isAnalyzing = ref(false);
const aiAnalysisResult = ref('');
const recommendations = ref<any>(null);
const analysisError = ref('');

// 从服务器获取健康数据
async function fetchHealthData() {
  isLoading.value = true;
  loadingError.value = '';
  
  let retryCount = 0;
  const maxRetries = 3;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      // 获取健康数据
      const healthData = await getHealthData();
      console.log('从服务器获取的健康数据:', healthData);
      
      // 更新UI
      weeklyIntake.value = healthData;
      
      // 获取健康目标
      const healthGoals = await getHealthGoals();
      console.log('从服务器获取的健康目标:', healthGoals);
      
      // 更新UI
      goals.value = healthGoals;
      
      success = true;
      loadingError.value = '';
    } catch (error) {
      console.error(`获取健康数据失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        loadingError.value = '获取健康数据失败，请点击重试按钮再次尝试';
      } else {
        loadingError.value = `获取健康数据失败，正在自动重试 (${retryCount}/${maxRetries})...`;
        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  isLoading.value = false;
}

// 组件挂载时获取数据
onMounted(() => {
  fetchHealthData();
});

// 简单的用户表单数据
const formData = ref({
  age: 19,
  gender: '男',
  weight: 65,
  height: 178,
  sleepQuality: '良好',
  budget: 200,
  weeklyFrequency: 3,
  sugarLevel: '中糖',
  caffeineLevel: '中'
});

// 格式化分析结果（将Markdown转为HTML）
const formattedAnalysisResult = computed(() => {
  if (typeof aiAnalysisResult.value === 'string') {
    return aiAnalysisResult.value ? marked(aiAnalysisResult.value) : '';
  } else if (aiAnalysisResult.value) {
    // 如果是对象类型，生成简单的分析结果HTML
    const result = aiAnalysisResult.value as any;
    
    // 检查是否超过健康目标
    const sugarExceeded = result.sugarIntake > goals.value.sugar * 0.9;
    const caffeineExceeded = result.caffeineIntake > goals.value.caffeine * 0.9;
    const budgetExceeded = result.totalSpent > goals.value.budget * 4 * 0.9; // 4周预算
    
    // 生成营养评价和建议
    let nutritionEvaluation = '';
    let healthSuggestion = '';
    
    // 添加健康建议
    if (sugarExceeded || caffeineExceeded || budgetExceeded) {
      // 确定主要问题
      let primaryIssue = '';
      let suggestionClass = '';
      let recommendationType = '';
      let suggestionIcon = '';
      
      // 判断最严重的问题
      if (caffeineExceeded && (result.caffeineIntake / goals.value.caffeine > (result.sugarIntake / goals.value.sugar))) {
        primaryIssue = '本周咖啡因摄入过多';
        suggestionClass = 'caffeine-warning';
        recommendationType = 'sleepFriendly';
        suggestionIcon = '☕';
      } else if (sugarExceeded) {
        primaryIssue = '本周糖分摄入过多';
        suggestionClass = 'sugar-warning';
        recommendationType = 'healthyBalance';
        suggestionIcon = '🍬';
      } else if (budgetExceeded) {
        primaryIssue = '本周奶茶消费超出预算';
        suggestionClass = 'budget-warning';
        recommendationType = 'budgetFriendly';
        suggestionIcon = '💰';
      }
      
      // 添加健康建议区块
      healthSuggestion = `
        <div class="health-suggestion ${suggestionClass}">
          <h3>${suggestionIcon} 健康建议</h3>
          <p class="primary-issue"><strong>${primaryIssue}</strong></p>
          ${caffeineExceeded && recommendationType === 'sleepFriendly' ? `
            <p>您的咖啡因摄入已超过健康目标的<span class="percentage-warning">${Math.round((result.caffeineIntake / goals.value.caffeine) * 100)}%</span>。过量咖啡因可能导致失眠、心悸和焦虑。</p>
            <p class="recommendation-action">👉 为了改善睡眠质量，建议您查看下方<span class="highlight-sleep">睡眠友好型</span>奶茶推荐。</p>
          ` : ''}
          ${sugarExceeded && recommendationType === 'healthyBalance' ? `
            <p>您的糖分摄入已超过健康目标的<span class="percentage-warning">${Math.round((result.sugarIntake / goals.value.sugar) * 100)}%</span>。长期过量摄入糖分可能导致肥胖、糖尿病等健康问题。</p>
            <p class="recommendation-action">👉 为了控制糖分摄入，建议您查看下方<span class="highlight-health">健康均衡型</span>奶茶推荐。</p>
          ` : ''}
          ${budgetExceeded && recommendationType === 'budgetFriendly' ? `
            <p>您的消费已超过月度预算的<span class="percentage-warning">${Math.round((result.totalSpent / (goals.value.budget * 4)) * 100)}%</span>。合理控制消费有助于财务健康。</p>
            <p class="recommendation-action">👉 为了控制开支，建议您查看下方<span class="highlight-budget">预算友好型</span>奶茶推荐。</p>
          ` : ''}
        </div>
      `;
      
      // 添加高亮推荐卡片的脚本
      setTimeout(() => {
        // 先清除所有卡片的高亮效果
        const allRecommendationCards = document.querySelectorAll('.recommendation-card');
        allRecommendationCards.forEach(card => {
          card.classList.remove('highlighted');
        });
        
        // 获取所有推荐卡片
        const recommendationCards = document.querySelectorAll('.recommendation-card');
        
        // 根据问题类型添加高亮效果
        if (recommendationCards && recommendationCards.length > 0) {
          let targetCard = null;
          
          if (recommendationType === 'sleepFriendly' && recommendationCards[2]) {
            targetCard = recommendationCards[2];
          } else if (recommendationType === 'healthyBalance' && recommendationCards[1]) {
            targetCard = recommendationCards[1];
          } else if (recommendationType === 'budgetFriendly' && recommendationCards[0]) {
            targetCard = recommendationCards[0];
          }
          
          if (targetCard) {
            // 添加高亮效果
            targetCard.classList.add('highlighted');
            
            // 滚动到推荐卡片位置
            setTimeout(() => {
              targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 800);
          }
        }
      }, 500);
    }
    
    // 生成营养评价
    if (sugarExceeded || caffeineExceeded) {
      nutritionEvaluation = `
        <h3>营养成分摄入评价</h3>
        ${sugarExceeded ? `
        <div class="nutrition-warning">
          <p>⚠️ <strong>糖分摄入过多</strong>：您本周的糖分摄入接近或超过了健康目标。长期过量摄入糖分可能导致肥胖、糖尿病等健康问题。</p>
        </div>
        ` : ''}
        ${caffeineExceeded ? `
        <div class="nutrition-warning">
          <p>⚠️ <strong>咖啡因摄入过多</strong>：您本周的咖啡因摄入接近或超过了健康目标。过量摄入咖啡因可能导致失眠、心悸等问题。</p>
        </div>
        ` : ''}
        
        <h3>营养成分摄入建议</h3>
        <ul>
          ${sugarExceeded ? `<li><strong>减少糖分摄入</strong>：推荐选择低糖或无糖饮品，如无糖绿茶、微糖奶茶等。每周减少一杯全糖奶茶可降低约20-30g的糖分摄入。</li>` : ''}
          ${caffeineExceeded ? `<li><strong>减少咖啡因摄入</strong>：推荐选择低咖啡因饮品，如果茶、花草茶或无咖啡因的水果茶。建议晚上6点后避免含咖啡因的饮品。</li>` : ''}
        </ul>
      `;
    }
    
    return `
      <h3>消费分析摘要</h3>
      <ul>
        <li>近6个月总消费: ¥${result.totalSpent}</li>
        <li>平均每周饮品数: ${result.avgWeeklyDrinks}杯</li>
        <li>每周糖分摄入: ${Math.round(result.sugarIntake)}g</li>
        <li>每周咖啡因摄入: ${Math.round(result.caffeineIntake)}mg</li>
      </ul>
      ${healthSuggestion}
      ${nutritionEvaluation}
    `;
  }
  return '';
});

// 开始AI分析
const startAIAnalysis = async () => {
  console.log("开始分析用户数据...");
  isAnalyzing.value = true;
  aiAnalysisResult.value = '';
  recommendations.value = null;
  analysisError.value = null;
  aiAnalysisResult.value = "正在分析您的奶茶消费习惯...";
  const sessionId = 'session_' + new Date().getTime();
  
  // 清除之前的高亮效果
  setTimeout(() => {
    const allCards = document.querySelectorAll('.recommendation-card');
    allCards.forEach(card => {
      card.classList.remove('highlighted');
    });
  }, 100);

  try {
    // 创建带随机波动的用户数据
    const { finalData, randomFactors } = createUserDataWithRandomization();
    console.log("随机化因子:", randomFactors);
    
    // 发送初始用户数据进行分析
    await analyzeUserData(
      finalData, 
      (content: string) => {
        // 内容更新回调
        console.log(`收到分析内容，长度: ${content.length}`);
        // 由于我们改为直接展示结果摘要，这里可以不处理流式内容
      },
      // 初始化回调
      () => {
        aiAnalysisResult.value = "AI 正在处理数据...";
      },
      // 错误回调
      (errorMsg: string) => {
        analysisError.value = errorMsg;
        isAnalyzing.value = false;
        aiAnalysisResult.value = "";
      }
    );
    
    // 分析完成，获取推荐
    aiAnalysisResult.value = "生成个性化推荐中...";
    
    // 使用新的getSmartRecommendations函数获取推荐
    const smartRecommendations = await getSmartRecommendations(finalData, sessionId);
    recommendations.value = smartRecommendations;
    
    // 设置为空字符串，这样可以将显示切换到摘要模式
    aiAnalysisResult.value = "";
    isAnalyzing.value = false;
    
    // 延迟显示消费习惯分析结果，确保先看到推荐
    setTimeout(() => {
      aiAnalysisResult.value = {
        totalSpent: finalData.consumptionData.monthlySpending.reduce((a: number, b: number) => a + b, 0).toFixed(2),
        avgWeeklyDrinks: (finalData.consumptionData.frequencyPerWeek * randomFactors.frequencyMultiplier).toFixed(1),
        sugarIntake: finalData.healthData.sugarIntakePerWeek,
        caffeineIntake: finalData.healthData.caffeineIntakePerWeek
      };
    }, 500);
    
  } catch (error) {
    console.error("分析过程出错:", error);
    aiAnalysisResult.value = "";
    analysisError.value = "分析过程中发生错误，请稍后再试";
    isAnalyzing.value = false;
  }
};

/**
 * 创建带随机波动的用户数据
 */
const createUserDataWithRandomization = () => {
  // 增加随机波动范围从±15%到±25%
  const getRandomFactor = () => 0.75 + Math.random() * 0.5;
  
  // 随机品牌列表 - 添加更多选择
  const teaBrands = ['喜茶', '奈雪的茶', '蜜雪冰城', '星巴克', 'COCO', '一点点', '茶百道', '古茗', '沪上阿姨', '益禾堂'];
  const randomBrand = teaBrands[Math.floor(Math.random() * teaBrands.length)];
  
  // 生成随机用户偏好
  const generateRandomPreferences = () => {
    const preferences = [
      { preference: '偏好奶茶', value: Math.random() > 0.4 },
      { preference: '喜欢清爽果茶', value: Math.random() > 0.5 },
      { preference: '注重健康', value: Math.random() > 0.3 },
      { preference: '价格敏感', value: Math.random() > 0.5 },
      { preference: '追求新品', value: Math.random() > 0.6 },
      { preference: '低糖少冰', value: Math.random() > 0.5 }
    ];
    return preferences.filter(p => Math.random() > 0.3); // 随机筛选一部分偏好
  };
  
  // 记录随机因子用于记录
  const randomFactors = {
    frequencyMultiplier: getRandomFactor(),
    sugarMultiplier: getRandomFactor(),
    caffeineMultiplier: getRandomFactor(),
    spendingMultiplier: getRandomFactor(),
    smallCupPreference: Math.random() > 0.5,
    seasonalPreference: ['春季', '夏季', '秋季', '冬季'][Math.floor(Math.random() * 4)],
    favoredBrand: randomBrand,
    healthGoal: Math.random() > 0.6 ? '减少糖分' : 
                (Math.random() > 0.5 ? '控制咖啡因' : 
                (Math.random() > 0.5 ? '节省开支' : '均衡营养')),
    userPreferences: generateRandomPreferences()
  };
  
  // 随机健康目标调整值（±20%）
  const healthGoalAdjustment = 0.8 + Math.random() * 0.4;
  
  // 使用表单数据创建带随机波动的用户数据
  const baseFrequency = Number(formData.value.weeklyFrequency) || 3;
  const finalData = {
    userData: {
      age: formData.value.age,
      gender: formData.value.gender,
      weight: formData.value.weight,
      height: formData.value.height,
      sleepQuality: formData.value.sleepQuality,
      healthGoal: randomFactors.healthGoal, // 使用随机健康目标
      budget: (formData.value.budget * healthGoalAdjustment).toFixed(0), // 调整后的预算目标
      preferences: randomFactors.userPreferences
    },
    consumptionData: {
      frequencyPerWeek: baseFrequency * randomFactors.frequencyMultiplier,
      preferredSize: randomFactors.smallCupPreference ? '小杯' : '中杯',
      seasonalPreference: randomFactors.seasonalPreference, // 使用随机季节偏好
      favoredBrand: randomFactors.favoredBrand,
      monthlySpending: Array(6).fill(0).map((_, i) => {
        // 生成近6个月的消费数据，带随机波动
        const baseSpending = (formData.value.budget || 150) / 4; // 默认每周预算
        return baseSpending * baseFrequency * randomFactors.spendingMultiplier * (0.85 + Math.random() * 0.3); // 添加额外随机波动
      })
    },
    healthData: {
      sugarIntakePerWeek: 
        (baseFrequency * (formData.value.sugarLevel === '低糖' ? 15 : 
                       formData.value.sugarLevel === '中糖' ? 25 : 
                       formData.value.sugarLevel === '高糖' ? 35 : 20)) 
        * randomFactors.sugarMultiplier,
      caffeineIntakePerWeek: 
        (baseFrequency * (formData.value.caffeineLevel === '低' ? 40 : 
                       formData.value.caffeineLevel === '中' ? 60 : 
                       formData.value.caffeineLevel === '高' ? 90 : 50))
        * randomFactors.caffeineMultiplier,
      calories: weeklyIntake.value.calories * (0.9 + Math.random() * 0.2), // 随机化卡路里数据
      sugar: weeklyIntake.value.sugar * randomFactors.sugarMultiplier, // 确保与上面的糖分计算一致
      caffeine: weeklyIntake.value.caffeine * randomFactors.caffeineMultiplier, // 确保与上面的咖啡因计算一致
      cost: weeklyIntake.value.cost * randomFactors.spendingMultiplier // 确保与上面的消费计算一致
    },
    timestamp: new Date().getTime(), // 添加时间戳以确保每次请求都不同
    _randomSeed: Math.floor(Math.random() * 1000000) // 额外随机种子
  };
  
  // 记录增强的随机数据
  console.log("增强随机化用户数据:", {
    健康目标: finalData.userData.healthGoal,
    偏好品牌: finalData.consumptionData.favoredBrand,
    季节偏好: finalData.consumptionData.seasonalPreference,
    杯型偏好: finalData.consumptionData.preferredSize,
    用户偏好: finalData.userData.preferences
  });
  
  return { finalData, randomFactors };
};
</script>

<style scoped>
/* 所有样式已移至 src/assets/styles/health.css */

/* 移除AI分析标题下的紫色线条 */
.no-line::after {
  display: none !important;
}

/* AI分析结果样式 */
.ai-analysis-result {
  margin-top: 1.5rem;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.analysis-content {
  line-height: 1.6;
  color: #333;
}

/* 营养警告样式 */
.nutrition-warning {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 0.8rem 1rem;
  margin: 0.8rem 0;
  border-radius: 0 4px 4px 0;
}

.nutrition-warning p {
  margin: 0;
  color: #e65100;
}

/* 健康建议样式 */
.health-suggestion {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.2rem;
  margin: 1.2rem 0;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #eaeaea;
}

.health-suggestion h3 {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.health-suggestion p {
  margin: 0.6rem 0;
  line-height: 1.5;
}

.health-suggestion .primary-issue {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
}

.health-suggestion .percentage-warning {
  font-weight: 600;
  color: #e53935;
}

.health-suggestion .recommendation-action {
  margin-top: 0.8rem;
  font-weight: 500;
}

.health-suggestion.caffeine-warning {
  background-color: #e8f4fd;
  border-left: 4px solid #2196f3;
}

.health-suggestion.sugar-warning {
  background-color: #f9fde8;
  border-left: 4px solid #8bc34a;
}

.health-suggestion.budget-warning {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
}

.health-suggestion.balanced {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.recommendation-link {
  font-weight: 500;
  margin-top: 0.5rem;
}

.highlight-sleep, .highlight-health, .highlight-budget {
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 4px;
}

.highlight-sleep {
  background-color: #e3f2fd;
  color: #1565c0;
}

.highlight-health {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.highlight-budget {
  background-color: #fff8e1;
  color: #f57f17;
}

/* 推荐卡片高亮样式 */
.recommendation-card.highlighted {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(166, 124, 82, 0.25);
  border: 2px solid #a67c52;
  animation: pulse 2s infinite;
  position: relative;
  z-index: 1;
}

.recommendation-card.highlighted::before {
  content: '推荐';
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #a67c52;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(166, 124, 82, 0.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(166, 124, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(166, 124, 82, 0);
  }
}

.analysis-content h1, 
.analysis-content h2, 
.analysis-content h3 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #a67c52;
}

.analysis-content ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.analysis-content li {
  margin-bottom: 0.5rem;
}

.analysis-content strong {
  color: #333;
  font-weight: 600;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  margin: 1rem 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #a67c52;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示样式 */
.error-message {
  background-color: #fff8f8;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #d32f2f;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-retry {
  background-color: #a67c52;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #8c6744;
  box-shadow: 0 2px 4px rgba(166, 124, 82, 0.2);
  transform: translateY(-1px);
}
</style>