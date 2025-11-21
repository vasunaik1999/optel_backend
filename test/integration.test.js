import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(() => {
  server = http.createServer(app);
  server.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}/verify`;
});

test.after(() => {
  server.close();
});

test('end-to-end: create user, add serial, consume, check pending', async () => {
  // Create user
  const createResp = await globalThis.fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'test-user-1', name: 'Test User' })
  });
  const createJson = await createResp.json();
  assert.equal(createResp.status, 200);
  assert.equal(createJson.success, true);

  // Add serial
  const addResp = await globalThis.fetch(`${baseUrl}/serial-numbers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serialNumber: '9999999999', mrp: 100 })
  });
  const addJson = await addResp.json();
  assert.equal(addResp.status, 200);
  assert.equal(addJson.success, true);

  // Verify serial exists
  const checkResp = await globalThis.fetch(`${baseUrl}/serial-numbers/9999999999`);
  const checkJson = await checkResp.json();
  assert.equal(checkJson.exists, true);
  assert.equal(checkJson.mrp, 100);

  // Consume serial
  const consumeResp = await globalThis.fetch(`${baseUrl}/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-user-1', serialNumber: '9999999999' })
  });
  const consumeJson = await consumeResp.json();
  assert.equal(consumeJson.success, true);
  assert.equal(consumeJson.commissionEarned, 1); // 1% of 100

  // Pending commission
  const pendingResp = await globalThis.fetch(`${baseUrl}/users/test-user-1/commission/pending`);
  const pendingJson = await pendingResp.json();
  assert.equal(pendingJson.pendingCommission, 1);
});
