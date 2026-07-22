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

// ── Volatile Data Pools ────────────────────────────────────────────────────────

// 1. Stock statuses — randomly selected per-request
const STOCK_POOL = [
  { status: 'in_stock', message: 'In Stock', cssClass: 'stock-in', delivery: 'FREE delivery <b>Tomorrow</b>' },
  { status: 'in_stock', message: 'In Stock', cssClass: 'stock-in', delivery: 'FREE delivery <b>{d1}</b>' },
  { status: 'low_stock', message: 'Only {n} left in stock - order soon', cssClass: 'stock-low', delivery: 'FREE delivery <b>{d2}</b>' },
  { status: 'low_stock', message: 'Only {n} left in stock - order soon', cssClass: 'stock-low', delivery: 'FREE delivery <b>{d2}</b>' },
  { status: 'ships_soon', message: 'Usually ships within {x} to {y} days', cssClass: 'stock-ships', delivery: 'Arrives <b>{d3}</b>' },
  { status: 'out_of_stock', message: 'Temporarily out of stock', cssClass: 'stock-out', delivery: 'We are working hard to be back in stock' },
  { status: 'preorder', message: 'Pre-order now — releases {date}', cssClass: 'stock-preorder', delivery: 'This item will be released on <b>{date}</b>' },
  { status: 'marketplace', message: 'Available from these sellers', cssClass: 'stock-marketplace', delivery: 'Ships from and sold by <b>{seller}</b>' },
];

// 2. Promotion banners — optional, randomly selected
const PROMO_POOL = [
  null, // no promo — most common
  null,
  null,
  { type: 'coupon', html: '<span class="promo-icon">🎫</span> Save <strong>{pct}%</strong> with coupon. <a href="#">Clip coupon</a>' },
  { type: 'deal', html: '<span class="promo-icon">⚡</span> <strong>Prime Day Deal</strong> — Limited time offer' },
  { type: 'bundle', html: '<span class="promo-icon">📦</span> Buy 2, save <strong>{pct}%</strong> on both' },
  { type: 'clearance', html: '<span class="promo-icon">🏷️</span> <strong>Clearance:</strong> Save an extra {pct}% at checkout' },
  { type: 'coupon', html: '<span class="promo-icon">💳</span> <strong>\${amt}</strong> off with store card. <a href="#">Learn more</a>' },
  { type: 'limited', html: '<span class="promo-icon">⏰</span> <strong>Limited time deal</strong> — ends in {hours}h {mins}m' },
];

// 3. Seller names for marketplace stock
const SELLERS = ['TechMart Direct', 'GlobalGadgets', 'PrimeElectro', 'DealHub Online', 'ShopFast Pro', 'ValueMart'];

// ── Product Data Generation ────────────────────────────────────────────────────
let allProducts = [];
let productsByCategory = {};

const PRODUCT_DESCRIPTIONS = {
  electronics: [
    'Premium wireless earbuds with active noise cancellation and crystal-clear audio. Features Bluetooth 5.3, IPX5 water resistance, and up to 36 hours of battery life with the charging case.',
    'Capture every moment in stunning 4K resolution. Features electronic image stabilization, waterproof design up to 33ft, and built-in Wi-Fi for instant sharing.',
    'Track your fitness, monitor your health, and stay connected. Features heart rate monitoring, GPS tracking, sleep analysis, and a vibrant always-on AMOLED display.',
  ],
  computers: [
    'Elevate your workspace with this premium adjustable laptop stand. Crafted from aerospace-grade aluminum, it supports laptops up to 17 inches and reduces neck strain.',
    'Experience the perfect keystroke with Cherry MX mechanical switches. Per-key RGB backlighting, aircraft-grade aluminum frame, and detachable USB-C cable.',
    'Blazing-fast NVMe SSD with PCIe Gen4 interface. Sequential read speeds up to 7,000 MB/s for lightning-fast boot times and game loads.',
  ],
  'home-kitchen': [
    'Professional-grade stainless steel cookware set with tri-ply construction for even heating. Dishwasher safe and compatible with all cooktops including induction.',
    'Powerful suction meets intelligent navigation. This robot vacuum maps your home with LiDAR, empties its own dustbin, and cleans for up to 180 minutes.',
    'Enjoy crispy, golden results with little to no oil. Large 5.8-quart capacity, 8 preset cooking programs, and easy-clean non-stick basket.',
  ],
  books: [
    'A comprehensive guide to modern software development practices, covering everything from clean code principles to distributed systems architecture.',
    'Master the fundamentals of data science with this hands-on guide. Covers Python, statistics, machine learning, and real-world case studies.',
    'A gripping tale of adventure and discovery set in a richly imagined world. Winner of multiple literary awards and beloved by readers worldwide.',
  ],
  'sports-outdoors': [
    'Extra thick, non-slip yoga mat with alignment lines. Eco-friendly TPE material, double-sided texture for superior grip, and includes carrying strap.',
    'Versatile resistance bands set with 5 levels from light to extra heavy. Includes door anchor, ankle straps, and workout guide for full-body training.',
    'Spacious 4-person tent with waterproof rainfly and sealed seams. Sets up in under 3 minutes with color-coded poles and includes gear loft.',
  ],
};

const PRODUCT_FEATURES = {
  electronics: [
    ['Bluetooth 5.3 connectivity', 'Active Noise Cancellation', '36-hour battery life', 'IPX5 water resistant', 'Touch controls', 'Voice assistant support'],
    ['4K/60fps video recording', 'Electronic Image Stabilization', 'Waterproof to 33ft', 'Wi-Fi + Bluetooth', '2-inch touch screen', 'Time-lapse mode'],
    ['Heart rate monitor', 'Blood oxygen sensor', 'GPS + GLONASS', 'Sleep tracking', '7-day battery', '5 ATM water resistance'],
  ],
  computers: [
    ['Adjustable height (4.7-7.5 inch)', 'Aluminum construction', 'Supports up to 17" laptops', 'Ventilated design', 'Foldable for travel', 'Non-slip silicone pads'],
    ['Cherry MX switches', 'Per-key RGB lighting', 'USB-C detachable cable', 'N-key rollover', 'Aircraft-grade aluminum', 'Programmable macros'],
    ['PCIe Gen 4.0 x4', '7,000 MB/s read', '5,000 MB/s write', '2M-hour MTBF', '5-year warranty', 'Heatsink included'],
  ],
  'home-kitchen': [
    ['Tri-ply stainless steel', 'Induction compatible', 'Oven safe to 500°F', 'Dishwasher safe', 'Tempered glass lids', 'Riveted handles'],
    ['LiDAR navigation', 'Auto-empty dock', '180-min runtime', '3,000Pa suction', 'Room mapping', 'App + voice control'],
    ['5.8-quart capacity', '8 preset programs', '170°F - 400°F range', 'Non-stick basket', 'Dishwasher safe parts', 'Shake reminder'],
  ],
  books: [
    ['800+ pages', 'Hardcover edition', 'Code examples included', 'Online resources', 'Updated for 2024', 'Exercises and solutions'],
    ['500+ pages', 'Full-color illustrations', 'Jupyter notebooks', 'Real-world datasets', 'Interview prep section', 'Companion website'],
    ['384 pages', 'Trade paperback', 'Book club discussion guide', 'Author interview included', 'Maps and illustrations', 'Signed edition available'],
  ],
  'sports-outdoors': [
    ['6mm thickness', '72" x 24" size', 'Non-slip dual texture', 'TPE eco-friendly material', 'Alignment lines', 'Carrying strap included'],
    ['5 resistance levels', 'Natural latex material', 'Door anchor included', '2 ankle straps', 'Carry bag', 'Exercise guide'],
    ['4-person capacity', '3-minute setup', 'Waterproof rainfly', 'Sealed seams', '6.5ft center height', 'Gear loft + pockets'],
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  // Non-deterministic: sometimes generate a list price higher than the sale price
  const hasListPrice = Math.random() < 0.55;
  const listPrice = hasListPrice ? price * (1.2 + Math.random() * 0.8) : null;

  // Review data
  const reviewCount = Math.floor(Math.random() * 15000) + 5;
  const rating = (3.0 + Math.random() * 2.0); // 3.0 - 5.0

  // Variant groups — store which variants this product "has"
  const variantGroups = [];
  if (Math.random() < 0.7) {
    variantGroups.push({
      type: 'color',
      label: 'Color',
      options: shuffle(['Midnight Black', 'Arctic White', 'Ocean Blue', 'Coral Red', 'Forest Green', 'Sunset Gold', 'Graphite Gray', 'Silver']).slice(0, 3 + Math.floor(Math.random() * 5)),
    });
  }
  if (Math.random() < 0.6) {
    variantGroups.push({
      type: 'size',
      label: 'Size',
      options: shuffle(['Small', 'Medium', 'Large', 'X-Large', 'XX-Large', 'Compact', 'Standard', 'Extended', 'Mini', 'Pro']).slice(0, 2 + Math.floor(Math.random() * 5)),
    });
  }
  if (Math.random() < 0.5) {
    variantGroups.push({
      type: 'style',
      label: 'Style',
      options: shuffle(['Classic', 'Modern', 'Premium', 'Sport', 'Essential', 'Deluxe', 'Lite', 'Ultra']).slice(0, 2 + Math.floor(Math.random() * 4)),
    });
  }

  const descs = PRODUCT_DESCRIPTIONS[categorySlug] || PRODUCT_DESCRIPTIONS.electronics;
  const feats = PRODUCT_FEATURES[categorySlug] || PRODUCT_FEATURES.electronics;

  return {
    id: `gen-${categorySlug}-${index}`,
    title,
    price,
    listPrice,
    image: '/img/product-placeholder.svg',
    category: categorySlug,
    description: descs[index % descs.length],
    features: feats[index % feats.length],
    rating,
    reviewCount,
    variantGroups,
    // Store available images (simulated as hue offsets)
    imageCount: 3 + Math.floor(Math.random() * 5),
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

// ── Volatile Helpers (called on every request, use Math.random()) ──────────────

function getStockInfo(product) {
  const stock = JSON.parse(JSON.stringify(pickRandom(STOCK_POOL)));
  const seeded = (product.title || '').length + Object.keys(product).length;

  // Fill in templated values
  stock.message = stock.message
    .replace('{n}', String(1 + (seeded % 15)))
    .replace('{x}', String(1 + (seeded % 5)))
    .replace('{y}', String(3 + (seeded % 10)))
    .replace('{date}', {
      '0': 'July 30, 2026', '1': 'August 5, 2026', '2': 'August 15, 2026',
      '3': 'September 1, 2026', '4': 'August 22, 2026',
    }[String(seeded % 5)] || 'August 10, 2026')
    .replace('{seller}', SELLERS[seeded % SELLERS.length]);

  // Delivery date placeholders
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  stock.delivery = stock.delivery
    .replace('{d1}', days[(seeded + 1) % days.length] + ', July ' + (27 + ((seeded) % 5)))
    .replace('{d2}', days[(seeded + 2) % days.length] + ', July ' + (28 + ((seeded + 1) % 5)))
    .replace('{d3}', days[(seeded + 3) % days.length] + ', August ' + (2 + ((seeded + 2) % 3)))
    .replace('{date}', stock.message.includes('{date}') ? 'August 10, 2026' : '')
    .replace('{seller}', SELLERS[(seeded + 1) % SELLERS.length]);

  return stock;
}

function getVolatileConfig(product) {
  const seed = (product.title || '').length + (product.id || '').length;

  return {
    // 1. Stock — always present, but message varies
    stock: getStockInfo(product),

    // 2. Variants — product.variantGroups is pre-generated, but we sometimes hide them
    showVariants: product.variantGroups && product.variantGroups.length > 0 && Math.random() < 0.85,

    // 3. Buy box sections
    showQuantitySelect: Math.random() < 0.75,
    showBuyNow: Math.random() < 0.6,
    showGiftOption: Math.random() < 0.25,
    showSecureTransaction: Math.random() < 0.7,
    showAddToWishlist: Math.random() < 0.8,

    // 4. Discount price display
    showListPrice: product.listPrice !== null && Math.random() < 0.8,
    showYouSave: product.listPrice !== null && Math.random() < 0.65,

    // 5. Promotions
    promotion: Math.random() < 0.35 ? pickRandom(PROMO_POOL.filter(Boolean)) : null,

    // 6. Comments / reviews
    showCustomerReviews: Math.random() < 0.75,
    reviewCount: Math.floor(Math.random() * 5) + 1, // how many reviews to show (1-5)

    // 7. "Also buy" section
    showAlsoBuy: Math.random() < 0.65,
    alsoBuyCount: Math.floor(Math.random() * 4) + 2, // 2-5 products

    // 8. "Similar products" section
    showSimilar: Math.random() < 0.6,
    similarCount: Math.floor(Math.random() * 4) + 2, // 2-5 products

    // Additional volatile elements
    showSpecTable: Math.random() < 0.7,
    showFeatureBullets: Math.random() < 0.8,
    showReportIssue: Math.random() < 0.3,
  };
}

function getReviews(product) {
  const reviewerNames = ['Amazon Customer', 'TechFan42', 'BookLover99', 'HomeChef', 'OutdoorEnthusiast',
    'MomOfThree', 'GadgetGuru', 'SportsFan', 'HomeBaker', 'CasualShopper'];
  const reviewTitles = [
    'Great product!', 'Works as expected', 'Better than I hoped', 'Decent for the price',
    'Exceeded expectations', 'A bit disappointing', 'Perfect gift', 'Good value',
    'Highly recommend', 'Solid purchase', 'Could be better', 'Five stars!',
  ];
  const reviewBodies = [
    'I bought this a few weeks ago and it has been working perfectly. Would definitely recommend to anyone looking for a reliable option.',
    'Shipped fast and arrived in perfect condition. The quality is excellent for the price point. Very happy with this purchase.',
    'This is my second one — I liked the first so much I bought another. Consistent quality and great performance.',
    'It does the job, but I wish the build quality was a bit better. For the price though, it\'s hard to complain.',
    'Absolutely love this! The features are exactly what I needed and the setup was super easy.',
    'Pretty good overall. Had a small issue but customer service sorted it out quickly.',
  ];

  const count = 1 + Math.floor(Math.random() * 5);
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const rating = Math.random() < 0.6
      ? (4 + Math.floor(Math.random() * 2)) // 4-5 stars (biased positive)
      : (1 + Math.floor(Math.random() * 4)); // 1-4 stars
    reviews.push({
      reviewer: pickRandom(reviewerNames),
      title: pickRandom(reviewTitles),
      body: pickRandom(reviewBodies),
      rating,
      date: `${pickRandom(['January', 'March', 'April', 'May', 'June', 'July'])} ${1 + Math.floor(Math.random() * 28)}, 2026`,
      verified: Math.random() < 0.7,
      helpfulCount: Math.floor(Math.random() * 200),
    });
  }
  return reviews;
}

function getPromoBanner(promo, product) {
  if (!promo) return null;
  let html = promo.html;
  const pct = 5 + Math.floor(Math.random() * 25);
  const amt = 5 + Math.floor(Math.random() * 45);
  const hours = 1 + Math.floor(Math.random() * 5);
  const mins = Math.floor(Math.random() * 60);
  return html
    .replace('{pct}', String(pct))
    .replace('{amt}', String(amt))
    .replace('{hours}', String(hours))
    .replace('{mins}', String(mins).padStart(2, '0'));
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

// Product detail page — the main target for volatile DOM injection
app.get('/product/:id', (req, res) => {
  const { id } = req.params;
  const product = allProducts.find(p => p.id === id);
  if (!product) return res.status(404).send('Product not found');

  const crumbs = getBreadcrumbs(product);
  const related = shuffle(productsByCategory[product.category] || [])
    .filter(p => p.id !== product.id)
    .slice(0, 6);

  // Generate volatile config FRESH for every request — non-deterministic!
  const vc = getVolatileConfig(product);

  // Generate reviews
  const reviews = vc.showCustomerReviews ? getReviews(product) : [];

  // Generate promo banner
  const promoHtml = getPromoBanner(vc.promotion, product);

  // Also-buy products
  const alsoBuy = vc.showAlsoBuy
    ? shuffle(allProducts.filter(p => p.id !== product.id)).slice(0, vc.alsoBuyCount)
    : [];

  // Similar products
  const similar = vc.showSimilar
    ? shuffle(productsByCategory[product.category] || [])
        .filter(p => p.id !== product.id && !alsoBuy.find(a => a.id === p.id))
        .slice(0, vc.similarCount)
    : [];

  res.render('product-detail', {
    product,
    CATEGORIES,
    crumbs,
    related,
    vc,
    reviews,
    promoHtml,
    alsoBuy,
    similar,
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
