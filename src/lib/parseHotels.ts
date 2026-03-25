export interface ParsedHotel {
  name: string;
  price: string;
  location: string;
  description: string;
  highlights: string[];
  badge: string;
}

/**
 * Extracts hotel data from the Voya AI response text.
 * Handles multiple formatting patterns from Gemini output.
 */
export function parseHotelsFromText(text: string): { introText: string; hotels: ParsedHotel[] } {
  const hotels: ParsedHotel[] = [];

  // Split by numbered items: "1.", "2.", "1)", "2)" etc.
  const parts = text.split(/\n(?=\d+[\.\)]\s)/);
  const introText = parts[0]?.trim() || "";

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];

    // Extract name: "1. **Hotel Name**" or "1. Hotel Name - ..." or "1. Hotel Name:"
    const nameMatch = block.match(/^\d+[\.\)]\s+\*{0,2}([^*\n\-:]+?)\*{0,2}\s*[\-:\n]/);
    if (!nameMatch) continue;

    const name = nameMatch[1].replace(/\*+/g, "").trim();
    if (!name || name.length < 3) continue;

    // Extract price: R$ 450, $120, €90, USD 200, US$ 300
    const priceMatch = block.match(
      /(?:R\$|US\$|\$|€|EUR|USD)\s?[\d.,]+(?:\s*(?:por noite|\/noite|per night|\/night|a diária))?/i
    );
    const price = priceMatch ? priceMatch[0].trim() : "Consultar";

    // Extract location from patterns like "Localização: ...", "em ...", "bairro de ..."
    const locMatch = block.match(
      /(?:localiza[çc][ãa]o|localizado|fica|bairro|regi[ãa]o|endere[çc]o|em)\s*:?\s*([^\n.,]{3,50})/i
    );
    const location = locMatch ? locMatch[1].replace(/\*+/g, "").trim() : "";

    // Collect bullet points / highlights
    const bulletMatches = block.match(/[-•✓✔]\s*\*{0,2}([^*\n]+)\*{0,2}/g);
    const highlights = bulletMatches
      ? bulletMatches
          .map((b) => b.replace(/^[-•✓✔]\s*\*{0,2}/, "").replace(/\*{0,2}$/, "").trim())
          .filter((h) => h.length > 2 && h.length < 100)
          .slice(0, 5)
      : [];

    // Extract a description - first sentence after the name that isn't a bullet
    const descMatch = block.match(/[\-:]\s*\*{0,2}([^*\n•\-]{15,150})/);
    const description = descMatch ? descMatch[1].replace(/\*+/g, "").trim() : "";

    // Generate contextual badge
    const lowerBlock = block.toLowerCase();
    const badgeMap: [string, string][] = [
      ["luxo", "Alto Luxo"],
      ["5 estrelas", "★★★★★"],
      ["4 estrelas", "★★★★"],
      ["boutique", "Hotel Boutique"],
      ["praia", "Beira-Mar"],
      ["spa", "Spa & Wellness"],
      ["centro", "Localização Central"],
      ["vista", "Vista Panorâmica"],
      ["rooftop", "Rooftop"],
      ["piscina", "Piscina"],
      ["família", "Ideal p/ Famílias"],
      ["históric", "Patrimônio Histórico"],
      ["fotógraf", "Ideal p/ Fotógrafos"],
      ["segurança", "Segurança 24h"],
    ];
    let badge = "Recomendado pelo Voya";
    for (const [kw, label] of badgeMap) {
      if (lowerBlock.includes(kw)) { badge = label; break; }
    }

    hotels.push({ name, price, location, description, highlights, badge });
  }

  return { introText, hotels };
}
