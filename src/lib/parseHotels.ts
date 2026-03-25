export type ParsedSuggestionKind = "hotel" | "flight" | "attraction" | "generic";

export interface ParsedExtendedDetails {
  raw: string;
  internetSpeed?: string;
  equipmentSecurity?: string;
  workspaceDetails?: string;
  logistics?: string[];
  photographyTips: string[];
  schedule: string[];
  lightingTips: string[];
}

export interface ParsedHotel {
  name: string;
  price: string;
  location: string;
  description: string;
  highlights: string[];
  badge: string;
  kind: ParsedSuggestionKind;
  extendedDetails: ParsedExtendedDetails;
}



const TAGGED_FIELDS = ["NOME", "PRECO", "RESUMO", "FOTO", "DETALHES_EXTENDIDOS", "DETALHES_TECNICOS"] as const;
const TECHNICAL_DETAIL_TAGS = ["WIFI", "SEGURANCA", "WORKSPACE", "LOGISTICA"] as const;

type TechnicalDetailTag = (typeof TECHNICAL_DETAIL_TAGS)[number];

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanBullet(line: string): string {
  return normalizeText(line.replace(/^[-•✓✔]\s*/, ""));
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.map((item) => normalizeText(item)).filter(Boolean))];
}

function extractTaggedValue(block: string, tag: (typeof TAGGED_FIELDS)[number]): string {
  const pairedRegex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "i");
  const pairedMatch = block.match(pairedRegex);
  if (pairedMatch) return normalizeText(pairedMatch[1]);

  const nextTags = TAGGED_FIELDS.filter((field) => field !== tag).join("|");
  const inlineRegex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\s*\\[(?:${nextTags})\\]|$)`, "i");
  const inlineMatch = block.match(inlineRegex);
  return inlineMatch ? normalizeText(inlineMatch[1]) : "";
}

function extractLabeledValue(line: string): string {
  const [, value = ""] = line.split(/:\s*/, 2);
  return normalizeText(value);
}

function hasTechnicalDetailTags(block: string): boolean {
  return TECHNICAL_DETAIL_TAGS.some((tag) => new RegExp(`(?:^|\\n)\\s*${tag}:`, "i").test(block));
}

function extractTechnicalTagValue(block: string, tag: TechnicalDetailTag): string {
  const normalizedBlock = block.replace(/\r/g, "");
  const startRegex = new RegExp(`(?:^|\\n)\\s*${tag}:\\s*`, "i");
  const startMatch = startRegex.exec(normalizedBlock);

  if (!startMatch || startMatch.index === undefined) return "";

  const contentStart = startMatch.index + startMatch[0].length;
  const endRegex = /\n\s*(?:WIFI|SEGURANCA|WORKSPACE|LOGISTICA):|\n\s*\[FIM_DETALHES\]|$/gi;
  endRegex.lastIndex = contentStart;

  const endMatch = endRegex.exec(normalizedBlock);
  const contentEnd = endMatch ? endMatch.index : normalizedBlock.length;

  return normalizeText(normalizedBlock.slice(contentStart, contentEnd));
}

function removeTechnicalTagBlocks(block: string): string {
  const normalizedBlock = block.replace(/\r/g, "");

  if (!hasTechnicalDetailTags(normalizedBlock)) {
    return normalizeText(normalizedBlock.replace(/\[FIM_DETALHES\]/gi, ""));
  }

  const markerRegex = /(?:^|\n)\s*(WIFI|SEGURANCA|WORKSPACE|LOGISTICA):\s*/gi;
  const markers = Array.from(normalizedBlock.matchAll(markerRegex)).map((match) => ({
    start: match.index ?? 0,
    contentStart: (match.index ?? 0) + match[0].length,
  }));

  let cursor = 0;
  let remaining = "";

  markers.forEach((marker, index) => {
    const nextMarkerStart = index < markers.length - 1 ? markers[index + 1].start : -1;
    const closingMatch = /\n\s*\[FIM_DETALHES\]/i.exec(normalizedBlock.slice(marker.contentStart));
    const closingIndex = closingMatch ? marker.contentStart + closingMatch.index : -1;
    const blockEndCandidates = [nextMarkerStart, closingIndex].filter((value) => value >= 0);
    const blockEnd = blockEndCandidates.length > 0 ? Math.min(...blockEndCandidates) : normalizedBlock.length;

    remaining += normalizedBlock.slice(cursor, marker.start);
    cursor = blockEnd;
  });

  remaining += normalizedBlock.slice(cursor);
  return normalizeText(remaining.replace(/\[FIM_DETALHES\]/gi, ""));
}

function stripLeadingLabel(line: string): string {
  return normalizeText(line.replace(/^[A-ZÇ_ ]+\s*:\s*/i, ""));
}

function extractLocation(...sources: string[]): string {
  const combined = sources.filter(Boolean).join("\n");
  const match = combined.match(
    /(?:localiza[çc][ãa]o|localizado|fica|bairro|regi[ãa]o|endere[çc]o|em)\s*:?\s*([^\n.,]{3,60})/i,
  );
  return match ? normalizeText(match[1].replace(/\*+/g, "")) : "";
}

function detectKind(name: string, summary: string, details: string): ParsedSuggestionKind {
  const source = `${name} ${summary} ${details}`.toLowerCase();
  if (/(?:voo|flight|partida|chegada|embarque|terminal|escala)/.test(source)) return "flight";
  if (/(?:atra[çc][ãa]o|attraction|museu|parque|ingresso|golden hour|p[ôo]r do sol)/.test(source)) return "attraction";
  if (/(?:hotel|resort|hostel|pousada|quarto|di[áa]ria)/.test(source)) return "hotel";
  return "generic";
}

function parseExtendedDetails(rawDetails: string): ParsedExtendedDetails {
  const details: ParsedExtendedDetails = {
    raw: normalizeText(rawDetails),
    photographyTips: [],
    schedule: [],
    lightingTips: [],
    logistics: [],
  };

  const normalizedRawDetails = rawDetails.replace(/\r/g, "");
  const hasExactTechnicalTags = hasTechnicalDetailTags(normalizedRawDetails);

  if (hasExactTechnicalTags) {
    details.internetSpeed = extractTechnicalTagValue(normalizedRawDetails, "WIFI") || undefined;
    details.equipmentSecurity = extractTechnicalTagValue(normalizedRawDetails, "SEGURANCA") || undefined;
    details.workspaceDetails = extractTechnicalTagValue(normalizedRawDetails, "WORKSPACE") || undefined;

    const logisticsValue = extractTechnicalTagValue(normalizedRawDetails, "LOGISTICA");
    if (logisticsValue) {
      details.logistics = dedupe(
        logisticsValue
          .split(/\n+/)
          .map((item) => cleanBullet(item))
          .filter(Boolean),
      );
    }
  }

  const fallbackSource = hasExactTechnicalTags ? removeTechnicalTagBlocks(normalizedRawDetails) : normalizedRawDetails;

  const fallbackBullets: string[] = [];
  const lines = fallbackSource
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let activeSection: "photography" | "schedule" | "lighting" | null = null;

  for (const originalLine of lines) {
    const line = normalizeText(originalLine);
    const bullet = cleanBullet(originalLine);

    if (/^wifi\s*:/i.test(line)) {
      details.internetSpeed = stripLeadingLabel(line);
      activeSection = null;
      continue;
    }

    if (/^seguran[çc]a\s*:/i.test(line)) {
      details.equipmentSecurity = stripLeadingLabel(line);
      activeSection = null;
      continue;
    }

    if (/^workspace\s*:/i.test(line)) {
      details.workspaceDetails = stripLeadingLabel(line);
      activeSection = null;
      continue;
    }

    if (/^log[ií]stica\s*:/i.test(line)) {
      details.logistics?.push(stripLeadingLabel(line));
      activeSection = "schedule";
      continue;
    }

    if (/^(?:velocidade\s+de\s+internet|wi-?fi|internet)\s*:/i.test(line)) {
      details.internetSpeed = extractLabeledValue(line);
      activeSection = null;
      continue;
    }

    if (/^(?:seguran[çc]a\s+de\s+equipamento|seguran[çc]a(?:\s+para)?\s+equipamentos?|equipment security)\s*:/i.test(line)) {
      details.equipmentSecurity = extractLabeledValue(line);
      activeSection = null;
      continue;
    }

    if (/^(?:fotos?\s+do\s+workspace|workspace|coworking)\s*:/i.test(line)) {
      details.workspaceDetails = extractLabeledValue(line);
      activeSection = null;
      continue;
    }

    const photographyMatch = line.match(/^(?:dicas?\s+de\s+fotografia|fotografia|photo tips)\s*:?(.*)$/i);
    if (photographyMatch) {
      const inlineValue = normalizeText(photographyMatch[1] || "");
      if (inlineValue) details.photographyTips.push(inlineValue);
      activeSection = "photography";
      continue;
    }

    const scheduleMatch = line.match(/^(?:hor[aá]rios?|partida|chegada|embarque|abertura|fechamento|dura[çc][ãa]o|check-?in|check-?out)\s*:?(.*)$/i);
    if (scheduleMatch) {
      const inlineValue = normalizeText(scheduleMatch[1] || "");
      details.schedule.push(inlineValue ? `${line.split(":", 1)[0]}: ${inlineValue}` : line);
      activeSection = "schedule";
      continue;
    }

    const lightingMatch = line.match(/^(?:golden\s+hour|tipo\s+de\s+luz|luz\s+ideal|melhor\s+luz|ilumina[çc][ãa]o)\s*:?(.*)$/i);
    if (lightingMatch) {
      const inlineValue = normalizeText(lightingMatch[1] || "");
      details.lightingTips.push(inlineValue ? `${line.split(":", 1)[0]}: ${inlineValue}` : line);
      activeSection = "lighting";
      continue;
    }

    if (/^[-•✓✔]/.test(originalLine)) {
      if (activeSection === "photography") details.photographyTips.push(bullet);
      else if (activeSection === "schedule") details.schedule.push(bullet);
      else if (activeSection === "lighting") details.lightingTips.push(bullet);
      else fallbackBullets.push(bullet);
      continue;
    }

    if (activeSection === "photography") details.photographyTips.push(line);
    else if (activeSection === "schedule") details.schedule.push(line);
    else if (activeSection === "lighting") details.lightingTips.push(line);
  }

  if (!details.internetSpeed) {
    const speedMatch = fallbackSource.match(/(?:velocidade\s+de\s+internet|wi-?fi|internet)\s*:?\s*([^\n]+)/i);
    if (speedMatch) details.internetSpeed = normalizeText(speedMatch[1]);
  }

  if (!details.equipmentSecurity) {
    const securityMatch = fallbackSource.match(/(?:seguran[çc]a\s+de\s+equipamento|seguran[çc]a(?:\s+para)?\s+equipamentos?)\s*:?\s*([^\n]+)/i);
    if (securityMatch) details.equipmentSecurity = normalizeText(securityMatch[1]);
  }

  if (!details.workspaceDetails) {
    const workspaceMatch = fallbackSource.match(/(?:workspace|coworking|edi[çc][ãa]o|lightroom)\s*:?\s*([^\n]+)/i);
    if (workspaceMatch) details.workspaceDetails = normalizeText(workspaceMatch[1]);
  }

  details.photographyTips = dedupe(details.photographyTips.length > 0 ? details.photographyTips : fallbackBullets.slice(0, 4));
  details.schedule = dedupe(details.schedule);
  details.lightingTips = dedupe(details.lightingTips);
  details.logistics = dedupe(details.logistics || []);

  return details;
}

function buildBadge(summary: string, details: string, kind: ParsedSuggestionKind): string {
  const source = `${summary} ${details}`.toLowerCase();
  const badgeMap: [RegExp, string][] = [
    [/(?:luxo|premium)/, "Alto Luxo"],
    [/(?:5 estrelas|★★★★★)/, "★★★★★"],
    [/(?:4 estrelas|★★★★)/, "★★★★"],
    [/(?:boutique)/, "Hotel Boutique"],
    [/(?:golden hour|luz dourada)/, "Golden Hour"],
    [/(?:metro|mobilidade|transporte)/, "Fácil Acesso"],
    [/(?:seguran[çc]a)/, "Segurança 24h"],
  ];

  for (const [pattern, label] of badgeMap) {
    if (pattern.test(source)) return label;
  }

  if (kind === "flight") return "Logística de Voo";
  if (kind === "attraction") return "Spot Recomendado";
  return "Recomendado pelo Voya";
}

function buildHighlights(details: ParsedExtendedDetails): string[] {
  return dedupe([
    details.internetSpeed ? `Internet: ${details.internetSpeed}` : "",
    details.equipmentSecurity ? `Segurança: ${details.equipmentSecurity}` : "",
    details.workspaceDetails ? `Ambiente de edição: ${details.workspaceDetails}` : "",
    ...(details.logistics || []).map((item) => `Logística: ${item}`),
    ...details.photographyTips,
    ...details.schedule,
    ...details.lightingTips,
  ]).slice(0, 5);
}

function parseTaggedSuggestions(text: string): { introText: string; hotels: ParsedHotel[] } {
  const introText = normalizeText(text.split(/\[NOME\]/i)[0] || "");
  const blocks = text
    .split(/(?=\[NOME\])/i)
    .map((block) => block.trim())
    .filter((block) => block.startsWith("[NOME]"));

  const hotels = blocks
    .map((block) => {
      const name = extractTaggedValue(block, "NOME");
      const price = extractTaggedValue(block, "PRECO") || "Consultar";
      const summary = extractTaggedValue(block, "RESUMO");
      const rawDetails = extractTaggedValue(block, "DETALHES_TECNICOS") || extractTaggedValue(block, "DETALHES_EXTENDIDOS");
      const imageUrl = extractTaggedValue(block, "FOTO") || undefined;

      if (!name || !summary || !rawDetails) return null;

      const kind = detectKind(name, summary, rawDetails);
      const extendedDetails = parseExtendedDetails(rawDetails);

      return {
        name,
        price,
        location: extractLocation(summary, rawDetails),
        description: summary,
        highlights: buildHighlights(extendedDetails),
        badge: buildBadge(summary, rawDetails, kind),
        kind,
        extendedDetails,
        imageUrl,
      } as ParsedHotel;
    })
    .filter((hotel): hotel is ParsedHotel => hotel !== null);

  return { introText, hotels };
}

function parseLegacySuggestions(text: string): { introText: string; hotels: ParsedHotel[] } {
  const hotels: ParsedHotel[] = [];
  const parts = text.split(/\n(?=\d+[\.\)]\s)/);
  const introText = normalizeText(parts[0] || "");

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const nameMatch = block.match(/^\d+[\.\)]\s+\*{0,2}([^*\n\-:]+?)\*{0,2}\s*[\-:\n]/);
    if (!nameMatch) continue;

    const name = normalizeText(nameMatch[1].replace(/\*+/g, ""));
    if (!name || name.length < 3) continue;

    const priceMatch = block.match(
      /(?:R\$|US\$|\$|€|EUR|USD)\s?[\d.,]+(?:\s*(?:por noite|\/noite|per night|\/night|a diária))?/i,
    );
    const price = priceMatch ? normalizeText(priceMatch[0]) : "Consultar";
    const descriptionMatch = block.match(/[\-:]\s*\*{0,2}([^*\n•\-]{15,150})/);
    const description = descriptionMatch ? normalizeText(descriptionMatch[1].replace(/\*+/g, "")) : "";
    const extendedDetails = parseExtendedDetails(block);
    const kind = detectKind(name, description, block);

    hotels.push({
      name,
      price,
      location: extractLocation(block),
      description,
      highlights: buildHighlights(extendedDetails),
      badge: buildBadge(description, block, kind),
      kind,
      extendedDetails,
    });
  }

  return { introText, hotels };
}

/**
 * Extracts structured Voya suggestions from tagged output and falls back to the legacy parser.
 */
export function parseHotelsFromText(text: string): { introText: string; hotels: ParsedHotel[] } {
  if (/\[NOME\]/i.test(text) && (/\[DETALHES_EXTENDIDOS\]/i.test(text) || /\[DETALHES_TECNICOS\]/i.test(text))) {
    return parseTaggedSuggestions(text);
  }

  return parseLegacySuggestions(text);
}
