const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;

// ── Configuration ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'electronics',      name: 'Electronics',       icon: '📱', desc: 'Phones, laptops, cameras & more' },
  { slug: 'computers',        name: 'Computers & Tablets', icon: '💻', desc: 'Laptops, desktops, monitors & accessories' },
  { slug: 'home-kitchen',     name: 'Home & Kitchen',    icon: '🏠', desc: 'Appliances, furniture, cookware & decor' },
  { slug: 'books',            name: 'Books',             icon: '📚', desc: 'Fiction, non-fiction, textbooks & more' },
  { slug: 'sports-outdoors',  name: 'Sports & Outdoors', icon: '⚽', desc: 'Gear, apparel, fitness & outdoor recreation' },
];

// ── Product Data ───────────────────────────────────────────────────────────────
let allProducts = [];
let productsByCategory = {};

function generateProduct(categorySlug, index) {
  const productNames = {
    electronics: [
      'Wireless Bluetooth Earbuds Pro', '4K Ultra HD Action Camera', 'Smart Watch with Fitness Tracker',
      'Portable Power Bank 20000mAh', 'Noise Cancelling Headphones', 'USB-C Hub 7-in-1 Adapter',
      'Wireless Charging Pad Fast Charge', 'Smart Home Security Camera', 'Digital Photo Frame 10 inch',
      'Portable Bluetooth Speaker Waterproof', 'Car Phone Mount Universal', 'LED Ring Light for Streaming',
      'Mechanical Gaming Keyboard RGB', 'Ergonomic Wireless Mouse', 'External SSD 1TB Portable',
      'Webcam 1080p with Microphone', 'VR Headset Compatible', 'Smart Plug WiFi Outlet',
      'HDMI Capture Card for Streaming', 'Tablet Stand Adjustable', 'USB Microphone for Podcasting',
      'Dash Cam Front and Rear', 'Handheld Gaming Console', 'Wireless Presenter Remote',
    ],
    computers: [
      'Laptop Stand Adjustable Aluminum', 'Mechanical Keyboard Cherry MX', 'Wireless Ergonomic Mouse',
      'External Hard Drive 2TB', 'DDR4 RAM 32GB Kit', 'Graphics Card RTX Series',
      'CPU Air Cooler Dual Fan', 'ATX Mid Tower PC Case', 'NVMe SSD 1TB Gen4',
      'WiFi 6 Router AX3000', 'USB-C Docking Station', 'Monitor Arm Mount Gas Spring',
      'Cable Management Kit', 'Mechanical Keyboard Keycaps', 'Laptop Sleeve 15.6 inch',
      'Antivirus Software 1 Year', 'Ergonomic Office Chair', 'Standing Desk Converter',
      'Vertical Laptop Stand', 'Wireless Keyboard and Mouse Combo', 'Thunderbolt 4 Cable',
      'PC Cooling Fan RGB 120mm', 'External Blu-ray Drive', 'USB Switch Selector',
    ],
    'home-kitchen': [
      'Stainless Steel Cookware Set', 'Robot Vacuum Cleaner', 'Air Fryer 5.8 Quart',
      'Memory Foam Pillow Set of 2', 'Cast Iron Dutch Oven', 'Espresso Machine Automatic',
      'Cordless Stick Vacuum', 'Knife Set Professional 15-Piece', 'Bamboo Cutting Board Set',
      'Electric Kettle Temperature Control', 'Smart LED Light Bulbs 4-Pack', 'Towel Set Cotton 6-Piece',
      'Food Processor 12-Cup', 'Non-Stick Frying Pan Set', 'French Press Coffee Maker',
      'Bathroom Rug Set Machine Washable', 'Oil Diffuser Ultrasonic', 'Wine Glasses Set of 8',
      'Sous Vide Precision Cooker', 'Spice Rack Organizer Wall Mount', 'Slow Cooker 6 Quart',
      'Bed Sheets Queen Microfiber', 'Window Curtains Blackout', 'Ice Maker Countertop',
    ],
    books: [
      'The Art of Programming', 'Data Science Handbook', 'Modern Web Development Guide',
      'Machine Learning Fundamentals', 'Business Strategy Essentials', 'Science Fiction Collection',
      'Historical Fiction Best Seller', 'Personal Finance Mastery', 'Psychology of Human Behavior',
      'Cooking Techniques Professional', 'Travel Guide Southeast Asia', 'Biography Notable Figures',
      'Creative Writing Workbook', 'Photography Complete Guide', 'Gardening for Beginners',
      'Yoga and Meditation Guide', 'Classic Literature Collection', 'Children Picture Book',
      'Graphic Novel Adventure Series', 'Self-Help Transformation Guide', 'Architecture Design Principles',
      'World Atlas Reference Edition', 'Poetry Anthology Modern', 'Mystery Thriller Series Book 1',
    ],
    'sports-outdoors': [
      'Yoga Mat Non-Slip Extra Thick', 'Resistance Bands Set', 'Adjustable Dumbbells Pair',
      'Camping Tent 4-Person Waterproof', 'Hiking Backpack 40L', 'Mountain Bike Helmet',
      'Fitness Tracker Waterproof', 'Running Shoes Lightweight', 'Kayak Paddle Carbon Fiber',
      'Fishing Rod and Reel Combo', 'Climbing Rope Dynamic 60m', 'Golf Club Set Beginner',
      'Soccer Ball Official Size', 'Basketball Indoor/Outdoor', 'Tennis Racket Professional',
      'Swimming Goggles Anti-Fog', 'Skateboard Complete Pro', 'Boxing Gloves Training',
      'Cycling Jersey Breathable', 'Camping Stove Portable', 'Binoculars for Bird Watching',
      'Jump Rope Adjustable Speed', 'Foam Roller for Recovery', 'Surfboard Leash Premium',
    ],
  };

  const names = productNames[categorySlug] || productNames.electronics;
  const titleIdx = index % names.length;
  const variant = Math.floor(index / names.length);
  const baseTitle = names[titleIdx];
  const title = variant > 0 ? `${baseTitle} (Variant ${variant + 1})` : baseTitle;
  const price = 4.99 + Math.round(Math.random() * 49500) / 100;

  return {
    id: `gen-${categorySlug}-${index}`,
    title,
    price,
    image: '/img/product-placeholder.svg',
    category: categorySlug,
  };
}

function buildProductCatalog() {
  const PER_CATEGORY = 30;

  for (const cat of CATEGORIES) {
    const products = Array.from({ length: PER_CATEGORY }, (_, j) => generateProduct(cat.slug, j));
    productsByCategory[cat.slug] = products;
    allProducts.push(...products);

    console.log(`  ${cat.slug}: ${products.length} generated`);
  }
}

// ── Initialize on startup ──────────────────────────────────────────────────────
buildProductCatalog();

// ── Express config ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve placeholder product images (inline SVG)
app.get('/img/product-placeholder.svg', (req, res) => {
  const hue = (parseInt(req.query.h || 210, 10) + parseInt(req.query.off || 0, 10)) % 360;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},40%,95%)"/><stop offset="100%" stop-color="hsl(${(hue+15)%360},30%,88%)"/>
    </linearGradient></defs>
    <rect fill="url(#bg)" width="400" height="400" rx="12"/>
    <g transform="translate(200,160)" fill="none" stroke="hsl(${hue},25%,65%)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-70" y="-50" width="140" height="160" rx="8" fill="hsl(${hue},20%,96%)"/>
      <circle cx="0" cy="-5" r="22"/><circle cx="0" cy="-5" r="12" fill="hsl(${hue},20%,85%)"/>
      <rect x="-30" y="18" width="60" height="10" rx="5" fill="hsl(${hue},20%,85%)"/>
    </g>
    <text x="200" y="360" text-anchor="middle" fill="hsl(${hue},15%,55%)" font-family="system-ui,sans-serif" font-size="13">Product Image</text>
  </svg>`);
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBreadcrumbs(product) {
  const cat = CATEGORIES.find(c => c.slug === product.category);
  return [
    { name: 'Home', url: '/' },
    { name: cat ? cat.name : product.category, url: `/category/${product.category}` },
    { name: product.title, url: null },
  ];
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// Home page
app.get('/', (req, res) => {
  const featured = [];
  for (const [slug, products] of Object.entries(productsByCategory)) {
    const cat = CATEGORIES.find(c => c.slug === slug);
    const picks = shuffle(products).slice(0, 4);
    featured.push({ cat, products: picks });
  }

  const allShuffled = shuffle(allProducts);
  const deals = allShuffled.slice(0, 8);

  res.render('home', {
    CATEGORIES,
    featured,
    deals,
    shuffle,
    allProducts,
    productsByCategory,
  });
});

// Category listing page
app.get('/category/:slug', (req, res) => {
  const { slug } = req.params;
  const cat = CATEGORIES.find(c => c.slug === slug);
  if (!cat) return res.status(404).send('Category not found');

  const products = productsByCategory[slug] || [];
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = 12;
  const totalPages = Math.ceil(products.length / perPage);
  const start = (page - 1) * perPage;
  const pageProducts = products.slice(start, start + perPage);

  res.render('category', {
    cat,
    CATEGORIES,
    products: pageProducts,
    totalProducts: products.length,
    page,
    totalPages,
    sort: req.query.sort || 'featured',
  });
});

// Product detail page
app.get('/product/:id', (req, res) => {
  const { id } = req.params;
  const product = allProducts.find(p => p.id === id);
  if (!product) return res.status(404).send('Product not found');

  const crumbs = getBreadcrumbs(product);
  const related = shuffle(productsByCategory[product.category] || [])
    .filter(p => p.id !== product.id)
    .slice(0, 6);

  res.render('product-detail', {
    product,
    CATEGORIES,
    crumbs,
    related,
  });
});

// Search — returns HTML page for browser navigation, JSON for fetch API
app.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (q.length < 2) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json([]);
    }
    return res.render('search', { CATEGORIES, query: '', results: [], total: 0 });
  }

  const results = allProducts
    .filter(p => p.title.toLowerCase().includes(q))
    .slice(0, 60);

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json(results.slice(0, 20).map(p => ({
      id: p.id, title: p.title, price: p.price, category: p.category,
    })));
  }

  res.render('search', { CATEGORIES, query: req.query.q || '', results, total: results.length });
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🛒  Mock E-Commerce Site                            ║
║                                                              ║
║  Home:           http://localhost:${PORT}/                       ║
║  Categories:     http://localhost:${PORT}/category/electronics   ║
║  Product:        http://localhost:${PORT}/product/<id>           ║
║                                                              ║
║  Total products: ${String(allProducts.length).padEnd(5)}                             ║
║  Categories:     5                                          ║
╚══════════════════════════════════════════════════════════════╝
`);
});
