import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import MapView from "@/components/MapView.vue";
import HistoryView from "@/views/HistoryView.vue";
import HistoryChart from "@/components/HistoryChart.vue";

const routes = [
  { path: "/", component: DashboardView },
  { path: "/map", component: MapView },
  { path: "/history", component: HistoryView },
  { path: "/chart", component: HistoryChart }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;