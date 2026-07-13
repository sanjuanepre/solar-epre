# Informe Técnico: Mapa de Calor e Inclinación de Estructuras

Este informe técnico describe los orígenes de datos, los modelos de procesamiento matemático, los niveles de precisión y los mecanismos de contingencia utilizados para las funcionalidades de **Mapa de Calor Solar** y **Ajuste de Estructuras por Inclinación** en el Simulador de Generación Solar Distribuida del E.P.R.E. San Juan.

---

## 1. Origen de los Datos

El simulador integra dos fuentes de información críticas para garantizar la exactitud geográfica y económica de la simulación:

### A. Google Solar API (Datos Geoespaciales 3D y Radiación)
Para cada consulta de ubicación o polígono dibujado por el usuario, el sistema consume dos endpoints de Google:
1. **Data Layers (Capas de Datos Ráster)**: Provee mapas de irradiancia solar en formato de alta resolución (GeoTIFF) donde cada píxel representa la energía solar anual que incide sobre esa porción exacta de superficie. También provee las máscaras de sombra (`fluxUrl`) que revelan el impacto de árboles, colinas o edificios cercanos a lo largo del año.
2. **Building Insights (Modelado 3D)**: Provee el modelo digital del edificio seleccionado. Contiene información precisa sobre:
   * **Inclinación natural del tejado** (`pitchDegrees`) para cada vertiente.
   * **Orientación del tejado** (`azimuthDegrees` donde 0° es el Norte, 90° Este, 180° Sur y 270° Oeste).
   * **Configuraciones recomendadas de paneles** e irradiancia solar acumulada históricamente.

### B. Google Sheets (Datos Económicos y Tarifas del E.P.R.E.)
Para evitar cálculos estáticos, las variables financieras se leen en tiempo real de una hoja de cálculo del E.P.R.E., asegurando que los resultados se ajusten a la realidad del mercado:
* **Cuadro Tarifario Oficial**: Tarifas de consumo e inyección en ARS/kWh para categorías como T1 (Residencial/General), T2 y T3 (Baja y Media tensión).
* **Parámetros Macroeconómicos**: Tipo de cambio oficial (ARS/USD) e inflación proyectada en dólares.
* **Costos Locales de Instalación**: Costo base del equipamiento solar por Watt pico (Wp), costo del equipo de medición bidireccional y costos de mantenimiento.

---

## 2. Procesamiento de los Datos (Modelo Matemático)

### A. Delimitación del Mapa de Calor Solar
Cuando el usuario delimita su tejado dibujando un polígono, el frontend procesa la capa ráster de flujo solar de Google (`fluxUrl`):
1. Se calcula el centroide geográfico y la caja de coordenadas del polígono.
2. Se realiza una operación de recorte geométrico por coordenadas (recorte espacial).
3. Se aplica un enmascaramiento visual en el navegador. La capa térmica se oculta fuera del polígono y se renderiza con opacidad graduable sobre el mapa híbrido únicamente dentro de los límites del tejado del usuario.
4. Los colores (morado/azul para sombras, naranja/rojo para alta radiación) informan visualmente las zonas idóneas para colocar los paneles.

### B. Optimización por Ángulo e Inclinación de Estructura
El simulador permite elegir entre dos modos de instalación:

#### I. Estructura Coplanar (Natural)
Los paneles se instalan paralelos al tejado, siguiendo su inclinación ($\beta$) y orientación ($\alpha$) naturales provistas por Google Solar API. La producción de energía se calcula directamente en base a la irradiancia incidente en esa inclinación natural.

#### II. Estructura con Inclinación Óptima (Estructura de Aluminio a 30° Norte)
Los paneles se montan sobre estructuras de soporte inclinadas para maximizar la captación. En la latitud de **San Juan (aprox. -31.5°)**, la configuración óptima anual consiste en una inclinación fija de **30°** orientada exactamente al **Norte** (azimut 0°).

Para calcular esta ganancia sin simulaciones horarias complejas, el backend ejecuta un **Modelo de Transposición y Pérdidas Angulares Relativas** para determinar el factor de rendimiento del tejado natural ($F_{\text{techo}}$) frente al plano óptimo:

$$F(\beta, \alpha) = 1 - \left[ 1.2 \cdot (1 - \cos(\beta - 30^\circ)) + 0.8 \cdot \sin^2(\beta) \cdot (1 - \cos(\alpha)) \right]$$

* **Pérdidas por desalineación de inclinación**: Representadas por el término $1.2 \cdot (1 - \cos(\beta - 30^\circ))$. Penaliza la desviación entre la pendiente del tejado ($\beta$) y los 30° óptimos.
* **Pérdidas por desalineación de azimut**: Representadas por el término $0.8 \cdot \sin^2(\beta) \cdot (1 - \cos(\alpha))$. Penaliza el desvío de la orientación del tejado ($\alpha$) respecto al Norte franco (0°), modulado por la inclinación (un tejado plano $\beta=0$ no tiene pérdidas por orientación).
* El factor resultante $F_{\text{techo}}$ representa el rendimiento de captación relativo (por ejemplo, un tejado Este-Oeste con 20° de inclinación puede tener un $F_{\text{techo}} = 0.85$, lo que indica que capta solo el 85% de la radiación óptima).

La producción optimizada al Norte ($E_{\text{estructura}}$) se estima entonces a partir de la producción coplanar ($E_{\text{techo}}$):

$$E_{\text{estructura}} = \frac{E_{\text{techo}}}{F_{\text{techo}}}$$

Al pasar a estructura óptima, la producción se incrementa en proporción directa a las pérdidas eliminadas (en el ejemplo, se incrementa un $\approx 17.6\%$).

---

## 3. Fiabilidad de la Información

### ¿Qué fiabilidad tienen los cálculos?
* **Radiación e Irradiancia**: **Muy Alta**. Google Solar API utiliza modelos meteorológicos y de irradiancia acumulada histórica de más de 20 años, considerando factores atmosféricos, nubosidad promedio de la región y la trayectoria solar.
* **Geometría y Sombras**: **Alta**. Los datos de inclinación, orientación y obstrucciones tridimensionales provienen de barridos LiDAR (detección por luz y distancia) de alta resolución y reconstrucciones aéreas en 3D.
* **Limitaciones**: La fiabilidad puede disminuir en áreas donde se hayan construido edificios altos o hayan crecido árboles con posterioridad al último barrido aéreo de Google.

---

## 4. Uso de Valores de Fallback (Mock)

Google Solar API cubre la gran mayoría de las zonas urbanas de la provincia, pero existen áreas rurales o de baja densidad catastral donde Google no dispone del modelo 3D del edificio. El simulador está diseñado para ser **robusto** ante estas situaciones:

* **Activación del Fallback (Mock)**: Si la API de Google retorna un error por falta de cobertura en las coordenadas indicadas, el backend intercepta el fallo y activa un modelo de simulación de contingencia basado en datos típicos de la provincia.
* **Datos Fallback Utilizados**:
  * Se asume una radiación de referencia típica para San Juan que rinde **567.2 kWh por cada panel solar instalado al año** (cálculo optimizado para San Juan).
  * Se asume un panel estándar de **400 W de capacidad** (medidas 1.879m x 1.045m).
  * Se realiza una **regresión lineal** dinámica sobre las curvas de generación para interpolar y escalar la energía en base a la cantidad exacta de paneles dibujados por el usuario.
* **Garantía Económica**: El flujo financiero, tarifas de inyección y consumo y la cotización del dólar **nunca se mockean**. Se siguen consultando las hojas oficiales del E.P.R.E., asegurando que el cálculo del ahorro monetario siga siendo 100% real.

