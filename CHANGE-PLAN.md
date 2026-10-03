# Change plan: site update v2

Status: **Step A done (2026-09-30)**. Unpublished theme "MosqueCarpetsCanada — Site update v2" (gid://shopify/OnlineStoreTheme/130977333294) built from `theme/`. The live theme is untouched. **Step B has not been applied yet.**
Preview: `previews/site-preview.html` (tabs: Home, Product page, Installation, About, Request a quote).

Live theme: `MosqueCarpetsCanada — Hero spacing` (gid://shopify/OnlineStoreTheme/130961637422).
Header and footer are custom sections (`mosque-header`, `mosque-footer`) with hard-coded links; the admin menus are unused.

## Step A: theme changes (safe, not visible until the owner publishes)

Duplicate the live theme as **"MosqueCarpetsCanada — Site update v2"** (unpublished), then:

| File | Change |
|------|--------|
| `sections/mosque-header.liquid` | Links → Shop by hall size, Installation, About, FAQ; add "Request a quote" button; keep cart |
| `sections/mosque-footer.liquid` | Replace dead `#` links; copy "woven to measure, supplied direct" → sourced/supplied/installed |
| `sections/mosque-home.liquid` | Hero copy + quote CTA; fix "0 seams" stat; trust strip; "what's included" lines on hall cards; new Sourcing, How-it-works, Installation teaser, FAQ and closing CTA blocks; saff + colorway copy ("we weave" → "we supply"); calculator "send for quote" button |
| `templates/index.json` | Link each hall card to its product (`product` setting already exists) |
| `assets/mosque-design.css` | Styles for the new blocks |
| `sections/mosque-product.liquid` (new) + `templates/product.json` | Custom product page: spacing chips (variants), colourway picker + installation choice (sent as line-item properties), assurances, spec/delivery/installation/payment accordions, other sizes |
| `sections/mosque-page.liquid` (new) + `templates/page.installation.json`, `page.about.json` | Installation and About page layouts |
| `sections/mosque-quote.liquid` (new) + `templates/page.contact.json` | Quote form (Shopify contact form with hall width/length, spacing, colourway, need) |

All copy lives in section settings, so it can be edited later in the theme editor without code.

## Step A.2: detail pass (v3), uploaded 2026-09-30

The owner published "Site update v2" (now **MAIN**), so the detail pass went into a new copy:
**"MosqueCarpetsCanada — Site update v3 (detail pass)"** (gid://shopify/OnlineStoreTheme/130977628206, unpublished),
from commit f8269ec. **Published by the owner (MAIN) on 2026-10-01.**

## Step B: store data (changes the live site immediately, needs separate approval)

1. ✅ **Pages (done 2026-10-01):** created `Installation` (/pages/installation, published); published `About Us`; renamed `Contact` → "Request a quote" (handle `contact` kept). Each has an SEO title and description.
2. ✅ **Products (done 2026-10-01):** descriptions rewritten (below), SEO titles/descriptions set, status ACTIVE and published to Online Store. Option was already named "Row spacing".
3. ✅ **Collection (done 2026-10-01):** smart collection "Prayer hall carpet rolls" (/collections/prayer-hall-carpet-rolls), product type = Prayer Hall Carpet Roll, sorted by price.
4. **Store name:** "My Store" → "MosqueCarpetsCanada.ca" (owner does this in Settings → Store details if the connector can't).
5. ✅ **Homepage SEO (done 2026-10-01):** shop `global.title_tag` / `global.description_tag` set.

## Step A.3: "Buy now" panels on hall-size cards (approved 2026-10-03, uploaded, published by owner as v4)

Owner asked for a clear buy section under each hall-size card. Each card now ends in a buy panel: "Buy online" label,
price, a gold **Buy now** button (to the product page, where spacing, colourway and installation are chosen),
and a "Prefer a quote first?" link. The rest of the card still opens the product. Changed: `sections/mosque-home.liquid`,
`assets/mosque-update.css`. Uploaded from commit 069a702 to **"MosqueCarpetsCanada — Site update v4 (buy panels)"**
(gid://shopify/OnlineStoreTheme/131005284398, unpublished); checksums verified. The connector cannot publish themes,
so the owner publishes it in Online Store → Themes.

## Step A.4: hall-size carousel with pop-out buy panel (approved 2026-10-03, uploaded)

Owner asked for left/right arrows on the three hall-size cards (same style as the "Artistry carousel" theme):
the middle card (Main hall) starts in front, the other two sit behind it at 30% opacity, and switching cards
slides them with a short motion blur. The front card's buy panel then pops out toward the viewer. Clicking a side
card brings it to the front; swipe and arrow keys work; reduced-motion users get no blur or pop.
Changed: `sections/mosque-home.liquid`, `assets/mosque-update.css`. Demo: `previews/carousel-demo.mp4`.
The owner published v4 (now MAIN, gid 131005284398), so this went into a new copy: **"MosqueCarpetsCanada — Site update v5 (carousel)"**
(gid://shopify/OnlineStoreTheme/131005513774), from commit 45d6b84. **Owner published v5**, but on the live Horizon
layout the cards stayed a 3-column grid: the carousel CSS was gated on `html.mcc-js`, which isn't kept there.
Fix (commit a5b7d4c): the script's `is-ready` class alone switches the layout on; side cards tucked to ±50%.
Uploaded to **"MosqueCarpetsCanada — Site update v6"** (gid://shopify/OnlineStoreTheme/131005546542, unpublished);
checksums verified. Owner published v6.
Motion blur removed at owner request (commit 7510333), uploaded to **"Site update v7 (no blur)"**
(gid://shopify/OnlineStoreTheme/131005644846, unpublished); checksums verified. Owner publishes it.
Note: themeFilesUpsert by URL sometimes reports done without applying; always compare checksums and retry once.

## Step D: brand identity and redesign (proposal, awaiting decision)

Preview: `previews/brand/brand-directions.html` (brand identity, layout review, directions A Mihrab, B Saff,
C Isha, D Jama'ah). Nothing built in the theme yet.

## Step E: layout pass (preview, awaiting owner feedback)

Owner asked to apply the layout suggestions only (not directions A-D). Homepage order is now: hero (shorter copy,
"Shop hall sizes" primary) → trust points in a green band under the skyline (fixes clipped domes) → hall sizes +
spacing tip + calculator link → colourways → testimonial (when added) → "How it works" (four steps + installation
merged, dark band) → sourcing → fit calculator → FAQ → closing banner. The separate line-spacing section is folded
into the tip; header menu adds "Colours"; footer links one per line. Page ~700px shorter.
Then (owner): removed everything between Colourways and the FAQ (How it works, sourcing, fit calculator, testimonial
slot); homepage only, other pages untouched. Homepage is now hero → trust band → hall sizes → colourways → FAQ →
closing banner (page ~4,300px, was ~7,600px). Their settings stay in the schema, labelled "not shown".
Still pointing at the removed calculator (not homepage files, left as asked): Installation page "Try the fit
calculator" button and footer "Fit calculator" link.
Screenshots: `previews/layout/`. Before upload, check the live `templates/index.json` for saved hero settings
(new hero wording is a schema default and won't show if the owner saved their own).

## Step C: shipping (needs owner decision)

Default shipping profile still offers $12 Standard, a free Standard option and $20 Express on carpet rolls. See OPEN-QUESTIONS #20.

## Proposed product descriptions

**Musalla Carpet Roll, Small (4 × 6 m)**
> Sized for a side room, overflow musalla or women's prayer area. It's one continuous roll cut to your room's width, so there are no seams at all. Prayer lines are woven in at 90, 95 or 100cm, never printed, so they stay sharp for years of sujood. Sourced from our partner mills, imported and inspected in Canada, and cut only after we've confirmed your measurements. Installation available, quoted with your order.

**Main Hall Carpet Roll, Mid-size (8 × 12 m)**
> The configuration mosques order most. Two roll widths are joined with a hidden seam placed between prayer rows, so the join sits where no one kneels and the saff lines run straight across the hall. Prayer lines are woven in at your chosen spacing. Sourced from our partner mills, imported and inspected in Canada, and cut only after we've confirmed your measurements. Installation available, quoted with your order.

**Jumu'ah Hall Carpet Roll, Large (15 × 22 m)**
> For main Jumu'ah and Eid halls. A multi-width installation planned from a site visit and floor template, both included in the price. We map every seam between rows and square the saff lines to the qibla wall before a single roll is cut. Prayer lines are woven in at your chosen spacing. Sourced from our partner mills, imported and inspected in Canada, and installed by our crew.

Each description keeps the Arabic hall name and adds a spec list (coverage, roll widths, spacing, pile, fire rating) once items 1 and 3 in `OPEN-QUESTIONS.md` are confirmed.
