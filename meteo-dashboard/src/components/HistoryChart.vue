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
  props: ['selectedDate'],
  setup(props) {
    const mainChart = ref(null);
    const windChart = ref(null);
    let mainChartInstance = null;
    let windChartInstance = null;

    // 生成模拟数据（含风向）
    const generateHistoricalData = () => {
      const isWeekly = props.selectedDate === "Last 7 days";
      const labels = isWeekly 
        ? Array.from({length: 7}, (_, i) => `Day ${i+1}`)
        : Array.from({length: 4}, (_, i) => `Week ${i+1}`);

      return {
        main: {
          labels,
          datasets: [
            {
              label: "Temperature (°C)",
              data: labels.map(() => Math.random() * 15 + 10),
              borderColor: '#FF6B6B',
              backgroundColor: 'rgba(255,107,107,0.2)',
              yAxisID: 'y',
              tension: 0.3
            },
            {
              label: "Precipitation (mm)",
              data: labels.map(() => Math.random() * 8),
              backgroundColor: '#4D96FF',
              yAxisID: 'y1',
              type: 'bar'
            }
          ]
        },
        wind: {
          labels,
          datasets: [{
            label: "Wind Direction",
            data: labels.map(() => Math.floor(Math.random() * 360)),
            backgroundColor: labels.map(() => 
              `hsl(${Math.random() * 360}, 70%, 50%)`
            ),
            type: 'polarArea',
            borderWidth: 1
          }]
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
                  let label = ctx.dataset.label || '';
                  if (label) label += ': ';
                  if (ctx.parsed.y !== null) {
                    label += ctx.dataset.type === 'bar' 
                      ? `${ctx.parsed.y} mm`
                      : `${ctx.parsed.y.toFixed(1)}°C`;
                  }
                  return label;
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