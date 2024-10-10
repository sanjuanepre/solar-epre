# Generación Solar San Juan

## Descripción

Este proyecto permite calcular el ahorro en el consumo eléctrico basandose en la generación fotovoltaica de un zona elegida dentro de la Provincia de San Juan, Argentina, usando la **API Solar de Google**. El backend está desarrollado en **NestJS** y el frontend en **Angular**.

## Estructura del Proyecto

## Tecnologías Utilizadas

### Backend
- **Node.js** (v18)
- **NestJS** (v10)
- **Google Cloud APIs** (Solar y Sheets)
- **Axios** para solicitudes HTTP
- **Passport** para autenticación JWT
- **Swagger** para documentación de la API
- **Google Auth Library** para autenticación con Google

### Frontend
- **Angular** (v16)
- **Angular Material** para la UI
- **Google Maps** para mostrar ubicaciones
- **ApexCharts** y **Chart.js** para gráficos interactivos
- **Ngx-spinner** para gestionar el estado de carga
- **HTML2Canvas** y **JsPDF** para generar reportes descargables en PDF

## Configuración y Despliegue

### 1. Backend

#### Configuración del Entorno
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install

3. Crear un archivo .env con las siguientes variables:
    ```json
    GOOGLE_API_KEY=<API_KEY>
    GOOGLE_CLIENT_ID=<CLIENT_ID>
## Scripts
### Iniciar el servidor en desarrollo:
    npm run start:dev
### Iniciar el servidor en producción:
    npm run start:prod
### Documentación de la API
    Acceder a la documentación en Swagger a través de /api/docs cuando el servidor esté corriendo.

### Frontend
## Configuración del Entorno
    Clonar el repositorio.
    Instalar dependencias:
  ```bash
    npm install
  ```
Crear el archivo src/env.json con las claves API:
  ```json
    {
      "googleApiKey": "<API_KEY>"
    }
  ```
### Scripts
    Iniciar la aplicación en desarrollo:
    npm start
### Construir para producción:
    npm run build
### Despliegue
    La aplicación se despliega en Kubernetes utilizando Ingress para gestionar el tráfico y TLS proporcionado por Let's Encrypt.

### Configuración de Kubernetes
    Ingress
    El archivo solar-app-ingress.yaml gestiona las rutas:

    El frontend está disponible en la raíz /.
    El backend está accesible en la ruta /api.
    El Ingress está configurado con Nginx como controlador y certificado SSL para el dominio app.solar.epresanjuan.gob.ar.
### Servicios
    Frontend: Configurado como servicio tipo LoadBalancer, expuesto en el puerto 80 con una IP externa asignada.
    Backend: Similar al frontend, también expuesto como LoadBalancer y gestionado por Kubernetes.
