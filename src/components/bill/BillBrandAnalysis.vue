<template>
  <div class="analysis-container">
    <h3>品牌消费分析</h3>
    <div ref="brandPieChart" class="chart"></div>
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

const brandPieChart = ref<HTMLElement | null>(null);
let brandPieChartInstance: echarts.ECharts | null = null;

// 更新品牌饼图
function updateBrandPieChart() {
  if (!brandPieChartInstance) {
    console.log('品牌图表实例不存在，无法更新');
    return;
  }
  
  console.log('开始更新品牌图表，账单数量:', props.bills.length);
  
  // 准备数据
  const brandMap = new Map<string, number>();
  
  props.bills.forEach((bill: Bill) => {
    // 确保price是数字类型
    const price = typeof bill.price === 'number' ? bill.price : parseFloat(String(bill.price));
    if (!isNaN(price)) {
      brandMap.set(bill.brand, (brandMap.get(bill.brand) || 0) + price);
    }
  });
  
  // 转换为饼图数据格式
  const pieData = Array.from(brandMap.entries()).map(([brand, value]) => {
    // 确保value是数字并安全使用toFixed
    const numValue = typeof value === 'number' ? value : 0;
    return { name: brand, value: Number(numValue.toFixed(2)) };
  });
  
  // 按金额降序排列
  pieData.sort((a, b) => b.value - a.value);
  
  console.log('品牌图表数据:', pieData);
  
  // 如果没有数据，显示空状态
  if (pieData.length === 0) {
    console.log('品牌图表没有数据，显示空状态');
    brandPieChartInstance.setOption({
      title: {
        text: '品牌消费占比',
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

  // 设置饼图选项
  const option = {
    title: {
      text: '品牌消费占比',
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
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '品牌消费',
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
          formatter: '{b}: {d}%'
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
  
  brandPieChartInstance.setOption(option, true);
}

// 初始化图表
onMounted(() => {
  setTimeout(() => {
    if (brandPieChart.value) {
      console.log('初始化品牌饼图，DOM元素存在');
      brandPieChartInstance = echarts.init(brandPieChart.value);
      
      // 添加窗口大小变化时的重绘
      window.addEventListener('resize', () => {
        brandPieChartInstance?.resize();
      });
      
      updateBrandPieChart();
    } else {
      console.error('品牌饼图DOM元素不存在，无法初始化图表');
    }
  }, 500);
});

// 清理资源
onUnmounted(() => {
  // 移除resize事件
  window.removeEventListener('resize', () => {
    brandPieChartInstance?.resize();
  });
  
  if (brandPieChartInstance) {
    brandPieChartInstance.dispose();
  }
});

// 当bills变化时更新图表
watch(() => props.bills, () => {
  updateBrandPieChart();
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