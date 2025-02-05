<template>
  <div>
    <nav>
      <router-link to="/">Dashboard</router-link> |
      <router-link to="/map">Map</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
nav {
  margin-bottom: 10px;
}
nav a {
  margin: 0 10px;
  text-decoration: none;
  color: blue;
}
nav a.router-link-exact-active {
  font-weight: bold;
  color: red;
}
</style>