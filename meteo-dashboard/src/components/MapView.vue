<template>
  <div class="map-container">
    <div id="map"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: "MapView",
  props: {
    station: Object 
  },
  data() {
    return {
      map: null,
      marker: null,
    };
  },
  mounted() {
    // 在 setup 函数顶部添加
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    if (!this.station) return; // 防止未传入 station 时出错
    this.map = L.map('map').setView([this.station.latitude, this.station.longitude], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([this.station.latitude, this.station.longitude])
      .addTo(this.map)
      .bindPopup(this.station.name)
      .openPopup();

    this.marker.on('click', () => {
      this.$emit('marker-click', {
        id: this.station.id,
        temp: this.station.data.temperature 
      });
    });
  },
  watch: {
    station: {
      handler(newStation) {
        if (this.map && this.marker) {
          this.marker.setLatLng([newStation.latitude, newStation.longitude])
            .bindPopup(newStation.name)
            .openPopup();
          this.map.setView([newStation.latitude, newStation.longitude], 10);
        }
      },
      deep: true
    }
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
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