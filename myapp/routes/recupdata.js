const { Client } = require('ssh2');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const nmea = require('node-nmea');

// Configuration SSH
const sshConfig = {
    host: 'piensg027',
    username: 'pi',
    privateKey: fs.readFileSync('/home/formation/.ssh/id_rsa')
};

// Configuration InfluxDB
const influxConfig = {
    url: 'http://localhost:8086',
    token: 'LSg1A6kR8GFf-aVlmcl_CZcPRwW9FZ-TwKpd8YXUAsOhLRDCnEBQzRy9F6UcGl0N0AzgU5A5d16_JmouvzBg6A==',
    org: 'ensg',
    bucket: 'tsi'
};

const influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });
const writeApi = influxClient.getWriteApi(influxConfig.org, influxConfig.bucket);
writeApi.useDefaultTags({ host: 'raspberry' });


let collectedData = {
    id : 27,
    unit: {},
    data: {},
    filesProcessed: 0
};
/**
 * Fonction principale pour lire les fichiers de capteurs et stocker dans InfluxDB
 */
function readSensorDataAndStore() {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('✅ Connexion SSH établie.');
        const files = [
            '/dev/shm/gpsNmea',
            '/dev/shm/sensors'
        ];


        files.forEach(file => readFileAndStore(conn, file));
    }).on('error', err => console.error('❌ Erreur SSH:', err))
      .connect(sshConfig);
}

/**
 * Lit un fichier distant via SSH et stocke les données dans InfluxDB
 */
function readFileAndStore(conn, filePath) {
    conn.exec(`cat ${filePath}`, (err, stream) => {
        if (err) {
            console.error(`❌ Erreur lecture ${filePath}:`, err);
            return;
        }

        let data = '';
        stream.on('data', chunk => data += chunk.toString());
        stream.on('close', () => {
            conn.end();
            console.log(`📂 Fichier ${filePath} lu.`);

            try {
                const parsedData = parseData(filePath, data.trim());
                if (parsedData) {
                    collectedData.unit = { ...collectedData.unit, ...parsedData.unit };
                    collectedData.data = { ...collectedData.data, ...parsedData.data };
                    collectedData.filesProcessed++;

                    // Une fois tous les fichiers lus, on stocke les données dans InfluxDB
                    if (collectedData.filesProcessed === 2) {

                        
                        storeData(collectedData);
                    }
                }
            } catch (error) {
                console.error(`❌ Erreur parsing ${filePath}:`, error);
            }
        });
    });
}

function convertDMMtoDD(coord, direction) {
    let match = coord.match(/^(\d+)(\d{2}\.\d+)$/);
    if (!match) {
        console.error("Format incorrect :", coord);
        return null;
    }

    let degrees = parseInt(match[1], 10);
    let minutes = parseFloat(match[2]);
    
    let decimal = degrees + (minutes / 60);

    // Appliquer la direction (N, S, E, W)
    if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
    }

    return decimal;
}

/**
 * Parse les données en fonction du fichier source
 */
function parseData(filePath, data) {
    if (!data || data.trim() === '') {
        console.warn(`⚠️ Données vides pour ${filePath}, ignorées.`);
        return null;
    }

    try {
        let parsedData = null;
        let parsedUnit = null;
        let DataUnit = null;

        switch (filePath) {

            case '/dev/shm/gpsNmea': {
                const nmeaData = data.trim().toString();
                const nmeaTab = nmeaData.split("\n");
                json = nmea.parse(nmeaTab[1]);

                const info_lat = json.loc.dmm.latitude.split(",");
                const info_long = json.loc.dmm.longitude.split(",");

                parsedData = {
                    latitude: convertDMMtoDD(info_lat[0], info_lat[1]) ,
                    longitude: convertDMMtoDD(info_long[0], info_long[1])
                }
                parsedUnit = {
                    latitude : "DD",
                    longitude : "DD"

                }

                console.log("gps :" + parsedData);

                break;
            }
            case '/dev/shm/sensors': {
                const json = JSON.parse(data);
                parsedData = { date: json.date };
                parsedUnit = {};
                json.measure.forEach(measure => {
                    parsedData[measure.name] = parseFloat(measure.value);
                    parsedUnit[measure.name] = measure.unit;
                });

                break;
            }
            default:
                console.warn(`⚠️ Fichier non reconnu : ${filePath}`);
                return null;
        }

        DataUnit = {unit : parsedUnit,
            data: parsedData
        }
        return DataUnit;
    } catch (error) {
        console.error(`❌ Erreur parsing ${filePath}:`, error.message);
        return null;
    }
}


/**
 * Stocke les données dans InfluxDB
 */
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

// Démarrage
module.exports = {
    readSensorDataAndStore
  };