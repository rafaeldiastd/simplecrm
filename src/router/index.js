import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        component: () => import('@/layouts/DashboardLayout.vue'),
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () => import('@/views/DashboardView.vue'),
            },
            {
                path: 'leads',
                name: 'leads',
                component: () => import('@/views/LeadsView.vue'),
            },
            {
                path: 'forms',
                name: 'forms',
                component: () => import('@/views/MyFormsView.vue'),
            },
            {
                path: 'builder/:id?',
                name: 'builder',
                component: () => import('@/views/FormBuilderView.vue'),
            },
            {
                path: 'settings',
                name: 'settings',
                component: () => import('@/views/SettingsView.vue'),
            },
        ],
    },
    {
        path: '/form/:id',
        name: 'public-form',
        component: () => import('@/views/PublicFormView.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
