<template>
  <div class="bill-view">
    <div class="page-header">
      <h1>账单管理</h1>
      <p>查看和管理您的奶茶消费记录，掌握消费趋势</p>
    </div>
    
    <!-- 统计卡片 -->
    <BillStatsSummary :bills="bills" />
    
    <!-- 图表显示 -->
    <div class="card chart-card">
      <BillChartDisplay 
        :bills="bills" 
        :filteredBills="filteredBills" 
        @update:dateRange="updateDateRange" 
      />
    </div>
    
    <div class="analysis-grid">
      <!-- 品牌分析饼图 -->
      <div class="card analysis-card">
        <h2 class="card-title">品牌分析</h2>
        <BillBrandAnalysis :bills="bills" />
      </div>
      
      <!-- 规格分析条形图 -->
      <div class="card analysis-card">
        <h2 class="card-title">规格分析</h2>
        <BillSizeAnalysis :bills="bills" />
      </div>
    </div>
    
    <!-- 账单表格 -->
    <div class="card table-card">
      <h2 class="card-title">账单明细</h2>
      <BillTable 
        :bills="filteredBills" 
        @add="addBill" 
        @update="updateBill" 
        @delete="deleteBill" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, watch } from 'vue';
import BillStatsSummary from '@/components/bill/BillStatsSummary.vue';
import BillChartDisplay from '@/components/bill/BillChartDisplay.vue';
import BillBrandAnalysis from '@/components/bill/BillBrandAnalysis.vue';
import BillSizeAnalysis from '@/components/bill/BillSizeAnalysis.vue';
import BillTable from '@/components/bill/BillTable.vue';
import { getAllBills, filterBills, addBill as apiAddBill, updateBill as apiUpdateBill, deleteBill as apiDeleteBill, batchImportBills, testConnection } from '../services/billApi';

// 定义账单类型
interface Bill {
  id?: number;
  date: string;
  brand: string;
  name: string;
  size: string;
  price: number;
  calories?: number;
  sugar?: number;
  fat?: number;
  caffeine?: number;
}

// 账单数据
const bills = ref<Bill[]>([]);
const filteredBills = ref<Bill[]>([]);
const loading = ref<boolean>(false);
const error = ref<string>('');

// 日期筛选
const startDate = ref<string>('2022-01-01');  // 扩大日期范围，从2022年1月1日开始
const endDate = ref<string>(new Date().toISOString().split('T')[0]);  // 当前日期

// 品牌筛选
const filterBrand = ref<string>('');

// 加载账单数据
async function loadBills() {
  loading.value = true;
  error.value = '';
  
  try {
    const data = await getAllBills();
    bills.value = data;
    console.log('加载账单数据成功，数量:', bills.value.length);
    applyFilters();
  } catch (err: any) {
    console.error('加载账单数据失败:', err);
    error.value = '加载账单数据失败: ' + (err.message || '未知错误');
    // 不再使用测试数据作为备选
    bills.value = [];
    filteredBills.value = [];
  } finally {
    loading.value = false;
  }
}

// 应用筛选条件
async function applyFilters() {
  console.log('应用筛选前，bills长度:', bills.value.length);
  
  // 如果指定了筛选条件，从API获取筛选后的数据
  if ((startDate.value && endDate.value) || filterBrand.value) {
    try {
      loading.value = true;
      const data = await filterBills(startDate.value, endDate.value, filterBrand.value);
      filteredBills.value = data;
      console.log('从API获取筛选账单成功，数量:', filteredBills.value.length);
    } catch (err) {
      console.error('API筛选账单失败，使用本地筛选:', err);
      // 如果API筛选失败，使用本地筛选作为备选
      let filtered = bills.value;
      
      // 应用日期筛选
      if (startDate.value && endDate.value) {
        filtered = filtered.filter((bill: Bill) => bill.date >= startDate.value && bill.date <= endDate.value);
        console.log('日期筛选后，filtered长度:', filtered.length);
      }
      
      // 应用品牌筛选
      if (filterBrand.value) {
        filtered = filtered.filter((bill: Bill) => bill.brand === filterBrand.value);
        console.log('品牌筛选后，filtered长度:', filtered.length);
      }
      
      filteredBills.value = filtered;
    } finally {
      loading.value = false;
    }
  } else {
    // 没有筛选条件，显示所有账单
    filteredBills.value = bills.value;
  }
  
  console.log('最终filteredBills长度:', filteredBills.value.length);
}

// 更新日期范围
function updateDateRange(dateRange: { startDate: string, endDate: string }) {
  startDate.value = dateRange.startDate;
  endDate.value = dateRange.endDate;
  applyFilters();
}

// 添加账单
async function addBill(bill: Bill) {
  let retryCount = 0;
  const maxRetries = 3;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      loading.value = true;
      // 调用API添加账单
      const newBill = await apiAddBill(bill);
      // 更新本地数据
      bills.value.push(newBill);
      console.log('添加账单成功:', newBill);
      applyFilters();
      success = true;
      if (retryCount > 0) {
        error.value = ''; // 清除之前的错误信息
      }
    } catch (err: any) {
      console.error(`添加账单失败 (尝试 ${retryCount + 1}/${maxRetries}):`, err);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        error.value = '添加账单失败: ' + (err.message || '未知错误') + '，已尝试多次';
        // 最终失败时降级为本地添加（仅为展示，不会持久化）
        bills.value.push({...bill, id: -Date.now()}); // 添加临时ID以便识别
        applyFilters();
      } else {
        error.value = `添加账单失败: ${err.message || '未知错误'}，正在重试 (${retryCount}/${maxRetries})...`;
        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      if (success || retryCount >= maxRetries) {
        loading.value = false;
      }
    }
  }
}

// 更新账单
async function updateBill(updatedBill: Bill, index: number) {
  // 如果找不到ID，使用另一种方式找到对应的账单
  const originalBill = filteredBills.value[index];
  const id = originalBill.id;
  
  if (!id) {
    console.error('更新账单失败: 找不到账单ID');
    error.value = '更新账单失败: 找不到账单ID';
    return;
  }
  
  try {
    loading.value = true;
    // 调用API更新账单
    const result = await apiUpdateBill(id, updatedBill);
    console.log('更新账单成功:', result);
    
    // 更新本地数据
    const originalIndex = bills.value.findIndex((b: Bill) => b.id === id);
    if (originalIndex !== -1) {
      bills.value[originalIndex] = { ...updatedBill, id };
      applyFilters();
    }
  } catch (err: any) {
    console.error('更新账单失败:', err);
    error.value = '更新账单失败: ' + (err.message || '未知错误');
    
    // 失败时降级为本地更新（仅为展示，不会持久化）
    const originalIndex = bills.value.findIndex((b: Bill) => 
      b.date === filteredBills.value[index].date && 
      b.brand === filteredBills.value[index].brand && 
      b.name === filteredBills.value[index].name && 
      b.price === filteredBills.value[index].price
    );
    
    if (originalIndex !== -1) {
      bills.value[originalIndex] = updatedBill;
      applyFilters();
    }
  } finally {
    loading.value = false;
  }
}

// 删除账单
async function deleteBill(index: number) {
  const originalBill = filteredBills.value[index];
  const id = originalBill.id;
  
  if (!id) {
    console.error('删除账单失败: 找不到账单ID');
    error.value = '删除账单失败: 找不到账单ID';
    return;
  }
  
  try {
    loading.value = true;
    // 调用API删除账单
    await apiDeleteBill(id);
    console.log('删除账单成功:', id);
    
    // 更新本地数据
    const originalIndex = bills.value.findIndex((b: Bill) => b.id === id);
    if (originalIndex !== -1) {
      bills.value.splice(originalIndex, 1);
      applyFilters();
    }
  } catch (err: any) {
    console.error('删除账单失败:', err);
    error.value = '删除账单失败: ' + (err.message || '未知错误');
    
    // 失败时降级为本地删除（仅为展示，不会持久化）
    const originalIndex = bills.value.findIndex((b: Bill) => 
      b.date === filteredBills.value[index].date && 
      b.brand === filteredBills.value[index].brand && 
      b.name === filteredBills.value[index].name && 
      b.price === filteredBills.value[index].price
    );
    
    if (originalIndex !== -1) {
      bills.value.splice(originalIndex, 1);
      applyFilters();
    }
  } finally {
    loading.value = false;
  }
}

// 监听筛选条件变化
watch(filterBrand, () => {
  applyFilters();
});

// 初始化
onMounted(async () => {
  // 先测试API连接，确保后端服务器正常运行
  try {
    const result = await testConnection();
    if (result.success) {
      console.log(`成功连接到API服务器，端口: ${result.port}`);
    } else {
      console.error('连接API服务器失败');
    }
  } catch (err) {
    console.error('测试API连接时出错:', err);
  }

  // 从API加载数据
  await loadBills();
  
  // 添加调试日志
  console.log('初始化完成，bills长度:', bills.value.length);
  console.log('初始化完成，filteredBills长度:', filteredBills.value.length);
});
</script>

<style scoped>
.bill-view {
  padding: 0.5rem;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.page-header p {
  color: var(--text-light);
  font-size: 1.1rem;
}

.card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-hover);
}

.card-title {
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
  position: relative;
  padding-bottom: 0.8rem;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: var(--primary-color);
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.analysis-card {
  display: flex;
  flex-direction: column;
}

.chart-card {
  overflow: hidden;
}

.table-card {
  overflow-x: auto;
}

@media (max-width: 992px) {
  .analysis-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .page-header p {
    font-size: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
}
</style>