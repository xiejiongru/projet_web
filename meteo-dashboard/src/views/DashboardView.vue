<template>
  <div>
    <h1>{{ selectedCity }} Weather Condition</h1>
    <div class="city-info">
      <p>
        {{ selectedStationData.latitude }} <strong>N</strong>  
        {{ selectedStationData.longitude }} <strong>W</strong>  
        {{ selectedStationData.elevation }} <strong>m</strong> 
      </p>
    </div>

    <div class="date-selector">
      <button v-for="date in dateOptions" :key="date" 
              @click="date === 'Last 7 days' || date === 'Last 30 days' ? goToHistory(date) : selectedDate = date" 
              :class="{ active: selectedDate === date }">
        {{ date }}
      </button>
    </div>

    <div class="dashboard-container">
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
          <li><strong>Temperature：</strong> {{ weatherData.temperature }} °C</li>
          <li><strong>Humidity：</strong> {{ weatherData.humidity }} %</li>
          <li><strong>Precipitation:</strong> {{ weatherData.precipitation }} mm</li>
          <li><strong>Pressure:</strong> {{ weatherData.pressure }} hPa</li>
          <li><strong>Wind speed:</strong> {{ weatherData.windSpeed }} m/s</li>
          <li><strong>Wind direction:</strong> {{ weatherData.windDirection }}</li>
          <li><strong>Luminosity:</strong> {{ weatherData.luminosity }} Lux</li>
          <li><strong>GPS location：</strong> {{ selectedStationData.latitude }}, {{ selectedStationData.longitude }}</li>
          <li><strong>Last update:</strong> {{ weatherData.lastUpdate }}</li>
        </ul>
      </div>
      <div class="map-container">
        <MapView :station="selectedStationData" />
      </div>
    </div>
  </div>
</template>

<script>
import MapView from '@/components/MapView.vue';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

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
    const dateOptions = ref(["Today", "Yesterday", "Last 7 days", "Last 30 days"]);
    const selectedDate = ref("Today");
    const weatherData = ref({
      temperature: null,
      humidity: null,
      precipitation: null,
      pressure: null,
      windSpeed: null,
      windDirection: null,
      luminosity: null,
      latitude: null,
      longitude: null,
      lastUpdate: null
    });

    const fetchWeatherData = async () => {
      try {
        const response = await api.fetchProbeData(selectedStationId.value);
        weatherData.value = {
          temperature: response.data.temperature,
          humidity: response.data.humidity,
          precipitation: response.data.precipitation,
          pressure: response.data.pressure,
          windSpeed: response.data.windSpeed,
          windDirection: response.data.windDirection,
          luminosity: response.data.luminosity,
          latitude: selectedStationData.value.latitude,
          longitude: selectedStationData.value.longitude,
          lastUpdate: new Date().toLocaleString()
        };
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      }
    };

    onMounted(() => {
      fetchWeatherData();
      setInterval(fetchWeatherData, 5000);
    });

    const updateSelectedStation = () => {
      fetchWeatherData();
    };

    const goToHistory = (dateRange) => {
      router.push({
        path: '/history',
        query: {
          stationId: selectedStationId.value,
          dateRange: dateRange
        }
      });
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
      goToHistory
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

