// Renders the theme's custom sections into static preview pages, using sample
// data shaped like the store's products. Usage: node previews/render.js
// (needs `npm i liquidjs@10` somewhere on NODE_PATH).
const { Liquid } = require('liquidjs');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const THEME = path.join(ROOT, 'theme');
const OUT = path.join(__dirname, 'v3');
fs.mkdirSync(OUT, { recursive: true });

const engine = new Liquid({ root: THEME });

const money = (cents) => '$' + (cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
engine.registerFilter('asset_url', (f) => `../../theme/assets/${f}`);
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('money', money);
engine.registerFilter('money_with_currency', (c) => money(c) + ' CAD');
engine.registerFilter('money_without_trailing_zeros', (c) => money(c).replace(/\.00$/, ''));
engine.registerFilter('image_url', (img) => (img && img.src) || '');
engine.registerFilter('image_tag', (src, ...args) => {
  const opts = Object.fromEntries(args.filter(Array.isArray));
  const attrs = Object.entries(opts).map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
  return `<img src="${src}"${attrs}>`;
});
engine.registerFilter('default_errors', () => 'Please check the highlighted fields.');
engine.registerFilter('pluralize', (n, one, many) => (n === 1 ? one : many));
engine.registerFilter('url_encode', (s) => encodeURIComponent(s));

engine.registerTag('schema', {
  parse(tok, rem) { let t; while ((t = rem.shift())) { if (t.name === 'endschema') return; } },
  render() { return ''; },
});
engine.registerTag('form', {
  parse(tok, rem) {
    this.args = tok.args;
    this.tpls = [];
    const s = this.liquid.parser.parseStream(rem)
      .on('tag:endform', () => s.stop())
      .on('template', (t) => this.tpls.push(t))
      .on('end', () => { throw new Error('unclosed form'); });
    s.start();
  },
  *render(ctx, emitter) {
    const id = (this.args.match(/id:\s*'([^']+)'/) || [])[1] || '';
    const cls = (this.args.match(/class:\s*'([^']+)'/) || [])[1] || '';
    const action = this.args.includes("'contact'") ? '/contact#contact_form' : '/cart/add';
    ctx.push({ form: { errors: null, 'posted_successfully?': false } });
    emitter.write(`<form method="post" action="${action}" id="${id}" class="${cls}" onsubmit="event.preventDefault();">`);
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
    ctx.pop();
  },
});

function readSection(name) {
  const src = fs.readFileSync(path.join(THEME, 'sections', name + '.liquid'), 'utf8');
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  return { src, schema };
}
function defaults(settings = []) {
  const o = {};
  for (const s of settings) if (s.id) o[s.id] = s.default !== undefined ? s.default : (s.type === 'checkbox' ? false : '');
  return o;
}

const variants = (base) => ['90cm', '95cm', '100cm'].map((t, i) => ({ id: base + i, title: t, price: 0, available: true }));
function mkProduct(id, handle, title, price, tags, description) {
  const vs = variants(id * 10).map((v) => ({ ...v, price }));
  return {
    id, handle, title, tags, description, url: `/products/${handle}`,
    price_min: price, variants: vs, selected_or_first_available_variant: vs[1],
    has_only_default_variant: false, featured_media: null, media: [],
  };
}
const products = [
  mkProduct(1, 'musalla-carpet-roll-small-4-6-m', 'Musalla Carpet Roll, Small (4 × 6 m)', 115000, ['hall-size', 'musalla', 'small'],
    '<p>Sized for a side room, overflow musalla or women\'s prayer area. One continuous roll cut to your room\'s width, so there are no seams at all.</p>'),
  mkProduct(2, 'main-hall-carpet-roll-mid-size-8-12-m', 'Main Hall Carpet Roll, Mid-size (8 × 12 m)', 365000, ['hall-size', 'main-hall', 'mid-size'],
    '<p>The configuration mosques order most. Two roll widths are joined with a hidden seam placed between prayer rows, so the join sits where no one kneels and the saff lines run straight across the hall.</p><p>Sourced from our partner mills, imported and inspected in Canada, and cut only after we\'ve confirmed your measurements.</p>'),
  mkProduct(3, 'jumuah-hall-carpet-roll-large-15-22-m', "Jumu'ah Hall Carpet Roll, Large (15 × 22 m)", 995000, ['hall-size', 'jumuah', 'large'],
    '<p>For main Jumu\'ah and Eid halls. A multi-width installation planned from a site visit and floor template, both included in the price.</p>'),
];
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));

const globals = {
  routes: { root_url: '/', cart_url: '/cart', all_products_collection_url: '/collections/all' },
  cart: { item_count: 0, currency: { iso_code: 'CAD' } },
  collections: { all: { products } },
  request: { path: '/' },
};

async function renderSection(name, extra = {}, templateSection = null) {
  const { src, schema } = readSection(name);
  const settings = { ...defaults(schema.settings), ...((templateSection && templateSection.settings) || {}) };
  const blocks = [];
  if (templateSection && templateSection.blocks) {
    for (const id of templateSection.block_order || Object.keys(templateSection.blocks)) {
      const b = templateSection.blocks[id];
      const bs = schema.blocks.find((x) => x.type === b.type);
      const s = { ...defaults(bs && bs.settings), ...b.settings };
      if (typeof s.product === 'string') s.product = byHandle[s.product] || '';
      blocks.push({ id, type: b.type, settings: s, shopify_attributes: '' });
    }
  }
  return engine.parseAndRender(src, { ...globals, ...extra, section: { id: name, settings, blocks } });
}

const PAGES = [
  { file: 'index.html', label: 'Home', section: 'mosque-home', template: 'index.json', path: '/', pageType: 'index' },
  { file: 'product.html', label: 'Product page', section: 'mosque-product', path: '/products/x', pageType: 'product', extra: { product: products[1] } },
  { file: 'installation.html', label: 'Installation', section: 'mosque-installation', path: '/pages/installation', extra: { page: { content: '' } } },
  { file: 'about.html', label: 'About', section: 'mosque-about', path: '/pages/about', extra: { page: { content: '' } } },
  { file: 'quote.html', label: 'Request a quote', section: 'mosque-quote', path: '/pages/contact', extra: { page: { content: '' } } },
];

function localLinks(html) {
  return html
    .replace(/href="\/pages\/installation"/g, 'href="installation.html"')
    .replace(/href="\/pages\/about"/g, 'href="about.html"')
    .replace(/href="\/pages\/contact([^"]*)"/g, 'href="quote.html$1"')
    .replace(/href="\/products\/[^"]*"/g, 'href="product.html"')
    .replace(/href="\/#/g, 'href="index.html#')
    .replace(/href="\/"/g, 'href="index.html"')
    .replace(/'\/pages\/contact/g, "'quote.html");
}

(async () => {
  for (const pg of PAGES) {
    const extra = { ...(pg.extra || {}), request: { path: pg.path, page_type: pg.pageType || 'page' } };
    let tplSection = null;
    if (pg.template) {
      const t = JSON.parse(fs.readFileSync(path.join(THEME, 'templates', pg.template), 'utf8'));
      tplSection = Object.values(t.sections)[0];
    }
    const header = await renderSection('mosque-header', extra);
    const main = await renderSection(pg.section, extra, tplSection);
    const footer = await renderSection('mosque-footer', extra);
    const nav = PAGES.map((p) => `<a href="${p.file}"${p.file === pg.file ? ' aria-current="page"' : ''}>${p.label}</a>`).join('');
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pg.label} · Site Preview</title>
<style>body{margin:0}.pv{position:relative;z-index:100;background:#111;color:#eee;font:13px/1.4 system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 14px}
.pv b{color:#fff}.pv a{color:#ddd;padding:4px 9px;border:1px solid #444;border-radius:6px;text-decoration:none}.pv a[aria-current]{background:#fff;color:#111}
.skip{position:absolute;left:8px;top:-60px;z-index:200;background:#0F2822;color:#fff;padding:10px 14px;border-radius:8px}.skip:focus{top:8px}</style>
</head><body>
<a class="skip" href="#MainContent">Skip to content</a>
<div class="pv"><b>PREVIEW v3, not live.</b> Rendered from the theme files in <code>theme/</code>. ${nav}</div>
<div id="header-group">${header}</div>
<main id="MainContent">${main}</main>
${footer}
</body></html>`;
    fs.writeFileSync(path.join(OUT, pg.file), localLinks(html));
    console.log('wrote', pg.file);
  }
})().catch((e) => { console.error(e); process.exit(1); });

// Bundle every page into one self-contained file (CSS inlined, each page in its own iframe)
// so the preview opens anywhere, including the Claude app.
process.on('beforeExit', () => {
  if (globalThis.__bundled) return;
  globalThis.__bundled = true;
  const css = ['mosque-design.css', 'mosque-update.css']
    .map((f) => fs.readFileSync(path.join(THEME, 'assets', f), 'utf8')).join('\n');
  const fonts = '<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">';
  const nav = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var m=a.getAttribute('href').match(/^(index|product|installation|about|quote)\\.html(.*)$/);if(!m)return;e.preventDefault();parent.postMessage({go:m[1],hash:m[2]},'*');});<\/script>`;
  const frames = PAGES.map((pg) => {
    let html = fs.readFileSync(path.join(OUT, pg.file), 'utf8')
      .replace(/<link rel="stylesheet" href="\.\.\/\.\.\/theme\/assets\/[^"]+">/g, '')
      .replace(/<div class="pv">[\s\S]*?<\/div>/, '')
      .replace('</head>', `${fonts}<style>${css}</style></head>`)
      .replace('</body>', `${nav}</body>`);
    const id = pg.file.replace('.html', '');
    return `<iframe id="f-${id}" title="${pg.label}" srcdoc="${html.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"${id === 'index' ? '' : ' hidden'}></iframe>`;
  }).join('\n');
  const tabs = PAGES.map((pg) => `<button data-go="${pg.file.replace('.html', '')}"${pg.file === 'index.html' ? ' aria-current="page"' : ''}>${pg.label}</button>`).join('');
  const w = [390, 1280];
  const out = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site Preview v3</title>
<style>html,body{margin:0;height:100%;background:#1a1a1a;font:13px/1.4 system-ui,sans-serif;color:#eee}
.bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:8px 12px;background:#111;position:sticky;top:0}
.bar b{color:#fff}.bar button{font:inherit;color:#ddd;background:#2a2a2a;border:1px solid #444;border-radius:6px;padding:5px 10px;cursor:pointer}
.bar button[aria-current]{background:#fff;color:#111}.sp{flex:1}
.stage{display:flex;justify-content:center;height:calc(100% - 46px)}
iframe{border:0;background:#F3EEE2;width:100%;height:100%}
body.mobile iframe{width:${w[0]}px;box-shadow:0 0 0 1px #333}</style></head><body>
<div class="bar"><b>PREVIEW v3, not live.</b>${tabs}<span class="sp"></span><button id="dev">Mobile view</button></div>
<div class="stage">${frames}</div>
<script>
function go(id,hash){document.querySelectorAll('iframe').forEach(function(f){f.hidden=f.id!=='f-'+id});
document.querySelectorAll('.bar [data-go]').forEach(function(b){if(b.dataset.go===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
var f=document.getElementById('f-'+id);try{var d=f.contentWindow;if(hash&&hash.charAt(0)==='#'){var t=d.document.getElementById(hash.slice(1));if(t)t.scrollIntoView();}else{d.scrollTo(0,0);}}catch(e){}}
document.querySelectorAll('.bar [data-go]').forEach(function(b){b.onclick=function(){go(b.dataset.go)}});
window.addEventListener('message',function(e){if(e.data&&e.data.go)go(e.data.go,e.data.hash)});
document.getElementById('dev').onclick=function(){var m=document.body.classList.toggle('mobile');this.textContent=m?'Desktop view':'Mobile view';};
<\/script></body></html>`;
  fs.writeFileSync(path.join(OUT, 'preview-all.html'), out);
  console.log('wrote preview-all.html', (out.length / 1024).toFixed(0) + 'KB');
});
