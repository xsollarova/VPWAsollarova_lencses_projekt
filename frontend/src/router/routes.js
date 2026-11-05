const routes = [
  { path: '/', redirect: '/login' },

  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
      { path: 'register', component: () => import('@/pages/RegisterPage.vue') },
    ],
  },

  {
    path: '/chat',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@/pages/ChatPage.vue') }],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes