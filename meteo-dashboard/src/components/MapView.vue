<template>
    <div class="map-container">
      <div id="map"></div>
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  
  export default {
    name: "MapView",
    setup() {
      onMounted(() => {
        const map = L.map('map').setView([48.8566, 2.3522], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
      });
  
      return {};
    }
  };
  </script>
  
  
  <style scoped>
  .map-container {
    width: 100%;
    height: 500px;
  }
  
  #map {
    width: 100%;
    height: 100%;
  }
  </style>
  