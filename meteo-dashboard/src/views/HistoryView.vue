<template>
    <div>
      <h1>{{ selectedCity }} Weather Condition</h1>
  
      <div class="city-info">
        <p>
          {{ weatherData.latitude }} <strong>N</strong>  
          {{ weatherData.longitude }} <strong>W</strong>  
          {{ weatherData.elevation }} <strong>m</strong> 
        </p>
      </div>
  
      <!-- 日期选择栏 -->
      <div class="date-selector">
        <button v-for="date in dateOptions" :key="date" @click="changeDate(date)" 
                :class="{ active: selectedDate === date }">
          {{ date }}
        </button>
      </div>
  
      <!-- 这里加载 HistoryChart 组件 -->
      <HistoryChart :selectedDate="selectedDate" />
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';  // Only import what you actually need
  import { useRoute } from 'vue-router';
  import HistoryChart from '@/components/HistoryChart.vue'; // 引入 HistoryChart 组件
  
  export default {
    components: {
      HistoryChart,
    },
    setup() {
      const route = useRoute();
  
      // 获取主页传来的参数
      const selectedCity = ref("Paris");
      const selectedDate = ref(route.query.date || "Last 7 days"); // 默认从主页接收时间范围
  
      const weatherData = ref({
        latitude: 48.8566,
        longitude: 2.3522,
        elevation: 35,
      });
  
      const dateOptions = ref(["Today", "Yesterday", "Last 7 days", "Last 30 days"]);
  
      // 切换日期
      const changeDate = (date) => {
        selectedDate.value = date;
      };
  
      return {
        selectedCity,
        weatherData,
        selectedDate,
        dateOptions,
        changeDate,
      };
    },
  };
  </script>
  
  <style scoped>
  .date-selector {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  
  .date-selector button {
    margin: 0 10px;
    padding: 10px 15px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    background: lightgray;
    border-radius: 5px;
  }
  
  .date-selector button.active {
    background: blue;
    color: white;
  }
  </style>
  