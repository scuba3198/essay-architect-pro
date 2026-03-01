const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace Fonts
html = html.replace(
  /<!-- Fonts -->[\s\S]*?<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]*"[\s\S]*?rel="stylesheet" \/>/,
  `<!-- Fonts -->\n  <link rel="preload" href="/fonts/playfair.woff2" as="font" type="font/woff2" crossorigin />`,
);

// Replace GTM
html = html.replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<\/script>/, '');

// Replace noscript pixel
html = html.replace(/<noscript><img[^>]*alt="Facebook Pixel"[\s\S]*?<\/noscript>/, '');

fs.writeFileSync('index.html', html);
console.log('Fixed index.html');
