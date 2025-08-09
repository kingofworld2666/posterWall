import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/recommend',
      name: 'recommend',
      component: () => import('../views/RecommendView.vue')
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue')
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('../views/DetailView.vue')
    },
    {
      path: '/play/:id',
      name: 'play',
      component: () => import('../views/PlayView.vue')
    },
    {
      path: '/actors',
      name: 'actors',
      component: () => import('../views/ActorsView.vue')
    },
    {
      path: '/actor/:id',
      name: 'actorDetail',
      component: () => import('../views/ActorDetailView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/favorite',
      name: 'favorite',
      component: () => import('../views/FavoriteView.vue')
    },
    {
      path: '/favorite-actors',
      name: 'favoriteActors',
      component: () => import('../views/FavoriteActorsView.vue')
    },
    {
      path: '/crawler',
      name: 'crawler',
      component: () => import('../views/CrawlerView.vue')
    }
  ]
})

export default router
