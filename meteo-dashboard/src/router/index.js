
import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';

const app = express();
const port = 3000;

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
      value: Math.floor(columns[6] * 100) / 100,  // La valeur se trouve à l'index 6
      field: columns[7]   // Le champ se trouve à l'index 7
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

  console.log("taille de data: " + organizedData.size);
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




  return organizedData;
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

// Démarrer le serveur sur le port 3000
app.listen(port, () => {
  console.log(`Serveur démarré sur https://localhost:${port}`);
});
