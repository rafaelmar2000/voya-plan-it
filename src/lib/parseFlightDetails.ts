/**
 * Utilities to extract structured flight metadata from parsed suggestion text.
 */

export interface FlightClassPrice {
  className: string;
  price: string;
  priceNumeric: number;
}

export interface FlightConnection {
  city: string;
  waitTime: string;
}

export interface FlightMeta {
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  schedule: string;
  connections: FlightConnection[];
  connectionLabel: string;
  classPrices: FlightClassPrice[];
}

function extractNumeric(price: string): number {
  const cleaned = price.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseFlightMeta(description: string, detailsText: string): FlightMeta {
  const combined = `${description}\n${detailsText}`;

  // Flight number
  const flightNumMatch = combined.match(/(?:voo|flight|n[úu]mero)?\s*(?:#?\s*)?([A-Z]{2,5}\s?\d{2,5})/i);
  const flightNumber = flightNumMatch ? flightNumMatch[1].trim() : "";

  // Schedule: extract "HH:MM - HH:MM" pattern from RESUMO line (e.g. "08:30 - 18:45")
  const scheduleMatch = combined.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  const departureTime = scheduleMatch ? scheduleMatch[1] : "";
  const arrivalTime = scheduleMatch ? scheduleMatch[2] : "";
  const schedule = scheduleMatch ? `${scheduleMatch[1]} - ${scheduleMatch[2]}` : "";

  // ── Connections ──
  const connections: FlightConnection[] = [];

  // Pattern 1: "Escala em PTY (Aeroporto X) por 48m"
  const connRegex1 = /(?:escala|conex[ãa]o|parada)\s*(?:em|:)?\s*([A-Za-zÀ-ú\s\(\)]+?)(?:por|com espera de|durante|[\-–])\s*(\d+h?\s*\d*\s*(?:min|m)?)/gi;
  let connMatch1;
  while ((connMatch1 = connRegex1.exec(combined)) !== null) {
    const city = connMatch1[1].replace(/\(.*?\)/g, "").trim();
    if (city.length > 1) {
      connections.push({ city, waitTime: connMatch1[2].trim() });
    }
  }

  // Pattern 2: "1 parada em PTY" ou "1 parada em Aeroporto Tocumen"
  const connRegex2 = /\d+\s*parada[s]?\s*(?:em|via)?\s*([A-Za-zÀ-ú\s\(\)]{3,40})/gi;
  let connMatch2;
  while ((connMatch2 = connRegex2.exec(combined)) !== null) {
    const city = connMatch2[1].replace(/\(.*?\)/g, "").trim();
    if (city.length > 1 && !connections.some(c => c.city.toLowerCase().includes(city.toLowerCase().slice(0, 5)))) {
      connections.push({ city, waitTime: "—" });
    }
  }

  // Pattern 3: formato "PTY (Aeroporto Internacional Tocumen) com espera de 0h48m"
  const connRegex3 = /([A-Z]{3})\s*\(([^)]+)\)\s*(?:com espera de|por)\s*(\d+h?\s*\d*\s*(?:min|m)?)/gi;
  let connMatch3;
  while ((connMatch3 = connRegex3.exec(combined)) !== null) {
    const city = `${connMatch3[2]} (${connMatch3[1]})`;
    if (!connections.some(c => c.city.includes(connMatch3![1]))) {
      connections.push({ city, waitTime: connMatch3[3].trim() });
    }
  }

  // Se ainda não encontrou conexões mas o texto menciona escala/parada, adiciona genérico
  if (connections.length === 0 && /escala|parada|conex[ãa]o/i.test(combined) && !/sem parada|nonstop/i.test(combined)) {
    const airportMatch = combined.match(/(?:em|via|airport)\s+([A-Z]{3})\b/);
    connections.push({ city: airportMatch ? airportMatch[1] : "Conexão", waitTime: "Ver detalhes" });
  }

  const hasDirectKeyword = /\bdireto\b/i.test(combined);
  const hasStopKeyword = /escala|parada|conex[ãa]o/i.test(combined);
  const isDirect = hasDirectKeyword && !hasStopKeyword;
  const connectionCount = connections.length;
  const connectionLabel = isDirect
    ? "Direto"
    : connectionCount === 1
      ? "1 Conexão"
      : connectionCount > 1
        ? `${connectionCount} Conexões`
        : hasStopKeyword ? "Com Escala" : "Direto";

  // ── Class prices ──
  const classPrices: FlightClassPrice[] = [];
  const seenClasses = new Set<string>();

  // Format 1: PRECO_ECONOMICA / PRECO_EXECUTIVA / PRECO_PRIMEIRA
  // Also supports PREÇO_ECONOMICA, PRECO ECONOMICA, etc.
  const taggedMap: Record<string, string[]> = {
    "Econômica": ["PRECO_ECONOMICA", "PREÇO_ECONOMICA", "PRECO_ECONÔMICA", "PREÇO_ECONÔMICA", "PRECO ECONOMICA"],
    "Executiva": ["PRECO_EXECUTIVA", "PREÇO_EXECUTIVA", "PRECO EXECUTIVA"],
    "Primeira Classe": ["PRECO_PRIMEIRA", "PREÇO_PRIMEIRA", "PRECO PRIMEIRA"],
  };
  for (const [label, tags] of Object.entries(taggedMap)) {
    for (const tag of tags) {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tagRegex = new RegExp(`${escaped}\\s*:?\\s*((?:R\\$|US\\$|\\$|€)\\s?[\\d.,]+(?:\\s*(?:mil|k))?)`, "i");
      const tagMatch = combined.match(tagRegex);
      if (tagMatch) {
        const price = tagMatch[1].trim();
        if (!seenClasses.has(label.toLowerCase())) {
          classPrices.push({ className: label, price, priceNumeric: extractNumeric(price) });
          seenClasses.add(label.toLowerCase());
        }
        break;
      }
    }
  }

  // Format 2: "Preço Econômica: R$ 3.200" or "Econômica: R$ 3.200"
  const inlinePatterns = [
    /(econ[oô]mica)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
    /(executiva)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
    /(premium)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
    /(primeira\s*classe)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
  ];

  for (const regex of inlinePatterns) {
    let cpMatch;
    while ((cpMatch = regex.exec(combined)) !== null) {
      let className = cpMatch[1].charAt(0).toUpperCase() + cpMatch[1].slice(1).toLowerCase();
      className = className.replace("Economica", "Econômica");
      if (seenClasses.has(className.toLowerCase())) continue;
      const price = cpMatch[2].trim();
      classPrices.push({ className, price, priceNumeric: extractNumeric(price) });
      seenClasses.add(className.toLowerCase());
    }
  }

  return { flightNumber, departureTime, arrivalTime, schedule, connections, connectionLabel, classPrices };
}
