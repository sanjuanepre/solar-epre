# INFORME TÉCNICO PERICIAL Y BASE DE CONTROL DE INGENIERÍA
## Módulo: Potencia Variable, Dimensionamiento Físico y Algoritmo de Recálculo Dinámico

---

### 1. Especificación Física y Potencia Unitaria de Módulos
El simulador integra una arquitectura de potencia paramétrica que permite evaluar diferentes tecnologías y potencias comerciales de módulos fotovoltaicos en condiciones estándar de ensayo (STC: $G = 1.000\text{ W/m}^2$, $T = 25^\circ\text{C}$, $\text{AM} = 1{,}5$).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               ESPECIFICACIONES DE POTENCIA Y ESCALADO                            │
├────────────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Potencia Unitaria      │ P_panel ∈ [350 Wp, 650 Wp] (Rango comercial estándar monocristalino)    │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Potencia Base          │ P_base = 400 Wp (Módulo de referencia en consultas geoespaciales base)  │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Potencia Pico Total    │ P_inst [kWp] = (N_paneles × P_panel [Wp]) / 1000                        │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Restricción Regulatoria│ P_inst [kWp] <= P_max_asignada [kW] (Límite por acometida / tarifa EPRE)│
└────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Dimensiones Físicas, Ocupación de Superficie y Eficiencia STC

$$\text{Área Unitaria de Panel}: \quad A_{\text{panel}} = H \times W \quad [\text{m}^2]$$
$$\text{Eficiencia Fotoeléctrica Nominal}: \quad \eta_{\text{módulo}} = \frac{P_{\text{panel}}\text{ [W]}}{A_{\text{panel}}\text{ [m}^2\text{]} \times 1.000\text{ W/m}^2} \times 100\%$$
$$\text{Área Neta Ocupada}: \quad A_{\text{neta}} = N_{\text{paneles}} \times A_{\text{panel}} \quad [\text{m}^2]$$

| Categoría de Módulo | Dimensiones $(H \times W)$ | Área ($A_{\text{panel}}$) | Potencia ($P_{\text{panel}}$) | Eficiencia ($\eta$) |
| :--- | :---: | :---: | :---: | :---: |
| **Residencial Estándar (54 celdas)** | $1{,}72\text{ m} \times 1{,}13\text{ m}$ | $1{,}94\text{ m}^2$ | $400\text{ Wp}$ | **$20{,}6\%$** |
| **Residencial Alta Potencia** | $1{,}76\text{ m} \times 1{,}13\text{ m}$ | $1{,}99\text{ m}^2$ | $450\text{ Wp}$ | **$22{,}6\%$** |
| **Comercial / Industrial (72 celdas)** | $2{,}28\text{ m} \times 1{,}13\text{ m}$ | $2{,}58\text{ m}^2$ | $550\text{ Wp}$ | **$21{,}3\%$** |
| **Gran Escala (78 celdas Bifacial)** | $2{,}38\text{ m} \times 1{,}13\text{ m}$ | $2{,}69\text{ m}^2$ | $600\text{ Wp}$ | **$22{,}3\%$** |

* **Factor de Ocupación de Tejado (Ground Cover Ratio - GCR)**:
  $$A_{\text{neta}} \le 0{,}80 \times A_{\text{polígono}}$$

---

### 3. Algoritmo de Recálculo Dinámico por Factor de Escala

#### Definición del Factor de Escala de Potencia ($f_{\text{potencia}}$)
$$f_{\text{potencia}} = \frac{P_{\text{panel, nuevo}}}{P_{\text{panel, base}}} \qquad \text{con } P_{\text{panel, base}} = 400\text{ Wp}$$

#### Propagación Analítica en la Cadena de Cálculos
1. **Energía Generada AC**:
   $$E_{\text{AC, nuevo}} = E_{\text{AC, base}}(N_{\text{nuevo}}) \times f_{\text{potencia}} \times \left( \frac{1}{F_{\text{techo}}} \right)^{\delta_{\text{opt}}}$$
2. **Inversión Inicial**:
   $$I_0 = C_{\text{Wp}} \times \left( N_{\text{nuevo}} \times P_{\text{panel, nuevo}} \right) + C_{\text{medición}}$$
3. **Autoconsumo**:
   $$E_{\text{auto, nuevo}} = \min\left( C_{\text{anual}}, \; E_{\text{AC, nuevo}} \times p_{\text{auto}} \right)$$
4. **Inyección a Red**:
   $$E_{\text{iny, nuevo}} = E_{\text{AC, nuevo}} - E_{\text{auto, nuevo}}$$
5. **Mitigación de Emisiones GEI**:
   $$\text{GEI}_{\text{nuevo}} = E_{\text{AC, nuevo}} \times \text{EF}_{\text{grid}}$$

---

### 4. Control de Restricción Normativa de Potencia (EPRE / Distribuidora)
$$P_{\text{inst}}\text{ [kWp]} \le P_{\text{max, asignada}}\text{ [kW]}$$
Si $P_{\text{inst}} > P_{\text{max, asignada}}$, el sistema bloquea el sobredimensionamiento por encima de la capacidad de red autorizada.

---

### 5. Validación Numérica y Casos Testigo en San Juan (14 Paneles)

| Potencia Unitaria | Factor $f_{\text{pot}}$ | Potencia Pico | Generación ($E_{\text{AC}}$) | Autoconsumo / Inyección | Inversión ($I_0$) | Payback |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **400 Wp (Base)** | $1{,}000$ | $5{,}60\text{ kWp}$ | $8.820\text{ kWh/año}$ | $5.733\text{ / }3.087\text{ kWh}$ | $\$5.880\text{ USD}$ | **6,1 años** |
| **450 Wp** | $1{,}125$ | $6{,}30\text{ kWp}$ | $9.923\text{ kWh/año}$ | $6.450\text{ / }3.473\text{ kWh}$ | $\$6.615\text{ USD}$ | **6,0 años** |
| **550 Wp** | $1{,}375$ | $7{,}70\text{ kWp}$ | $12.128\text{ kWh/año}$ | $7.200\text{ / }4.928\text{ kWh}$ | $\$8.085\text{ USD}$ | **5,9 años** |
| **600 Wp** | $1{,}500$ | $8{,}40\text{ kWp}$ | $13.230\text{ kWh/año}$ | $7.200\text{ / }6.030\text{ kWh}$ | $\$8.820\text{ USD}$ | **6,2 años** |

*Nota de Auditoría sobre Saturación*: Al superar los $550\text{ Wp}$, el autoconsumo se satura en la demanda total anual ($7.200\text{ kWh}$), derivando el $100\%$ de la producción marginal hacia la inyección a la red de distribución.
