const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const nmea = require('node-nmea');


// Configuration InfluxDB

const token = fs.readFileSync('/home/formation/run/secrets/token.txt', 'utf8').trim();



const org = 'tsi';
const bucket = 'tsi';
const url = 'http://localhost:8086';

// Création du client
const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns'); // ns = précision en nanosecondes


const files = [
    '/dev/shm/gpsNmea',
    '/dev/shm/sensors',
    '/dev/shm/rainCounter.log',
    '/dev/shm/tph.log'
];

function readSensorDataAndStore() {
    let collectedData = {
        id: 27,
        data: {},
        filesProcessed: 0
    };
    files.forEach(file => readFileAndStore(file, collectedData));
    setTimeout(readSensorDataAndStore, 100000);

}

function readFileAndStore(filePath, collectedData) {



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
    try {
        const point = new Point('sensor_data')
            .tag('device', 'weather_station')
            .floatField('latitude', data.data.latitude)
            .floatField('longitude', data.data.longitude)
            .floatField('temperature', data.data.temperature)
            .floatField('pressure', data.data.pressure)
            .floatField('humidity', data.data.humidity)
            .floatField('luminosity', data.data.luminosity)
            .floatField('wind_speed_avg', data.data.wind_speed_avg)
            .floatField('wind_speed_max', data.data.wind_speed_max)
            .floatField('wind_speed_min', data.data.wind_speed_min)
            .timestamp(new Date(data.data.date));

        writeApi.writePoint(point);
        writeApi.flush(); // Envoie les données immédiatement

        console.log('✅ Données stockées dans InfluxDB');
    } catch (error) {
        console.error('❌ Erreur lors de l’envoi à InfluxDB:', error);
    }
}


async function fetchInfluxDBData(bucket, token, org, days) {
    const INFLUX_URL = `http://localhost:8086/api/v2/query?org=${org}`;

    const query = `from(bucket: "${bucket}") |> range(start: -${days}d)`;

    try {
        const response = await fetch(INFLUX_URL, {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: query,
                dialect: {
                    header: true,
                    delimiter: ",",
                    quoteChar: "\"",
                    commentPrefix: "#",
                    annotations: ["datatype", "group", "default"]
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.text(); // Récupérer les données en texte brut (CSV)
        console.log("Données récupérées:", data); // Log des données brutes

        // Organiser les données sans utiliser csv-parse
        const organizedData = organizeDataByDate(data);
        console.log("Données organisées :", organizedData);
        return organizedData;

    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
    }
}

function organizeDataByDate(csvData) {
    const lines = csvData.split("\n"); // Diviser les lignes du CSV

    // Extraire les lignes 4 à 6 (indices 3, 4, 5)
    const dataWithoutHeader = lines.slice(4);

    const extractedData = dataWithoutHeader.map(line => {
        const columns = line.split(","); // Séparer les colonnes par virgule
        return {
            date: columns[5],   // La date se trouve à l'index 5
            value: columns[6],  // La valeur se trouve à l'index 6
            field: columns[7]   // Le champ se trouve à l'index 7
        };
    });

    console.log("Données extraites : ", extractedData);
    let organizedData = {}
    let tab = {};
    tab[extractedData[0].field] = extractedData[0].value;
    organizedData[extractedData[0].date] = tab;

    extractedData.forEach(data => {
        const { date, field, value } = data;

        if (date) {

            if (!organizedData[date]) {
                tab = {};
                tab[field] = value
                organizedData[date] = tab;
            }
            else {

                organizedData[date][field] = value;
            }
        }
    });



    return organizedData;
}




// Exemple d'utilisation
fetchInfluxDBData(bucket, token, org, 1);


readSensorDataAndStore();
