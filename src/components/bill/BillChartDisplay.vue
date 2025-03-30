<template>
  <div class="chart-container">
    <div class="chart-tabs">
      <div 
        class="chart-tab" 
        :class="{ active: activeChart === 'trend' }" 
        @click="setActiveChart('trend')"
      >
        消费趋势
      </div>
      <div 
        class="chart-tab" 
        :class="{ active: activeChart === 'monthly' }" 
        @click="setActiveChart('monthly')"
      >
        月度统计
      </div>
    </div>
    
    <div class="chart-controls">
      <div class="date-range-selector">
        <label>日期范围:</label>
        <input type="date" v-model="startDateValue" @change="updateDateRange">
        <span>至</span>
        <input type="date" v-model="endDateValue" @change="updateDateRange">
      </div>
      
      <!-- 分组选择器 -->
      <div class="group-selector" v-if="activeChart === 'monthly'">
        <label>统计单位:</label>
        <select v-model="groupBy" @change="updateMonthlyChart(getDateFilteredBills())">
          <option value="month">月度</option>
          <option value="quarter">季度</option>
          <option value="year">年度</option>
        </select>
      </div>
    </div>
    
    <div class="chart-container-inner">
      <div ref="trendChart" class="chart" v-show="activeChart === 'trend'" style="height: 400px; width: 100%"></div>
      <div ref="monthlyChart" class="chart" v-show="activeChart === 'monthly'" style="height: 400px; width: 100%"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

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

// 定义props和emits
const props = defineProps<{
  bills: Bill[];
  filteredBills: Bill[];
}>();

const emit = defineEmits<{
  (e: 'update:dateRange', value: { startDate: string; endDate: string }): void;
}>();

// 图表实例
let trendChartInstance: echarts.ECharts | null = null;
let monthlyChartInstance: echarts.ECharts | null = null;

// DOM引用
const trendChart = ref<HTMLElement | null>(null);
const monthlyChart = ref<HTMLElement | null>(null);

// 状态管理
const activeChart = ref('monthly');
const groupBy = ref('month');
const startDateValue = ref('2022-01-01');
const endDateValue = ref(new Date().toISOString().split('T')[0]);

// 日期范围更新
function updateDateRange() {
  emit('update:dateRange', { 
    startDate: startDateValue.value, 
    endDate: endDateValue.value 
  });
}

// 切换图表类型
function setActiveChart(chart: string) {
  activeChart.value = chart;
  
  // 使用nextTick确保DOM更新后再调整图表大小
  nextTick(() => {
    try {
      console.log(`切换到${chart}图表`);
      
      if (chart === 'trend') {
        if (trendChartInstance) {
          console.log('调整趋势图表大小');
          trendChartInstance.resize();
          // 应用筛选后的数据
          updateTrendChart(getDateFilteredBills());
        } else if (trendChart.value) {
          console.log('趋势图表实例不存在，进行初始化');
          trendChartInstance = echarts.init(trendChart.value);
          updateTrendChart(getDateFilteredBills());
        } else {
          console.error('趋势图表DOM引用不存在，无法初始化图表');
        }
      } else if (chart === 'monthly') {
        if (monthlyChartInstance) {
          console.log('调整月度图表大小');
          monthlyChartInstance.resize();
          // 应用筛选后的数据
          updateMonthlyChart(getDateFilteredBills());
        } else if (monthlyChart.value) {
          console.log('月度图表实例不存在，进行初始化');
          console.log('月度图表DOM引用:', monthlyChart.value);
          monthlyChartInstance = echarts.init(monthlyChart.value);
          updateMonthlyChart(getDateFilteredBills());
        } else {
          console.error('月度图表DOM引用不存在，无法初始化图表');
        }
      }
    } catch (error) {
      console.error('切换图表时发生错误:', error);
    }
  });
}

// 获取日期筛选后的账单
function getDateFilteredBills() {
  return props.filteredBills.filter((bill: Bill) => {
    return bill.date >= startDateValue.value && bill.date <= endDateValue.value;
  });
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 更新趋势图表
function updateTrendChart(bills: Bill[]) {
  if (!trendChartInstance) return;
  
  // 准备数据
  const dateMap = new Map<string, number>();
  const countMap = new Map<string, number>(); // 记录每天的消费次数
  bills.forEach(bill => {
    const date = bill.date;
    dateMap.set(date, (dateMap.get(date) || 0) + bill.price);
    countMap.set(date, (countMap.get(date) || 0) + 1);
  });
  
  // 按日期排序
  const sortedDates = Array.from(dateMap.keys()).sort();
  const values = sortedDates.map(date => dateMap.get(date) || 0);
  const counts = sortedDates.map(date => countMap.get(date) || 0);
  const formattedDates = sortedDates.map(date => formatDate(date));
  
  // 设置图表选项
  const option = {
    title: {
      text: '消费趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const date = params[0].axisValue;
        const value = params[0].value;
        const count = counts[params[0].dataIndex];
        return `<div style="font-weight:bold">${date}</div>
               消费金额: ¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}<br/>
               消费次数: ${count}次<br/>
               平均单价: ¥${count > 0 && typeof value === 'number' ? (value / count).toFixed(2) : '0.00'}`;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          title: {
            zoom: '区域缩放',
            back: '还原'
          }
        },
        restore: {
          title: '还原'
        },
        saveAsImage: {
          title: '保存为图片'
        }
      }
    },
    xAxis: {
      type: 'category',
      data: formattedDates,
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 0,
        borderColor: 'transparent',
        backgroundColor: '#f5f5f5',
        fillerColor: 'rgba(166, 124, 82, 0.2)',
        handleStyle: {
          color: '#a67c52'
        },
        textStyle: {
          color: '#666'
        }
      }
    ],
    series: [{
      name: '消费金额',
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'emptyCircle',
      symbolSize: 6,
      lineStyle: {
        color: '#a67c52',
        width: 3,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10,
        shadowOffsetY: 5
      },
      itemStyle: {
        color: '#a67c52',
        borderWidth: 2,
        borderColor: '#fff'
      },
      emphasis: {
        itemStyle: {
          color: '#a67c52',
          borderWidth: 4,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          shadowColor: 'rgba(166, 124, 82, 0.5)',
          shadowBlur: 10
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(166, 124, 82, 0.5)'
          }, {
            offset: 1, color: 'rgba(166, 124, 82, 0.05)'
          }]
        }
      },
      markPoint: {
        symbolSize: 60,
        data: [
          { type: 'max', name: '最高消费' },
          { type: 'min', name: '最低消费' }
        ],
        label: {
          formatter: '{b}: ¥{c}'
        },
        itemStyle: {
          color: '#a67c52'
        }
      }
    }]
  };
  
  trendChartInstance.setOption(option);
}

// 更新月度图表
function updateMonthlyChart(bills: Bill[]) {
  if (!monthlyChartInstance) {
    console.error('月度图表实例不存在，无法更新图表');
    return;
  }
  
  console.log('开始更新月度图表，账单数量:', bills.length);
  
  // 根据分组类型进行数据处理
  const groupData = (bills: Bill[], groupType: string) => {
    const groupMap = new Map<string, number>();
    const countMap = new Map<string, number>();
    
    bills.forEach(bill => {
      let groupKey = '';
      const date = new Date(bill.date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // 根据不同分组类型生成键
      if (groupType === 'month') {
        // 按月分组: YYYY-MM
        groupKey = `${year}-${month}`;
      } else if (groupType === 'quarter') {
        // 按季度分组: YYYY-Q?
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        groupKey = `${year}-Q${quarter}`;
      } else if (groupType === 'year') {
        // 按年分组: YYYY
        groupKey = year;
      }
      
      // 确保price是数字
      const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
      if (!isNaN(price)) {
        groupMap.set(groupKey, (groupMap.get(groupKey) || 0) + price);
        countMap.set(groupKey, (countMap.get(groupKey) || 0) + 1);
      }
    });
    
    return { groupMap, countMap };
  };
  
  // 格式化分组键为显示文本
  const formatGroupKey = (key: string, groupType: string) => {
    if (groupType === 'month') {
      // 月度显示: YYYY年MM月
      const [year, month] = key.split('-');
      return `${year}年${month}月`;
    } else if (groupType === 'quarter') {
      // 季度显示: YYYY年第Q季度
      const [year, quarter] = key.split('-');
      return `${year}年${quarter}`;
    } else {
      // 年度显示: YYYY年
      return `${key}年`;
    }
  };
  
  // 获取分组数据
  const { groupMap, countMap } = groupData(bills, groupBy.value);
  
  // 按时间顺序排序键
  const sortedKeys = Array.from(groupMap.keys()).sort();
  
  console.log(`${groupBy.value}数据分组结果:`, sortedKeys);
  
  // 调试每个数据值
  const debugValues = sortedKeys.map(key => {
    const val = groupMap.get(key);
    return typeof val === 'number' ? val.toFixed(2) : '非数字:' + val;
  });
  console.log(`${groupBy.value}数据值:`, debugValues);
  
  // 如果没有数据，显示空状态
  if (sortedKeys.length === 0) {
    console.log('月度图表没有数据，显示空状态');
    monthlyChartInstance.setOption({
      title: {
        text: '消费统计',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无数据，请调整日期范围',
              fontSize: 16,
              fontWeight: 'bold',
              fill: '#999'
            }
          }
        ]
      }
    });
    return;
  }
  
  // 确保values是数字数组
  const values = sortedKeys.map(key => {
    const val = groupMap.get(key);
    return typeof val === 'number' ? val : 0;
  });
  const counts = sortedKeys.map(key => countMap.get(key) || 0);
  const formattedKeys = sortedKeys.map(key => formatGroupKey(key, groupBy.value));
  
  // 计算环比增长率
  const growthRates = sortedKeys.map((key, index) => {
    if (index === 0) return 0;
    const currentValue = groupMap.get(key) || 0;
    const prevValue = groupMap.get(sortedKeys[index - 1]) || 0;
    return prevValue === 0 ? 0 : ((currentValue - prevValue) / prevValue * 100).toFixed(2);
  });
  
  // 设置图表标题
  let chartTitle = '';
  switch(groupBy.value) {
    case 'month': chartTitle = '月度消费统计'; break;
    case 'quarter': chartTitle = '季度消费统计'; break;
    case 'year': chartTitle = '年度消费统计'; break;
    default: chartTitle = '消费统计';
  }
  
  // 设置图表选项
  const option = {
    title: {
      text: chartTitle,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    graphic: [],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const key = params[0].axisValue;
        const value = params[0].value;
        const count = counts[params[0].dataIndex];
        const growthRate = growthRates[params[0].dataIndex];
        
        let growthText = '';
        if (params[0].dataIndex > 0) {
          growthText = `环比: ${Number(growthRate) > 0 ? '+' : ''}${growthRate}%<br/>`;
        }
        
        return `<div style="font-weight:bold">${key}</div>
               消费金额: ¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}<br/>
               ${growthText}
               消费次数: ${count}次<br/>
               平均单价: ¥${count > 0 && typeof value === 'number' ? (value / count).toFixed(2) : '0.00'}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    toolbox: {
      show: true,
      feature: {
        magicType: {
          type: ['bar', 'line'],
          title: {
            bar: '切换为柱状图',
            line: '切换为折线图'
          }
        },
        restore: {
          title: '还原'
        },
        saveAsImage: {
          title: '保存为图片'
        }
      }
    },
    xAxis: {
      type: 'category',
      data: formattedKeys,
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '消费金额',
        position: 'left',
        axisLabel: {
          formatter: '¥{value}',
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#eee'
          }
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        start: Math.max(0, 100 - (600 / sortedKeys.length)),
        end: 100
      },
      {
        type: 'slider',
        start: Math.max(0, 100 - (600 / sortedKeys.length)),
        end: 100,
        height: 20,
        bottom: 0,
        borderColor: 'transparent',
        backgroundColor: '#f5f5f5',
        fillerColor: 'rgba(166, 124, 82, 0.2)',
        handleStyle: {
          color: '#a67c52'
        },
        textStyle: {
          color: '#666'
        }
      }
    ],
    series: [
      {
        name: '消费金额',
        type: 'bar',
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '¥{c}',
          fontSize: 12,
          color: '#666'
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#a67c52' },
            { offset: 1, color: '#a67c52' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7d3c98' },
              { offset: 1, color: '#a67c52' }
            ])
          }
        },
        data: values
      }
    ]
  };
  
  console.log('设置月度图表选项');
  monthlyChartInstance.setOption(option, true);
  console.log('月度图表更新完成');
}

// 调整图表大小
function resizeAllCharts() {
  if (trendChartInstance) trendChartInstance.resize();
  if (monthlyChartInstance) monthlyChartInstance.resize();
}

// 初始化图表
onMounted(() => {
  // 设置延迟，确保DOM完全渲染
  setTimeout(() => {
    // 根据当前激活的图表初始化
    if (activeChart.value === 'trend') {
      if (trendChart.value) {
        trendChartInstance = echarts.init(trendChart.value);
        updateTrendChart(getDateFilteredBills());
      }
    } else if (activeChart.value === 'monthly') {
      if (monthlyChart.value) {
        monthlyChartInstance = echarts.init(monthlyChart.value);
        updateMonthlyChart(getDateFilteredBills());
      }
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeAllCharts);
    
    // 初始更新日期范围
    updateDateRange();
  }, 500);
});

// 清理资源
onUnmounted(() => {
  window.removeEventListener('resize', resizeAllCharts);
  
  if (trendChartInstance) trendChartInstance.dispose();
  if (monthlyChartInstance) monthlyChartInstance.dispose();
});

// 当bills或filteredBills变化时，更新图表
watch([() => props.bills, () => props.filteredBills], () => {
  const filteredData = getDateFilteredBills();
  if (activeChart.value === 'trend' && trendChartInstance) {
    updateTrendChart(filteredData);
  } else if (activeChart.value === 'monthly' && monthlyChartInstance) {
    updateMonthlyChart(filteredData);
  }
}, { deep: true });
</script>

<style scoped>
.chart-container {
  margin: 20px 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
}

.chart-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.chart-tab {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  font-weight: 500;
}

.chart-tab.active {
  background-color: #a67c52;
  color: white;
}

.chart-tab:hover:not(.active) {
  background-color: #f0f0f0;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.date-range-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range-selector input, 
.group-selector select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.group-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container-inner {
  position: relative;
  height: 400px;
  width: 100%;
}

.chart {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-range-selector,
  .group-selector {
    width: 100%;
  }
}
</style>