<template>
  <div class="chart-container">
    <!-- 主图表容器 -->
    <div class="main-chart">
      <canvas ref="mainChart"></canvas>
    </div>
    
    <!-- 风速图表容器 -->
    <div class="wind-chart">
      <canvas ref="windChart"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: "HistoryChart",
  props: {
    selectedDate: {
      type: String,
      default: "Last 7 days"
    }
  },
  setup(props) {
    const mainChart = ref(null);
    const windChart = ref(null);
    let mainChartInstance = null;
    let windChartInstance = null;

    const generateHistoricalData = () => {
      const isWeekly = props.selectedDate === "Last 7 days";
      const labels = isWeekly 
        ? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`)
        : Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);

      const baseData = labels.map(() => ({
        temp: Math.random() * 15 + 10,
        precip: Math.random() * 8
      }));

      const getExtremes = (data, key) => ({
        max: Math.max(...data.map(d => d[key])),
        min: Math.min(...data.map(d => d[key]))
      });
      const tempExtremes = getExtremes(baseData, 'temp');

      const windSpeedData = labels.map(() => Math.random() * 10 + 5);
      const windDirectionData = labels.map(() => Math.random() * 360);

      return {
        labels,
        tempExtremes,
        main: {
          labels,
          datasets: [
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
            {
              label: "Precipitation (mm)",
              data: baseData.map(d => d.precip),
              backgroundColor: '#4D96FF',
              type: 'bar'
            }
          ]
        },
        wind: {
          labels,
          datasets: [
            {
              label: "Wind Speed (m/s)",
              data: windSpeedData,
              borderColor: "purple",
              borderWidth: 1,
              fill: false,
              pointStyle: 'triangle',
              pointRotation: windDirectionData,
              pointRadius: 6,
              tension: 0.3
            }
          ]
        }
      };
    };

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
              title: { display: true, text: 'Temperature (°C)' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { display: true, text: 'Precipitation (mm)' },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    };

    const createWindChart = (data) => {
      return new Chart(windChart.value.getContext('2d'), {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: "Wind Speed (m/s)",
            data: data.wind.datasets[0].data,
            borderColor: "#9C27B0",
            borderWidth: 2,
            fill: false,
            pointStyle: 'triangle', // 使用三角形标记
            pointRotation: data.wind.datasets[0].pointRotation,
            pointRadius: data.wind.datasets[0].data.map(speed => 
              Math.min(8, Math.max(4, speed)) // 动态半径4-8
            ),
            pointBackgroundColor: data.wind.datasets[0].data.map(speed => 
              speed > 8 ? '#FF1744' : 
              speed > 5 ? '#FF9100' : 
              '#00E676'
            ),
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 } }
            },
            y: {
              title: { 
                display: true, 
                text: 'Wind Speed (m/s)',
                font: { size: 14 }
              },
              ticks: { stepSize: 2 }
            }
          },
          plugins: {
            legend: {
              labels: { font: { size: 14 } }
            },
            tooltip: {
              bodyFont: { size: 14 },
              callbacks: {
                label: (ctx) => {
                  const speed = ctx.parsed.y;
                  const dir = ctx.dataset.pointRotation[ctx.dataIndex];
                  return [
                    `风速: ${speed.toFixed(1)} m/s`,
                    `风向: ${getWindDirectionText(dir)} (${dir.toFixed(0)}°)`
                  ];
                }
              }
            }
          }
        }
      });
    };
    // 新增函数：根据风向角度获取文字描述
    const getWindDirectionText = (angle) => {
      const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
      const index = Math.round((angle % 360) / 45) % 8;
      return directions[index];
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
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.main-chart, .wind-chart {
  position: relative;
  height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 20px;
  transition: transform 0.3s ease;
}

.wind-chart {
  height: 350px;
  background: #f8f9fa;
}

.main-chart:hover, .wind-chart:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}
</style>
