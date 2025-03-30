<template>
  <div class="app-container">
    <header>
      <nav class="navbar">
        <div class="logo">
          <router-link to="/">
            <span class="logo-icon">🧋</span>
            <h1>奶茶记账</h1>
          </router-link>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">首页</span>
          </router-link>
          <router-link to="/bill" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-text">账单管理</span>
          </router-link>
          <router-link to="/nutrition" class="nav-item">
            <span class="nav-icon">🥤</span>
            <span class="nav-text">营养分析</span>
          </router-link>
          <router-link to="/health" class="nav-item">
            <span class="nav-icon">❤️</span>
            <span class="nav-text">健康管家</span>
          </router-link>
        </div>
      </nav>
    </header>
  
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style>
/* 全局样式 */
:root {
  --primary-color: #a67c52;
  --primary-light: #c39b77;
  --primary-dark: #8d6845;
  --secondary-color: #f8f9fa;
  --text-color: #333;
  --text-light: #666;
  --white: #ffffff;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 8px 15px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: #f5f7fa;
  background-image: url('./assets/images/bubble-tea-bg.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  background-position: center center;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 导航栏样式 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%);
  padding: 0.8rem 2rem;
  box-shadow: var(--shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
}

.logo a {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--white);
}

.logo-icon {
  font-size: 1.8rem;
  margin-right: 0.5rem;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.nav-icon {
  font-size: 1.4rem;
  margin-bottom: 0.2rem;
}

.nav-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-item:hover,
.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--white);
  transform: translateY(-2px);
}

/* 主要内容区域样式 */
main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  margin-top: 80px; /* 为固定导航栏留出空间 */
}



/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    padding: 0.8rem 1rem;
  }
  
  .logo {
    margin-bottom: 0.8rem;
  }
  
  .nav-links {
    width: 100%;
    justify-content: space-around;
  }
  
  .nav-item {
    padding: 0.5rem;
  }
  
  main {
    padding: 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .footer-links {
    justify-content: center;
  }
}
</style>