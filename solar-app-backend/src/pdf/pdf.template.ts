import { GeneratePdfDto } from './pdf.dto';
import { HEADER_LOGO_BASE64 } from './header-logo.base64';

export function buildPdfHtml(data: GeneratePdfDto, qrBase64?: string): string {
  const uniqueId = data.uniqueID || Math.random().toString(36).substring(2, 10).toUpperCase();
  const fechaStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const estructuraTexto =
    data.tipoEstructura === 'optimo'
      ? 'Estructura inclinada al Norte (30°)'
      : 'Coplanar al tejado (inclinación natural)';

  const formatMoneda = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  const formatNumero = (val: number, dec = 1) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(val || 0);

  const hasCharts = Boolean(
    data.chartImages &&
    (data.chartImages.energiaConsumo || data.chartImages.ahorroRecupero || data.chartImages.emisiones)
  );

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resultados Estimados - Calculadora Solar EPRE</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      padding: 12mm 15mm 12mm 15mm;
      font-size: 10pt;
      line-height: 1.4;
    }
    .page {
      position: relative;
      min-height: 270mm;
      box-sizing: border-box;
    }
    .page-break {
      page-break-before: always;
      padding-top: 12mm;
    }

    /* HEADER INSTITUCIONAL */
    .top-logo-bar {
      width: 100%;
      margin-bottom: 12px;
    }
    .top-logo-bar img {
      width: 100%;
      max-width: 100%;
      height: auto;
      display: block;
    }

    /* NAVY BANNER - EXECUTIVE MODERN STYLE */
    .banner-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 6px solid #0284c7;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .banner-title h1 {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .banner-title p {
      font-size: 8.5pt;
      color: #94a3b8;
    }
    .banner-meta {
      text-align: right;
    }
    .id-badge {
      display: inline-block;
      font-family: 'Courier New', Courier, monospace;
      background-color: rgba(255, 255, 255, 0.15);
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .date-badge {
      font-size: 8pt;
      color: #cbd5e1;
      margin-top: 3px;
    }

    /* GRID PANELES / KPI CARDS */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 5px solid #0284c7;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-accent-gold {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    .card-accent-green {
      border-left-color: #10b981;
      background-color: #f0fdf4;
    }
    .card-accent-purple {
      border-left-color: #6366f1;
      background-color: #f5f3ff;
    }
    .card-accent-cyan {
      border-left-color: #06b6d4;
      background-color: #ecfeff;
    }
    .card-accent-emerald {
      border-left-color: #059669;
      background-color: #ecfdf5;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .card-label {
      font-size: 8pt;
      text-transform: uppercase;
      color: #475569;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .card-icon {
      width: 18px;
      height: 18px;
      opacity: 0.85;
    }
    .card-value {
      font-size: 13.5pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .card-subtext {
      font-size: 7.8pt;
      color: #64748b;
      margin-top: 3px;
    }

    /* HIPOTESIS ADOPTADAS */
    .section-header {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hipotesis-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 8.5pt;
      margin-bottom: 12px;
    }
    .hipotesis-intro {
      color: #475569;
      margin-bottom: 8px;
      font-size: 8pt;
      line-height: 1.35;
    }
    .hipotesis-list {
      list-style: none;
    }
    .hipotesis-list li {
      margin-bottom: 4px;
      color: #334155;
      display: flex;
      align-items: flex-start;
    }
    .hipotesis-list li::before {
      content: "•";
      color: #0284c7;
      font-weight: bold;
      font-size: 11pt;
      margin-right: 6px;
      line-height: 1;
    }

    /* FOOTER CON QR CODE */
    .footer-container {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-info {
      font-size: 8pt;
      color: #64748b;
    }
    .footer-info strong {
      color: #0f172a;
    }
    .footer-url {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
      font-size: 8.5pt;
      margin-top: 2px;
      display: block;
    }
    .qr-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .qr-container img {
      width: 48px;
      height: 48px;
    }
    .qr-label {
      font-size: 7pt;
      color: #64748b;
      line-height: 1.2;
    }

    /* SECCION GRAFICAS - PAGINA 2 */
    .chart-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .chart-card-header {
      background-color: #1e293b;
      color: #ffffff;
      padding: 5px 12px;
      font-size: 8.5pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chart-card-header span.badge {
      background-color: #0284c7;
      color: #ffffff;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 7.5pt;
    }
    .chart-img-wrapper {
      padding: 6px 12px;
      text-align: center;
      background-color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .chart-img-wrapper img {
      width: 100%;
      max-width: 680px;
      max-height: 225px;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: RESUMEN Y RESULTADOS ESTIMADOS -->
  <div class="page">
    <div class="top-logo-bar">
      <img src="${HEADER_LOGO_BASE64}" alt="EPRE - Generacion Solar Distribuida San Juan" />
    </div>

    <div class="banner-header">
      <div class="banner-title">
        <h1>Resultados Estimados de Generación Solar</h1>
        <p>Simulador técnico-económico para usuarios de Generación Distribuida en San Juan</p>
      </div>
      <div class="banner-meta">
        <div class="id-badge">ID: ${uniqueId}</div>
        <div class="date-badge">Fecha: ${fechaStr}</div>
      </div>
    </div>

    <div class="grid-container">
      <!-- Card 1: Sistema Fotovoltaico -->
      <div class="card card-accent-gold">
        <div class="card-header-flex">
          <span class="card-label">Sistema Fotovoltaico</span>
          <svg class="card-icon" fill="none" stroke="#d97706" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        </div>
        <div class="card-value">${data.panelesCantidad} Paneles (${formatNumero(data.potenciaPicoKw, 2)} kWp)</div>
        <div class="card-subtext">Potencia individual: ${data.panelCapacityW} W | ${estructuraTexto}</div>
      </div>

      <!-- Card 2: Ahorro Anual Estimado -->
      <div class="card card-accent-green">
        <div class="card-header-flex">
          <span class="card-label">Ahorro Anual Estimado</span>
          <svg class="card-icon" fill="none" stroke="#059669" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="card-value">${formatNumero(data.ahorroEstimadoPesosAnual, 0)} USD/año</div>
        <div class="card-subtext">${data.ahorroPorcentajeAnual > 0 ? 'Equivalente al ' + formatNumero(data.ahorroPorcentajeAnual, 0) + '% de reducción anual en la factura eléctrica' : 'Ahorro económico anual estimado derivado de la instalación solar'}</div>
      </div>

      <!-- Card 3: Costo Estimado de Instalación -->
      <div class="card">
        <div class="card-header-flex">
          <span class="card-label">Costo Estimado de Instalación</span>
          <svg class="card-icon" fill="none" stroke="#0284c7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
        <div class="card-value">${formatMoneda(data.costoInstalacion)}</div>
        <div class="card-subtext">Llave en mano aproximado para ${formatNumero(data.superficieTechoM2, 1)} m² de superficie</div>
      </div>

      <!-- Card 4: Tiempo de Recupero -->
      <div class="card card-accent-purple">
        <div class="card-header-flex">
          <span class="card-label">Tiempo de Recupero</span>
          <svg class="card-icon" fill="none" stroke="#4f46e5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="card-value">${formatNumero(data.periodoRecuperoAnios, 1)} Años</div>
        <div class="card-subtext">Retorno estimado de la inversión inicial en años</div>
      </div>

      <!-- Card 5: Generación Anual Estimada -->
      <div class="card card-accent-cyan">
        <div class="card-header-flex">
          <span class="card-label">Generación Anual Estimada</span>
          <svg class="card-icon" fill="none" stroke="#0891b2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <div class="card-value">${formatNumero(data.generacionAnualKwh, 0)} kWh/año</div>
        <div class="card-subtext">Autoconsumo: ${formatNumero(data.proporcionAutoconsumo, 0)}% | Inyección a red: ${formatNumero(data.proporcionInyectada, 0)}%</div>
      </div>

      <!-- Card 6: Impacto Ambiental -->
      <div class="card card-accent-emerald">
        <div class="card-header-flex">
          <span class="card-label">Impacto Ambiental</span>
          <svg class="card-icon" fill="none" stroke="#059669" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
        </div>
        <div class="card-value">${formatNumero(data.emisionesGEIEvitadasTnAnual, 2)} Tn CO₂/año</div>
        <div class="card-subtext">Emisiones de gases de efecto invernadero evitadas anualmente</div>
      </div>
    </div>

    <div class="section-header">Hipótesis Adoptadas</div>
    <div class="hipotesis-box">
      <p class="hipotesis-intro">
        Los resultados de la evaluación a partir de la aplicación "Generación Solar Distribuida San Juan" deben considerarse aproximados y no representan opinión ni dictamen técnico formal del E.P.R.E. Se reproducen a modo de referencia adoptando las siguientes hipótesis:
      </p>
      <ul class="hipotesis-list">
        <li><strong>Categoría tarifaria seleccionada:</strong> &nbsp;${data.categoriaTarifa}</li>
        <li><strong>Tipo de estructura de montaje:</strong> &nbsp;${estructuraTexto}</li>
        <li><strong>Potencia contratada:</strong> &nbsp;${formatNumero(data.potenciaContratada, 1)} kW</li>
        <li><strong>Distribución del flujo de energía:</strong> &nbsp;${formatNumero(data.proporcionAutoconsumo, 0)}% autoconsumido en sitio, ${formatNumero(data.proporcionInyectada, 0)}% inyectado a la red de distribución.</li>
      </ul>
    </div>

    <div class="footer-container">
      <div class="footer-info">
        <strong>E.P.R.E. San Juan</strong> - Calculadora Solar Distribuida
        <a class="footer-url" href="https://solar.epresanjuan.gob.ar" target="_blank">https://solar.epresanjuan.gob.ar</a>
      </div>
      ${
        qrBase64
          ? `
      <div class="qr-container">
        <img src="${qrBase64}" alt="Código QR EPRE" />
        <div class="qr-label">
          Verificar simulador<br>
          <strong>E.P.R.E. San Juan</strong>
        </div>
      </div>
      `
          : ''
      }
    </div>
  </div>

  ${
    hasCharts
      ? `
  <!-- PÁGINA 2: GRÁFICAS -->
  <div class="page page-break">
    <div class="top-logo-bar">
      <img src="${HEADER_LOGO_BASE64}" alt="EPRE - Generacion Solar Distribuida San Juan" />
    </div>

    <div class="banner-header">
      <div class="banner-title">
        <h1>Gráficas y Proyecciones Solar</h1>
        <p>Análisis visual de energía, flujo financiero e impacto ambiental</p>
      </div>
      <div class="banner-meta">
        <div class="id-badge">ID: ${uniqueId}</div>
        <div class="date-badge">Página 2 de 2</div>
      </div>
    </div>

    ${
      data.chartImages?.energiaConsumo
        ? `
    <div class="chart-card">
      <div class="chart-card-header">
        <span class="badge">1</span>
        <span>Energía consumida y generada (kWh/año)</span>
      </div>
      <div class="chart-img-wrapper">
        <img src="${data.chartImages.energiaConsumo}" alt="Gráfica Energía Consumida y Generada" />
      </div>
    </div>
    `
        : ''
    }

    ${
      data.chartImages?.ahorroRecupero
        ? `
    <div class="chart-card">
      <div class="chart-card-header">
        <span class="badge">2</span>
        <span>Ahorros anuales y punto de recupero de la inversión</span>
      </div>
      <div class="chart-img-wrapper">
        <img src="${data.chartImages.ahorroRecupero}" alt="Gráfica Ahorros Anuales y Recupero" />
      </div>
    </div>
    `
        : ''
    }

    ${
      data.chartImages?.emisiones
        ? `
    <div class="chart-card">
      <div class="chart-card-header">
        <span class="badge">3</span>
        <span>Emisiones de CO₂ evitadas acumuladas</span>
      </div>
      <div class="chart-img-wrapper">
        <img src="${data.chartImages.emisiones}" alt="Gráfica Emisiones CO2 Evitadas" />
      </div>
    </div>
    `
        : ''
    }

    <div class="footer-container" style="margin-top: 10px;">
      <div class="footer-info">
        <strong>E.P.R.E. San Juan</strong> - Calculadora Solar Distribuida
        <a class="footer-url" href="https://solar.epresanjuan.gob.ar" target="_blank">https://solar.epresanjuan.gob.ar</a>
      </div>
    </div>
  </div>
  `
      : ''
  }

</body>
</html>
  `;
}
