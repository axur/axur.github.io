const csp = {
  name: 'Content-Security-Policy',
  content:
    "frame-ancestors 'self'; worker-src 'self' 'unsafe-eval' blob:; object-src 'none'; script-src 'self' 'unsafe-inline' *googletagmanager.com *google-analytics.com; style-src * 'unsafe-inline' 'unsafe-eval'; script-src-elem 'self' 'unsafe-inline'",
};

const hsts = {
  name: 'Strict-Transport-Security',
  content: 'max-age=31536000; includeSubDomains; preload',
};

const cto = {
  name: 'X-Content-Type-Options',
  content: 'nosniff',
};

const headers = [csp, hsts, cto];

headers.forEach((header) => {
  var meta = document.createElement('meta');
  meta.httpEquiv = header.name;
  meta.content = header.content;

  document.getElementsByTagName('head')[0].appendChild(meta);
});
