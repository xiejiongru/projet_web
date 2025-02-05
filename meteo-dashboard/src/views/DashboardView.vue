<!-- src/views/DashboardView.vue -->
<template>
  <div>
    <h1>DashboardView</h1>
    <div style="width: 100%; height: 500px;">
      <MapView />
    </div>
  </div>
</template>


<script>
import MapView from '@/components/MapView.vue';

export default {
  name: "DashboardView",
  components: { MapView }
};
</script>
  

