var express = require('express');
var router = express.Router();
const { readSensorDataAndStore } = require('./recupdata');
const { InfluxDB } = require('@influxdata/influxdb-client');

const influxConfig = {
    url: 'http://localhost:8086',
    token: 'e6u708mjT23L-cxSMJcvtmzQHauLo-8ohVt6VpfU69IgW3k4wX8-fz-4h1OHIwael2rN2RnOhfWG4uVZAcgZ5Q==', 
    org: 'ensg',
    bucket: 'tsi'
};
const influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });

const subscribedProbes = new Set([27]);

router.post('/subscribe/:probeId', (req, res) => {
    const probeId = parseInt(req.params.probeId);
    subscribedProbes.add(probeId);
    res.json({ success: true, message: `已订阅探测器 ${probeId}` });
  });

router.get('/probes', (req, res) => {
  res.json(Array.from(subscribedProbes));
});

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
