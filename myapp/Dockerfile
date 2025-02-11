# Utilisez une image de base officielle de Node.js
FROM node:16

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json dans le conteneur
COPY package*.json ./

# Installer les dépendances (modules Node.js)
RUN npm install

# Copier le reste des fichiers de l'application dans le conteneur
COPY . .

# Exposer le port que votre application utilise (par exemple, 3000)
EXPOSE 3000

# Commande pour démarrer l'application
#CMD ["node", "routes/recupdata.js"]  # Exécute le script recupdata.js
