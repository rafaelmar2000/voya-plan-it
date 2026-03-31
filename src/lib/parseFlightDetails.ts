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
  connectionLabel: string; // "Direto" | "1 Conexão" | "2 Conexões"
  classPrices: FlightClassPrice[];
}

function extractNumeric(price: string): number {
  const cleaned = price.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse flight metadata from the RESUMO (description) and DETALHES (detailsText) fields.
 */
export function parseFlightMeta(description: string, detailsText: string): FlightMeta {
  const combined = `${description}\n${detailsText}`;

  // Flight number: e.g. "AA 123", "LATAM 3469", "GOL 1234"
  const flightNumMatch = combined.match(/(?:voo|flight|n[úu]mero)?\s*(?:#?\s*)?([A-Z]{2,5}\s?\d{2,5})/i);
  const flightNumber = flightNumMatch ? flightNumMatch[1].trim() : "";

  // Departure time: e.g. "08:30", "14h00", "partida às 10:45"
  const timeMatch = combined.match(/(?:partida|sa[ií]da|decolagem|hor[áa]rio)?\s*(?:[àa]s?\s*)?(\d{1,2}[h:]\d{2})/i);
  const departureTime = timeMatch ? timeMatch[1].replace("h", ":") : "";

  // Connections: look for patterns like "Conexão em Miami (2h30)" or "Escala: São Paulo - 1h45"
  const connections: FlightConnection[] = [];
  const connRegex = /(?:conex[ãa]o|escala|parada)\s*(?:em|:)?\s*([A-Za-zÀ-ú\s]+?)[\s\-–]*\(?(\d+h?\d*(?:min)?)\)?/gi;
  let connMatch;
  while ((connMatch = connRegex.exec(combined)) !== null) {
    connections.push({
      city: connMatch[1].trim(),
      waitTime: connMatch[2].trim(),
    });
  }

  // If no structured connections found, check for "Direto" or count mentions
  const isDirect = /\bdireto\b/i.test(combined) && connections.length === 0;
  const connectionCount = connections.length;
  const connectionLabel = isDirect || connectionCount === 0
    ? "Direto"
    : connectionCount === 1
      ? "1 Conexão"
      : `${connectionCount} Conexões`;

  // Class prices: "Econômica: R$ 3.200" or "Executiva: R$ 8.500"
  const classPrices: FlightClassPrice[] = [];
  const classPriceRegex = /(econ[oô]mica|executiva|premium|primeira\s*classe)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi;
  let cpMatch;
  while ((cpMatch = classPriceRegex.exec(combined)) !== null) {
    const className = cpMatch[1].charAt(0).toUpperCase() + cpMatch[1].slice(1).toLowerCase();
    const price = cpMatch[2].trim();
    classPrices.push({
      className: className.replace("Econômica", "Econômica").replace("Economica", "Econômica"),
      price,
      priceNumeric: extractNumeric(price),
    });
  }

  return {
    flightNumber,
    departureTime,
    connections,
    connectionLabel,
    classPrices,
  };
}
