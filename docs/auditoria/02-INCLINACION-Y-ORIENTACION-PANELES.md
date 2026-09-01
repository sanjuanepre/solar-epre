# INFORME TÉCNICO PERICIAL Y BASE DE CONTROL DE INGENIERÍA
## Módulo: Inclinación, Orientación y Factor de Captación del Tejado ($F_{\text{techo}}$)

---

### 1. Fundamentos Físicos y Geometría de Captación Solar en San Juan
La producción energética de un generador fotovoltaico depende directamente del ángulo de incidencia ($\theta$) con que los rayos solares interceptan el plano del módulo. En la Provincia de San Juan, situada en latitud $\phi \approx -31{,}53^\circ\text{ S}$, la optimización de captación anual exige maximizar la integral de irradiancia incidente en el plano del generador (*POA - Plane of Array*).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CUADRO DE ESPECIFICACIONES TÉCNICAS                                │
├────────────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Inclinación de Cubierta│ Inclinación real de cada vertiente: 0° <= β <= 90°                      │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Inclinación Óptima     │ β_opt = 30° (inclinación anual óptima para latitud -31.5° San Juan)     │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Azimut de Cubierta     │ γ: 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste                     │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Azimut Óptimo Anual    │ γ_opt = 0° (Norte Geográfico / Hacia el Ecuador)                        │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Factor de Techo        │ F_techo ∈ [0.50, 1.00] (Rendimiento angular relativo respecto al óptimo)│
└────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

#### Ecuación Fundamental del Ángulo de Incidencia Solar ($\theta$)
Para cualquier instante horario del año:
$$\begin{aligned}
  \cos(\theta) &= \sin(\delta)\sin(\phi)\cos(\beta) - \sin(\delta)\cos(\phi)\sin(\beta)\cos(\gamma) \\
               &\quad + \cos(\delta)\cos(\phi)\cos(\beta)\cos(\omega) + \cos(\delta)\sin(\phi)\sin(\beta)\cos(\gamma)\cos(\omega) \\
               &\quad + \cos(\delta)\sin(\beta)\sin(\gamma)\sin(\omega)
\end{aligned}$$
*Donde $\delta$ es la declinación solar ($-23{,}45^\circ \le \delta \le +23{,}45^\circ$), $\omega$ el ángulo horario solar y $\phi$ la latitud geodésica local.*

---

### 2. Descomposición por Segmentos de Tejado (*Roof Segments*)
A partir de la restitución altimétrica del Modelo Digital de Superficie (DSM), el tejado es segmentado en $K$ vertientes homogéneas. Cada vertiente $k \in \{1, \dots, K\}$ posee:
* **Inclinación natural**: $\beta_k = \text{pitchDegrees}_k \in [0^\circ, 60^\circ]$.
* **Orientación azimutal**: $\gamma_k = \text{azimuthDegrees}_k \in [0^\circ, 360^\circ)$.
* **Cantidad de módulos asignados**: $n_k = \text{panelsCount}_k \in \mathbb{N}_{\ge 0}$.

---

### 3. Modelo Matemático del Factor de Techo ($F_{\text{techo}}$)

#### Función Analítica de Pérdidas Angulares por Segmento ($k$)
$$\text{loss}_k = 1{,}2 \cdot \left[ 1 - \cos(\beta_k - \beta_{\text{opt}}) \right] + 0{,}8 \cdot \sin^2(\beta_k) \cdot \left[ 1 - \cos(\gamma_k) \right]$$
* Con $\beta_{\text{opt}} = 30^\circ = \frac{\pi}{6}\text{ rad}$.

#### Factor Ponderado Global del Generador
$$f_k = \max\left(0{,}50, \; 1 - \text{loss}_k\right)$$
$$F_{\text{techo}} = \frac{\sum_{k=1}^{K} f_k \cdot n_k}{\sum_{k=1}^{K} n_k}$$

---

### 4. Modos de Instalación y Corrección de Estructura Soporte

1. **Estructura Coplanar (Montaje rasante al tejado)**:
   $$E_{\text{DC}} = E_{\text{DC, Google}}$$
   Los paneles copian la inclinación y azimut natural de cada agua del tejado.
2. **Estructura Soporte con Ángulo Óptimo ($30^\circ$ Norte)**:
   $$E_{\text{DC, óptimo}} = \frac{E_{\text{DC, Google}}}{F_{\text{techo}}}$$
   Se corrigen las pérdidas por desvío de orientación e inclinación mediante estructuras soporte triangulares orientadas al Norte.

#### Ganancia Relativa de Captación ($\Delta G$)
$$\Delta G = \left( \frac{1}{F_{\text{techo}}} - 1 \right) \times 100\%$$

---

### 5. Validación Numérica y Casos Testigo en San Juan

| Tipología de Tejado | Geometría $(\beta, \gamma)$ | Pérdida ($\text{loss}$) | Factor $F_{\text{techo}}$ | Ganancia ($\Delta G$) |
| :--- | :---: | :---: | :---: | :---: |
| **Techo Plano (Losa horizontal)** | $\beta = 0^\circ, \gamma = \text{indif.}$ | $0{,}1608$ ($16{,}1\%$) | **$0{,}8392$** | **$+19{,}16\%$** |
| **Techo Norte Favorable** | $\beta = 15^\circ, \gamma = 0^\circ$ (Norte) | $0{,}0409$ ($4{,}1\%$) | **$0{,}9591$** | **$+4{,}26\%$** |
| **Techo Norte Óptimo** | $\beta = 30^\circ, \gamma = 0^\circ$ (Norte) | $0{,}0000$ ($0{,}0\%$) | **$1{,}0000$** | **$0{,}00\%$ (Base)** |
| **Techo Este / Oeste** | $\beta = 20^\circ, \gamma = 90^\circ / 270^\circ$ | $0{,}1116$ ($11{,}2\%$) | **$0{,}8884$** | **$+12{,}56\%$** |
| **Techo Desfavorable al Sur** | $\beta = 20^\circ, \gamma = 180^\circ$ (Sur) | $0{,}2052$ ($20{,}5\%$) | **$0{,}7948$** | **$+25{,}82\%$** |

#### Caso Multivertiente Complejo (Techo a Tres Aguas con 20 Paneles)
* Vertiente A (Norte, $\beta = 18^\circ, \gamma = 0^\circ$): 10 paneles $\to f_A = 0{,}9736$
* Vertiente B (Este, $\beta = 18^\circ, \gamma = 90^\circ$): 6 paneles $\to f_B = 0{,}9008$
* Vertiente C (Oeste, $\beta = 18^\circ, \gamma = 270^\circ$): 4 paneles $\to f_C = 0{,}9008$

$$F_{\text{techo}} = \frac{10 \times 0{,}9736 + 6 \times 0{,}9008 + 4 \times 0{,}9008}{20} = \mathbf{0{,}9372}$$
* **Resultado**: En estructura coplanar genera el $93{,}72\%$ del potencial óptimo. Con estructura orientada al Norte a $30^\circ$, la ganancia anual es del **$+6{,}70\%$**.
