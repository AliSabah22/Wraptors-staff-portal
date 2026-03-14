/**
 * Human-readable quote number generation: WRP-YYYY-NNNN
 */

const PREFIX = "WRP";
const YEAR = new Date().getFullYear();

export function nextQuoteNumber(existingNumbers: string[]): string {
  const pattern = new RegExp(`^${PREFIX}-${YEAR}-(\\d+)$`);
  const numbers = existingNumbers
    .map((n) => {
      const m = n.match(pattern);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = max + 1;
  const pad = next.toString().padStart(4, "0");
  return `${PREFIX}-${YEAR}-${pad}`;
}
