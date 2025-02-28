// 在weather.js中修改
export const useWeatherStore = defineStore('weather', {
  state: () => ({
    influxToken: 'my-super-secret-auth-token',
    baseURL: 'http://localhost:8086/api/v2',
    // ...其他状态
  }),
  actions: {
    async fetchData(query) {
      const response = await fetch(`${this.baseURL}/query?org=ensg`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.influxToken}`,
          'Content-Type': 'application/vnd.flux'
        },
        body: query
      });
      return this.parseFluxResponse(await response.text());
    },
    parseFluxResponse(csvData) {
      // 实现CSV到JSON的转换逻辑
    }
  }
})