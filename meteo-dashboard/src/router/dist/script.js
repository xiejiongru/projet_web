document.addEventListener('DOMContentLoaded', function () {
    const cityTitle = document.getElementById('cityTitle');
    const stationInfo = document.getElementById('stationInfo');
    const weatherDataElements = {
        temperature: document.getElementById('temperature'),
        humidity: document.getElementById('humidity'),
        precipitation: document.getElementById('precipitation'),
        pressure: document.getElementById('pressure'),
        windSpeed: document.getElementById('windSpeed'),
        windDirection: document.getElementById('windDirection'),
        luminosity: document.getElementById('luminosity'),
        latitude: document.getElementById('latitude'),
        longitude: document.getElementById('longitude'),
        lastUpdate: document.getElementById('lastUpdate')
    };
    const stationSelect = document.getElementById('station-select');
    const dateButtons = document.querySelectorAll('.date-btn');
    const mapContainer = document.getElementById('mapContainer');

    // Initialiser la carte Leaflet
    const map = L.map('mapContainer').setView([48.8566, 2.3522], 13); // Paris par défaut

    // Ajouter une couche de tuiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


    const weatherStations = [
        { id: 1, name: "Paris Station", latitude: 48.8566, longitude: 2.3522, elevation: 35 },
        { id: 2, name: "Lyon Station", latitude: 45.764, longitude: 4.8357, elevation: 173 },
        { id: 3, name: "Marseille Station", latitude: 43.2965, longitude: 5.3698, elevation: 25 }
    ];

    let selectedStationId = 1;
    let selectedDate = 'Today';

    const fetchWeatherData = () => {
        const selectedStation = weatherStations.find(station => station.id === selectedStationId);
        const apiResponse = {
            temperature: 22.5,
            humidity: 65,
            precipitation: 3.2,
            pressure: 1013,
            windSpeed: 5.2,
            windDirection: "NE",
            luminosity: 1473,
            latitude: selectedStation.latitude,
            longitude: selectedStation.longitude,
            lastUpdate: new Date().toLocaleString()
        };

        cityTitle.textContent = `${selectedStation.name.split(' ')[0]} Weather Condition`;
        stationInfo.textContent = `${selectedStation.latitude} <strong>N</strong> ${selectedStation.longitude} <strong>W</strong> ${selectedStation.elevation} <strong>m</strong>`;

        for (const key in weatherDataElements) {
            weatherDataElements[key].innerHTML = apiResponse[key];
        }

        // Simulate MapView (replace with your map logic)
        mapContainer.innerHTML = `<p>Map for ${selectedStation.name} will be loaded here.</p>`;
        // Afficher un marqueur pour la station météo
        const marker = L.marker([apiResponse.latitude, apiResponse.longitude]).addTo(map);
        marker.bindPopup(`<b>${selectedStation.name}</b>`).openPopup();

        // Centrer la carte sur le marqueur
        map.setView([apiResponse.latitude, apiResponse.longitude], 13);
    };

    stationSelect.addEventListener('change', function () {
        selectedStationId = parseInt(this.value);
        fetchWeatherData();
    });

    dateButtons.forEach(button => {
        button.addEventListener('click', function () {
            dateButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedDate = this.dataset.date;
            if (selectedDate === 'Last 7 days' || selectedDate === 'Last 30 days') {
                // Simulate navigation to history page
                alert('Navigating to history page for ' + selectedDate);
            }
        });
    });

    fetchWeatherData();
});