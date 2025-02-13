const express = require('express');
const router = express.Router();

// Handle GET /data/:coordinates request
router.get('/:coordinates', (req, res) => {
    const coordinates = req.params.coordinates.split(',');
    const [lat1, lon1, lat2, lon2] = coordinates.map(parseFloat);

    // Add logic to process weather data here
    // For example, fetch data from a database or another API

    // Example: Return mock weather data
    const weatherData = {
        temperature: 25.3,
        humidity: 60,
        windSpeed: 5.4,
        coordinates: {
            lat1,
            lon1,
            lat2,
            lon2
        }
    };

    res.json(weatherData);
});

module.exports = router;