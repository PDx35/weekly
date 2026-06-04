/* FreshMart — mock catalogue & content. Plain script, attaches to window. */
(function () {
  // Category tints used for placeholder tiles (soft, brand-neutral)
  const CATEGORIES = [
    { id: 'fruits',     name: 'Fresh Fruits',    blurb: 'Seasonal & handpicked',     tint: '#FCEFD9', ink: '#9A6B16' },
    { id: 'veggies',    name: 'Vegetables',      blurb: 'Farm-fresh daily',          tint: '#E7F3E4', ink: '#3C7A36' },
    { id: 'dairy',      name: 'Dairy & Eggs',    blurb: 'Milk, cheese, butter',      tint: '#F1F4FB', ink: '#3F5A93' },
    { id: 'bakery',     name: 'Bakery',          blurb: 'Baked every morning',       tint: '#F8EEE2', ink: '#9A6233' },
    { id: 'beverages',  name: 'Beverages',       blurb: 'Juices, tea & coffee',      tint: '#EAF1EE', ink: '#2F7D5B' },
    { id: 'staples',    name: 'Staples & Grains', blurb: 'Rice, dal, atta & oils',   tint: '#F5EFE3', ink: '#8A6A2C' },
    { id: 'snacks',     name: 'Snacks & Munchies', blurb: 'Chips, nuts & more',      tint: '#FBEDE9', ink: '#A94B36' },
    { id: 'household',  name: 'Household',       blurb: 'Cleaning & essentials',     tint: '#EEF1F2', ink: '#566066' },
  ];

  // Helper to build products compactly
  let _id = 0;
  const P = (cat, name, price, unit, opts = {}) => ({
    id: 'p' + (++_id),
    cat, name, price, unit,
    mrp: opts.mrp || null,
    rating: opts.rating || (4 + Math.round(Math.random() * 9) / 10),
    reviews: opts.reviews || (20 + Math.floor(Math.random() * 600)),
    tag: opts.tag || null,
    desc: opts.desc || null,
    stock: opts.stock == null ? true : opts.stock,
  });

  const PRODUCTS = [
    // Fruits
    P('fruits', 'Alphonso Mango', 349, '6 pcs (1.2 kg)', { mrp: 420, tag: 'Seasonal', rating: 4.8, reviews: 512, desc: 'The king of mangoes — fragrant, fibreless Ratnagiri Alphonso, naturally ripened without carbide.' }),
    P('fruits', 'Banana Robusta', 54, '1 kg (5–7 pcs)', { mrp: 64, rating: 4.5, reviews: 388, desc: 'Everyday energy fruit. Firm, slightly green tips that ripen on the counter in a day or two.' }),
    P('fruits', 'Royal Gala Apple', 189, '4 pcs (600 g)', { mrp: 210, tag: 'Imported', rating: 4.6, desc: 'Crisp, sweet bi-colour apples. Great for lunchboxes and snacking.' }),
    P('fruits', 'Pomegranate', 132, '2 pcs (500 g)', { rating: 4.4, desc: 'Deep-red Bhagwa arils, juicy and high in antioxidants.' }),
    P('fruits', 'Sweet Lime (Mosambi)', 78, '1 kg', { mrp: 92, rating: 4.3 }),
    P('fruits', 'Seedless Grapes', 96, '500 g', { tag: 'Fresh', rating: 4.5 }),
    P('fruits', 'Tender Coconut', 49, '1 pc', { rating: 4.7 }),

    // Vegetables
    P('veggies', 'Tomato (Hybrid)', 32, '1 kg', { mrp: 40, tag: 'Bestseller', rating: 4.4, reviews: 740, desc: 'Firm, ripe tomatoes for everyday cooking — gravies, salads and chutneys.' }),
    P('veggies', 'Onion', 36, '1 kg', { rating: 4.3, reviews: 690 }),
    P('veggies', 'Potato', 39, '1 kg', { mrp: 45, rating: 4.4 }),
    P('veggies', 'Baby Spinach', 28, '250 g', { tag: 'Organic', rating: 4.6, desc: 'Tender baby spinach leaves, triple-washed and ready to cook.' }),
    P('veggies', 'Broccoli', 69, '1 pc (350 g)', { rating: 4.5 }),
    P('veggies', 'Capsicum Trio', 88, '500 g', { tag: 'Fresh', rating: 4.4, desc: 'Red, yellow & green bell peppers — crunchy and colourful.' }),
    P('veggies', 'Green Chilli', 18, '100 g', { rating: 4.2 }),
    P('veggies', 'Ginger', 24, '200 g', { rating: 4.3 }),

    // Dairy & Eggs
    P('dairy', 'Farm Fresh Milk', 33, '500 ml', { tag: 'Daily', rating: 4.7, reviews: 1240, desc: 'Toned cow milk, pasteurised and homogenised. Delivered chilled every morning.' }),
    P('dairy', 'Free-Range Eggs', 84, '6 pcs', { mrp: 96, rating: 4.6, desc: 'Brown free-range eggs from grain-fed hens.' }),
    P('dairy', 'Greek Yogurt', 65, '400 g', { tag: 'High protein', rating: 4.5 }),
    P('dairy', 'Amul Butter', 56, '100 g', { rating: 4.8, reviews: 980 }),
    P('dairy', 'Cheddar Cheese Block', 175, '200 g', { mrp: 199, rating: 4.5 }),
    P('dairy', 'Paneer', 89, '200 g', { tag: 'Fresh', rating: 4.6 }),

    // Bakery
    P('bakery', 'Whole Wheat Bread', 45, '400 g', { rating: 4.4, desc: 'Soft 100% whole-wheat sandwich loaf, baked fresh daily, no added maida.' }),
    P('bakery', 'Butter Croissant', 35, '1 pc', { tag: 'Baked today', rating: 4.7 }),
    P('bakery', 'Multigrain Bun', 28, '2 pcs', { rating: 4.3 }),
    P('bakery', 'Chocolate Muffin', 49, '1 pc', { mrp: 59, rating: 4.6 }),

    // Beverages
    P('beverages', 'Cold-Pressed Orange Juice', 119, '500 ml', { tag: 'No added sugar', rating: 4.6, desc: '100% squeezed oranges, nothing added. Best within 3 days.' }),
    P('beverages', 'Green Tea Bags', 199, '25 bags', { mrp: 240, rating: 4.5 }),
    P('beverages', 'Filter Coffee Powder', 245, '250 g', { tag: 'Roasted', rating: 4.7 }),
    P('beverages', 'Tender Coconut Water', 45, '200 ml', { rating: 4.4 }),
    P('beverages', 'Sparkling Water', 89, '750 ml', { rating: 4.2 }),

    // Staples
    P('staples', 'Basmati Rice', 320, '1 kg', { mrp: 380, tag: 'Aged', rating: 4.7, reviews: 860, desc: 'Premium aged long-grain basmati — fluffy, aromatic, non-sticky.' }),
    P('staples', 'Toor Dal', 158, '1 kg', { rating: 4.5 }),
    P('staples', 'Whole Wheat Atta', 285, '5 kg', { mrp: 320, rating: 4.6 }),
    P('staples', 'Cold-Pressed Groundnut Oil', 410, '1 L', { tag: 'Wood-pressed', rating: 4.6 }),
    P('staples', 'Rock Salt', 42, '1 kg', { rating: 4.3 }),
    P('staples', 'Raw Honey', 320, '500 g', { tag: 'Unprocessed', rating: 4.8 }),

    // Snacks
    P('snacks', 'Roasted Almonds', 399, '500 g', { mrp: 460, tag: 'Bestseller', rating: 4.7, desc: 'California almonds, dry-roasted with a pinch of salt.' }),
    P('snacks', 'Banana Chips', 89, '200 g', { rating: 4.4 }),
    P('snacks', 'Dark Chocolate 70%', 165, '100 g', { mrp: 185, rating: 4.6 }),
    P('snacks', 'Mixed Trail Nuts', 285, '250 g', { tag: 'No sugar', rating: 4.5 }),
    P('snacks', 'Salted Cashews', 349, '250 g', { rating: 4.6 }),

    // Household
    P('household', 'Dishwash Gel', 99, '500 ml', { mrp: 120, rating: 4.3 }),
    P('household', 'Floor Cleaner', 145, '1 L', { tag: 'Disinfectant', rating: 4.4 }),
    P('household', 'Garbage Bags', 129, '30 pcs', { rating: 4.2 }),
    P('household', 'Laundry Detergent', 235, '1 kg', { mrp: 270, rating: 4.5 }),
    P('household', 'Hand Wash Refill', 89, '750 ml', { rating: 4.3 }),
  ];

  const byCat = (catId) => PRODUCTS.filter((p) => p.cat === catId);
  const find = (id) => PRODUCTS.find((p) => p.id === id);
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;
  const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

  // Curated home rails
  const bestsellers = ['p8', 'p15', 'p1', 'p35', 'p30', 'p18'].map(find).filter(Boolean);
  const deals = PRODUCTS.filter((p) => p.mrp).slice(0, 6);

  window.FM_DATA = {
    CATEGORIES, PRODUCTS, byCat, find, catName, catOf, bestsellers, deals,
    // Sample saved data for a returning user
    sampleAddresses: [
      { id: 'a1', label: 'Home', name: 'Aarav Sharma', phone: '+91 98765 43210', line1: '14, Lake View Residency', line2: 'Indiranagar, 100 Ft Road', city: 'Bengaluru', pin: '560038', type: 'home', def: true },
      { id: 'a2', label: 'Work', name: 'Aarav Sharma', phone: '+91 98765 43210', line1: 'WeWork Galaxy, 4th Floor', line2: 'Residency Road', city: 'Bengaluru', pin: '560025', type: 'work', def: false },
    ],
  };
})();
