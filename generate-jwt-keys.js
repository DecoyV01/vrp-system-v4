import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

async function generateJWTKeys() {
  console.log("Generating JWT key pair for Convex Auth...");
  
  // Generate RS256 key pair with extractable: true
  const keys = await generateKeyPair("RS256", { extractable: true });
  
  // Export private key in PKCS#8 format
  const privateKey = await exportPKCS8(keys.privateKey);
  
  // Export public key as JWK
  const publicKey = await exportJWK(keys.publicKey);
  
  // Add required properties for JWKS
  const jwks = {
    keys: [
      {
        ...publicKey,
        use: "sig",
        alg: "RS256",
        kid: "convex-auth-key"
      }
    ]
  };
  
  console.log("\n=== JWT_PRIVATE_KEY ===");
  console.log(privateKey);
  
  console.log("\n=== JWKS ===");
  console.log(JSON.stringify(jwks, null, 2));
  
  return { privateKey, jwks };
}

generateJWTKeys().catch(console.error);