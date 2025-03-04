<template>
  <div class="history-view">
    <div class="header">
      <h1>
        <i class="fas fa-chart-line"></i>
        {{ selectedCity }} Historical Data
      </h1>
      <div class="location-info">
        <span class="coord">
          <i class="fas fa-map-marker-alt"></i>
          {{ weatherData.latitude }}°N {{ weatherData.longitude }}°W
        </span>
        <span class="elevation">
          <i class="fas fa-mountain"></i>
          {{ weatherData.elevation }}m
        </span>
      </div>
    </div>

    <div class="controls">
      <div class="date-selector">
        <button 
          v-for="date in dateOptions" 
          :key="date" 
          @click="changeDate(date)"
          :class="{ 
            active: selectedDate === date,
            'long-range': date.includes('30 days')
          }"
        >
          <i class="fas" :class="dateIcon(date)"></i>
          {{ date }}
        </button>
      </div>
    </div>

    <HistoryChart :selectedDate="selectedDate" />
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import HistoryChart from '@/components/HistoryChart.vue';

export default {
  components: { HistoryChart },
  setup() {
    const route = useRoute();
    
    const selectedCity = ref("Paris");
    const selectedDate = ref(route.query.date || "Last 7 days");
    
    const weatherData = ref({
      latitude: 48.8566,
      longitude: 2.3522,
      elevation: 35
    });

    const tempExtremes = ref({
      max: 0,
      min: 0
    });

    const handleUpdateExtremes = (newExtremes) => {
      tempExtremes.value = newExtremes;
    };

    const dateOptions = ref([
      "Today", 
      "Yesterday", 
      "Last 7 days", 
      "Last 30 days"
    ]);

    const dateIcon = (date) => {
      const icons = {
        Today: 'fa-sun',
        Yesterday: 'fa-moon',
        'Last 7 days': 'fa-calendar-week',
        'Last 30 days': 'fa-calendar-alt'
      };
      return icons[date] || 'fa-calendar';
    };

    const changeDate = (date) => {
      selectedDate.value = date;
    };

    return {
      selectedCity,
      weatherData,
      selectedDate,
      dateOptions,
      changeDate,
      tempExtremes,
      handleUpdateExtremes,
      dateIcon
    };
  }
};
</script>

<style scoped>
.history-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.location-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  color: #6c757d;
}

.coord i, .elevation i {
  margin-right: 5px;
}

.controls {
  margin: 20px 0;
}

.date-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.date-selector button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #f8f9fa;
  color: #495057;
  transition: all 0.2s;
}

.date-selector button.active {
  background: #4D96FF;
  color: white;
}

.date-selector button.long-range {
  grid-column: span 2;
}

.date-selector button i {
  width: 20px;
}

.extremes-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-card i {
  font-size: 1.5rem;
  padding: 10px;
  border-radius: 8px;
}

.temp-max i {
  color: #FF0000;
  background: rgba(255,0,0,0.1);
}

.temp-min i {
  color: #00AAFF;
  background: rgba(0,170,255,0.1);
}

.summary-card label {
  display: block;
  color: #666;
  font-size: 0.9rem;
}
</style>