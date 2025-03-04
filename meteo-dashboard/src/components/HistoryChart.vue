<template>
  <div class="chart-container">
    <!-- 温度/降水主图表 -->
    <canvas ref="mainChart"></canvas>
    
    <!-- 风向辅助图表 -->
    <div class="wind-chart-container">
      <canvas ref="windChart"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

// 风向方向映射表
const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export default {
  name: "HistoryChart",
  props: {
    selectedDate: String
  },
  setup(props) {
    const mainChart = ref(null);
    const windChart = ref(null);
    let mainChartInstance = null;
    let windChartInstance = null;

    // 生成模拟数据（含风向）
    const generateHistoricalData = () => {
      const isWeekly = props.selectedDate === "Last 7 days";
      const labels = isWeekly 
        ? Array.from({ length: 7 }, (_, i) => `Day ${i+1}`)
        : Array.from({ length: 4 }, (_, i) => `Week ${i+1}`);

      // 生成基础数据
      const baseData = labels.map(() => ({
        temp: Math.random() * 15 + 10,
        precip: Math.random() * 8
      }));

      // 计算周期极值
      const getExtremes = (data, key) => ({
        max: Math.max(...data.map(d => d[key])),
        min: Math.min(...data.map(d => d[key]))
      });

      const tempExtremes = getExtremes(baseData, 'temp');

      return {
        labels,
        tempExtremes, // 额外返回极值数据
        main: { // 用于主图表
          labels,
          datasets: [
            // 温度折线（整合极值标注）
            {
              label: "Temperature (°C)",
              data: baseData.map(d => d.temp),
              borderColor: '#FF6B6B',
              backgroundColor: '#FF6B6B',
              tension: 0.3,
              pointRadius: baseData.map(d => 
                d.temp === tempExtremes.max || d.temp === tempExtremes.min ? 6 : 3
              ),
              pointBackgroundColor: baseData.map(d => 
                d.temp === tempExtremes.max ? '#FF0000' :
                d.temp === tempExtremes.min ? '#00AAFF' : 
                'rgba(255,107,107,0.2)'
              ),
              pointBorderWidth: 2
            },
            // 降水柱状图
            {
              label: "Precipitation (mm)",
              data: baseData.map(d => d.precip),
              backgroundColor: '#4D96FF',
              type: 'bar'
            }
          ]
        },
        wind: { // 用于风向图表
          labels: windDirections,
          datasets: [
            {
              label: "Wind Direction (°)",
              data: baseData.map(() => Math.random() * 360),
              backgroundColor: 'rgba(0, 123, 255, 0.5)'
            }
          ]
        }
      };
    };

    // 创建主图表
    const createMainChart = (data) => {
      return new Chart(mainChart.value.getContext('2d'), {
        type: 'line',
        data: data.main,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index'
          },
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const value = ctx.parsed.y;
                  let label = ctx.dataset.label;
                  if (ctx.datasetIndex === 0) { // 温度数据
                    if (value === data.tempExtremes.max) {
                      label += ' (最高)';
                    } else if (value === data.tempExtremes.min) {
                      label += ' (最低)';
                    }
                  }
                  return `${label}: ${value.toFixed(1)}°C`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { text: 'Temperature (°C)', display: true }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { text: 'Precipitation (mm)', display: true },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    };

    // 创建风向图表
    const createWindChart = (data) => {
      return new Chart(windChart.value.getContext('2d'), {
        type: 'polarArea',
        data: data.wind,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const degrees = ctx.raw;
                  const dirIndex = Math.round(degrees / 45) % 8;
                  return `${windDirections[dirIndex]} (${degrees.toFixed(0)}°)`;
                }
              }
            }
          },
          scales: {
            r: {
              pointLabels: { display: false },
              ticks: { display: false }
            }
          }
        }
      });
    };

    const renderCharts = () => {
      const data = generateHistoricalData();
      if (mainChartInstance) mainChartInstance.destroy();
      if (windChartInstance) windChartInstance.destroy();

      mainChartInstance = createMainChart(data);
      windChartInstance = createWindChart(data);
    };

    watch(() => props.selectedDate, renderCharts);
    onMounted(renderCharts);
    onUnmounted(() => {
      if (mainChartInstance) mainChartInstance.destroy();
      if (windChartInstance) windChartInstance.destroy();
    });

    return { mainChart, windChart };
  }
};
</script>

<style scoped>
.chart-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  max-width: 1200px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.wind-chart-container {
  position: relative;
  height: 400px;
}
</style>
