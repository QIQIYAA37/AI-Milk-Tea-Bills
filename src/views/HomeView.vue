<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>AI智能奶茶记账</h1>
        <p>让你的奶茶消费更透明，健康管理更智能</p>
        <div class="hero-buttons">
          <router-link to="/bill" class="btn btn-primary">开始记账</router-link>
          <router-link to="/nutrition" class="btn btn-secondary">查看营养分析</router-link>
          <router-link to="/health" class="btn btn-secondary">健康管家</router-link>
        </div>
      </div>
      <div class="hero-image">
        <img src="../assets/images/milk-tea-anime.png" alt="奶茶动漫风格图片" />
      </div>
    </section>

    <section class="features">
      <h2>核心功能</h2>
      <div class="feature-cards">
        <div class="feature-card" @click="navigateToBill">
          <div class="icon">📊</div>
          <h3>智能账单管理</h3>
          <p>自动记录奶茶消费金额，支持手动录入，消费数据可视化展示</p>
        </div>
        <div class="feature-card" @click="navigateToNutrition">
          <div class="icon">🥤</div>
          <h3>AI营养分析</h3>
          <p>预置800+款奶茶成分数据库，智能匹配奶茶名称自动填充营养成分</p>
        </div>
        <div class="feature-card" @click="navigateToHealth">
          <div class="icon">🔔</div>
          <h3>健康管家</h3>
          <p>阈值预警，智能推荐，多维度健康决策</p>
        </div>
      </div>
    </section>


  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import '../assets/styles/home.css';

const router = useRouter();

// 跳转到账单管理页面
function navigateToBill() {
  router.push('/bill');
}

// 跳转到营养分析页面
function navigateToNutrition() {
  router.push('/nutrition');
}

// 跳转到健康管家页面
function navigateToHealth() {
  router.push('/health');
}
</script>

<style scoped>
/* 所有样式已移至 src/assets/styles/home.css */
</style>