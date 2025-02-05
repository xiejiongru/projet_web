import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import MapView from "@/components/MapView.vue";

const routes = [
  { path: "/", component: DashboardView },
  { path: "/map", component: MapView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;