# Usa una imagen de Node como base
FROM node:18-alpine

# Crea el directorio de la app en el contenedor
WORKDIR /app

# Copia el package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias incluyendo las de desarrollo
RUN npm install

# Copia el resto de los archivos de la aplicación
RUN mkdir -p /app/dist/google-sheets
COPY . .

# Construye la aplicación
RUN npm run build

# Expone el puerto en el que corre tu app
EXPOSE PORT

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start:prod"]