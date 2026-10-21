# Cupid Clothings admin dashboard

Run `npm run dev` and open http://localhost:3000. Existing Firebase environment variables and project configuration are preserved. The initialization module is now `src/lib/firebase.js` (the original contained JavaScript plus an invalid stray `s;`, which was removed).

## Data and filter scope

- Registered customers: count of registrations in the selected local-calendar date range; the email-verification segment applies. Choosing All time counts every user document. The card and registration chart share the same reporting window; undated records only contribute to the All time card.
- Total orders, Pending orders, Orders marked paid: all follow the selected creation-date range and order-status filter. Pending and paid are observed stored order statuses; the cards do not claim historical backlog or audited payment totals.
- Cart and wishlist: current document counts across the verified collection groups. These are not quantities, unique customers, or historical snapshots; global filters do not apply.
- Revenue: intentionally omitted. A numeric `total` and an order status alone do not establish a verified payment/currency contract.
- Recent customers: six rows per page, ordered by timestamp, with local snapshot pagination (Firestore cursors for oversized collections). Records without valid timestamps are not given invented dates.

Overview, Orders and Customers now share a root-mounted Zustand store. Four bounded Firestore listeners load users, orders, cart and wishlist once per admin session and apply subsequent snapshots. Chart calculations, filters, route navigation and customer details use that shared data without new reads. Each source is limited to 1,001 documents to detect the 1,000-record threshold; oversized sources use existing count/cursor query fallbacks rather than incomplete totals. Indexed fallback requests are deduplicated, cached for 60 seconds and invalidated by observed snapshots. Manual refresh explicitly requests fresh server data. A browser reload starts a new session. Customer records are kept in memory, not localStorage, and cleared when auth identity changes. Listener cleanup occurs on root unmount. Firestore security rules and mobile code remain unchanged.

## Previous-period comparison

Comparison is off by default. When enabled, the Compare filter uses the previous equivalent calendar span, using the same segment/status filters. In-progress ranges compare only elapsed time: Today through 17:35 compares with yesterday through 17:35. Completed ranges compare their full duration. Exact previous dates appear above the cards; charts align their buckets by position and show previous dates in tooltips. Percentage changes are calculated only for nonzero baselines. A zero baseline uses an absolute change, missing data stays unavailable, and All time has no previous period. Comparisons can be switched off.

## Firestore indexes and access

The live store currently lacks a collection-group index on `orders.createdAt`. The dashboard supports the present small collection using a shared, bounded fallback read and client-side timestamp/status filtering. For growth, enable collection-group ascending and descending indexes on `orders.createdAt`, and an index on `orders.status`. Combined status/date queries may require a composite index. Customer email-verification/date queries may require a composite index on `users.emailVerified` and `users.createdAt`. Query failures are surfaced rather than represented as zero.

For the current small customer collection, missing email-verification composite indexes also use a shared bounded fallback. Fallback table pages reuse that snapshot without repeating collection reads. Segments exceeding 1,000 documents require the composite index rather than showing incomplete results.

Deploy required indexes using your existing Firebase administrative workflow; this implementation does not deploy indexes or alter security rules. Authorized admins need `list` access to `users` and collection-group reads of `orders`, `cart`, and `wishlist`. If your rules require authentication, use the existing application's authenticated admin session. This dashboard does not grant admin access or create a new authentication system.

## UI

Tailwind CSS remains configured. Shared component styles are in `src/app/globals.css`, with mode-specific tokens and interaction refinements in `src/app/globals.css`. Dark mode is the default; the header theme toggle stores the selected mode in browser local storage. Pink is the brand accent; muted green marks connection/success states and order activity. Sidebar configuration includes Overview, Orders and Customers, preserving the existing App Controls entry. Navigation supports desktop/tablet expansion and a keyboard-accessible mobile drawer.

Refresh uses a thin indeterminate progress line. Focus, hover and sidebar transitions are restrained; all animations respect reduced-motion preferences. Filters use an outer focus ring to avoid jagged native-select outlines.

Typography and comparison styles are in `src/app/globals.css`. Five compact stats share a single desktop row: customers, total orders, pending orders, orders marked paid, and current cart products. Wishlist remains in the saved-items detail panel, not the stat row. Smaller screens can scroll the stat strip horizontally.

The default is Last 30 days with daily data and readable axis labels. Customer-chart dots animate into place, the line draws on refresh, and the latest current-day point has a 1.15-second pulse. Reduced motion disables these effects. The customer legend uses the requested label New Login; its footnote explicitly identifies the source as registration timestamps, not sign-in events. The order legend is Total orders.

## Validation

- `npm run lint`
- `npm run build` (the existing Geist font setup needs access to Google Fonts during build)
- `node --test scripts/analytics.test.mjs scripts/order-records.test.mjs`
- `node scripts/inspect-firestore.mjs`: read-only schema/count checks; prints field types and aggregate counts, never customer records or configuration values.
- `node scripts/check-dashboard.cjs`: local browser checks using the temporary Playwright installation in `node_modules/.cache/dashboard-qa`, with installed Chrome. Screenshots stay in that ignored directory because they contain real customer data.

Keep future modules under `src/components/dashboard` and queries in `src/lib/dashboard-data.js`. No demo records or fabricated growth percentages are used.

## Orders

The Orders route shows all recorded orders, independently of Overview date filters. Up to 1,000 records use one bounded snapshot with client search, filters and pagination; larger stores use 25-record Firestore cursor pages with full-store filters disabled. Order details show products and tracking events. Explicit payment fields appear when stored; paid order status is labeled Marked paid, and pending is never inferred to be unpaid or COD. Currency symbols are shown only with a recorded currency. Refresh discovers newly available fields. Styles live in src/app/orders.css.

Browser check: node scripts/check-dashboard.cjs --orders.


## Order editing, dates and PDF

Row actions provide an explicit status editor and a lazy-loaded jsPDF export. Order, payment and delivery values remain independent. A Firestore transaction compares touched fields against the opened record and rejects concurrent edits. Only changed status fields plus adminStatusUpdatedAt/adminStatusUpdatedBy are written. Existing payment and delivery field paths are preserved; absent fields use paymentStatus/trackingStatus. This records status only; it does not invoke payment or courier operations. Authorized accounts need get/update access to the order document and metadata fields; no rules are deployed. Live writes are not performed by browser QA.

The themed calendar filters createdAt using local-calendar inclusive dates. Undated orders are excluded only while date filtering is active. Large paged datasets retain the existing indexed-search limitation. PDF exports contain recorded values and are order summaries, not tax invoices. Missing currency is displayed as a compact Price amount without inventing a currency.


## Tailwind styling

Layout, spacing, typography, responsive states and component controls now use static Tailwind v4 utility recipes in src/lib/ui.js, consumed by components through ui(). tailwind-merge resolves utilities when recipes are composed. Semantic class names remain only as stable state/chart/test hooks; the old component CSS rules were removed. The global CSS files retain design tokens, base element/accessibility defaults, mode-specific colors, Recharts integration and keyframe animations.

The sidebar preserves the supplied Cloudinary Cupid512_1_lw3rqp.png URL as a 40px square image without a background wrapper or extra heart icon. Desktop collapse/expand is available only in the header; the mobile drawer retains its close button.


## Customer directory and cache limits

`/customers` offers name/email/phone/ID search, A?Z/Z?A, newest/oldest and coin sorting; email verification, available location/onboarding, order activity and joined-date filters; paginated rows and filtered CSV export. The profile drawer shows recorded profile fields, orders, cart and wishlist entries. Secrets/token fields are excluded. CSV formula-like cells are escaped. Missing timestamps are never treated as today.

For collections above 1,000 records, all customer documents remain reachable through ID-based cursor pages. Full-directory search/sort/export are disabled until an appropriate search index exists. The bounded listener only observes its loaded window; changes outside that window require refresh or cache expiry in the indexed fallbacks. The UI labels this mode INDEXED DATA rather than LIVE. No claim is made that a bounded listener monitors unseen records.

Checks: `npm run lint`, `npm run build`, `node --test scripts/analytics.test.mjs scripts/order-records.test.mjs scripts/customers.test.mjs`, and browser checks `node scripts/check-dashboard.cjs --customers` / `--orders` / `--quick` (local Playwright tooling). Browser checks are read-only; status editor tests cancel without saving.
