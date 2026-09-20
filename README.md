# PuraClear product page

A complete static product and brand experience. Run with Node.js 22 or newer; the site has no production package dependencies.

```sh
npm run dev
# http://127.0.0.1:4173
npm run check
npm run build
```

`public/` is the editable source. `build.mjs` creates `dist/` and adds the production Meta Pixel noscript fallback. Vercel serves `dist/`; the original `/products/puraclear-acne-moisturizer` route also resolves to the page.

`public/commerce.js` centralizes integer-cent pricing and validates stored cart data. `public/app.js` handles offer selection, gallery, image zoom, native dialogs, saved demo bag, subscription cadence, and the sticky purchase bar. The bag is stored only in the current browser; payment and subscription creation are intentionally not connected.

`public/pixel.js` loads PuraClear Meta Pixel 2355104858564681 and PageView on the public site. Use `?qa=1` for manual JavaScript QA without pixel traffic. Localhost and browser DNT/GPC signals also skip it. The production noscript fallback is independent of the JavaScript conditions.

Design assets, research rationale, source-generation directions, and visual references are in the sibling deliverables. Original PNGs are outside the deployed `public/` folder; the site serves WebP versions. The font is the Latin variable DM Sans web font.

The public preview is marked noindex and nofollow until the real commerce integration is ready. The deployment contains no competitor HTML or private source-store assets.
