#!/usr/bin/env node

/**
 * JWT Keys Generator for Convex Auth
 *
 * Generates RS256 key pair for Convex authentication:
 * - JWT_PRIVATE_KEY: Private key for signing tokens
 * - JWKS: JSON Web Key Set with public key for verification
 *
 * Usage:
 *   node scripts/generate-jwt-keys.mjs
 *
 * Output will be in the format:
 *   JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- ..."
 *   JWKS={"keys":[{...}]}
 *
 * Copy these values and set them in Convex:
 *   bunx convex env set JWT_PRIVATE_KEY "<value>"
 *   bunx convex env set JWKS <value>
 */

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

console.log("========================================");
console.log("Generating RS256 JWT Keys for Convex Auth");
console.log("========================================");
console.log("");

try {
  // Generate RS256 key pair
  console.log("Generating key pair...");
  const keys = await generateKeyPair("RS256", { extractable: true });

  // Export private key in PKCS#8 format
  console.log("Exporting private key...");
  const privateKey = await exportPKCS8(keys.privateKey);

  // Export public key as JWK
  console.log("Exporting public key...");
  const publicKey = await exportJWK(keys.publicKey);

  // Create JWKS (JSON Web Key Set)
  console.log("Creating JWKS...");
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

  console.log("✓ Keys generated successfully!");
  console.log("");
  console.log("========================================");
  console.log("Copy the values below to set in Convex:");
  console.log("========================================");
  console.log("");

  // Format private key for Convex (replace newlines with spaces)
  const formattedPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");

  console.log(`JWT_PRIVATE_KEY="${formattedPrivateKey}"`);
  console.log("");
  console.log(`JWKS=${jwks}`);
  console.log("");

  console.log("========================================");
  console.log("How to set these in Convex:");
  console.log("========================================");
  console.log("");
  console.log('1. Copy the JWT_PRIVATE_KEY value (including quotes)');
  console.log('2. Run: bunx convex env set JWT_PRIVATE_KEY "<paste-value-here>"');
  console.log("");
  console.log('3. Copy the JWKS value (the entire JSON object)');
  console.log('4. Run: bunx convex env set JWKS <paste-value-here>');
  console.log("");
  console.log("Or use the convex-env-template.sh script to set all variables at once.");
  console.log("");

  console.log("========================================");
  console.log("Security Notes:");
  console.log("========================================");
  console.log("• Keep these keys secret - never commit to git");
  console.log("• Use different keys for development and production");
  console.log("• Rotate keys periodically for security");
  console.log("• Store production keys securely (password manager, secrets manager)");
  console.log("");

} catch (error) {
  console.error("❌ Error generating keys:");
  console.error(error);
  process.exit(1);
}
