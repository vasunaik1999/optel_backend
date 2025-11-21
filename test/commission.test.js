import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCommission } from '../src/services/commissionService.js';

test('calculateCommission returns 1% of mrp for positive mrp', async () => {
  const mrp = 1000;
  const c = calculateCommission(mrp);
  assert.equal(c, 10);
});

test('calculateCommission handles zero and negative values', async () => {
  assert.equal(calculateCommission(0), 0);
  assert.equal(calculateCommission(-100), -1);
});
