var express = require('express');
var router = express.Router();
const { readSensorDataAndStore } = require('../recupdata'); // Corrige l'import

const { InfluxDB } = require('@influxdata/influxdb-client');
const influxConfig = {
    url: 'http://localhost:8086',
    token: 'LSg1A6kR8GFf-aVlmcl_CZcPRwW9FZ-TwKpd8YXUAsOhLRDCnEBQzRy9F6UcGl0N0AzgU5A5d16_JmouvzBg6A==', 
    org: 'ensg',
    bucket: 'tsi'
};
const influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });

router.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
});

router.get('/collect', (req, res) => {
    readSensorDataAndStore();
    res.json({ message: '🔄 Données récupérées et stockées dans InfluxDB' });
});

router.get('/data', async (req, res) => {
    const queryApi = influxClient.getQueryApi(influxConfig.org);
    const query = `from(bucket: "${influxConfig.bucket}") |> range(start: -1h)`;

    let result = [];
    queryApi.queryRows(query, {
        next(row, tableMeta) {
            result.push(tableMeta.toObject(row));
        },
        complete() {
            res.json(result);
        },
        error(error) {
            console.error(error);
            res.status(500).send(error);
        }
    });
});

module.exports = router;
