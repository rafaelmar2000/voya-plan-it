export interface ParsedHotel {
  name: string;
  price: string;
  badge: string;
  highlights: string[];
  imageQuery: string;
}

/**
 * Attempts to extract hotel suggestions from the AI response text.
 * Looks for numbered hotel entries with name, price, and detail patterns.
 */
export function parseHotelsFromText(text: string): ParsedHotel[] {
  const hotels: ParsedHotel[] = [];

  // Pattern: numbered items like "1. **Hotel Name**" or "1. Hotel Name"
  const hotelBlocks = text.split(/\n(?=\d+[\.\)]\s)/);

  for (const block of hotelBlocks) {
    const nameMatch = block.match(/\d+[\.\)]\s+\*{0,2}(.+?)\*{0,2}\s*[\n\-–:]/);
    if (!nameMatch) continue;

    const name = nameMatch[1].replace(/\*+/g, "").trim();
    if (!name || name.length < 3) continue;

    // Extract price patterns like "R$ 450", "$120", "€90", "USD 200"
    const priceMatch = block.match(/(?:R\$|US\$|\$|€|EUR|USD)\s*[\d.,]+(?:\s*(?:por noite|\/noite|per night|\/night))?/i);
    const price = priceMatch ? priceMatch[0].trim() : "Consultar preço";

    // Extract highlights - lines starting with - or •
    const highlightMatches = block.match(/[-•]\s*(.+)/g);
    const highlights = highlightMatches
      ? highlightMatches.slice(0, 4).map((h) => h.replace(/^[-•]\s*/, "").replace(/\*+/g, "").trim())
      : [];

    // Generate a contextual badge
    const badgeKeywords: Record<string, string> = {
      "centro": "Localização Central",
      "praia": "Beira-Mar",
      "luxo": "Alto Luxo",
      "boutique": "Hotel Boutique",
      "spa": "Spa & Wellness",
      "família": "Ideal p/ Famílias",
      "vista": "Vista Panorâmica",
      "histórico": "Patrimônio Histórico",
      "rooftop": "Rooftop Bar",
      "piscina": "Piscina",
    };

    let badge = "Recomendado";
    const lowerBlock = block.toLowerCase();
    for (const [keyword, label] of Object.entries(badgeKeywords)) {
      if (lowerBlock.includes(keyword)) {
        badge = label;
        break;
      }
    }

    hotels.push({
      name,
      price,
      badge,
      highlights,
      imageQuery: `${name} hotel exterior`,
    });
  }

  return hotels;
}
