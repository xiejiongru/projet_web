<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
    <button @click="setQuickRange('1h')">最近1小时</button>
    <button @click="setQuickRange('24h')">最近24小时</button>
  </div>
</template>

<script>
import { ref } from 'vue';
import Chart from 'chart.js/auto';
import { useWeatherStore } from '@/stores/weather'; 
import {watch, onMounted, onUnmounted} from 'vue';

export default {
  props: {
    selectedDate: String, // 接收历史页面传来的日期范围
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;
    const weatherStore = useWeatherStore(); // 使用 Pinia store

    // 生成历史气候数据
    const generateHistoricalData = () => {
      const labels = props.selectedDate === "Last 7 days"
        ? ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
        : ["Week 1", "Week 2", "Week 3", "Week 4"];

      return {
        labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: labels.map(() => Math.random() * 10 + 10), // 生成随机温度数据
            borderColor: "red",
            borderWidth: 1,
            fill: false,
          },
          // {
          //   label: "Humidity (%)",
          //   data: labels.map(() => Math.random() * 40 + 30), // 生成随机湿度数据
          //   borderColor: "blue",
          //   borderWidth: 2,
          //   fill: false,
          // },
          {
            label: "Precipitation (mm)",
            data: labels.map(() => Math.random() * 5), // 生成随机降水数据
            borderColor: "blue",
            borderWidth: 1,
            fill: true,
          },
        ],
      };
    };

    // 渲染折线图
    const renderChart = () => {
      if (chartInstance) {
        chartInstance.destroy(); // 销毁旧图表，防止重复渲染
      }

      const ctx = chartCanvas.value.getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "line",
        data: generateHistoricalData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              enabled: true,
            },
          },
        },
      });
    };

    watch(() => props.selectedDate, renderChart); // 监听日期变化更新图表
    onMounted(renderChart);
    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    });


    const setQuickRange = (range) => {
      const now = new Date();
      switch(range) {
        case '1h': 
          weatherStore.startDate = new Date(now - 3600*1000);
          break;
        case '24h':
          weatherStore.startDate = new Date(now - 86400*1000);
      }
    };

    return {
      chartCanvas,
      setQuickRange, // 返回 setQuickRange 函数
    };
  },
};

</script>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 800px;
  height: 400px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
