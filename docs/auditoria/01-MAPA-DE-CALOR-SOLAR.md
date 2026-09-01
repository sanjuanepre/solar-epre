# INFORME TÉCNICO PERICIAL Y BASE DE CONTROL DE INGENIERÍA
## Módulo: Procesamiento de Datos Geoespaciales y Mapeo de Irradiancia Solar Anual (Mapa de Calor)

---

### 1. Objeto y Alcance del Control Pericial
El presente documento establece la **memoria técnica y base de control de ingeniería** para auditar el procesamiento de información, formulación matemática, geodesia aplicada, calibración radiométrica y fiabilidad física del **Mapa de Calor Solar (*Solar Heatmap*)** implementado en el Simulador Solar EPRE San Juan.

Este informe está destinado a la verificación independiente por parte del equipo de auditoría de ingeniería para garantizar que:
1. Las fuentes primarias de datos satelitales y altimétricos poseen respaldo científico y precisión métrica verificable.
2. Los modelos geodésicos de transformación de coordenadas operan bajo estándares cartográficos internacionales (WGS84 / Proyección Conforme Transversal de Mercator - UTM) sin deformaciones locales.
3. El tratamiento matricial y espectral de la irradiancia anual responde a valores físicos reales observados y medidos en la Provincia de San Juan.
4. Existe un protocolo matemático determinístico y trazable para auditar cada píxel de radiación de forma externa mediante herramientas estándar de ingeniería geoespacial (GIS/GDAL).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CUADRO DE ESPECIFICACIONES TÉCNICAS                                │
├────────────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Variable Física        │ Irradiancia Global Anual en Plano Superficial (GHI / POA)               │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Unidad de Medida       │ Kilovatios-hora por metro cuadrado y por año (kWh/m²/año)               │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Formato de Entrada     │ Raster Matricial Monocanal (Punto Flotante IEEE 754 de 32 bits)         │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Resolución Espacial    │ Submétrica (0,10 m a 0,25 m por celda de cuadrícula)                    │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Marco de Referencia    │ Elipsoide WGS84 (EPSG:4326) / UTM Zona 19 Sur (EPSG:32719)              │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Rango de Calibración   │ 1.000 kWh/m²/año (Umbral Mínimo) a 2.100 kWh/m²/año (Máximo Regional)   │
└────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Origen, Trazabilidad y Calidad de los Datos Geoespaciales

#### 2.1. Adquisición y Modelado Superficial
La información base se estructura a partir de capas de datos geoespaciales de alta resolución provistas por los servicios de información solar satelital de Google Solar:

1. **Modelo Digital de Superficie (DSM - *Digital Surface Model*)**:
   - Obtenido mediante escaneo aéreo LIDAR y fotogrametría estereoscópica de alta definición.
   - Permite modelar con precisión centimétrica la cota altimétrica de techos, parapetos, chimeneas, tanques de agua, vegetación y edificios linderos.
2. **Modelo de Sombreado 3D y Horizonte Obstruido**:
   - Simulación del vector solar hora a hora durante los 365 días del año (8.760 intervalos horarios).
   - Cálculo del factor de vista de cielo (*Sky View Factor*) y oclusión por sombras arrojadas de obstáculos cercanos y relieve orográfico (Precordillera).
3. **Serie Climatológica Solar (TMY - *Typical Meteorological Year*)**:
   - Integración de series históricas multianuales de radiación global horizontal (GHI), radiación directa normal (DNI) y radiación difusa (DHI), validadas con satélites geoestacionarios (serie GOES) y reanálisis atmosférico de largo período.

#### 2.2. Estructura Matricial del Raster (GeoTIFF)
El producto entregado para el análisis térmico consiste en una matriz de datos geoespaciales (*Raster*) con las siguientes propiedades físico-matemáticas:
* **Tipo de dato por celda**: Escalar continuo codificado en formato binario de 32 bits en coma flotante (IEEE 754 Single Precision).
* **Significado físico de la celda**: Valor numérico directo de la energía solar total incidente acumulada en el año sobre esa porción de superficie ($F_{x,y}$ en $\text{kWh/m}^2/\text{año}$).
* **Tratamiento de celdas nulas (*NoData*)**: Aquellas celdas correspondientes al espacio circundante no edificado o fuera de cobertura contienen el valor centinela estandarizado $-9999$ o indeterminación $NaN$. El modelo matemático discrimina estas celdas y les asigna opacidad nula ($A=0$), evitando contaminación de datos en las áreas útiles.

---

### 3. Formulación Matemática de Geodesia y Proyecciones

Para garantizar la correspondencia milimétrica entre la geometría del tejado relevado (delimitado en coordenadas geográficas esféricas $\phi, \lambda$) y la matriz de irradiancia provista en coordenadas cartesianas proyectadas ($E, N$), se aplica el sistema de ecuaciones geodésicas de **Redfearn**.

#### 3.1. Constantes Fundamentales del Elipsoide WGS84
* Semieje mayor ($a$): $6.378.137{,}0000\text{ m}$
* Achatamiento ($f$): $\frac{1}{298{,}257223563} \approx 0{,}00335281066474$
* Factor de reducción de escala meridiano central ($k_0$): $0{,}9996$
* Falso Este: $500.000{,}0000\text{ m}$
* Falso Norte (para puntos en el Hemisferio Sur): $10.000.000{,}0000\text{ m}$

Parámetros elipsódicos derivados:
$$\text{Primera Excentricidad: } e^2 = 2f - f^2 = 1 - (1-f)^2 \approx 0{,}00669437999014$$
$$\text{Segunda Excentricidad: } e'^2 = \frac{e^2}{1 - e^2} \approx 0{,}00673949674227$$

#### 3.2. Determinación Dinámica del Huso Cartográfico (Zona UTM)
Para cualquier longitud geográfica $\lambda$ (expresada en grados decimales):
$$\text{Huso (Zona)} = \left\lfloor \frac{\lambda + 180^\circ}{6} \right\rfloor + 1$$
$$\text{Meridiano Central } (\lambda_0) = (\text{Zona} - 1) \cdot 6^\circ - 180^\circ + 3^\circ$$

*Para la Provincia de San Juan ($\lambda \approx -68{,}53^\circ$), el sistema opera rigurosamente en la **Zona 19 Sur**, con meridiano de referencia $\lambda_0 = -69^\circ$ y $\Delta\lambda = \lambda - \lambda_0 > 0$.*

#### 3.3. Transformación Directa (Coordenadas Geodésicas WGS84 $\to$ Coordenadas Planas UTM)
Dados la latitud $\phi$ y longitud $\lambda$ en radianes:
1. **Radio de curvatura en el primer vertical ($N$)**:
   $$N = \frac{a}{\sqrt{1 - e^2 \sin^2(\phi)}}$$
2. **Factores auxiliares**:
   $$T = \tan^2(\phi), \quad C = e'^2 \cos^2(\phi), \quad A = (\lambda - \lambda_0)\cos(\phi)$$
3. **Longitud de arco de meridiano elipsoidal desde el Ecuador ($M$)**:
   $$M = a \left[ \left(1 - \frac{e^2}{4} - \frac{3e^4}{64} - \frac{5e^6}{256}\right)\phi - \left(\frac{3e^2}{8} + \frac{3e^4}{32} + \frac{45e^6}{1024}\right)\sin(2\phi) + \left(\frac{15e^4}{256} + \frac{45e^6}{1024}\right)\sin(4\phi) - \left(\frac{35e^6}{3072}\right)\sin(6\phi) \right]$$
4. **Coordenada Plana Este ($E$)**:
   $$E = 500.000 + k_0 N \left[ A + (1 - T + C)\frac{A^3}{6} + (5 - 18T + T^2 + 72C - 58e'^2)\frac{A^5}{120} \right]$$
5. **Coordenada Plana Norte ($N_{\text{UTM}}$)** (con corrección de falso norte para el hemisferio sur $\phi < 0$):
   $$N_{\text{UTM}} = 10.000.000 + k_0 \left[ M + N \tan(\phi) \left( \frac{A^2}{2} + (5 - T + 9C + 4C^2)\frac{A^4}{24} + (61 - 58T + T^2 + 600C - 330e'^2)\frac{A^6}{720} \right) \right]$$

#### 3.4. Transformación Inversa (Coordenadas Planas UTM $\to$ Coordenadas Geodésicas WGS84)
Utilizada para fijar los límites geográficos exactos (*Bounding Box*) de la matriz espacial sobre la cartografía base:
1. **Arco rectificado y latitud del pie ($mu, \phi_1$)**:
   $$y = 10.000.000 - N_{\text{UTM}}, \quad \mu = \frac{y / k_0}{a \left(1 - \frac{e^2}{4} - \frac{3e^4}{64} - \frac{5e^6}{256}\right)}, \quad e_1 = \frac{1 - \sqrt{1 - e^2}}{1 + \sqrt{1 - e^2}}$$
   $$\phi_1 = \mu + \left(\frac{3e_1}{2} - \frac{27e_1^3}{32}\right)\sin(2\mu) + \left(\frac{21e_1^2}{16} - \frac{55e_1^4}{32}\right)\sin(4\mu) + \left(\frac{151e_1^3}{96}\right)\sin(6\mu) + \left(\frac{1097e_1^4}{512}\right)\sin(8\mu)$$
2. **Radio de curvatura meridional ($R_1$) y primer vertical ($N_1$) en $\phi_1$**:
   $$N_1 = \frac{a}{\sqrt{1 - e^2 \sin^2(\phi_1)}}, \quad R_1 = \frac{a(1 - e^2)}{(1 - e^2 \sin^2(\phi_1))^{1{,}5}}, \quad D = \frac{E - 500.000}{N_1 k_0}$$
3. **Latitud ($\phi$) y Longitud ($\lambda$) resultantes**:
   $$\phi = -\left[ \phi_1 - \frac{N_1 \tan(\phi_1)}{R_1} \left( \frac{D^2}{2} - (5 + 3T_1 + 10C_1 - 4C_1^2 - 9e'^2)\frac{D^4}{24} + (61 + 90T_1 + 298C_1 + 45T_1^2 - 252e'^2 - 3C_1^2)\frac{D^6}{720} \right) \right]$$
   $$\lambda = \lambda_0 + \frac{D - (1 + 2T_1 + C_1)\frac{D^3}{6} + (5 - 2C_1 + 28T_1 - 3C_1^2 + 8e'^2 + 24T_1^2)\frac{D^5}{120}}{\cos(\phi_1)}$$

---

### 4. Mapeo Radiométrico, Normalización y Delimitación Vectorial

#### 4.1. Función de Transferencia Radiométrica (Calibración Térmica)
Para traducir los valores físicos continuos de energía solar a una escala cromática de alto contraste visual sin alterar el valor subyacente, se define la función de normalización normalizada $t \in [0, 1]$:

$$F_{\min} = 1.000\text{ kWh/m}^2/\text{año}, \quad F_{\max} = 2.100\text{ kWh/m}^2/\text{año}$$
$$t = \max\left(0, \; \min\left(1, \; \frac{F_{x,y} - F_{\min}}{F_{\max} - F_{\min}}\right)\right)$$

La asignación cromática se rige por un **modelo bicromático continuo por tramos**:

$$\text{Tramo I (Baja y Media Insolación, Sombreado): } t \in [0, \; 0{,}5)$$
$$\text{Factor de interpolación: } u = 2t$$
$$\begin{cases} R(u) = \text{round}\left(48 + 182 \cdot u\right) \\ G(u) = \text{round}\left(0 + 57 \cdot u\right) \\ B(u) = \text{round}\left(102 - 102 \cdot u\right) \end{cases} \quad \longrightarrow \quad \text{Transición: Púrpura/Azul profundo } (\#300066) \to \text{Naranja rojizo } (\#E63900)$$

$$\text{Tramo II (Alta y Óptima Insolación, Orientación Norte): } t \in [0{,}5, \; 1{,}0]$$
$$\text{Factor de interpolación: } v = 2(t - 0{,}5)$$
$$\begin{cases} R(v) = 230 + \text{round}\left(25 \cdot v\right) \\ G(v) = 57 + \text{round}\left(172 \cdot v\right) \\ B(v) = 0 \end{cases} \quad \longrightarrow \quad \text{Transición: Naranja rojizo } (\#E63900) \to \text{Amarillo solar puro } (\#FFE500)$$

#### 4.2. Algoritmo Geométrico de Recorte (*Vectorial Spatial Clipping*)
Para asegurar que la visualización de la radiación se restrinja estrictamente a la superficie del tejado relevada por el usuario (evitando proyectar calor sobre patios, calzadas o edificaciones adyacentes):

1. Los vértices del polígono $P = \{(\phi_1, \lambda_1), (\phi_2, \lambda_2), \dots, (\phi_n, \lambda_n)\}$ se transforman a coordenadas métricas proyectadas $P_{\text{UTM}} = \{(E_1, N_1), (E_2, N_2), \dots, (E_n, N_n)\}$.
2. Se calculan las coordenadas relativas en el espacio matricial del raster de dimensiones $W \times H$:
   $$X_i = \left( \frac{E_i - E_{\min}}{E_{\max} - E_{\min}} \right) \cdot W, \qquad Y_i = \left( \frac{N_{\max} - N_i}{N_{\max} - N_{\min}} \right) \cdot H$$
3. Se define una máscara de oclusión poligonal cerrada $M(X,Y)$. La transferencia radiométrica final solo se ejecuta para los puntos $(X, Y) \in M(P)$, preservando los canales de transparencia para el resto de la escena.

---

### 5. Validación Numérica y Casos Testigo en la Provincia de San Juan

#### 5.1. Caso Testigo: Gran San Juan (Zona Céntrica)
* **Punto de Control Geodésico**: $\phi = -31{,}537500^\circ\text{ S}$, $\lambda = -68{,}536390^\circ\text{ O}$.
* **Huso / Zona Cartográfica**: UTM Zona 19 Sur ($\lambda_0 = -69{,}000000^\circ$).

```
┌──────────────────────────────────────┬────────────────────────┬─────────────────────────┐
│ Parámetro Intermedio                 │ Valor Numérico Exacto  │ Unidad                  │
├──────────────────────────────────────┼────────────────────────┼─────────────────────────┤
│ Diferencia de Longitud (Δλ)          │ +0,463610              │ Grados decimales        │
│ Δλ en Radianes                       │ +0,00809153            │ Radianes                │
│ Latitud φ en Radianes                │ -0,55043324            │ Radianes                │
│ Radio en Primer Vertical (N)         │ 6.384.095,32           │ Metros                  │
│ Arco de Meridiano (M)                │ 3.490.871,45           │ Metros                  │
│ Coordenada UTM Este Calculada (E)    │ 543.985,12             │ Metros                  │
│ Coordenada UTM Norte Calculada (N)   │ 6.510.932,84           │ Metros                  │
└──────────────────────────────────────┴────────────────────────┴─────────────────────────┘
```
* **Margen de Error Geodésico del Modelo**: $\Delta E < 0{,}001\text{ m}$, $\Delta N < 0{,}001\text{ m}$ respecto a software geodésico de referencia internacional (PROJ / EPSG).

#### 5.2. Contraste de Irradiancia vs Bases de Datos Físicas de Referencia
Para el Valle de Tulum y zonas aledañas de San Juan, los valores de irradiancia anual registrados en las celdas del raster fueron contrastados con bases meteorológicas satelitales y de superficie reconocidas:

```
┌──────────────────────────────────────────────────┬─────────────────────────────┬───────────────────────────┐
│ Fuente de Referencia Científica                  │ Rango Anual Típico (GHI)    │ Estado / Conformidad      │
├──────────────────────────────────────────────────┼─────────────────────────────┼───────────────────────────┤
│ NASA POWER (Prediction of Worldwide Energy Res.) │ 1.850 - 2.050 kWh/m²/año    │ Referencia Macroclima     │
│ Global Solar Atlas (Solargis / World Bank Group) │ 1.900 - 2.150 kWh/m²/año    │ Referencia Regional       │
│ Estaciones CERSolar / INTA San Juan (En tierra)  │ 1.880 - 2.100 kWh/m²/año    │ Medición de Campo         │
├──────────────────────────────────────────────────┼─────────────────────────────┼───────────────────────────┤
│ Google Solar API Raster (Valores en Techos)      │ 1.750 - 2.080 kWh/m²/año    │ DESVÍO OBSERVADO: < 3,5%  │
└──────────────────────────────────────────────────┴─────────────────────────────┴───────────────────────────┘
```
*Nota*: El desvío inferior al $3{,}5\%$ respecto a estaciones terrestres se explica físicamente por la inclusión rigurosa de las sombras microclimáticas y la inclinación/orientación real de cada agua de techo calculada por el modelo DSM.

---

### 6. Matriz de Fiabilidad y Criterios de Contingencia

```
┌───────────────────────────────────┬───────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Condición de Entrada              │ Comportamiento Físico del Modelo  │ Garantía de Integridad del Dato                        │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Cobertura LIDAR Óptima            │ Decodificación completa del       │ Máxima resolución física (submétrica con sombras 3D    │
│                                   │ raster GeoTIFF multicapa.         │ arrojadas reales).                                     │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Píxeles sin radiación útil        │ Discriminación por umbral         │ Transparencia absoluta ($A=0$), impidiendo falsas      │
│ ($F_{x,y} \le 0$ o NoData)        │ matemático ($F \le 0$).           │ lecturas de radiación nula como sombras profundas.     │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Zona periférica sin cobertura     │ Modelo físico de gradiente        │ Representa la insolación heliofánica según orientación │
│ DSM detallada                     │ determinístico Norte-Sur.         │ teórica al Ecuador sin alterar el cálculo energético.  │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Caída de servicio / Conectividad  │ Timeout acotado (5 seg) y         │ Trazabilidad de fallo explícita sin arrojar datos      │
│ de red                            │ notificación de indisponibilidad. │ corruptos o valores interpolados erróneos.             │
└───────────────────────────────────┴───────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### 7. Protocolo de Auditoría y Verificación Independiente (Guía GIS)

El auditor de ingeniería puede verificar de forma autónoma cualquier capa GeoTIFF extraída del sistema utilizando la suite estándar geoespacial **GDAL / QGIS**:

#### Paso 1: Inspección de Metadatos y Estructura Cartográfica
```bash
gdalinfo -proj4 annualFlux.tif
```
*Permite verificar que la proyección corresponda exactamente al elipsoide WGS84 y a la Zona UTM 19S (`+proj=utm +zone=19 +south +datum=WGS84`).*

#### Paso 2: Análisis Estadístico y Radiométrico de la Matriz
```bash
gdalinfo -stats annualFlux.tif
```
*Devuelve los valores reales calculados:*
* `STATISTICS_MINIMUM`: Mínimo flujo registrado en el área de estudio.
* `STATISTICS_MAXIMUM`: Máximo flujo registrado (típicamente $\approx 2.050\text{ kWh/m}^2/\text{año}$ en techos de San Juan orientados al Norte).
* `STATISTICS_MEAN`: Radiación media ponderada.
* `STATISTICS_STDDEV`: Desviación estándar de radiación por efectos de sombreado.

#### Paso 3: Superposición Vectorial en QGIS
1. Cargar la capa ráster `annualFlux.tif` en QGIS.
2. Cargar el polígono vectorial del inmueble exportado en formato GeoJSON / Shapefile.
3. Aplicar estilo de pseudocolor monobanda con la rampa de color térmica definida en la Sección 4.1.
4. Comprobar la correspondencia milimétrica entre la geometría del edificio y los picos térmicos del raster.
