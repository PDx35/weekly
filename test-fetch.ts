const { getProducts } = require('./lib/queries');

async function test() {
  const products = await getProducts();
  const wonder = products.find(p => p.name.includes('Wonderchef'));
  console.log("Wonderchef product:", JSON.stringify(wonder, null, 2));
}

test();
