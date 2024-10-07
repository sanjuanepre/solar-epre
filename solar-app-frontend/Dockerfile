# Etapa 1: Construcción
FROM node:18-alpine AS build

# Configura el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos necesarios
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos
COPY . .

# Compila la aplicación Angular
RUN npm run build --prod

# Etapa 2: Servidor NGINX
FROM nginx:alpine

# Copia los archivos compilados de la aplicación Angular a la carpeta de NGINX
COPY --from=build /app/dist/gsdsj-front /usr/share/nginx/html

# Configura NGINX para usar el puerto 8080
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf

# Expone el puerto 8080
EXPOSE 8080

# Comando para ejecutar NGINX
CMD ["nginx", "-g", "daemon off;"]
