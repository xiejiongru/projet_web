<template>
  <div>

    <div class="city-info">
      <h1>
        <i :class="`fas fa-${weatherStatus}`"></i>
        {{ selectedCity }} Weather Condition
      </h1>
    </div>

    <div class="date-selector">
      <button v-for="date in dateOptions" :key="date" 
              @click="date === 'Last 7 days' || date === 'Last 30 days' ? goToHistory(date) : selectedDate = date" 
              :class="{ active: selectedDate === date }">
        {{ date }}
      </button>
    </div>
  </div>
  
  <div class="weather-card">
  <div class="card-content">
    
  <div class="dashboard-container">
    <!-- 左侧气象数据 -->
    <div class="weather-info">
      <h2>Weather Data</h2>

      <div class="weather-station">
        <label for="station-select"><strong>Select Weather Station:</strong></label>
        <select id="station-select" v-model="selectedStationId" @change="updateSelectedStation">
          <option v-for="station in weatherStations" :key="station.id" :value="station.id">
            {{ station.name }}
          </option>
        </select>
      </div>

      <ul>
        <li>
          <i class="fas fa-thermometer-half"></i>
          <strong>Temperature：</strong> {{ weatherData.temperature }} °C
        </li>
        <li>
          <i class="fas fa-tint"></i>
          <strong>Humidity：</strong> {{ weatherData.humidity }} %
        </li>
        <li>
          <i class="fas fa-cloud-rain"></i>
          <strong>Precipitation:</strong> {{ weatherData.precipitation }} mm
        </li>
        <li>
          <i class="fas fa-tachometer-alt"></i>
          <strong>Pressure:</strong> {{ weatherData.pressure }} hPa
        </li>
        <li>
          <i class="fas fa-wind"></i>
          <strong>Wind speed:</strong> {{ weatherData.windSpeed }} m/s
        </li>
        <li>
          <i class="fas fa-arrow-circle-up"></i>
          <strong>Wind direction:</strong> {{ weatherData.windDirection }}
        </li>
        <li>
          <i class="fas fa-sun"></i>
          <strong>Luminosity:</strong> {{ weatherData.luminosity }} Lux
        </li>
        <li>
          <i class="fas fa-map-marker-alt"></i>
          <strong>GPS location：</strong> {{ selectedStationData.latitude }}, {{ selectedStationData.longitude }}
        </li>
        <li>
          <i class="fas fa-clock"></i>
          <strong>Last update:</strong> {{ weatherData.lastUpdate }}
        </li>
      </ul>
    </div>

    <!-- 右侧地图 -->
    <div class="map-container">
      <MapView :station="selectedStationData" />
    </div>
  </div>
  </div> <!-- 添加闭合标签 -->
  </div> <!-- 添加闭合标签 -->
</template>

<script>
import MapView from '@/components/MapView.vue';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  components: {
    MapView
  },
  setup() {
    const router = useRouter();

    const selectedCity = ref("Paris");

    const weatherStations = ref([
      { id: 1, name: "Paris Station", latitude: 48.8566, longitude: 2.3522, elevation: 35 },
      { id: 2, name: "Lyon Station", latitude: 45.764, longitude: 4.8357, elevation: 173 },
      { id: 3, name: "Marseille Station", latitude: 43.2965, longitude: 5.3698, elevation: 25 }
    ]);

    const selectedStationId = ref(weatherStations.value[0].id);

    const selectedStationData = computed(() => {
      return weatherStations.value.find(station => station.id === selectedStationId.value) || weatherStations.value[0];
    });

    const weatherStatus = computed(() => {
      if (weatherData.value.precipitation > 5) return 'cloud-showers-heavy'
      if (weatherData.value.luminosity > 2000) return 'sun'
      return 'cloud'
    });

    const dateOptions = ref(["Today", "Yesterday", "Last 7 days", "Last 30 days"]);
    const selectedDate = ref("Today");

    const weatherData = ref({
      temperature: null,
      humidity: null,
      precipitation: null,
      pressure: null,
      windSpeed: null,
      windDirection: null,
      luminosity: null, // 新增光照度
      latitude: null,
      longitude: null,
      lastUpdate: null
    });

    const fetchWeatherData = () => {
      // 假设从API获取数据
      const apiResponse = {
        temperature: 22.5,  
        humidity: 65,       
        precipitation: 3.2, 
        pressure: 1013,     
        windSpeed: 5.2,     
        windDirection: "NE",
        luminosity: 1473,  // 光照度数据
        latitude: selectedStationData.value.latitude,
        longitude: selectedStationData.value.longitude,
        lastUpdate: new Date().toLocaleString()
      };

      weatherData.value = apiResponse;
    };

    onMounted(fetchWeatherData);

    const updateSelectedStation = () => {
      fetchWeatherData();
    };

    const goToHistory = () => {
      router.push('/history');
    };

    return {
      selectedCity,
      weatherData,
      selectedStationId,
      selectedStationData,
      weatherStations,
      updateSelectedStation,
      dateOptions,
      selectedDate,
      goToHistory,
      weatherStatus // 确保 weatherStatus 被返回
    };
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.weather-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
}

.card-header {
  border-bottom: 2px solid #eee;
  margin-bottom: 15px;
  padding-bottom: 10px;
}

.card-header h2 {
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
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
