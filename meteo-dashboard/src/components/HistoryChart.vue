<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  props: {
    selectedDate: String, // 接收历史页面传来的日期范围
  },
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

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
            borderWidth: 2,
            fill: false,
          },
          {
            label: "Humidity (%)",
            data: labels.map(() => Math.random() * 40 + 30), // 生成随机湿度数据
            borderColor: "blue",
            borderWidth: 2,
            fill: false,
          },
          {
            label: "Precipitation (mm)",
            data: labels.map(() => Math.random() * 5), // 生成随机降水数据
            borderColor: "green",
            borderWidth: 2,
            fill: false,
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
        },
      });
    };

    watch(() => props.selectedDate, renderChart); // 监听日期变化更新图表
    onMounted(renderChart);

    return {
      chartCanvas,
    };
  },
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 600px;
  height: 400px;
  margin: auto;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
