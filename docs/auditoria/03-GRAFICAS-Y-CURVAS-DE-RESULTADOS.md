# INFORME TÉCNICO PERICIAL Y BASE DE CONTROL DE INGENIERÍA
## Módulo: Modelado Matemático y Trazabilidad de las Gráficas de Resultados

---

### 1. Alcance y Taxonomía de las Curvas de Simulación
El módulo de resultados sintetiza el comportamiento técnico, económico y ambiental de la instalación a través de cuatro curvas visuales de ingeniería. Cada gráfica se construye de forma determinística a partir de los balances de energía, tarifas eléctricas vigentes del EPRE y parámetros de degradación física de los componentes.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               TAXONOMÍA DE LAS GRÁFICAS DE RESULTADOS                            │
├───────────────┬──────────────────────────────────────────────────────────────────────────────────┤
│ Gráfica 1     │ Balance y Flujo de Energía (Generación Solar vs. Consumo Histórico)              │
├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
│ Gráfica 2     │ Diagrama de Distribución Energética y Grado de Autosuficiencia (Donut)           │
├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
│ Gráfica 3     │ Flujo de Fondos Acumulado y Período de Recuperación (Payback a 20 Años)          │
├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
│ Gráfica 4     │ Mitigación de Emisiones GEI Evitadas (t CO2e) y Equivalencia Forestal            │
└───────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Gráfica 1: Balance y Flujo de Energía (Generación vs. Consumo)
Discrimina la interacción energética horaria y anual entre el generador solar, la demanda del inmueble y la red de distribución:

$$\text{Energía Generada Total (AC)}: \quad E_{\text{AC}} = E_{\text{DC}} \times \eta_{\text{instalación}}$$
$$\text{Energía Autoconsumida}: \quad E_{\text{auto}} = \min\left( C_{\text{anual}}, \; E_{\text{AC}} \times p_{\text{auto}} \right)$$
$$\text{Energía Excedente Inyectada a Red}: \quad E_{\text{iny}} = E_{\text{AC}} - E_{\text{auto}}$$
$$\text{Energía Remanente Demandada de Red}: \quad E_{\text{red}} = C_{\text{anual}} - E_{\text{auto}}$$

---

### 3. Gráfica 2: Distribución y Cuota de Autosuficiencia (Diagrama Donut)
* **Cuota de Autoconsumo**: $\text{CA} = \frac{E_{\text{auto}}}{E_{\text{AC}}} \times 100\%$
* **Cuota de Inyección**: $\text{CI} = \frac{E_{\text{iny}}}{E_{\text{AC}}} \times 100\%$
* **Grado de Autosuficiencia (Solar Fraction)**:
  $$\text{SF} = \frac{E_{\text{auto}}}{C_{\text{anual}}} \times 100\% \quad (\text{Porcentaje de factura evitado por energía propia})$$

---

### 4. Gráfica 3: Flujo de Fondos Acumulado y Período de Recuperación (Payback a 20 Años)
Modela la evolución temporal de los ingresos netos anuales frente a la inversión inicial:

$$\text{Inversión Inicial (Año 0)}: \quad I_0 = -\left( C_{\text{Wp}} \times P_{\text{inst}} + C_{\text{medición}} \right)$$
$$\text{Ahorro en Electricidad Año } t: \quad A_t = E_{\text{auto}, t} \times T_{\text{consumo}, t} \times (1 + \text{Impuestos})$$
$$\text{Ingreso por Inyección Año } t: \quad I_{\text{iny}, t} = E_{\text{iny}, t} \times T_{\text{inyección}, t}$$
$$\text{Costo Mantenimiento Año } t: \quad M_t = M_0 \times (1 + i_{\text{USD}})^{t-1}, \quad \text{con } M_0 = 0{,}01 \times |I_0|$$
$$\text{Flujo Neto Anual}: \quad F_t = A_t + I_{\text{iny}, t} - M_t$$
$$\text{Flujo Acumulado}: \quad \text{CF}_t = I_0 + \sum_{j=1}^{t} F_j, \qquad \text{para } t = 1, \dots, 20$$

#### Determinación Analítica del Payback (Meses de Recupero)
$$\text{Payback (Años)} = t^* + \frac{|\text{CF}_{t^*}|}{F_{t^*+1}}, \qquad \text{Payback (Meses)} = \text{round}\left( \text{Payback (Años)} \times 12 \right)$$

---

### 5. Curva Temporal de Degradación Física de Módulos ($d = 0{,}5\%/\text{año}$)
$$E_{\text{AC}}(t) = E_{\text{AC}}(1) \times (1 - d)^{t-1}, \qquad \text{con } d = 0{,}005 \text{ (0,5\% anual)}$$
$$\text{Generación Acumulada a 20 Años}: \quad E_{\text{total, 20a}} = E_{\text{AC}}(1) \times \sum_{t=1}^{20} (1 - d)^{t-1} \approx 19{,}03 \times E_{\text{AC}}(1)$$

---

### 6. Gráfica 4: Modelado de Impacto Ambiental y Emisiones GEI Evitadas
$$\text{Factor de Emisión de Red}: \quad \text{EF}_{\text{grid}} \approx 0{,}420\text{ kg CO}_2\text{e/kWh} = 0{,}00042\text{ t CO}_2\text{e/kWh}$$
$$\text{Emisiones Evitadas Anuales (Año } t): \quad \text{GEI}_t = E_{\text{AC}}(t) \times \text{EF}_{\text{grid}} \quad [\text{t CO}_2\text{e/año}]$$
$$\text{Emisiones Evitadas Acumuladas (20 Años)}: \quad \text{GEI}_{\text{acum}} = \sum_{t=1}^{20} \text{GEI}_t \quad [\text{t CO}_2\text{e}]$$
$$\text{Equivalencia en Árboles Adultos}: \quad N_{\text{árboles}} = \text{round}\left( \frac{\text{GEI}_{\text{anual, año 1}} \times 1000\text{ kg}}{22\text{ kg CO}_2/\text{árbol}\cdot\text{año}} \right)$$

---

### 7. Caso Testigo Numérico Integral (Instalación Residencial 5,5 kWp en San Juan)

| Variable Modelada en Gráfica | Valor Año 1 | Valor Año 10 | Valor Año 20 | Total Acumulado 20a |
| :--- | :---: | :---: | :---: | :---: |
| **Generación Solar ($E_{\text{AC}}$)** | $9.200\text{ kWh}$ | $8.795\text{ kWh}$ | $8.363\text{ kWh}$ | **$175.076\text{ kWh}$** |
| **Autoconsumo ($E_{\text{auto}}$)** | $5.980\text{ kWh}$ | $5.717\text{ kWh}$ | $5.436\text{ kWh}$ | **$113.799\text{ kWh}$** |
| **Inyección a Red ($E_{\text{iny}}$)** | $3.220\text{ kWh}$ | $3.078\text{ kWh}$ | $2.927\text{ kWh}$ | **$61.277\text{ kWh}$** |
| **Ahorro + Ingreso Neto ($F_t$)** | $\$895\text{ USD}$ | $\$1.042\text{ USD}$ | $\$1.218\text{ USD}$ | **$\$20.890\text{ USD}$** |
| **Flujo Acumulado ($\text{CF}_t$)** | $-\$4.905\text{ USD}$ | **$+\$3.840\text{ USD}$** | **$+\$15.090\text{ USD}$** | **Payback: 5,8 años** |
| **Emisiones Evitadas ($\text{GEI}_t$)** | $3{,}86\text{ t CO}_2\text{e}$ | $3{,}69\text{ t CO}_2\text{e}$ | $3{,}51\text{ t CO}_2\text{e}$ | **$73{,}5\text{ t CO}_2\text{e}$** |
