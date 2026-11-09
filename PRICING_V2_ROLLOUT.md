# Vital Elixir — Pricing V2 deployment and operating guide

## Architecture
The `COST MASTER` tab is an **authoring** system only. It does not handle carts. Publish to GitHub through the updated Google Apps Script `Preview Changes` → `Publish to Website` flow. The browser reads `products-data.json` and calculates selling prices by multiplying the published integer `price_per_pack_cents` by the chosen whole pack count. The cart sums fractional box equivalents across products before applying shipping. No Google Sheets or Apps Script price request is made for V2 items.

The legacy `quote-api.js` and signed quote endpoint remain available for old carts **during migration**, not for Pricing V2.

## Sheet layout
COST MASTER A–F: existing identity, packaging and private acquisition cost; G: Med MRP INR; H: MRP Profit INR; I: Final Selling INR = G + H; J: Final Selling USD = ROUND(I / SETTINGS!B2, 2); K–P: Qty 1–Qty 6. Inputs G/H intentionally start blank. Never invent prices or publish an unverified value.

Only products with both valid G/H inputs are exported with `pricing_v2`. Incomplete products retain legacy display during staged migration. When all active products are priced and published, the website no longer uses legacy price quotes for active V2 choices.

## Quantity policy
Per medicine/composition: whole physical packs only; no more than 500 dosage units **and** no more than 5 box equivalents. The stricter limit wins. For 10 tablets/strip and 10 strips/box, max = 50 strips / 500 tablets / 5 boxes. Bottle, tube, pen, inhaler, vial etc. follow their actual Units per Pack and Packs per Box. Saved older cart lines for products with newly published V2 prices require reselection.

K–P contain the quantity preset values **in units**, not box counts. These become display selections, each priced at (quantity / units per pack) × published pack price, without old tier pricing or $5 minimum price steps.

## Shipping (total physical box equivalents across cart)
- (0, 9] => USD 35
- (9, 15] => USD 45
- (15, 20] => USD 49
- (20, 40] => USD 59 **assumed bound** for the user's ambiguous “more than 20 = $59” instruction
- (40, 60] => USD 69
- (60, 100] => USD 85
- >100 => “Shipping quantity too big — break your order into parts.”

The 20–40 boundary is the only unconfirmed threshold. Update both `pricing-v2.js` and the Apps Script shipping function together if this should be different.

## Deployment steps
1. **Back up** the current bound Google Apps Script project. Replace the existing code with `Vital_Elixir_Pricing_V2_Apps_Script.gs` supplied separately. Do **not** paste it alongside the old code as duplicate function names can cause conflicts. Save and reload the Sheet so the updated Vital Elixir menu appears.
2. Enter Med MRP and MRP Profit in G/H, beginning with a test product; verify I/J formula values. Do not fill with invented prices.
3. Use `Vital Elixir → Validate Pricing V2`; review the catalogue and quantities; `Preview Changes`, then `Publish to Website`. This publishes `products-data.json` to `UI-of-web`, preserving existing product identity/content, while only active priced products turn on the V2 UI.
4. Test both product pages, cart, currency switching, saved cart migration, and checkout request email.
5. Run `node --test tests/pricing-v2.test.js` in the repository.
6. For Firebase notification source, **revoke the leaked Gmail app password**, configure `GMAIL_APP_PASSWORD` as a Firebase Functions secret, then deploy the function separately. Current Git history may still contain the exposed credential. Never post the replacement password in a ticket, GitHub or chat.

## Special cases to verify
- P0023 and P0079: “7 Sachets/Box” conflicts with stored Packs per Box = 7 (verify shipping equivalents).
- P0158: “1 Tablet/Strip” conflicts with Units per Pack = 10.
- A product whose single physical pack contains >500 units cannot be selected without a specific policy override.

## Security and status
V2 uses public, locally calculated **estimates**, not a signed private server quote. These must be confirmed by the team before any payment or supply commitment. Existing Firestore permissions should be audited: the browser is not a trusted authority for final order pricing. Retain the old Apps Script service for future pricing decisions, but do not send V2 cart values to Google Sheets.

The GitHub code is staged; existing new pricing data is not populated until the Sheet is configured and the updated Apps Script is installed/published.

## Hotfix — 9 November 2026

The COST MASTER rows P0001–P0004 now have approved input prices. Their `pricing_v2` fields and recalculated legacy display variant prices were published directly to `UI-of-web/products-data.json` using the connected GitHub tool, because the bound Apps Script's `GITHUB_TOKEN` currently produces HTTP 401 (Bad credentials).

Approved prices: P0001 $17.50 per bottle; P0002 $3.99 per strip; P0003 $2.74 per strip; P0004 $6.31 per strip. All remaining products retain legacy pricing until approved.

The new top Cost / Pack / Enter the strips panel appears above Dosage / strength and Select Qty in `product-details.html` for these V2-priced products, and appears immediately below Use on `products.html`. On mobile, the product-detail summary is inside the details column after the product-image column. The preset dropdown remains independent of the custom whole-strip input.

**Apps Script still needs user installation and credential repair.** Use `Vital_Elixir_Pricing_V2_Apps_Script_FIXED.gs` from the privately supplied ZIP, replacing the existing bound script after backing it up. In Apps Script Project Settings → Script Properties, renew `GITHUB_TOKEN` with a GitHub fine-grained PAT for exactly this repo and Contents read/write. Never commit or share the token. The corrected script can read the public catalogue without a valid token for preview, but publishing still requires a working token and preserves SHA/fingerprint checks.

**Test scope:** Static code syntax, unit price multiplication, fractional box shipping, preset selection, whole-number input validation and maximum 50 strips all passed in isolated tests. The actual hosted desktop/mobile pages and Firestore checkout have not been verified in a browser; use the branch preview deployment for those tests before promoting to main. Main branch has not been modified by this hotfix.
