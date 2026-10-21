import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRange, makeBuckets, DEFAULT_FILTERS, reportingPeriods, compareValues } from '../src/lib/analytics.js';

test('last 30 days includes today with an exclusive end', () => {
  const { start, end } = resolveRange({ ...DEFAULT_FILTERS, range: 'Last 30 days' }, new Date(2026, 9, 19, 12));
  assert.equal(start.getDate(), 20);
  assert.equal(start.getMonth(), 8);
  assert.equal(end.getDate(), 20);
  assert.equal(end.getMonth(), 9);
  assert.equal(makeBuckets(start, end).buckets.length, 30);
});
test('last month crosses year boundaries correctly', () => {
  const { start, end } = resolveRange({ range: 'Last month' }, new Date(2026, 0, 12));
  assert.equal(start.getFullYear(), 2025);
  assert.equal(start.getMonth(), 11);
  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 0);
});
test('custom ranges include the final day and reject reversed dates', () => {
  const { start, end } = resolveRange({ range: 'Custom range', start: '2026-10-01', end: '2026-10-01' });
  assert.equal(makeBuckets(start, end).buckets.length, 24);
  assert.throws(() => resolveRange({ range: 'Custom range', start: '2026-10-03', end: '2026-10-01' }));
  assert.throws(() => resolveRange({ range: 'Custom range', start: '', end: '' }));
});
test('long ranges group continuously without overlapping boundaries', () => {
  const start = new Date(2025, 0, 15), end = new Date(2026, 3, 2);
  const { buckets, grouping } = makeBuckets(start, end);
  assert.equal(grouping, 'month');
  assert.equal(+buckets[0].start, +start);
  assert.equal(+buckets.at(-1).end, +end);
  for (let i = 1; i < buckets.length; i++) assert.equal(+buckets[i].start, +buckets[i - 1].end);
});
test('an all-time history beginning midday still groups at calendar midnights', () => {
  const { buckets } = makeBuckets(new Date(2026, 9, 1, 14, 30), new Date(2026, 9, 4));
  assert.equal(buckets[0].start.getHours(), 14);
  assert.equal(buckets[0].end.getHours(), 0);
  assert.equal(buckets[1].start.getHours(), 0);
  assert.equal(buckets.length, 3);
});
test('Today compares with yesterday through the same clock time, excluding future hours', () => {
  const now = new Date(2026, 9, 19, 17, 35);
  const { range, previous } = reportingPeriods({ ...DEFAULT_FILTERS, range: 'Today', compare: true }, now);
  assert.equal(+range.end, +now);
  assert.equal(previous.start.getDate(), 18);
  assert.equal(previous.end.getHours(), 17);
  assert.equal(previous.end.getMinutes(), 35);
  const { grouping, buckets } = makeBuckets(range.start, range.end);
  assert.equal(grouping, 'hour');
  assert.equal(buckets.length, 18);
  assert.equal(+buckets.at(-1).end, +now);
});
test('previous periods keep matching calendar lengths across year boundaries', () => {
  const { range, previous } = reportingPeriods({ ...DEFAULT_FILTERS, range: 'Last 7 days', compare: true }, new Date(2026, 0, 3, 12));
  assert.equal(range.start.getFullYear(), 2025);
  assert.equal(previous.start.getDate(), 21);
  assert.equal(previous.end.getDate(), 27);
  assert.equal(previous.end.getHours(), 12);
});
test('all-time and disabled comparisons do not fabricate previous periods', () => {
  assert.equal(reportingPeriods({ ...DEFAULT_FILTERS, range: 'All time' }).previous, null);
  assert.equal(reportingPeriods({ ...DEFAULT_FILTERS, compare: false }).previous, null);
});
test('comparisons handle zero and unavailable baselines honestly', () => {
  assert.equal(compareValues(5, 0).percent, null);
  assert.equal(compareValues(5, 0).label, '+5 from zero');
  assert.equal(compareValues(0, 0).label, 'No change');
  assert.equal(compareValues(5, 10).percent, -50);
  assert.equal(compareValues(null, 10), null);
});
test('the default range contains thirty consecutive daily buckets without comparison', () => {
  const { range } = reportingPeriods(DEFAULT_FILTERS, new Date(2026, 9, 19, 17));
  const { grouping, buckets } = makeBuckets(range.start, range.end);
  assert.equal(DEFAULT_FILTERS.range, 'Last 30 days');
  assert.equal(grouping, 'day');
  assert.equal(buckets.length, 30);
  assert.equal(DEFAULT_FILTERS.compare, false);
});

