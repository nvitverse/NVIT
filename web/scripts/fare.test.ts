import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFare } from '../src/app/core/fare';
import { FARES as cfg } from '../src/app/core/fares';

test('one way: 40 km uses 130 km minimum (matches drop1taxi: 130*15+400 = 2350)', () => {
  const r = computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 40 }, cfg);
  assert.equal(r.billableKm, 130); assert.equal(r.total, 2350); assert.equal(r.includedKm, 130);
});
test('one way: 191 km sedan = 191*15+400 = 3265 -> 3270 (rounded to 10)', () => {
  assert.equal(computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 191 }, cfg).total, 3270);
});
test('one way SUV uses its own batta (500)', () => {
  const r = computeFare({ service: 'one_way', vehicle: 'SUV', km: 200 }, cfg);
  assert.equal(r.batta, 500); assert.equal(r.total, 4500);
});
test('round trip doubles one-way km and enforces 250 km/day', () => {
  const r = computeFare({ service: 'round_trip', vehicle: 'SEDAN', km: 100, days: 2 }, cfg);
  assert.equal(r.billableKm, 500); assert.equal(r.total, 500 * 13 + 400 * 2);
});
test('round trip long route: 345 km one-way x2 = 690 km', () => {
  const r = computeFare({ service: 'round_trip', vehicle: 'INNOVA', km: 345, days: 2 }, cfg);
  assert.equal(r.billableKm, 690); assert.equal(r.total, 690 * 19 + 500 * 2 + 0);
});
test('crysta round trip batta is 600/day', () => {
  assert.equal(computeFare({ service: 'round_trip', vehicle: 'CRYSTA', km: 300, days: 3 }, cfg).batta, 1800);
});
test('hourly: rate x hours, included km = hours*10', () => {
  const r = computeFare({ service: 'hourly_rental', vehicle: 'SEDAN', km: 0, hours: 8 }, cfg);
  assert.equal(r.total, 2400); assert.equal(r.includedKm, 80); assert.equal(r.extraHourRate, 300);
});
test('hourly: invalid package falls back to first package', () => {
  assert.equal(computeFare({ service: 'hourly_rental', vehicle: 'SEDAN', km: 0, hours: 7 }, cfg).hours, 5);
});
test('multi city adds 100 per stop', () => {
  const a = computeFare({ service: 'multi_city', vehicle: 'SEDAN', km: 400, days: 1, stops: 0 }, cfg);
  const b = computeFare({ service: 'multi_city', vehicle: 'SEDAN', km: 400, days: 1, stops: 3 }, cfg);
  assert.equal(b.total - a.total, 300);
});
test('toll only added when includeToll', () => {
  const a = computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 200, toll: 500 }, cfg);
  const b = computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 200, toll: 500, includeToll: true }, cfg);
  assert.equal(b.total - a.total, 500);
});
test('discount reduces total, never below zero', () => {
  assert.equal(computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 200, discount: 100000 }, cfg).total, 0);
  assert.equal(computeFare({ service: 'one_way', vehicle: 'SEDAN', km: 200, discount: 200 }, cfg).total, 3200);
});
test('airport behaves like one way', () => {
  assert.equal(computeFare({ service: 'airport', vehicle: 'SEDAN', km: 30 }, cfg).total, 2350);
});
test('unknown vehicle throws', () => {
  assert.throws(() => computeFare({ service: 'one_way', vehicle: 'BUS' as never, km: 10 }, cfg));
});
