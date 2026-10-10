# PuraClear commerce connection — local only

Deployment approved by the user; final environment configuration and browser checkout verification are required before release.

## Verified store configuration

- Store: `j0xqxk-xi.myshopify.com`, USD.
- Single variant `50383230632176`: updated to $48; product remains UNLISTED.
- Duo product `10350864826608`, variant `50596270932208`: created at $76, compare-at $96; now ACTIVE and published to PuraClear Vercel. Two 4 oz jars per bundle. Inventory is tracked with CONTINUE policy for the user-confirmed advance orders; no stock quantity was invented.
- General shipping profile: U.S. zone only; free Standard at $70 or more, $8 Standard, $15 Express. No shipping settings were changed.
- User confirmed all orders are presales; no shipping date provided.

## Before accepting payments

1. Headless public token configured locally in ignored `.env.local`; both products successfully create checkout carts at the expected prices. Browser navigation still redirects to the Shopify password page. User authorized removing the storefront password on October 10; admin login is pending.
2. Set `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` in Vercel Production before deployment. Local server loads `.env.local`. Do not use an Admin token. Vercel sign-in is pending.
3. Configure the presale purchase/inventory policy and expected shipping communication. Both products currently have zero recorded inventory. The Duo now permits advance orders explicitly; do not invent stock. Decide whether the bundle will use component inventory when fulfillment starts.
4. Verify the final Shopify checkout URL belongs to this store. The API only permits the known store checkout route (or the specifically named future checkout subdomain); it does not rewrite signed checkout URLs to the Vercel domain.
5. Verify payment setup and complete a Shopify test-mode order, including the Single, Duo, mixed quantities, shipping, taxes, confirmations, and return-to-store destination. No payment or order has been created during this work.
6. Confirm FormSubmit is activated for `puraclear@gmail.com` and test contact delivery. The form uses the same service as the existing ambassador form. No test email was sent; delivery has not been verified.

## Behavior

The bag stays on the custom site. On checkout, `/api/checkout` validates items, quantities, Shopify prices, availability, resulting cart lines, subtotal and checkout host before returning a direct Shopify checkout URL. It never routes to the old product page. A failed request keeps the bag and displays an error. The server creates no order and handles no payment details.

Shipping eligibility is enforced by Shopify's shipping profile. The on-page free-shipping wording is the exact wording requested by the user; Shopify's threshold is inclusive ($70+).

## Checks

Run `npm run check`, `npm run build`, and `node --test tests/checkout.test.mjs`.
The automated tests use controlled Shopify responses; they do not establish live checkout readiness. Local browser tests confirmed the shipping copy, presale notice, contact dialog, and preserved bag on the real locked-store failure.

Public-facing presale and shipping-date wording was removed at the user’s request. The underlying fulfillment situation remains advance orders.
