import { GeneratePdfDto } from './pdf.dto';

export function buildPdfHtml(data: GeneratePdfDto): string {
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
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      padding: 15mm 15mm 20mm 15mm;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0284c7;
      margin-bottom: 16px;
    }
    .brand {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 8.5pt;
      color: #0284c7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-badge {
      text-align: right;
    }
    .id-tag {
      font-family: monospace;
      background-color: #f1f5f9;
      color: #334155;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      border: 1px solid #cbd5e1;
    }
    .date-tag {
      font-size: 8pt;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-title {
      text-align: center;
      margin-bottom: 16px;
    }
    .doc-title h1 {
      font-size: 15pt;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title p {
      font-size: 9pt;
      color: #64748b;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid #0284c7;
    }
    .card-accent-gold {
      border-left-color: #f59e0b;
      background-color: #fffbebf5;
    }
    .card-accent-green {
      border-left-color: #10b981;
      background-color: #f0fdf4;
    }
    .card-label {
      font-size: 8.5pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
    }
    .card-subtext {
      font-size: 8pt;
      color: #475569;
      margin-top: 2px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
    }
    .hipotesis-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      font-size: 9pt;
      margin-bottom: 16px;
    }
    .hipotesis-intro {
      color: #475569;
      margin-bottom: 8px;
      font-size: 8.5pt;
    }
    .hipotesis-list {
      list-style: none;
    }
    .hipotesis-list li {
      margin-bottom: 4px;
      color: #1e293b;
    }
    .hipotesis-list strong {
      color: #0f172a;
    }
    .chart-container {
      margin-top: 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .footer {
      position: fixed;
      bottom: 10mm;
      left: 15mm;
      right: 15mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    .footer a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <span class="brand-title">E.P.R.E. SAN JUAN</span>
      <span class="brand-sub">Ente Provincial Regulador de la Electricidad</span>
    </div>
    <div class="meta-badge">
      <div class="id-tag">ID: ${uniqueId}</div>
      <div class="date-tag">Fecha: ${fechaStr}</div>
    </div>
  </div>

  <div class="doc-title">
    <h1>Resultados Estimados de Generación Solar</h1>
    <p>Simulador técnico-económico para usuarios de Generación Distribuida en San Juan</p>
  </div>

  <div class="grid-container">
    <div class="card card-accent-gold">
      <div class="card-label">Sistema Fotovoltaico</div>
      <div class="card-value">${data.panelesCantidad} Paneles (${formatNumero(data.potenciaPicoKw, 2)} kWp)</div>
      <div class="card-subtext">Potencia individual: ${data.panelCapacityW} W | Estructura: ${data.tipoEstructura === 'optimo' ? 'Óptima 30°' : 'Coplanar'}</div>
    </div>

    <div class="card card-accent-green">
      <div class="card-label">Ahorro Anual Estimado</div>
      <div class="card-value">${formatMoneda(data.ahorroEstimadoPesosAnual)}</div>
      <div class="card-subtext">Equivalente al ${formatNumero(data.ahorroPorcentajeAnual, 0)}% de reducción anual en tu factura eléctrica</div>
    </div>

    <div class="card">
      <div class="card-label">Costo Estimado de Instalación</div>
      <div class="card-value">${formatMoneda(data.costoInstalacion)}</div>
      <div class="card-subtext">Llave en mano aproximado para ${formatNumero(data.superficieTechoM2, 1)} m² de superficie</div>
    </div>

    <div class="card">
      <div class="card-label">Tiempo de Recupero</div>
      <div class="card-value">${formatNumero(data.periodoRecuperoAnios, 1)} Años</div>
      <div class="card-subtext">Retorno estimado de la inversión inicial en años</div>
    </div>

    <div class="card">
      <div class="card-label">Generación Anual Estimada</div>
      <div class="card-value">${formatNumero(data.generacionAnualKwh, 0)} kWh/año</div>
      <div class="card-subtext">Autoconsumo: ${formatNumero(data.proporcionAutoconsumo, 0)}% | Inyección a red: ${formatNumero(data.proporcionInyectada, 0)}%</div>
    </div>

    <div class="card">
      <div class="card-label">Impacto Ambiental</div>
      <div class="card-value">${formatNumero(data.emisionesGEIEvitadasTnAnual, 2)} Tn CO₂/año</div>
      <div class="card-subtext">Emisiones de gases de efecto invernadero evitadas anualmente</div>
    </div>
  </div>

  <div class="section-title">Hipótesis Adoptadas</div>
  <div class="hipotesis-box">
    <p class="hipotesis-intro">
      Los resultados de la evaluación a partir de la aplicación "Generación Solar Distribuida San Juan" deben considerarse aproximados y no representan opinión ni dictamen técnico formal del E.P.R.E. Se reproducen a modo de referencia adoptando las siguientes hipótesis:
    </p>
    <ul class="hipotesis-list">
      <li>• <strong>Categoría tarifaria seleccionada:</strong> ${data.categoriaTarifa}</li>
      <li>• <strong>Tipo de estructura de montaje:</strong> ${estructuraTexto}</li>
      <li>• <strong>Potencia contratada:</strong> ${formatNumero(data.potenciaContratada, 1)} kW</li>
      <li>• <strong>Distribución del flujo de energía:</strong> ${formatNumero(data.proporcionAutoconsumo, 0)}% autoconsumido en sitio, ${formatNumero(data.proporcionInyectada, 0)}% inyectado a la red de distribución.</li>
    </ul>
  </div>

  <div class="footer">
    <span>E.P.R.E. San Juan - Calculadora Solar Distribuida</span>
    <a href="https://solar.epresanjuan.gob.ar" target="_blank">https://solar.epresanjuan.gob.ar</a>
  </div>

</body>
</html>
  `;
}
