import { importPKCS8, exportJWK } from '@convex-dev/auth/node_modules/jose';
import { readFileSync } from 'fs';

const privateKeyPem = readFileSync('/tmp/jwt_private.pem', 'utf-8');
const privateKey = await importPKCS8(privateKeyPem, 'RS256');
const jwk = await exportJWK(privateKey);

// Create JWKS structure  
const jwks = {
  keys: [{
    ...jwk,
    kid: 'default',
    alg: 'RS256',
    use: 'sig'
  }]
};

console.log(JSON.stringify(jwks));
