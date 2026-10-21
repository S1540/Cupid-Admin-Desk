import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrder, filterOrders, orderAmount } from '../src/lib/order-records.js';
import { orderChanges, assertUnchanged } from '../src/lib/order-updates.js';
test('updates only include edited fields and detect concurrent edits', () => {
  const original = { status: 'pending', payment: '', delivery: 'NEW' };
  assert.deepEqual(orderChanges(original, { ...original, delivery: 'DELIVERED' }), { delivery: 'DELIVERED' });
  assert.throws(() => orderChanges(original, { ...original, status: '' }));
  assert.throws(() => assertUnchanged(original, { ...original, delivery: 'SHIPPED' }, { delivery: 'DELIVERED' }));
  assert.doesNotThrow(() => assertUnchanged(original, { ...original, status: 'paid' }, { delivery: 'DELIVERED' }));
});
test('date filtering includes the whole final day and excludes undated records', () => {
  const rows = [normalizeOrder('one', { createdAt: { toMillis: () => +new Date(2026, 9, 19, 23, 59) } }), normalizeOrder('two', {}), normalizeOrder('three', { createdAt: { toMillis: () => +new Date(2026, 9, 20) } })];
  assert.deepEqual(filterOrders(rows, { search: '', start: '2026-10-19', end: '2026-10-19' }).map(row => row.id), ['one']);
});
test('pending orders do not imply unpaid or COD', () => {
  const order = normalizeOrder('one', { status: 'pending', total: 400 });
  assert.equal(order.paymentStatus, null);
  assert.equal(order.paymentMethod, null);
  assert.equal(order.createdAt, null);
  assert.equal(order.currency, null);
  assert.equal(orderAmount(order.amount, order.currency), '400');
});
test('explicit payment and delivery records take precedence', () => {
  const order = normalizeOrder('one', { status: 'paid', paymentStatus: 'refunded', paymentMethod: 'COD', trackingStatus: 'DELIVERED', createdAt: { toMillis: () => 123 } });
  assert.equal(order.paymentStatus, 'refunded');
  assert.equal(order.paymentMethod, 'COD');
  assert.equal(order.delivery, 'DELIVERED');
  assert.equal(order.createdAt, 123);
  assert.equal(normalizeOrder('two', { status: 'paid' }).paymentStatus, 'Marked paid');
});
test('filters combine recorded fields and product search', () => {
  const rows = [normalizeOrder('one', { status: 'paid', products: [{ title: 'Cotton shirt' }] }), normalizeOrder('two', { status: 'pending' })];
  assert.equal(filterOrders(rows, { search: 'cotton', status: 'paid' }).length, 1);
  assert.equal(filterOrders(rows, { search: 'cotton', status: 'pending' }).length, 0);
});
