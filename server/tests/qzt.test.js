/**
 * QZT SDK Core - Test Suite
 * Run with: node server/tests/qzt.test.js
 */

const assert = require('assert');
const { sign, verify, signWithTimestamp } = require('../core/payment/qzt');

console.log('Running QZT SDK Core tests...\n');

// Test 1: Signature generation
console.log('Test 1: Signature generation');
const payload = { test: 123, amount: 1000 };
const signature = sign(payload);
assert.ok(signature, 'Signature should be generated');
assert.ok(typeof signature === 'string', 'Signature should be a string');
assert.ok(signature.length > 0, 'Signature should not be empty');
console.log('  ✓ Signature generated:', signature.substring(0, 20) + '...');

// Test 2: Signature verification with valid payload
console.log('\nTest 2: Signature verification with valid payload');
const isValid = verify(payload, signature);
assert.strictEqual(isValid, true, 'Signature should be verified');
console.log('  ✓ Signature verified successfully');

// Test 3: Signature verification fails with tampered payload
console.log('\nTest 3: Signature verification fails with tampered payload');
const tamperedPayload = { test: 999, amount: 9999 };
const isInvalid = verify(tamperedPayload, signature);
assert.strictEqual(isInvalid, false, 'Tampered payload should fail verification');
console.log('  ✓ Tampered payload correctly rejected');

// Test 4: String payload support
console.log('\nTest 4: String payload support');
const stringPayload = 'plain_string_data';
const stringSignature = sign(stringPayload);
assert.ok(stringSignature, 'String signature should be generated');
const stringValid = verify(stringPayload, stringSignature);
assert.strictEqual(stringValid, true, 'String payload should verify');
console.log('  ✓ String payload signing/verification works');

// Test 5: signWithTimestamp adds signature and timestamp
console.log('\nTest 5: signWithTimestamp adds signature and timestamp');
const timestamped = signWithTimestamp(payload);
assert.ok(timestamped.signature, 'Should have signature field');
assert.ok(timestamped.signed_at, 'Should have signed_at field');
assert.strictEqual(typeof timestamped.signed_at, 'number', 'signed_at should be a timestamp number');
// Verify using the data that was actually signed (payload + signed_at, no signature field)
const dataToSign = { ...payload, signed_at: timestamped.signed_at };
const timestampValid = verify(dataToSign, timestamped.signature);
assert.strictEqual(timestampValid, true, 'Timestamped payload should verify');
console.log('  ✓ signWithTimestamp works correctly, signed_at:', timestamped.signed_at);

console.log('\n========================================');
console.log('All tests PASSED ✓');
console.log('========================================\n');
