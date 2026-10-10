import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, checkoutConfig } from '../api/checkout.js';
const config = checkoutConfig({});
const single = [{ pack: 1, quantity: 1, plan: 'once' }];
function fakeShopify({ wrongPrice = false, unavailable = false, host = 'j0xqxk-xi.myshopify.com', changedQuantity = false } = {}) {
  return async (_url, options) => {
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('PuraClearVariants')) return Response.json({ data: { nodes: variables.ids.map(id => {
      const offer = Object.values(config).find(x => x.id === id);
      return { id, availableForSale: !unavailable, price: { amount: String((wrongPrice ? 3999 : offer.cents) / 100), currencyCode: 'USD' } };
    }) } });
    const lines = variables.input.lines;
    return Response.json({ data: { cartCreate: { userErrors: [], warnings: [], cart: {
      checkoutUrl: `https://${host}/checkouts/cn/example`,
      lines: { nodes: lines.map(x => ({ quantity: changedQuantity ? 0 : x.quantity, merchandise: { id: x.merchandiseId } })) },
      cost: { subtotalAmount: { amount: String(lines.reduce((total, x) => total + Object.values(config).find(y => y.id === x.merchandiseId).cents * x.quantity, 0) / 100), currencyCode: 'USD' } }
    } } } });
  };
}
test('single and duo quantities create a direct checkout URL', async () => {
  const result = await createCheckout([...single, { pack: 2, quantity: 2, plan: 'once' }], { request: fakeShopify() });
  assert.equal(result.checkoutUrl, 'https://j0xqxk-xi.myshopify.com/checkouts/cn/example');
});
for (const [name, options, message] of [
  ['wrong catalog price', { wrongPrice: true }, /pricing is being updated/],
  ['unavailable item', { unavailable: true }, /currently unavailable/],
  ['wrong checkout host', { host: 'wrong-store.myshopify.com' }, /address needs verification/],
  ['partial quantity', { changedQuantity: true }, /total or availability has changed/]
]) test(`rejects ${name}`, async () => { await assert.rejects(createCheckout(single, { request: fakeShopify(options) }), message); });
test('rejects empty, negative, duplicate, fractional and subscription requests', async () => {
  for (const lines of [[], [{ ...single[0], quantity: -1 }], [...single, ...single], [{ ...single[0], quantity: 1.5 }], [{ ...single[0], plan: 'subscribe' }]]) {
    await assert.rejects(createCheckout(lines, { request: () => { throw new Error('Must not contact Shopify'); } }), /check the items/);
  }
});
test('Shopify network failure never produces a checkout URL', async () => {
  await assert.rejects(createCheckout(single, { request: async () => new Response('', { status: 500 }) }), /could not reach checkout/);
});
