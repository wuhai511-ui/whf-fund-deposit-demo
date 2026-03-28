/**
 * Qianzhangtong (QZT) Payment SDK Core
 * RSA Sign/Verify implementation for payment request signing
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load keys from test keys directory
const KEYS_DIR = path.resolve(__dirname, '../../tests/keys');

const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private_key.pem');
const CLOUD_PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'cloud_public_key.pem');

let _privateKey = null;
let _cloudPublicKey = null;

/**
 * Load private key from PEM file (cached)
 */
function getPrivateKey() {
  if (!_privateKey) {
    _privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  }
  return _privateKey;
}

/**
 * Load cloud public key from PEM file (cached)
 */
function getCloudPublicKey() {
  if (!_cloudPublicKey) {
    _cloudPublicKey = fs.readFileSync(CLOUD_PUBLIC_KEY_PATH, 'utf8');
  }
  return _cloudPublicKey;
}

/**
 * Sign a payload using RSA-SHA256
 * @param {object|string} payload - The payload to sign
 * @returns {string} Base64 encoded signature
 */
function sign(payload) {
  const privateKey = getPrivateKey();
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  const signer = crypto.createSign('SHA256');
  signer.update(data, 'utf8');
  signer.end();
  
  return signer.sign(privateKey, 'base64');
}

/**
 * Verify a signature using RSA-SHA256
 * @param {object|string} payload - The original payload
 * @param {string} signature - Base64 encoded signature to verify
 * @returns {boolean} True if signature is valid
 */
function verify(payload, signature) {
  const cloudPublicKey = getCloudPublicKey();
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  const verifier = crypto.createVerify('SHA256');
  verifier.update(data, 'utf8');
  verifier.end();
  
  return verifier.verify(cloudPublicKey, signature, 'base64');
}

/**
 * Generate a signature with timestamp
 * Returns the payload merged with signed_at and signature - ready for verification
 * @param {object} payload - The payload to sign
 * @returns {object} Object with signed_at and signature added (merged with original payload)
 */
function signWithTimestamp(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  // Data to sign: payload + signed_at (NOT including signature field)
  const dataToSign = {
    ...payload,
    signed_at: timestamp
  };
  
  const signature = sign(dataToSign);
  
  // Return payload merged with signed_at and signature
  // The verify() call should use dataToSign (without signature), NOT this merged object
  return {
    ...payload,
    signed_at: timestamp,
    signature
  };
}

module.exports = {
  sign,
  verify,
  signWithTimestamp,
  getPrivateKey,
  getCloudPublicKey
};
