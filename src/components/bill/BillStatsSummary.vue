<template>
  <div class="stats-container">
    <div class="stats-card">
      <div class="stats-icon monthly-icon">
        <i>📅</i>
      </div>
      <div class="stats-content">
        <h3>本月消费</h3>
        <div class="amount">¥{{ monthlyTotal }}</div>
        <div class="comparison" :class="monthlyComparison > 0 ? 'up' : 'down'">
          <span class="arrow">{{ monthlyComparison > 0 ? '↑' : '↓' }}</span> 
          <span class="percentage">{{ Math.abs(monthlyComparison) }}%</span>
          <span class="period">较上月</span>
        </div>
      </div>
    </div>
    
    <div class="stats-card">
      <div class="stats-icon weekly-icon">
        <i>📊</i>
      </div>
      <div class="stats-content">
        <h3>本周消费</h3>
        <div class="amount">¥{{ weeklyTotal }}</div>
        <div class="comparison" :class="weeklyComparison > 0 ? 'up' : 'down'">
          <span class="arrow">{{ weeklyComparison > 0 ? '↑' : '↓' }}</span> 
          <span class="percentage">{{ Math.abs(weeklyComparison) }}%</span>
          <span class="period">较上周</span>
        </div>
      </div>
    </div>
    
    <div class="stats-card">
      <div class="stats-icon average-icon">
        <i>💰</i>
      </div>
      <div class="stats-content">
        <h3>平均单价</h3>
        <div class="amount">¥{{ averagePrice }}</div>
        <div class="bill-count">共{{ props.bills.length }}笔消费</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue';

interface Bill {
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

const props = defineProps<{
  bills: Bill[];
}>();

// 计算统计数据
const monthlyTotal = computed(() => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const total = props.bills
    .filter((bill: Bill) => bill.date.startsWith(currentMonth))
    .reduce((sum: number, bill: Bill) => {
      // 确保price是数字
      const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  
  return total.toFixed(2);
});

const weeklyTotal = computed(() => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const total = props.bills
    .filter((bill: Bill) => new Date(bill.date) >= oneWeekAgo)
    .reduce((sum: number, bill: Bill) => {
      // 确保price是数字
      const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  
  return total.toFixed(2);
});

const averagePrice = computed(() => {
  if (props.bills.length === 0) return '0.00';
  
  const total = props.bills.reduce((sum: number, bill: Bill) => {
    // 确保price是数字
    const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  
  return (total / props.bills.length).toFixed(2);
});

// 比较数据（模拟上月/上周数据）
// 在实际项目中，这些数值应该从历史数据中计算得出
const monthlyComparison = computed(() => 15); // 模拟数据：比上月增长15%
const weeklyComparison = computed(() => -8); // 模拟数据：比上周减少8%
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: var(--transition);
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
}

.stats-card:nth-child(1)::before {
  background: linear-gradient(to right, #c39b77, #a67c52);
}

.stats-card:nth-child(2)::before {
  background: linear-gradient(to right, #3498db, #2980b9);
}

.stats-card:nth-child(3)::before {
  background: linear-gradient(to right, #f1c40f, #f39c12);
}

.stats-icon {
  background: rgba(166, 124, 82, 0.1);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.monthly-icon {
  background: rgba(166, 124, 82, 0.1);
}

.weekly-icon {
  background: rgba(52, 152, 219, 0.1);
}

.average-icon {
  background: rgba(241, 196, 15, 0.1);
}

.stats-icon i {
  font-size: 1.8rem;
}

.stats-content {
  flex-grow: 1;
}

.stats-content h3 {
  font-size: 1rem;
  color: var(--text-light);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.amount {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.comparison {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  gap: 0.3rem;
}

.up {
  color: #27ae60;
}

.down {
  color: #e74c3c;
}

.arrow {
  font-weight: bold;
}

.period {
  color: var(--text-light);
  margin-left: 0.2rem;
}

.bill-count {
  font-size: 0.9rem;
  color: var(--text-light);
}

@media (max-width: 992px) {
  .stats-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    padding: 1.2rem;
  }
  
  .stats-icon {
    width: 50px;
    height: 50px;
  }
  
  .stats-icon i {
    font-size: 1.5rem;
  }
  
  .amount {
    font-size: 1.5rem;
  }
}
</style>