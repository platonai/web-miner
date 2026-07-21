# Mock E-Commerce Site

Simulated e-commerce website for WebMiner testing. Serves a complete storefront
with home page, product categories, and product detail pages — all with
realistic CSS styling and JavaScript-driven animations.

**Everything runs locally — no network calls, no external services.**

## Quick Start

1. Install **Node.js 18+**.

2. Install dependencies:

   ```bash
   cd mock-site
   npm install
   ```

3. Start the server:

   ```bash
   node server.js
   ```

4. Open [http://localhost:3456](http://localhost:3456).

The server expects product HTML files at
`D:\Backup\Data\20260719\amazon.com.slim`. To use a different directory, change
the `DATA_DIR` constant at the top of `server.js`.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero banner, category grid, deals strip, featured products by category |
| Category | `/category/:slug` | Product grid with pagination (12/page) and sort options |
| Product | `/product/:id` | Detail page with full product content, buy box, specs, related items |
| Search | `/search?q=term` | HTML results page (browser) or JSON (fetch API) |

### Categories

| Slug | Name | Products |
|------|------|----------|
| `electronics` | Electronics | 30 |
| `computers` | Computers & Tablets | 30 |
| `home-kitchen` | Home & Kitchen | 30 |
| `books` | Books | 30 |
| `sports-outdoors` | Sports & Outdoors | 30 |

## Product Content

The site mixes two kinds of product pages:

- **Real pages** (51): Existing Amazon HTML files from
  `D:\Backup\Data\20260719\amazon.com.slim`, wrapped in the site layout with
  CSS and JS. Product titles and prices are extracted from the HTML at startup.

- **Generated pages** (99): Programmatic filler to reach 30 products per
  category. Each has a unique title, price, specs table, and description.
  Content varies deterministically based on the title string.

Both types share the same EJS wrapper — CSS styles, sticky navigation, footer,
breadcrumbs, and client-side JavaScript.

## Architecture

```
mock-site/
├── server.js              # Express app, product scanning, routes
├── package.json
├── public/
│   ├── css/style.css      # E-commerce stylesheet (~500 lines)
│   └── js/main.js         # Scroll animations, cart, search dropdown
└── views/
    ├── partials/
    │   ├── header.ejs     # Shared <head>, nav, category bar, breadcrumbs
    │   └── footer.ejs     # Shared footer with JS include
    ├── home.ejs           # Home page template
    ├── category.ejs       # Category listing template
    ├── product-detail.ejs # Product detail (real or generated)
    └── search.ejs         # Search results template
```

### Data Flow

1. **Startup** — `scanProducts()` reads all `product-*.html` files from the
   data directory, extracts titles and prices via regex, and distributes them
   evenly across the 5 categories. `generateProduct()` fills each category to
   30 entries.

2. **Request** — For real products, the server reads the raw HTML file from
   disk and passes it to the EJS template as `rawProductHtml`. The template
   renders a full HTML document around it. For generated products, the
   template renders a buy-box and specs table from the product metadata.

3. **Response** — The client receives a complete HTML page with embedded CSS
   and JavaScript. The JS activates scroll animations, cart interactions,
   search autocomplete, and the back-to-top button.

## Client-Side Features

| Feature | Implementation |
|---------|---------------|
| Scroll-triggered fade-in | `IntersectionObserver` on `.fade-up` / `.fade-in` |
| Staggered product cards | Cascading `transitionDelay` per grid child |
| Cart interactions | Click handler on "Add to Cart" buttons, counter badge, toast notification |
| Search dropdown | Debounced fetch to `/search?q=...` (JSON), rendered inline |
| Back-to-top button | Appears after 400px scroll, smooth scroll to top |
| Nav scroll shadow | Adds box-shadow when scrolled past 10px |
| Price count-up | Animated number counter on hero stats (ease-out cubic) |
| Lazy images | `IntersectionObserver` swaps `data-src` for `src` |

## Design

The CSS mimics a modern e-commerce look:

- **Palette**: Dark navy primary (`#232f3e`), orange accent (`#ff9900`),
  light gray background (`#eaeded`)
- **Layout**: Sticky nav, max-width 1320px centered containers, CSS Grid
  product cards (auto-fill, minmax 220px)
- **Cards**: White background, rounded corners, hover lift (translateY -4px +
  shadow), image scale on hover
- **Responsive**: Breakpoints at 768px and 480px hide elements progressively

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3456` | Server port (env var) |
| `DATA_DIR` | `D:/Backup/Data/20260719/amazon.com.slim` | Real product HTML files |
| `CATEGORIES` | 5 entries | Category slugs, names, icons, descriptions |

## Integration with WebMiner

This mock site is designed to provide structured HTML input for WebMiner
testing. The pages contain:

- **Breadcrumb navigation** — multi-level category paths
- **Product listings** — repeating card patterns with title, price, rating
- **Data tables** — specs and shipping details in `<table>` elements
- **Semantic structure** — `<nav>`, `<header>`, `<section>`, `<article>` markup
- **CSS classes** — predictable class names for component-selector targeting
