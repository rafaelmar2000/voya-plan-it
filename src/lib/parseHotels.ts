export type ParsedSuggestionKind = "hotel" | "flight" | "attraction" | "generic";

export interface ParsedHotel {
  name: string;
  price: string;
  location: string;
  description: string;
  highlights: string[];
  badge: string;
  kind: ParsedSuggestionKind;
  detailsText: string;
  imageUrl: string;
  photoUrl: string;
}

const TAGGED_FIELDS = ["CATEGORIA", "NOME", "PRECO", "RESUMO", "DETALHES", "FOTO", "FIM"] as const;

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^:(?!\/)\s*/, ""); // Remove leading ':' only if NOT part of a URL scheme (e.g. https://)
}

function cleanDisplayText(value: string): string {
  return value
    .replace(/\[\/?(?:CATEGORIA|NOME|PRECO|RESUMO|DETALHES|FOTO|FIM)\]/gi, "")
    .trim();
}

function extractTaggedValue(block: string, tag: (typeof TAGGED_FIELDS)[number]): string {
  const pairedRegex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "i");
  const pairedMatch = block.match(pairedRegex);
  if (pairedMatch) return normalizeText(pairedMatch[1]);

  const nextTags = TAGGED_FIELDS.filter((f) => f !== tag).join("|");
  const inlineRegex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\s*\\[(?:${nextTags})\\]|$)`, "i");
  const inlineMatch = block.match(inlineRegex);
  return inlineMatch ? normalizeText(inlineMatch[1]) : "";
}

function buildImageUrl(_name: string, _location: string): string {
  // No longer used — images come exclusively from [FOTO] tag
  return "";
}

function detectKind(categoria: string, name: string, summary: string): ParsedSuggestionKind {
  const cat = categoria.toLowerCase();
  if (cat.includes("voo") || cat.includes("flight")) return "flight";
  if (cat.includes("atra") || cat.includes("attraction")) return "attraction";
  if (cat.includes("hotel") || cat.includes("hospedagem")) return "hotel";

  const source = `${name} ${summary}`.toLowerCase();
  if (/(?:voo|flight|partida|chegada|embarque)/.test(source)) return "flight";
  if (/(?:atra[çc][ãa]o|museu|parque|golden hour)/.test(source)) return "attraction";
  if (/(?:hotel|resort|hostel|pousada)/.test(source)) return "hotel";
  return "generic";
}

function buildBadge(summary: string, kind: ParsedSuggestionKind): string {
  const s = summary.toLowerCase();
  if (/(?:luxo|premium)/.test(s)) return "Alto Luxo";
  if (/(?:5 estrelas|★★★★★)/.test(s)) return "★★★★★";
  if (/(?:4 estrelas|★★★★)/.test(s)) return "★★★★";
  if (/(?:boutique)/.test(s)) return "Hotel Boutique";
  if (kind === "flight") return "Logística de Voo";
  if (kind === "attraction") return "Spot Recomendado";
  return "Recomendado pelo Voya";
}

function extractLocation(summary: string, details: string): string {
  const combined = `${summary}\n${details}`;
  const match = combined.match(
    /(?:localiza[çc][ãa]o|localizado|fica|bairro|regi[ãa]o|endere[çc]o|em)\s*:?\s*([^\n.,]{3,60})/i,
  );
  return match ? normalizeText(match[1].replace(/\*+/g, "")) : "";
}

function extractHighlights(summary: string): string[] {
  return summary
    .split(/\n+/)
    .map((l) => l.replace(/^[-•✓✔]\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 4);
}

function parseTaggedSuggestions(text: string): { introText: string; hotels: ParsedHotel[] } {
  // Split on [CATEGORIA] or [NOME] — whichever starts a new suggestion block
  const blockDelimiter = /(?=\[(?:CATEGORIA|NOME)\])/i;
  const rawParts = text.split(blockDelimiter).map((b) => b.trim());

  // Intro = first chunk that does NOT start with a tag
  const introParts: string[] = [];
  const blockParts: string[] = [];
  for (const part of rawParts) {
    if (/^\[(?:CATEGORIA|NOME)\]/i.test(part)) {
      blockParts.push(part);
    } else if (blockParts.length === 0) {
      introParts.push(part);
    }
  }
  const introText = normalizeText(introParts.join("\n"));

  // Merge consecutive CATEGORIA-only chunks with the next NOME chunk
  const mergedBlocks: string[] = [];
  for (let i = 0; i < blockParts.length; i++) {
    if (/^\[CATEGORIA\]/i.test(blockParts[i]) && !/\[NOME\]/i.test(blockParts[i])) {
      // This chunk has CATEGORIA but not NOME — merge with the next
      if (i + 1 < blockParts.length) {
        blockParts[i + 1] = blockParts[i] + "\n" + blockParts[i + 1];
      }
    } else {
      mergedBlocks.push(blockParts[i]);
    }
  }

  const hotels = mergedBlocks
    .filter((b) => /\[NOME\]/i.test(b))
    .map((block) => {
      const name = extractTaggedValue(block, "NOME");
      const price = extractTaggedValue(block, "PRECO") || "Consultar";
      const summary = extractTaggedValue(block, "RESUMO");
      const detailsText = extractTaggedValue(block, "DETALHES");
      const categoria = extractTaggedValue(block, "CATEGORIA");

      if (!name) return null;

      const kind = detectKind(categoria, name, summary);
      const photoUrl = extractTaggedValue(block, "FOTO");

      const loc = extractLocation(summary, detailsText);
      return {
        name: cleanDisplayText(name),
        price: cleanDisplayText(price),
        location: loc,
        description: cleanDisplayText(summary),
        highlights: extractHighlights(summary),
        badge: buildBadge(summary, kind),
        kind,
        detailsText: cleanDisplayText(detailsText || summary),
        imageUrl: buildImageUrl(name, loc),
        photoUrl,
      } as ParsedHotel;
    })
    .filter((h): h is ParsedHotel => h !== null);

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
    const descMatch = block.match(/[\-:]\s*\*{0,2}([^*\n•\-]{15,150})/);
    const description = descMatch ? normalizeText(descMatch[1].replace(/\*+/g, "")) : "";

    const loc = extractLocation(block, "");
    hotels.push({
      name,
      price,
      location: loc,
      description,
      highlights: extractHighlights(block),
      badge: buildBadge(description, detectKind("", name, description)),
      kind: detectKind("", name, description),
      detailsText: block,
      imageUrl: buildImageUrl(name, loc),
      photoUrl: "",
    });
  }

  return { introText, hotels };
}

export function parseHotelsFromText(text: string): { introText: string; hotels: ParsedHotel[] } {
  if (/\[(?:NOME|CATEGORIA)\]/i.test(text)) {
    const result = parseTaggedSuggestions(text);
    // Strip any leftover tags from intro so raw markup never shows
    result.introText = result.introText.replace(/\[\/?(?:\w+)\]/g, "").replace(/^[:\s]+/, "").trim();
    return result;
  }
  // No [CATEGORIA] tags → plain text, no cards
  return { introText: normalizeText(text), hotels: [] };
}
