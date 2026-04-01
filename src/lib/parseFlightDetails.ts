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

  // Pattern 1: "Conexão em Miami (2h30)" / "Escala: São Paulo - 1h45"
  const connRegex = /(?:conex[ãa]o|escala|parada)\s*(?:em|:)?\s*([A-Za-zÀ-ú\s]+?)[\s\-–]*\(?\s*(\d+h?\s*\d*\s*(?:min)?)\s*\)?/gi;
  let connMatch;
  while ((connMatch = connRegex.exec(combined)) !== null) {
    connections.push({ city: connMatch[1].trim(), waitTime: connMatch[2].trim() });
  }

  // Pattern 2: Bullet/numbered list under CONEXÕES header
  // e.g. "CONEXÕES:\n- Miami (MIA): 2h30 de espera\n- Bogotá (BOG): 1h45"
  const connSectionMatch = combined.match(/CONEX[ÕO]ES\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:[A-Z_]{4,}|$))/i);
  if (connSectionMatch) {
    const lines = connSectionMatch[1].split("\n");
    for (const line of lines) {
      const lineMatch = line.match(/[-•*]\s*(.+?)\s*[:\-–]\s*(\d+h?\s*\d*\s*(?:min)?)/i);
      if (lineMatch) {
        const city = lineMatch[1].replace(/\([A-Z]{3}\)/g, "").trim();
        if (!connections.some((c) => c.city.toLowerCase() === city.toLowerCase())) {
          connections.push({ city, waitTime: lineMatch[2].trim() });
        }
      }
    }
  }

  const isDirect = /\bdireto\b/i.test(combined) && connections.length === 0;
  const connectionCount = connections.length;
  const connectionLabel = isDirect || connectionCount === 0
    ? "Direto"
    : connectionCount === 1
      ? "1 Conexão"
      : `${connectionCount} Conexões`;

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

  return { flightNumber, departureTime, connections, connectionLabel, classPrices };
}
