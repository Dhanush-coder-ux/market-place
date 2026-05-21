const http = require('http');

http.get('http://127.0.0.1:8000/inventories/s_movements/by/shop/TEST-SHOP?limit=2', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
