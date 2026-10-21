// Read-only schema inspection. Never print customer records or configuration.
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, collectionGroup, getDocsFromServer, getCountFromServer, query, limit, where, orderBy, Timestamp } from 'firebase/firestore';
process.loadEnvFile('.env');
const db = getFirestore(initializeApp({apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID}));
const timer = setTimeout(() => { console.log('Inspection timed out'); process.exit(1); }, 25000);
if (process.argv.includes('--orders')) {
  const snapshot = await getDocsFromServer(query(collectionGroup(db, 'orders'), limit(1001)));
  const schema = new Map();
  function inspect(value, prefix = '') {
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const types = schema.get(path) || new Set();
      types.add(item?.constructor?.name || typeof item); schema.set(path, types);
      if (item && item.constructor === Object) inspect(item, path);
      if (Array.isArray(item) && item[0]?.constructor === Object) inspect(item[0], `${path}[]`);
    }
  }
  snapshot.docs.forEach(doc => inspect(doc.data()));
  console.log(JSON.stringify({ count: snapshot.size, schema: Object.fromEntries([...schema].map(([key, types]) => [key, [...types]])), orderStatuses: [...new Set(snapshot.docs.map(doc => doc.data().status))], trackingStatuses: [...new Set(snapshot.docs.map(doc => doc.data().trackingStatus))] }, null, 2));
  clearTimeout(timer); process.exit(0);
}
for (const name of ['users', 'orders', 'cart', 'wishlist']) {
  try {
    const ref = name === 'users' ? collection(db, name) : collectionGroup(db, name);
    const snapshot = await getDocsFromServer(query(ref, limit(3)));
    console.log(JSON.stringify({collection: name, documents: snapshot.docs.map(doc => ({pathShape: doc.ref.path.split('/').map((v, i) => i % 2 ? '[id]' : v).join('/'), fields: Object.fromEntries(Object.entries(doc.data()).map(([k, v]) => [k, v?.constructor?.name || typeof v]))}))}));
  } catch (error) { console.log(name, error.code); }
}
for (const name of ['users', 'orders', 'cart', 'wishlist']) {
  const ref = name === 'users' ? collection(db, name) : collectionGroup(db, name);
  try { console.log(name, 'total count', (await getCountFromServer(ref)).data().count); } catch (e) { console.log(name, 'count error', e.code); }
  if (name === 'users' || name === 'orders') {
    try {
      const constraints = [where('createdAt', '>=', Timestamp.fromDate(new Date('2026-09-20T00:00:00Z'))), where('createdAt', '<', Timestamp.fromDate(new Date('2026-10-20T00:00:00Z')))];
      console.log(name, 'range count', (await getCountFromServer(query(ref, ...constraints))).data().count);
      await getDocsFromServer(query(ref, ...constraints, orderBy('createdAt', 'desc'), limit(7)));
      console.log(name, 'pagination query passed');
    } catch(e) { console.log(name, 'range error', e.code, e.message); }
  }
}
clearTimeout(timer);
process.exit(0);
