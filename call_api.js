fetch("http://127.0.0.1:8010/api/v1/inventories/search/SHOP-12345?q=VARIANT")
  .then(res => res.json())
  .then(data => console.dir(data, { depth: null }))
  .catch(console.error);
