# MosqueCarpetsCanada.ca — Shopify store

We supply (not manufacture) luxury carpet rolls, imported internationally, and offer an installation service.
Store: `tqtwwj-3a.myshopify.com` (Basic plan, CAD, Canada), accessed through the Shopify MCP connector.

## Working rules

- **Preview first.** Before changing anything on the live store (products, collections, pages, theme, discounts, settings), build a preview in the chat and wait for explicit approval.
- Read-only lookups (products, orders, shop info) need no approval.
- New products are created as `DRAFT` unless told otherwise.
- Theme file writes go to an unpublished theme; publishing is done by the owner in Shopify admin.

## Skills

Shopify reference skills live in `.claude/skills/` (theme-development, liquid-templating, api-graphql,
app-development, checkout-customization, shopify-functions, headless-hydrogen, cli-tools). MIT licensed — see
`.claude/skills/LICENSE-shopify-agent-skills`. `modern-web-design` (accessibility, performance, micro-interactions)
comes from the Claude Design Skillstack, MIT — see `.claude/skills/LICENSE-claude-design-skills`. The pack's
3D/WebGL/parallax skills were deliberately not installed: they slow a store down and distract buyers.

## Theme source and previews

- `theme/` mirrors the custom files in the Shopify theme (sections, templates, `assets/mosque-*.css`).
  Edit here, then upload to an **unpublished** theme.
- `node previews/render.js` (needs `liquidjs@10`) renders those real files into `previews/v3/`,
  including `preview-all.html`, a self-contained file to send to the owner. Previews come from the
  theme files, never a hand-made mock-up, so what's approved is what ships.

## Design standards (detail pass)

- **Contrast:** body text ≥ 4.5:1. Gold/green as *text* on light backgrounds uses `--brass-text` / `--sage-text`;
  `--brass` / `--sage` are for fills, lines and large decorative marks only.
- **Type:** nothing below 14px except uppercase micro-labels; prices use tabular numbers.
- **Spacing:** sections use `--section-y`; grids use `--gap`; no inline padding hacks, use
  `mcc-tight-top` or `mcc-flush-top` instead.
- **CTAs:** one primary (gold) action per view, except the hall-size cards, where each card's buy panel
  has its own gold "Buy now" (owner request: make it obvious that's where you buy). The primary label is "Request a quote" (product
  pages: "Add to cart"); secondary actions use `mcc-btn-secondary`; text links use `mcc-btn-ghost`.
  Note under quote buttons: "Free and itemised, with no obligation."
- **Navigation:** current page marked with `aria-current`; touch targets ≥ 44px; section anchors
  clear the sticky header (`scroll-margin-top`).
- **Images:** fixed aspect ratios (cards 16:9, product 1:1) so nothing jumps while loading; responsive
  `widths` on every `image_tag`; drawings until real photos exist (see `PHOTO-GUIDE.md`).
- **Motion:** transform/opacity only, ≤ 600ms, `data-reveal` once per element, off under
  `prefers-reduced-motion`, content visible without JavaScript.
  Exception (owner request): the front hall-size card's buy panel pops out toward the viewer (the owner
  asked for the motion blur on sliding to be removed). Without JavaScript it stays a plain grid.
- **Copy:** Canadian spelling (colour, centre, itemised). Prices are formatted "$3,650 CAD".

## Open questions

`OPEN-QUESTIONS.md` tracks everything we still need from the owner. When something is unknown, use safe wording
that makes no claim, mark it "To confirm" in previews, add it to that file, and end each update to the owner with
a short reminder of what's still open. `CHANGE-PLAN.md` lists what will be applied once approved.
