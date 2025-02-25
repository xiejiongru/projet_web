# Projet web

## Raspberry / Groupe

- **pi 27** : Romain, Jiongru
- **pi 28** : Vanessa, Zijian
- **pi 30** : Loïs, Jean-Baptiste
- **pi 31** :
- **pi 32** : Thomas, Antonin

## Lien sujet

[Projet Station Météo](https://web.iamvdo.me/js/exercices/projet-station-meteo/)

Chaque sonde est reliée à plusieurs capteurs qui donnent des informations diverses :

- **Température** : degré Celsius (précision : 2 chiffres après la virgule)
- **Hygrométrie** : % (précision : 2 chiffres après la virgule)
- **Pression atmosphérique** : Pa (Pascal) (précision : 2 chiffres après la virgule)
- **Pluviométrie** : mm de pluie / m (précision : 2 chiffres après la virgule)
- **Luminosité** : lux (précision : 2 chiffres après la virgule)
- **Vitesse du vent** : km/h (précision : 0 chiffre après la virgule)
- **Direction du vent** : degré (0° = Nord) (précision : 0 chiffre après la virgule)
- **Position GPS et heure** (précision : 3 chiffres après la virgule)

## Objectifs

Vous devrez réaliser un (ou des) programme(s) en **Node.js** qui :

1. Lit ces données
2. Les stocke (ex. : [InfluxDB](https://www.influxdata.com/) semble adapté)
3. Les expose via un **service Web** (port 80 ou 443)

### Fonctionnalités attendues

- **Dashboard** présentant toutes les dernières données d'une sonde (design inspiré des centrales météo du commerce)
- **Historique** des données d'une sonde sur **1 semaine / 1 mois / 1 an**
- **Comparatif** d'une donnée sur toutes les sondes (instantané ou graphique sur une durée définie)
- **Cartographie** des sondes (position ajustable via configuration des générateurs factices)

## Fichiers de données

### Capteurs (/dev/shm/sensors)

```json
{
  "date": "2025-02-04T08:23:54.313Z",
  "measure": [
    {"name": "temperature", "desc": "Température", "unit": "C", "value": "10.01"},
    {"name": "pressure", "desc": "Pression", "unit": "hP", "value": "995.00"},
    {"name": "humidity", "desc": "Humidité", "unit": "%", "value": "50.1"},
    {"name": "luminosity", "desc": "Luminosité", "unit": "Lux", "value": "7"},
    {"name": "wind_heading", "desc": "Direction du vent", "unit": "°", "value": "190.52"},
    {"name": "wind_speed_avg", "desc": "Force moyenne du vent", "unit": "Kts", "value": "40.9"},
    {"name": "wind_speed_max", "desc": "Force maxi du vent", "unit": "Kts", "value": "65.9"},
    {"name": "wind_speed_min", "desc": "Force moyenne du vent", "unit": "Kts", "value": "25.8"}
  ]
}
```

### Pluviométrie (/dev/shm/rainCounter.log)

```
2025-02-04T08:38:10.390Z
```

### GPS (/dev/shm/gpsNmea)

```
$GPGGA,084016.46,5130.421,N,00007.694,W,1,08,0.9,542.9,M,46.9,M, , *7B
$GPRMC,084016.46,A,5130.421,N,00007.694,W,000.0,054.7,040225,020.3,E*49
```

### Température, Humidité, Pression (/dev/shm/tpg.log)

```json
{
  "date": "2025-02-04T08:40:55.096441",
  "temp": 41.336,
  "hygro": 14.131,
  "press": 1024.175
}
```

## Accès SSH

```sh
ssh pi@piensg{numéro}
```

## API

```javascript
// Exemple de route pour récupérer les données en temps réel
app.get('/api/station', (req, res) => {
    res.json({
        station: 'station id',
        date: {
            temp: data,
            hygr: data,
            prat: data,
            pluv: data,
            lumi: data,
            vitv: data,
            dirv: data,
            posi: [x , y]
        }
    });
});
```

## Dashboard & Visualisation

[Grafana Dashboards](https://grafana.com/grafana/dashboards/)

