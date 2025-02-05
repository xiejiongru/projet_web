<template>
  <div class="map-container">
    <div id="map"></div>
  </div>
</template>

<script>
import { onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: "MapView",
  props: {
    station: Object 
  },
  setup(props) {
    let map, marker;

    onMounted(() => {

      map = L.map('map').setView([props.station.latitude, props.station.longitude], 10);


      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);


      marker = L.marker([props.station.latitude, props.station.longitude])
        .addTo(map)
        .bindPopup(props.station.name)
        .openPopup();
    });

    watch(() => props.station, (newStation) => {
      if (map && marker) {
        marker.setLatLng([newStation.latitude, newStation.longitude])
          .bindPopup(newStation.name)
          .openPopup();
        map.setView([newStation.latitude, newStation.longitude], 10);
      }
    }, { deep: true });

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
