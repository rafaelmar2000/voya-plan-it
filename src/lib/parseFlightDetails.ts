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

  // Schedule
  const scheduleMatch = combined.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  const departureTime = scheduleMatch ? scheduleMatch[1] : "";
  const arrivalTime = scheduleMatch ? scheduleMatch[2] : "";
  const schedule = scheduleMatch ? `${scheduleMatch[1]} - ${scheduleMatch[2]}` : "";

  // ── Connections ──
  // Estratégia: usar APENAS o número de paradas do texto, não tentar extrair cada conexão
  // para evitar duplicatas. Extrai a primeira ocorrência de cada aeroporto/cidade.
  const connections: FlightConnection[] = [];
  const seenCities = new Set<string>();

  // Padrão principal: "X parada(s) em CIDADE (AEROPORTO) com duração de Xh Xm"
  // ou "escala em CIDADE por Xh"
  const mainPattern = /(?:(\d+)\s*parada[s]?\s*em|escala\s*em|conex[ãa]o\s*em)\s+([A-Za-zÀ-ú\s]+?)(?:\s*\([^)]*\))?\s*(?:com\s*(?:dura[çc][ãa]o|espera)\s*de|por)\s*([\dhm\s]+)/gi;
  let m;
  while ((m = mainPattern.exec(combined)) !== null) {
    const city = m[2].trim();
    const waitTime = m[3].trim();
    const key = city.slice(0, 6).toLowerCase();
    if (!seenCities.has(key)) {
      seenCities.add(key);
      connections.push({ city, waitTime });
    }
  }

  // Se não encontrou pelo padrão principal, tenta padrão simples de IATA
  if (connections.length === 0) {
    const iataPattern = /(?:escala|parada|conex[ãa]o)\s*(?:em|via)?\s*([A-Z]{3})\b/gi;
    while ((m = iataPattern.exec(combined)) !== null) {
      const city = m[1];
      if (!seenCities.has(city)) {
        seenCities.add(city);
        connections.push({ city, waitTime: "—" });
      }
    }
  }

  // Conta paradas pelo número explícito no texto (mais confiável que contar conexões)
  const numParadasMatch = combined.match(/(\d+)\s*parada[s]?/i);
  const numParadas = numParadasMatch ? parseInt(numParadasMatch[1]) : connections.length;

  const hasDirectKeyword = /\bdireto\b|\bsem\s*parada[s]?\b|\bnonstop\b/i.test(combined);
  const hasStopKeyword = /\bescala\b|\bparada\b|\bconex[ãa]o\b/i.test(combined);
  const isDirect = hasDirectKeyword && !hasStopKeyword;

  const connectionLabel = isDirect
    ? "Direto"
    : numParadas === 1
      ? "1 Parada"
      : numParadas > 1
        ? `${numParadas} Paradas`
        : hasStopKeyword ? "Com Escala" : "Direto";

  // ── Class prices ──
  const classPrices: FlightClassPrice[] = [];
  const seenClasses = new Set<string>();

  const taggedMap: Record<string, string[]> = {
    "Econômica": ["PRECO_ECONOMICA", "PREÇO_ECONOMICA", "PRECO_ECONÔMICA", "PREÇO_ECONÔMICA"],
    "Executiva": ["PRECO_EXECUTIVA", "PREÇO_EXECUTIVA"],
    "Primeira Classe": ["PRECO_PRIMEIRA", "PREÇO_PRIMEIRA"],
  };

  for (const [label, tags] of Object.entries(taggedMap)) {
    for (const tag of tags) {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tagRegex = new RegExp(`${escaped}\\s*:?\\s*((?:R\\$|US\\$|\\$|€)\\s?[\\d.,]+)`, "i");
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

  // Padrões inline como fallback
  const inlinePatterns = [
    /(econ[oô]mica)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
    /(executiva)\s*:?\s*((?:R\$|US\$|\$|€)\s?[\d.,]+)/gi,
  ];

  for (const regex of inlinePatterns) {
    let cp;
    while ((cp = regex.exec(combined)) !== null) {
      let className = cp[1].charAt(0).toUpperCase() + cp[1].slice(1).toLowerCase();
      className = className.replace("Economica", "Econômica");
      if (seenClasses.has(className.toLowerCase())) continue;
      classPrices.push({ className, price: cp[2].trim(), priceNumeric: extractNumeric(cp[2]) });
      seenClasses.add(className.toLowerCase());
    }
  }

  return { flightNumber, departureTime, arrivalTime, schedule, connections, connectionLabel, classPrices };
}
