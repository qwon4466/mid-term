process.env.SIGN_HOST ||= '0.0.0.0';
process.env.SIGN_ALLOWED_ORIGINS ||= 'http://localhost,capacitor://localhost';
await import('../server.mjs');
