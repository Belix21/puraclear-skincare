export const REGULAR_PRICE = 3999;
export const MAX_QUANTITY = 10;
export const priceFor = ({ pack, plan }) => plan === 'subscribe' ? 3399 * pack : pack === 2 ? 7198 : 3999;
export const lineKey = ({ pack, plan, cadence }) => `${pack}:${plan}:${plan === 'subscribe' ? cadence : 0}`;
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function restoreCart(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = new Map();
    for (const item of parsed.slice(0, 50)) {
      if (!item || ![1, 2].includes(item.pack) || !['once', 'subscribe'].includes(item.plan)) continue;
      if (!Number.isInteger(item.quantity) || item.quantity < 1) continue;
      if (item.plan === 'subscribe' && ![30, 60, 90].includes(item.cadence)) continue;
      const line = { pack: item.pack, plan: item.plan, cadence: item.plan === 'subscribe' ? item.cadence : 0, quantity: Math.min(item.quantity, MAX_QUANTITY) };
      const previous = valid.get(lineKey(line));
      if (previous) previous.quantity = Math.min(previous.quantity + line.quantity, MAX_QUANTITY);
      else valid.set(lineKey(line), line);
    }
    return [...valid.values()];
  } catch { return []; }
}
