import axios from 'axios';

const API_BASE = 'http://localhost:3000/api'; // 假设后端运行在3000端口

export default {
  // 获取探测器数据
  fetchProbeData(probeId) {
    return axios.get(`${API_BASE}/data?probeId=${probeId}`);
  },
  
  // 订阅探测器
  subscribeProbe(probeId) {
    return axios.post(`${API_BASE}/subscribe/${probeId}`);
  }
};