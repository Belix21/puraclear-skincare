export const SHOP = 'j0xqxk-xi.myshopify.com';
export const API_VERSION = '2026-07';
export const VARIANTS_QUERY = `query PuraClearVariants($ids: [ID!]!) {
  nodes(ids: $ids) { ... on ProductVariant {
    id availableForSale price { amount currencyCode }
  } }
}`;
export const CART_MUTATION = `mutation PuraClearCheckout($input: CartInput!) {
  cartCreate(input: $input) {
    cart { checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } }
      lines(first: 10) { nodes { quantity merchandise { ... on ProductVariant { id } } } }
    }
    userErrors { field message code }
    warnings { code message }
  }
}`;

class CheckoutError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}
export function checkoutConfig(env = process.env) {
  return {
    1: { id: 'gid://shopify/ProductVariant/50383230632176', cents: 4800, name: 'Single' },
    2: { id: env.SHOPIFY_DUO_VARIANT_ID || 'gid://shopify/ProductVariant/50596270932208', cents: 7600, name: '2-Pack Bundle' }
  };
}
export async function createCheckout(input, { config = checkoutConfig(), request = fetch, buyerIp, publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN } = {}) {
  if (!Array.isArray(input) || !input.length || input.length > 2) throw new CheckoutError('Please check the items in your bag.', 400);
  const seen = new Set();
  const lines = input.map(line => {
    if (!line || ![1, 2].includes(line.pack) || line.plan !== 'once' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10 || seen.has(line.pack)) {
      throw new CheckoutError('Please check the items and quantities in your bag.', 400);
    }
    seen.add(line.pack);
    const offer = config[line.pack];
    if (!offer?.id || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(offer.id)) throw new CheckoutError('The 2-Pack Bundle is not ready for checkout yet. Your bag has been saved.');
    return { ...offer, quantity: line.quantity };
  });
  if (new Set(lines.map(line => line.id)).size !== lines.length) throw new CheckoutError('Checkout is temporarily unavailable. Your bag has been saved.');
  async function graphql(query, variables) {
    const headers = { 'Content-Type': 'application/json' };
    if (publicToken) headers['X-Shopify-Storefront-Access-Token'] = publicToken;
    if (buyerIp) headers['Shopify-Storefront-Buyer-IP'] = buyerIp;
    const response = await request(`https://${SHOP}/api/${API_VERSION}/graphql.json`, {
      method: 'POST', headers, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new CheckoutError('We could not reach checkout. Please try again shortly.', 502);
    const result = await response.json();
    if (result.errors?.length || !result.data) throw new CheckoutError('Checkout is temporarily unavailable. Your bag has been saved.', 502);
    return result.data;
  }
  const catalog = await graphql(VARIANTS_QUERY, { ids: lines.map(line => line.id) });
  for (const line of lines) {
    const variant = catalog.nodes?.find(node => node?.id === line.id);
    if (!variant) throw new CheckoutError(`${line.name} is not ready for checkout yet. Your bag has been saved.`);
    if (variant.price.currencyCode !== 'USD' || Math.round(Number(variant.price.amount) * 100) !== line.cents) {
      throw new CheckoutError(`${line.name} pricing is being updated. Please try again later; your bag has been saved.`);
    }
    if (!variant.availableForSale) throw new CheckoutError(`${line.name} is currently unavailable. Your bag has been saved.`);
  }
  const result = await graphql(CART_MUTATION, { input: {
    lines: lines.map(line => ({ merchandiseId: line.id, quantity: line.quantity }))
  } });
  const payload = result.cartCreate;
  if (!payload?.cart || payload.userErrors?.length || payload.warnings?.length) throw new CheckoutError('Some items are unavailable in the requested quantity. Please review your bag.');
  const cart = payload.cart;
  const actual = cart.lines.nodes;
  const expectedTotal = lines.reduce((sum, line) => sum + line.cents * line.quantity, 0);
  if (actual.length !== lines.length || lines.some(line => !actual.some(item => item.merchandise.id === line.id && item.quantity === line.quantity)) ||
      cart.cost.subtotalAmount.currencyCode !== 'USD' || Math.round(Number(cart.cost.subtotalAmount.amount) * 100) !== expectedTotal) {
    throw new CheckoutError('Your Shopify total or availability has changed. Please review your bag before checking out.');
  }
  const url = new URL(cart.checkoutUrl);
  // Only the verified store can receive buyers. Never replace the host in Shopify's signed URL.
  const allowedHosts = new Set([SHOP, 'checkout.shoppuraclear.com']);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.username || url.password || !/^\/(?:checkouts?\/|cart\/c\/)/.test(url.pathname)) {
    throw new CheckoutError('Checkout address needs verification. Please contact PuraClear.');
  }
  return { checkoutUrl: url.href };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method not allowed' })); }
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) throw new Error(); }
    catch { res.statusCode = 403; return res.end(JSON.stringify({ error: 'Request not allowed' })); }
  }
  try {
    if (!String(req.headers['content-type']).includes('application/json')) throw new CheckoutError('JSON required', 415);
    let body = req.body;
    if (body === undefined) {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 4096) throw new CheckoutError('Request too large', 413); }
      body = JSON.parse(raw);
    } else if (typeof body === 'string') body = JSON.parse(body);
    const buyerIp = process.env.VERCEL ? req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim() : undefined;
    res.end(JSON.stringify(await createCheckout(body?.lines, { buyerIp })));
  } catch (error) {
    res.statusCode = error.status || 502;
    res.end(JSON.stringify({ error: error instanceof CheckoutError ? error.message : 'Checkout could not load. Please try again. Your bag has been saved.' }));
  }
}
