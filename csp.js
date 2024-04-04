var csp =
  "frame-ancestors 'self'; worker-src 'self' 'unsafe-eval' blob:; object-src 'none'; script-src 'self' 'unsafe-inline' *googletagmanager.com; style-src * 'unsafe-inline' 'unsafe-eval'; script-src-elem 'self' 'unsafe-inline'";

var meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = csp;

document.getElementsByTagName('head')[0].appendChild(meta);
