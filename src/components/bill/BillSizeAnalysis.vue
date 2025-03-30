<template>
  <div class="analysis-container">
    <h3>奶茶规格分析</h3>
    <div ref="sizePieChart" class="chart"></div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, onMounted, onUnmounted, watch } from 'vue';
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

const props = defineProps<{
  bills: Bill[];
}>();

const sizePieChart = ref<HTMLElement | null>(null);
let sizePieChartInstance: echarts.ECharts | null = null;

// 更新规格饼图
function updateSizePieChart() {
  if (!sizePieChartInstance) {
    console.log('规格图表实例不存在，无法更新');
    return;
  }

  console.log('开始更新规格图表，账单数量:', props.bills.length);

  // 准备数据
  const sizeCountMap = new Map<string, number>();
  const sizePriceMap = new Map<string, number>();
  
  props.bills.forEach((bill: Bill) => {
    // 确保price是数字
    const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
    if (!isNaN(price)) {
      sizeCountMap.set(bill.size, (sizeCountMap.get(bill.size) || 0) + 1);
      sizePriceMap.set(bill.size, (sizePriceMap.get(bill.size) || 0) + price);
    }
  });

  // 获取所有尺寸
  const allSizes = Array.from(sizeCountMap.keys());
  
  console.log('规格类型数量:', allSizes.length);
  
  // 如果没有数据，显示空状态
  if (allSizes.length === 0) {
    console.log('规格图表没有数据，显示空状态');
    sizePieChartInstance.setOption({
      title: {
        text: '奶茶规格分析',
        left: 'center',
        top: 0,
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
              text: '暂无数据，请添加账单',
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
  
  // 饼图数据
  const pieData = allSizes.map(size => {
    const count = sizeCountMap.get(size) || 0;
    const totalPrice = sizePriceMap.get(size) || 0;
    const avgPrice = Number((totalPrice / count).toFixed(2));
    
    return {
      name: size,
      value: count,
      avgPrice: avgPrice
    };
  });
  
  // 按照数量降序排序
  pieData.sort((a, b) => b.value - a.value);
  
  console.log('规格图表数据:', pieData);
  
  // 设置颜色
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#a67c52'];
  
  // 设置图表选项
  const option = {
    title: {
      text: '奶茶规格分析',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    graphic: [],
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const item = params.data;
        return `<div style="font-weight:bold">${item.name}</div>
                购买次数: ${item.value}次 (${params.percent}%)<br/>
                平均价格: ¥${item.avgPrice}`;
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 10,
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '规格分析',
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}次 ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: pieData
      }
    ]
  };

  sizePieChartInstance.setOption(option, true);
}

// 初始化图表
onMounted(() => {
  setTimeout(() => {
    if (sizePieChart.value) {
      console.log('初始化规格饼图，DOM元素存在');
      sizePieChartInstance = echarts.init(sizePieChart.value);
      updateSizePieChart();
      
      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        sizePieChartInstance?.resize();
      });
    } else {
      console.error('规格饼图DOM元素不存在，无法初始化图表');
    }
  }, 500);
});

// 清理资源
onUnmounted(() => {
  window.removeEventListener('resize', () => {
    sizePieChartInstance?.resize();
  });
  
  if (sizePieChartInstance) {
    sizePieChartInstance.dispose();
  }
});

// 当bills变化时更新图表
watch(() => props.bills, () => {
  updateSizePieChart();
}, { deep: true });
</script>

<style scoped>
.analysis-container {
  margin-top: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.chart {
  height: 350px;
  width: 100%;
}
</style>