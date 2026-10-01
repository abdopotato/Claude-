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

## Step A.3: "Buy now" panels on hall-size cards (awaiting approval)

Owner asked for a clear buy section under each hall-size card. Each card now ends in a buy panel: "Buy online" label,
price, a gold **Buy now** button (to the product page, where spacing, colourway and installation are chosen),
and a "Prefer a quote first?" link. The rest of the card still opens the product. Changed: `sections/mosque-home.liquid`,
`assets/mosque-update.css`. v3 is live, so the upload goes to a new unpublished copy ("Site update v4").

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
