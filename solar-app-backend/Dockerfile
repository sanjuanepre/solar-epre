# Usa una imagen de Node como base
FROM node:18-alpine

# Crea el directorio de la app en el contenedor
WORKDIR /app

# Copia el package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Crea el directorio adicional si es necesario
RUN mkdir -p /app/dist/google-sheets

# Copia el resto de los archivos de la aplicación
COPY . .

# Construye la aplicación
RUN npm run build

# Expone el puerto en el que corre tu app
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]
