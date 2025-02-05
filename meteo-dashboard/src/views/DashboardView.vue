<!-- src/views/DashboardView.vue -->
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

    <div class="date-selector">
      <button v-for="date in dateOptions" :key="date" 
              @click="date === 'Last 7 days' || date === 'Last 30 days' ? goToHistory(date) : selectedDate = date" 
              :class="{ active: selectedDate === date }">
        {{ date }}
      </button>
    </div>
  </div>

  <div class="dashboard-container">
    <!-- 左侧气象数据 -->
    <div class="weather-info">
      <h2>Weather Data</h2>

      <div class="weather-station">
        <label for="station-select"><strong>Select Weather Station:</strong></label>
        <select id="station-select" v-model="selectedStation" @change="updateWeatherData">
          <option v-for="station in weatherStations" :key="station.id" :value="station.name">
            {{ station.name }}
          </option>
        </select>
      </div>

      <ul>
        <li><strong>Temperature：</strong> {{ weatherData.temperature }} °C</li>
        <li><strong>Humidity：</strong> {{ weatherData.humidity }} %</li>
        <li><strong>Precipitation:</strong> {{ weatherData.precipitation }} mm</li>
        <li><strong>Pressure:</strong> {{ weatherData.pressure }} hPa</li>
        <li><strong>Wind speed:</strong> {{ weatherData.windSpeed }} m/s</li>
        <li><strong>Wind direction:</strong> {{ weatherData.windDirection }}</li>
        <li><strong>GPS location：</strong> {{ weatherData.latitude }}, {{ weatherData.longitude }}</li>
        <li><strong>Last update:</strong> {{ weatherData.lastUpdate }}</li>
      </ul>
    </div>

    <!-- 右侧地图 -->
    <div class="map-container">
      <MapView />
    </div>
  </div>
</template>

<script>
import MapView from '@/components/MapView.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';


export default {
  components: {
    MapView
  },
  setup() {
    const router = useRouter();

    // 默认选中的城市
    const selectedCity = ref("Paris");

    // 定义气象站数据
    const weatherStations = ref([
      { id: 1, name: "Paris Station", latitude: 48.8566, longitude: 2.3522, elevation: 35 },
      { id: 2, name: "Lyon Station", latitude: 45.764, longitude: 4.8357, elevation: 173 },
      { id: 3, name: "Marseille Station", latitude: 43.2965, longitude: 5.3698, elevation: 25 }
    ]);

    const selectedStation = ref(weatherStations.value[0].name);

    // 日期选择
    const dateOptions = ref(["Today", "Yesterday",  "Last 7 days", "Last 30 days"]);
    const selectedDate = ref("Today");

    // 定义气象数据
    const weatherData = ref({
      temperature: null,
      humidity: null,
      precipitation: null,
      pressure: null,
      windSpeed: null,
      windDirection: null,
      latitude: null,
      longitude: null,
      lastUpdate: null
    });

    // 模拟获取气象数据（之后可以改成API请求）
    const fetchWeatherData = () => {
      weatherData.value = {
        temperature: 22.5,  // °C
        humidity: 65,       // %
        precipitation: 3.2, // mm
        pressure: 1013,     // hPa
        windSpeed: 5.2,     // m/s
        windDirection: "NE",
        latitude: 48.8566,
        longitude: 2.3522,
        lastUpdate: new Date().toLocaleString()
      };
    };

    onMounted(fetchWeatherData);
    selectedStation.value = weatherStations.value[0].name;
    fetchWeatherData();

    // 监听下拉框的变化
    const updateWeatherData = () => {
      fetchWeatherData();
    };

    // 进入历史页面（后面再做）
    const goToHistory = () => {
      router.push('/history');
    };

    return { selectedCity, weatherData, selectedStation, weatherStations, updateWeatherData, dateOptions, selectedDate, goToHistory };
  }
};
</script>
  

<style scoped>
/* 布局 */
.dashboard-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
}

/* 左侧气象数据框 */
.weather-info {
  flex: 1;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  max-width: 400px;
}

.weather-info h2 {
  margin-bottom: 10px;
}

.weather-info ul {
  list-style: none;
  padding: 0;
}

.weather-info li {
  margin-bottom: 5px;
}

/* 选择气象站 */
.weather-station {
  margin-bottom: 10px;
}

.weather-station select {
  padding: 5px;
  font-size: 14px;
}

/* 右侧地图 */
.map-container {
  flex: 2;
  background: #ddd;
  border-radius: 8px;
  height: 400px;
}

/* 日期选择按钮 */
.date-selector {
  margin-top: 10px;
}

.date-selector button {
  margin-right: 10px;
  padding: 8px 12px;
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

