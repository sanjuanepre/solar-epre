# Estado del Proyecto: Calculadora de Generación Solar Distribuida

Este archivo sirve como referencia histórica y de contexto rápido para desarrolladores o asistentes de IA que continúen con el mantenimiento y evolución del proyecto.

Última actualización: Julio de 2026

---

## 📋 Arquitectura y Configuración Actual

El proyecto consta de dos repositorios/carpetas principales:
1. **Frontend (`solar-app-frontend`)**: Desarrollado en Angular v16.
2. **Backend (`solar-app-backend`)**: Desarrollado en NestJS v10 con Node.js 24.x.

### Integraciones Activas:
* **Google Maps & Places API**: Usados en el frontend para buscar direcciones y delimitar techos.
* **Google Solar API**: Usado por el backend para estimar la radiación solar anual y paneles máximos que caben según el polígono provisto.
* **Google Sheets API v4**: Usado por el backend para leer la planilla de parámetros económicos e impositivos del EPRE (ID de la hoja en `.env`).
* **Gmail SMTP**: Usado por el backend para enviar notificaciones por correo (ej. avisos si la API de Solar devuelve paneles con capacidad distinta a 400W).

---

## 🚀 Hitos Recientes Completados

### 1. Reescritura del Módulo de Mapas y Dibujo (Frontend)
Se eliminó la dependencia de la librería obsoleta `DrawingManager` de Google Maps que provocaba errores de carga.
* Se desarrolló una solución nativa basada en eventos de clic sobre el mapa para recopilar vértices.
* Se dibuja una línea temporal de guía hasta cerrar el polígono (mediante doble clic o clic en el vértice inicial).
* Al cerrarse, se genera un objeto interactivo `google.maps.Polygon` nativo que permite arrastrar y reposicionar sus vértices para ajustar el área de simulación, actualizando los paneles solares automáticamente.

### 2. Sincronización Real con Google Sheets (Backend)
Se verificó el pipeline que conecta NestJS con Google Sheets API en producción. El sistema:
* Lee en tiempo real valores como la eficiencia de instalación (95%), la degradación anual del panel (0.40%), y costos/tarifas específicos de la provincia.
* Realiza proyecciones financieras complejas a 20 años calculando VAN, TIR y Payback en vivo.

### 3. Solución de Bugs de Despliegue en Vercel (CI/CD)
* Se migró la configuración de despliegue a **Node.js 24.x**.
* Se resolvió el error de compilación en Vercel redirigiendo el directorio de salida del compilador de Angular a la carpeta correcta configurada en el panel del proyecto.
* Se actualizó la clave de API activa de Google Maps en los entornos del frontend (`environments.ts`, `environments.prod.ts` y `assets/env.json`), resolviendo el error del buscador de ubicaciones.

---

## 🔮 Siguientes Pasos y Roadmap Pendiente

Si deseas continuar con el desarrollo del proyecto, estas son las áreas prioritarias:

1. **Optimización del Diseño y UX (Paso 3):**
   * Mejorar el diseño estético de las tarjetas de resultados económicos y gráficos de flujo de fondos usando las pautas de diseño premium (HSL, gradientes y micro-animaciones) en el frontend.
2. **Pruebas de Carga e Integración:**
   * Validar la cuota de la API Solar de Google en producción bajo múltiples solicitudes concurrentes y el tiempo de respuesta de Google Sheets.
3. **Manejo de Roles / Autenticación:**
   * Extender el panel de control administrativo si en el futuro se requiere editar los parámetros directamente desde la web (actualmente se hace desde la hoja de cálculo de Google).
