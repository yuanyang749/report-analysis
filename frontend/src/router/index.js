import Vue from 'vue';
import VueRouter from 'vue-router';
import ReportAnalysis from '../views/ReportAnalysis.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'ReportAnalysis',
    component: ReportAnalysis
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router; 