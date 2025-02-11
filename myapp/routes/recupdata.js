const { Client } = require('ssh2');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { QueryApi } = require('@influxdata/influxdb-client');
const fs = require('fs');
const nmea = require('node-nmea');

// Configuration SSH
const sshConfig = {
    host: 'piensg027',
    username: 'pi',
    privateKey: fs.readFileSync('/root/.ssh/id_rsa')
};



// Lecture des secrets Docker
const INFLUXDB_TOKEN = fs.readFileSync('/run/secrets/influxdb2-admin-token', 'utf8').trim();
const INFLUXDB_USERNAME = fs.readFileSync('/run/secrets/influxdb2-admin-username', 'utf8').trim();
const INFLUXDB_PASSWORD = fs.readFileSync('/run/secrets/influxdb2-admin-password', 'utf8').trim();

// Configuration de l'InfluxDB client
const influx = new InfluxDB({
    url: process.env.INFLUXDB_URL || 'http://influxdb2:8086',
    token: INFLUXDB_TOKEN
});
const influxConfig = {
    bucket: "tsi",
};


// Si vous utilisez le nom d'utilisateur et mot de passe pour l'authentification
// vous pouvez configurer aussi l'authentification via ces informations

const queryApi = influx.getQueryApi(INFLUXDB_USERNAME);
const writeApi = influx.getWriteApi('', 'tsi', 'ns');


/**
 * Fonction principale pour lire les fichiers de capteurs et stocker dans InfluxDB
 */

function readFileAndStore(conn, filePath, collectedData) {
    return new Promise((resolve, reject) => {
        conn.exec(`cat ${filePath}`, (err, stream) => {
            if (err) {
                console.error(`❌ Erreur lecture ${filePath}:`, err);
                return reject(err);
            }

            let data = '';
            stream.on('data', chunk => data += chunk.toString());
            stream.on('close', () => {
                console.log(`📂 Fichier ${filePath} lu.`);
                try {
                    const parsedData = parseData(filePath, data.trim());

                    if (parsedData) {
                        collectedData.unit = { ...collectedData.unit, ...parsedData.unit };
                        collectedData.data = { ...collectedData.data, ...parsedData.data };
                        collectedData.filesProcessed++;

                    }
                    resolve(); // Résolution de la promesse quand la lecture est terminée
                } catch (error) {
                    console.error(`❌ Erreur parsing ${filePath}:`, error);
                    resolve(); // Même en cas d'erreur, résoudre la promesse pour continuer
                }
            });
        });
    });
}

async function readSensorDataAndStore() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('✅ Connexion SSH établie.');

        const files = [
            '/dev/shm/tph.log',
            '/dev/shm/gpsNmea',
            '/dev/shm/sensors'
        ];

        let collectedData = {
            id: 27,
            unit: {},
            data: {},
            filesProcessed: 0
        };

        try {
            // Lire et stocker les données de manière séquentielle
            for (const file of files) {
                await readFileAndStore(conn, file, collectedData);
            }

            storeData(collectedData);
            conn.end();
            setTimeout(readSensorDataAndStore, 10000); // Relance après 10 secondes
        } catch (err) {
            console.error("❌ Erreur lors de la lecture des fichiers:", err);
            setTimeout(readSensorDataAndStore, 10000); // Réessaie après 10 secondes en cas d'erreur
        }
    }).on('error', err => {
        console.error('❌ Erreur SSH:', err);
        setTimeout(readSensorDataAndStore, 10000); // Réessaie après 10 secondes en cas d'erreur
    }).connect(sshConfig);
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


    if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
    }

    return decimal;
}


function parseData(filePath, data) {
    if (!data || data.trim() === '') {
        console.warn(`⚠️ Données vides pour ${filePath}, ignorées.`);
        return null;
    }

    try {
        let parsedData = null;
        let parsedUnit = null;

        switch (filePath) {
            case '/dev/shm/tph.log': {

                const json = JSON.parse(data);

                if (json && json.hygro) {
                    parsedData = { hygro: json.hygro };
                } else {
                    console.error('❌ Donnée "hygro" manquante dans tph.log');
                    parsedDta = { hygro: 0 };
                }

                parsedUnit = { hygro: "mm * km² " }
                break;
            }
            case '/dev/shm/gpsNmea': {
                const nmeaData = data.trim().toString();
                const nmeaTab = nmeaData.split("\n");
                const json = nmea.parse(nmeaTab[1]);

                const info_lat = json.loc.dmm.latitude.split(",");
                const info_long = json.loc.dmm.longitude.split(",");

                parsedData = {
                    latitude: convertDMMtoDD(info_lat[0], info_lat[1]),
                    longitude: convertDMMtoDD(info_long[0], info_long[1])
                };
                parsedUnit = {
                    latitude: "DD",
                    longitude: "DD"
                };


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
        return { unit: parsedUnit, data: parsedData };
    } catch (error) {
        console.error(`❌ Erreur parsing ${filePath}:`, error.message);
        return null;
    }
}

async function getSensorData(dateStr = new Date().toISOString(), field = null) {
    try {
        // Vérifie que la date est valide
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error('Date invalide');
        }

        // Plage de dates de 1 jour avant et après la date donnée
        const start = new Date(date);
        start.setDate(start.getDate() - 1); // 1 jour avant

        const end = new Date(date);
        end.setDate(end.getDate() + 1); // 1 jour après

        let query = `
            from(bucket: "${influxConfig.bucket}")
                |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
                |> filter(fn: (r) => r._measurement == "sensor_data")
                |> sort(columns: ["_time"], desc: true)
                |> limit(n: 1)`;

        // Si un field est spécifié, ajoute-le à la requête
        if (field) {
            query += ` |> filter(fn: (r) => r._field == "${field}")`;
        }

        const rows = [];
        await new Promise((resolve, reject) => {
            queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    rows.push(obj);
                },
                error(error) {
                    reject(error);
                },
                complete() {
                    resolve();
                }
            });
        });

        if (rows.length > 0) {
            return rows;
        } else {
            console.warn(`⚠️ Aucune donnée trouvée pour ${dateStr}`);
            // Si aucune donnée n'est trouvée, retourne les dates disponibles
            const availableDates = await getAvailableDates();
            return { error: `Pas de données pour ${dateStr}`, availableDates };
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données :', error.message);
        return { error: error.message };
    }
}

// Fonction pour obtenir les dates disponibles dans InfluxDB
async function getAvailableDates() {
    try {
        const query = `
            from(bucket: "${influxConfig.bucket}")
                |> range(start: -30d)
                |> filter(fn: (r) => r._measurement == "sensor_data")
                |> distinct(column: "_time")`;

        const rows = [];
        await new Promise((resolve, reject) => {
            queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    rows.push(obj._time);
                },
                error(error) {
                    reject(error);
                },
                complete() {
                    resolve();
                }
            });
        });

        return rows;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des dates disponibles :', error);
        return [];
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

    getSensorData(new Date(data.data.date).toISOString())
        .then(result => {
            if (result.error) {
                console.log(result.error);
                console.log('Dates disponibles :', result.availableDates);
            } else {
                const reconstructedData = reconstructData(result);
                console.log("Données reconstruites : ", reconstructedData);
            }
        })
        .catch(error => {
            console.error('❌ Erreur lors de la récupération des données après insertion :', error);
        });
    verifyData(new Date(data.data.date).toISOString());
}

async function verifyData(dateStr) {
    try {
        const rows = await getSensorData(dateStr);
        if (rows && rows.length > 0 && !rows.error) {
            console.log("✅ Données présentes dans InfluxDB après insertion:", rows);
        } else {
            console.error("❌ Données manquantes ou incorrectes dans InfluxDB après insertion:", rows);
        }
    } catch (error) {
        console.error("❌ Erreur lors de la vérification des données:", error);
    }
}

function reconstructData(rows) {
    const result = {
        id: 27,
        unit: {
            latitude: 'DD',
            longitude: 'DD',
            temperature: 'C',
            pressure: 'hP',
            humidity: '%',
            luminosity: 'Lux',
            wind_heading: '°',
            wind_speed_avg: 'Kts',
            wind_speed_max: 'Kts',
            wind_speed_min: 'Kts',
            hygro: 'mm*km²'
        },
        data: {}
    };

    rows.forEach(row => {
        // Extract the field name and the corresponding value from each row
        const field = row._field;
        const value = row._value;

        // Map the field to the correct property in the data object
        switch (field) {
            case 'hygro':
                result.data.hygro = value;
            case 'humidity':
                result.data.humidity = value;
                break;
            case 'latitude':
                result.data.latitude = value;
                break;
            case 'longitude':
                result.data.longitude = value;
                break;
            case 'luminosity':
                result.data.luminosity = value;
                break;
            case 'pressure':
                result.data.pressure = value;
                break;
            case 'temperature':
                result.data.temperature = value;
                break;
            case 'wind_heading':
                result.data.wind_heading = value;
                break;
            case 'wind_speed_avg':
                result.data.wind_speed_avg = value;
                break;
            case 'wind_speed_max':
                result.data.wind_speed_max = value;
                break;
            case 'wind_speed_min':
                result.data.wind_speed_min = value;
                break;
        }

        // Set the date when all values are found (assume the first row will have the correct timestamp)
        if (!result.data.date) {
            result.data.date = row._time;
        }
    });

    return result;
}
// Démarrage avec mise à jour toutes les 10 secondes
readSensorDataAndStore();

getSensorData("2025-02-05T12:00:00Z");
