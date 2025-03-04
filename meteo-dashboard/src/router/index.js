
import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist'))); // Serve static files first

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')); // Serve index.html for all other routes
});

const token = fs.readFileSync('/home/formation/run/secrets/token.txt', 'utf8').trim();
const org = 'tsi';
const bucket = 'tsi';

async function fetchInfluxDBData(bucket, token, org, periodValue = 'last', periodType = 'days') {
  const INFLUX_URL = `http://localhost:8086/api/v2/query?org=${org}`;

  // Si periodValue est 'last', on applique la requête avec last()
  let query;
  if (periodValue === 'last') {
    console.log("cc")
    query = `from(bucket: "${bucket}") |> range(start: -1y) |> last()`;  // Récupérer la dernière donnée
  } else {
    // Sinon, on construit la requête en fonction du type de période
    if (periodType === 'days') {
      query = `from(bucket: "${bucket}") |> range(start: -${periodValue}d)`;
    } else if (periodType === 'hours') {
      query = `from(bucket: "${bucket}") |> range(start: -${periodValue}h)`;
    } else if (periodType === 'minutes') {
      query = `from(bucket: "${bucket}") |> range(start: -${periodValue}m)`;
    } else {
      throw new Error('Type de période invalide. Utilisez "days" ou "hours".');
    }
  }

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

    // Organiser les données sans utiliser csv-parse
    const organizedData = organizeDataByDate(data);

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
      date: columns[5],
      value: Math.floor(columns[6] * 100) / 100,
      field: columns[7]
    };
  });


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



  let dataformat = {
    "id": 27,
    "unit": {
      "temperature": "C",
      "pressure": "hP",
      "humidity": "%",
      "rain": "mm/m2",
      "lux": "Lux",
      "wind_heading": "°",
      "wind_speed_avg": "km/h",
      "lat": "DD",
      "lon": "DD"
    }
  }

  if (Object.keys(organizedData).length === 1) {
    let data = Object.keys(organizedData).map(date => {
      return {
        date: date,
        ...organizedData[date]
      };
    });
    console.log("data :", data[0]);
    dataformat["data"] = data[0];
  }
  else {
    dataformat = { ...dataformat, ...organizedData };
  }

  return dataformat;
}

function filter_by_date(data, endDate) {
  let filteredData = {
    id: 27,
    unit: data.unit
  };
  Object.entries(data).forEach(([date, values]) => {
    let DateofItem = new Date(date);
    if (date != 'unit' && date != 'id' && (endDate - DateofItem >= 0)) {
      filteredData[date] = values;
    }
    if (date === 'data') {
      DateofItem = new Date(values.date);

      if (endDate - DateofItem >= 0) {
        filteredData[date] = values;
      }
    }
  });
  return filteredData;

}


function filter_by_sensor(data, para) {
  let filteredData = {};
  let filteredUnit = {};
  Object.entries(data).forEach(([key, value]) => {
    console.log(`Clé : ${key}, Valeur :`, value);
  });



  for (let key in data.unit) {
    if (para.includes(key)) {
      filteredUnit[key] = data.unit[key];
    }
  }

  let filteredJSON = {};
  if (data.data) {

    filteredData.date = data.data.date;

    for (let key in data.data) {
      if (para.includes(key)) {
        filteredData[key] = data.data[key];
      }
    }


    filteredJSON = {
      id: 27,
      unit: filteredUnit,
      data: filteredData
    };
  }
  else {
    console.log('salut');
    filteredJSON = {
      id: 27,
      unit: filteredUnit,

    };
    Object.entries(data).forEach(([key, value]) => {
      filteredData = {};

      if (key != 'id' && key && 'unit' && key != 'data') {

        for (let cle in value) {
          if (para.includes(cle)) {
            filteredData[cle] = value[cle];

            filteredJSON[key] = filteredData;
          }
        }
      }
    });

  }
  return filteredJSON;
}



// Route qui appelle la fonction de récupération des données et les renvoie à l'URL /live
app.get('/live', async (req, res) => {
  try {
    const data = await fetchInfluxDBData(bucket, token, org);
    if (data) {
      res.json(data);  // Retourner les données sous forme de JSON
    } else {
      res.status(500).send("Erreur lors de la récupération des données.");
    }
  } catch (error) {
    res.status(500).send("Erreur interne du serveur.");
  }
});

app.get('/live/:listcapteur', async (req, res) => {
  try {
    const data = await fetchInfluxDBData(bucket, token, org);  // Récupère les données de InfluxDB

    if (data) {
      const { listcapteur } = req.params;
      const para = listcapteur.split('-'); // Liste des capteurs demandés

      let filteredJSON = filter_by_sensor(data, para);

      if (Object.keys(filteredJSON.unit).length === 0) {
        res.json({
          message: "A query argument is invalid"
        })
      }
      else {
        res.json(filteredJSON);
      }
    } else {
      res.status(404).json({ error: "No data found" });
    }
  } catch (error) {
    console.error("Unable to retrieve data from DB :", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/sample/:start/now', async (req, res) => {
  try {
    const { start } = req.params;

    const givenDate = new Date(start);

    const now = new Date();


    const diffMs = now - givenDate;

    if (diffMs < 0) {

      res.json({
        message: "A query argument is invalid"
      })
    }
    else {
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      const data = await fetchInfluxDBData(bucket, token, org, diffMinutes, 'minutes');
      if (data) {

        res.json(data);
      }
      else {
        res.status(500).send("Erreur lors de la récupération des données.");
      }
    }
  } catch (error) {
    res.status(500).send("Erreur interne du serveur.");
  }
});



app.get('/sample/:start/now/:listcapteur', async (req, res) => {
  try {
    const { start } = req.params;

    const givenDate = new Date(start);

    const now = new Date();


    const diffMs = now - givenDate;

    if (diffMs < 0) {

      res.json({
        message: "A query argument is invalid"
      })
    }
    else {
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      const data = await fetchInfluxDBData(bucket, token, org, diffMinutes, 'minutes');
      if (data) {
        const { listcapteur } = req.params;
        const para = listcapteur.split('-'); // Liste des capteurs demandés

        let filteredJSON = filter_by_sensor(data, para);

        if (Object.keys(filteredJSON.unit).length === 0) {
          res.json({
            message: "A query argument is invalid"
          })
        }
        else {
          res.json(filteredJSON);
        }
      }
      else {
        res.status(500).send("Erreur lors de la récupération des données.");
      }
    }
  } catch (error) {
    res.status(500).send("Erreur interne du serveur.");
  }
});

app.get('/sample/:start/:end', async (req, res) => {
  try {
    const { start } = req.params;

    const startDate = new Date(start);

    const { end } = req.params;

    const endDate = new Date(end);
    console.log(' end date', end);

    const now = new Date();

    const diffMs = now - startDate;

    if (diffMs < 0) {

      res.json({
        message: "A query argument is invalid"
      })
    }
    else {
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      const data = await fetchInfluxDBData(bucket, token, org, diffMinutes, 'minutes');
      if (data) {
        let filteredJSON = filter_by_date(data, endDate);
        if (Object.keys(filteredJSON).length === 2) {
          res.json({
            message: "A query argument is invalid"
          })
        }
        else {
          res.json(filteredJSON);
        }
      }
      else {
        res.status(500).send("Erreur lors de la récupération des données.");
      }
    }
  } catch (error) {
    res.status(500).send("Erreur interne du serveur.");
  }
});

app.get('/sample/:start/:end/:listcapteur', async (req, res) => {
  try {
    const { start } = req.params;

    const startDate = new Date(start);

    const { end } = req.params;

    const endDate = new Date(end);
    console.log(' end date', end);

    const now = new Date();

    const diffMs = now - startDate;

    if (diffMs < 0) {

      res.json({
        message: "A query argument is invalid"
      })
    }
    else {
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      const data = await fetchInfluxDBData(bucket, token, org, diffMinutes, 'minutes');
      if (data) {
        const { listcapteur } = req.params;
        const para = listcapteur.split('-'); // Liste des capteurs demandés

        let filteredData = filter_by_date(data, endDate);
        let filteredJSON = filter_by_sensor(filteredData, para)
        if (Object.keys(filteredJSON).length === 2 || Object.keys(filteredJSON.unit).length === 0) {
          res.json({
            message: "A query argument is invalid"
          })
        }
        else {
          res.json(filteredJSON);
        }
      }
      else {
        res.status(500).send("Erreur lors de la récupération des données.");
      }
    }
  } catch (error) {
    res.status(500).send("Erreur interne du serveur.");
  }
});

// Démarrer le serveur sur le port 3000
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});