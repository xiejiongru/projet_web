<template>
  <div class="map-container">
    <div id="map"></div>
  </div>
</template>

<script>
import { onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: "MapView",
  props: {
    station: Object 
  },
  setup(props) {
    let map, marker;

    // 在 setup 函数顶部添加
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    onMounted(() => {
      if (!props.station) return; // 防止未传入 station 时出错
      map = L.map('map').setView([props.station.latitude, props.station.longitude], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      marker = L.marker([props.station.latitude, props.station.longitude])
        .addTo(map)
        .bindPopup(props.station.name)
        .openPopup();
    });

    onUnmounted(() => {
      if (map) {
        map.remove();
      }
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

#map {
  width: 100%;
  height: 100%;
}
</style>
