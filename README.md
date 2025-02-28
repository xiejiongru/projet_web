# Weather Station Project 🌦️  
**Smart Weather Station System - Frontend & Data Visualization Solution**  

![Project Screenshot](screenshot.png) *(Replace with actual screenshot)*

## Table of Contents
- [Weather Station Project 🌦️](#weather-station-project-️)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Current Progress](#current-progress)
  - [Features](#features)
    - [Implemented](#implemented)
    - [Roadmap](#roadmap)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [Quick Start](#quick-start)
    - [Tools](#tools)
  - [Quick Start](#quick-start-1)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Configuration](#configuration)
      - [Create .env files:](#create-env-files)
      - [Launch Commands](#launch-commands)
    - [Project Structure](#project-structure)
    - [API Documentation](#api-documentation)
      - [Example request:](#example-request)
    - [License｜ MIT License](#license-mit-license)
    - [Team｜ Roman Coin \& XIE Jiongru @TSI-C 2024](#team-roman-coin--xie-jiongru-tsi-c-2024)

## Project Overview
A distributed weather monitoring system consisting of:
- Sensor nodes (Sonde)
- Central station (Centrale)

Key functionalities:
- Real-time data collection
- Data storage
- Visualization

Built with:
- Frontend: Vue.js dashboard
- Backend: Node.js/Express.js processing

## Current Progress
- [x] Frontend Base Framework (Vue 3)
- [x] Real-time Data Cards
- [x] Historical Charts (Chart.js)
- [x] Map Integration (Leaflet)
- [ ] User Subscription (WebSocket)
- [ ] Multi-sensor Comparison Mode
- [ ] Backend Data Aggregation
- [ ] InfluxDB Query Optimization

## Features
### Implemented
- Real-time weather data display (Temp/Humidity/Wind/etc)
- Interactive historical line charts (24h/7d/1m ranges)
- Sensor geolocation visualization (Leaflet maps)
- Responsive layout (Mobile/Tablet/Desktop)

### Roadmap
- [ ] Customizable Dashboard Layout
- [ ] Data Anomaly Alerts
- [ ] Multi-language Support
- [ ] CSV/JSON Data Export

## Tech Stack
### Frontend
![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vuedotjs)  
![Chart.js](https://img.shields.io/badge/Chart.js-3.x-FF6384?logo=chartdotjs)  
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)

### Backend
![Node.js](https://im

## Quick Start

### Tools
![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?logo=vite)  
![Swagger](https://img.shields.io/badge/Swagger-3.0-85EA2D?logo=swagger)

## Quick Start
### Prerequisites
- Raspberry Pi 4B+ (Recommended)
- Node.js ≥18.x
- InfluxDB ≥2.7

### Installation
```bash
# Clone repo
git clone https://github.com/xiejiongru/projet_web.git

# Install frontend deps
cd frontend
npm install

# Install backend deps
cd ../backend
npm install
```

### Configuration
#### Create .env files:
```ini
# Frontend (frontend/.env)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=your_mapbox_token

# Backend (backend/.env)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
FAKE_SONDE=true  # Enable mock data mode
```

#### Launch Commands
```bash
# Frontend dev server
cd frontend
npm run dev

# Backend service
cd ../backend
npm start

# Access points
http://localhost:5173  # Frontend
http://localhost:3000/api-docs  # Swagger UI
```
### Project Structure
```bash
.
├── frontend
│   ├── public/            # Static assets
│   ├── src
│   │   ├── assets/        # Styles/icons
│   │   ├── components/    # Vue components
│   │   │   ├── Dashboard/
│   │   │   ├── Charts/
│   │   │   └── Map/
│   │   ├── stores/        # Pinia store
│   │   └── router/        # Vue Router
│   └── vite.config.js
│
├── backend
│   ├── routes/            # API endpoints
│   │   ├── sensors.js
│   │   └── weather.js
│   ├── utils/             # Data processors
│   ├── influxdb.js        # DB connection
│   └── app.js             # Express entry
│
└── docs
    └── api-spec.yml       # OpenAPI spec
```
### API Documentation
We maintain API docs using Swagger UI:
http://localhost:3000/api-docs

#### Example request:
```javascript
// Get latest sensor data
fetch('/api/sensors/latest')
  .then(response => response.json())
  .then(data => {
    console.log('Current temperature:', data.temperature);
  });
```
#### Docker:
```bash
sudo docker stop influxdb
sudo docker rm influxdb
sudo docker volume rm influxdb_data

sudo docker run -d --name influxdb -p 8086:8086 -v influxdb_data:/var/lib/influxdb2 -e INFLUXDB_DB=mydb -e INFLUXDB_ADMIN_USER=admin -e INFLUXDB_ADMIN_PASSWORD=adminpassword influxdb:latest
```

### License｜ MIT License
### Team｜ Romain Coin & XIE Jiongru @TSI-C 2024
