const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const nmea = require('node-nmea');

// Configuration InfluxDB
const influxConfig = {
    url: 'http://localhost:8086',
    token: 'LSg1A6kR8GFf-aVlmcl_CZcPRwW9FZ-TwKpd8YXUAsOhLRDCnEBQzRy9F6UcGl0N0AzgU5A5d16_JmouvzBg6A==',
    org: 'ensg',
    bucket: 'tsi'
};

const influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });
const writeApi = influxClient.getWriteApi(influxConfig.org, influxConfig.bucket);
writeApi.useDefaultTags({ host: 'local' });

let collectedData = {
    id: 27,
    data: {},
    filesProcessed: 0
};

const files = [
    '/dev/shm/gpsNmea',
    '/dev/shm/sensors',
    '/dev/shm/rainCounter.log',
    '/dev/shm/tph.log'
];

function readSensorDataAndStore() {
    files.forEach(file => readFileAndStore(file));
}

function readFileAndStore(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`❌ Erreur lecture ${filePath}:`, err);
            return;
        }

        console.log(`📂 Fichier ${filePath} lu.`);
        try {
            const parsedData = parseData(filePath, data.trim());
            if (parsedData) {
                collectedData.data = { ...collectedData.data, ...parsedData };
                collectedData.filesProcessed++;

                if (collectedData.filesProcessed === files.length) {
                    console.log(collectedData);
                    storeData(collectedData);
                }
            }
        } catch (error) {
            console.error(`❌ Erreur parsing ${filePath}:`, error);
        }
    });
}

function convertDMMtoDD(coord, direction) {
    let match = coord.match(/^([0-9]+)([0-9]{2}\.\d+)$/);
    if (!match) {
        console.error("Format incorrect :", coord);
        return null;
    }
    let degrees = parseInt(match[1], 10);
    let minutes = parseFloat(match[2]);
    let decimal = degrees + (minutes / 60);
    return (direction === 'S' || direction === 'W') ? -decimal : decimal;
}

function parseData(filePath, data) {
    if (!data) {
        console.warn(`⚠️ Données vides pour ${filePath}, ignorées.`);
        return null;
    }

    try {
        let parsedData = {};

        switch (filePath) {
            case '/dev/shm/gpsNmea': {
                const nmeaLines = data.split("\n");
                const json = nmea.parse(nmeaLines[1]);

                console.log(json);
                const info_lat = json.loc.dmm.latitude.split(",");
                const info_long = json.loc.dmm.longitude.split(",");

                parsedData = {
                    latitude: convertDMMtoDD(info_lat[0], info_lat[1]),
                    longitude: convertDMMtoDD(info_long[0], info_long[1])
                };
                break;
            }
            case '/dev/shm/sensors': {

                const json = JSON.parse(data);
                parsedData.date = json.date;
                json.measure.forEach(measure => {
                    parsedData[measure.name] = parseFloat(measure.value);

                });

                break;
            }
            case '/dev/shm/rainCounter.log': {
                parsedData["raindate"] = data;

                break;
            }
            case '/dev/shm/tph.log': {
                const json = JSON.parse(data);
                parsedData = { date: json.date, temp: json.temp, hygro: json.hygro, press: json.press };

                break;
            }
            default:
                console.warn(`⚠️ Fichier non reconnu : ${filePath}`);
                return null;
        }

        return parsedData;
    } catch (error) {
        console.error(`❌ Erreur parsing ${filePath}:`, error.message);
        return null;
    }
}

function storeData(data) {
    const point = new Point('sensor_data').timestamp(new Date(data.data.date));

    Object.keys(data.data).forEach(key => {
        if (key !== 'date') {
            point.floatField(key, data.data[key]);
        }
    });

    writeApi.writePoint(point);
    console.log(`✅ Données stockées dans InfluxDB :`, data);
}

readSensorDataAndStore();
