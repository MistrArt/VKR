const https = require('https');

const fetchImage = (url) => {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
};

(async () => {
  const html = await fetchImage('https://ru.wikipedia.org/wiki/%D0%95%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D0%BD%D0%B1%D1%83%D1%80%D0%B3');
  const matches = html.match(/src="\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^"]+/g);
  if (matches) {
    console.log(matches.slice(0, 10).join('\n'));
  }
})();
