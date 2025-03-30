import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/bill',
      name: 'bill',
      component: () => import('../views/BillViewNew.vue')
    },
    {
      path: '/nutrition',
      name: 'nutrition',
      component: () => import('../views/NutritionView.vue')
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('../views/HealthView.vue')
    }
  ]
})

export default router