import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFare } from '../src/app/core/fare.ts';

const sedan = { id: 'sedan', onewayRate: 14, roundRate: 13, batta: 400 };

test('one way applies 130 km minimum', () => {
  const r = computeFare({ km: 80, trip: 'oneway', vehicle: sedan });
  assert.equal(r.billableKm, 130);
  assert.equal(r.total, 2220); // 130*14 + 400
});
test('one way above minimum uses real km', () => {
  assert.equal(computeFare({ km: 345, trip: 'oneway', vehicle: sedan }).total, 5230); // 4830+400
});
test('round trip uses max(days*250, 2*km)', () => {
  const r = computeFare({ km: 100, trip: 'round', days: 2, vehicle: sedan });
  assert.equal(r.billableKm, 500);
  assert.equal(r.total, 7300); // 500*13 + 800
});
test('round trip long distance dominates minimum', () => {
  const r = computeFare({ km: 345, trip: 'round', days: 2, vehicle: sedan });
  assert.equal(r.billableKm, 690);
});
test('days floor at 1', () => {
  assert.equal(computeFare({ km: 200, trip: 'round', days: 0, vehicle: sedan }).days, 1);
});
