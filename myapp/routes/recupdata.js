const { Client } = require('ssh2');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const nmea = require('node-nmea');

// SSH Configuration
const sshConfig = {
    host: 'piensg027',
    username: 'pi',
    privateKey: fs.existsSync('/home/formation/.ssh/id_rsa') ? fs.readFileSync('/home/formation/.ssh/id_rsa') : null
};

// InfluxDB Configuration
const influxConfig = {
    url: 'http://localhost:8086',
    token: 'e6u708mjT23L-cxSMJcvtmzQHauLo-8ohVt6VpfU69IgW3k4wX8-fz-4h1OHIwael2rN2RnOhfWG4uVZAcgZ5Q==',
    org: 'ensg',
    bucket: 'tsi'
};

const influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });
const writeApi = influxClient.getWriteApi(influxConfig.org, influxConfig.bucket);
writeApi.useDefaultTags({ host: 'raspberry' });

let collectedData = {
    id: 27,
    unit: {},
    data: {},
    filesProcessed: 0
};

/**
 * Main function to read sensor files and store data in InfluxDB
 */
function readSensorDataAndStore() {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('✅ SSH connection established.');
        const files = [
            '/dev/shm/gpsNmea',
            '/dev/shm/sensors'
        ];

        files.forEach(file => readFileAndStore(conn, file));
    }).on('error', err => console.error('❌ SSH error:', err))
      .connect(sshConfig);
}

/**
 * Reads a remote file via SSH and stores data in InfluxDB
 */
function readFileAndStore(conn, filePath) {
    conn.exec(`cat ${filePath}`, (err, stream) => {
        if (err) {
            console.error(`❌ Error reading ${filePath}:`, err);
            return;
        }

        let data = '';
        stream.on('data', chunk => data += chunk.toString());
        stream.on('close', () => {
            conn.end();
            console.log(`📂 File ${filePath} read.`);

            try {
                const parsedData = parseData(filePath, data.trim());
                if (parsedData) {
                    collectedData.unit = { ...collectedData.unit, ...parsedData.unit };
                    collectedData.data = { ...collectedData.data, ...parsedData.data };
                    collectedData.filesProcessed++;

                    // Once all files are read, store data in InfluxDB
                    if (collectedData.filesProcessed === 2) {
                        storeData(collectedData);
                    }
                }
            } catch (error) {
                console.error(`❌ Error parsing ${filePath}:`, error);
            }
        });
    });
}

function convertDMMtoDD(coord, direction) {
    let match = coord.match(/^(\d+)(\d{2}\.\d+)$/);
    if (!match) {
        console.error("Incorrect format:", coord);
        return null;
    }

    let degrees = parseInt(match[1], 10);
    let minutes = parseFloat(match[2]);
    
    let decimal = degrees + (minutes / 60);

    // Apply direction (N, S, E, W)
    if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
    }

    return decimal;
}

/**
 * Parses data based on the source file
 */
function parseData(filePath, data) {
    if (!data || data.trim() === '') {
        console.warn(`⚠️ Empty data for ${filePath}, ignored.`);
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
                    latitude: convertDMMtoDD(info_lat[0], info_lat[1]),
                    longitude: convertDMMtoDD(info_long[0], info_long[1])
                };
                parsedUnit = {
                    latitude: "DD",
                    longitude: "DD"
                };

                console.log("GPS data:", parsedData);
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
                console.warn(`⚠️ Unrecognized file: ${filePath}`);
                return null;
        }

        DataUnit = {
            unit: parsedUnit,
            data: parsedData
        };
        return DataUnit;
    } catch (error) {
        console.error(`❌ Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Stores data in InfluxDB
 */
function storeData(data) {
    const point = new Point('sensor_data').timestamp(new Date(data.data.date));

    Object.keys(data.data).forEach(key => {
        if (key !== 'date') {
            point.floatField(key, data.data[key]);
        }
    });

    writeApi.writePoint(point);
    console.log(`✅ Data stored in InfluxDB:`, data);
}

// Start
module.exports = {
    readSensorDataAndStore
};