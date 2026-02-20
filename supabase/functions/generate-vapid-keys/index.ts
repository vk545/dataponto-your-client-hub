import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate VAPID keys using Web Crypto API
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  // Convert to URL-safe base64 for VAPID
  const publicKey = publicKeyJwk.x + publicKeyJwk.y; // simplified - need raw format
  
  // Export raw public key
  const rawPublic = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawPublic)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Export PKCS8 private key
  const rawPrivate = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawPrivate)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return new Response(JSON.stringify({
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
