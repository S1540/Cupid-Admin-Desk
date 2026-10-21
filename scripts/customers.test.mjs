import test from "node:test";
import assert from "node:assert/strict";
import { CUSTOMER_FILTERS, normalizeCustomer, filterCustomers, csvCell, ownerCounts } from "../src/lib/customer-records.js";
import { cachedRequest, useAdminStore, SOURCE_LIMIT } from "../src/lib/admin-store.js";
import { buildCachedDashboard } from "../src/lib/cached-analytics.js";
import { DEFAULT_FILTERS } from "../src/lib/analytics.js";
const stamp = value => ({ toMillis: () => +new Date(value) });
const raw = [
  {id:"a",data:{fullName:"Zara",email:"z@example.test",emailVerified:true,createdAt:stamp("2026-10-20T01:00:00"),cupidCoins:0}},
  {id:"b",data:{userName:"Alice",email:"a@example.test",emailVerified:false,createdAt:stamp("2026-10-19T01:00:00"),cupidCoins:100}},
  {id:"c",data:{fullName:"Ben",createdAt:"invalid"}},
];
const rows=raw.map(normalizeCustomer);
test("customer sorting handles missing dates and zero coins",()=>{
  for(const [sort,expected] of [["az",["b","c","a"]],["za",["a","c","b"]],["newest",["a","b","c"]],["oldest",["b","a","c"]],["coins-low",["a","b","c"]]]) {
    assert.deepEqual(filterCustomers(rows,{...CUSTOMER_FILTERS,sort}).map(row=>row.id),expected);
  }
});
test("customer search, verification, dates and order activity combine accurately",()=>{
  assert.deepEqual(filterCustomers(rows,{...CUSTOMER_FILTERS,search:"EXAMPLE",verification:"verified"}).map(row=>row.id),["a"]);
  assert.deepEqual(filterCustomers(rows,{...CUSTOMER_FILTERS,start:"2026-10-20",end:"2026-10-20"}).map(row=>row.id),["a"]);
  const counts=ownerCounts([{path:"users/b/orders/1"},{path:"users/b/orders/2"}]);
  assert.equal(counts.b,2);
  assert.deepEqual(filterCustomers(rows,{...CUSTOMER_FILTERS,activity:"ordered"},counts).map(row=>row.id),["b"]);
  assert.equal(rows[2].createdAt,null);
});
test("CSV escapes formulas, quotes and preserves normal values",()=>{
  assert.equal(csvCell('=1+1'),'"\'=1+1"');
  assert.equal(csvCell('a"b'),'"a""b"');
  assert.equal(csvCell(0),'"0"');
});
test("shared requests deduplicate, invalidate on snapshots and clear on auth change",async()=>{
  useAdminStore.getState().resetSession("admin-a");
  let calls=0;
  const loader=async()=>++calls;
  assert.deepEqual(await Promise.all([cachedRequest("test",loader),cachedRequest("test",loader)]),[1,1]);
  assert.equal(await cachedRequest("test",loader),1);
  useAdminStore.getState().receive("users",raw);
  assert.equal(await cachedRequest("test",loader),2);
  useAdminStore.getState().resetSession("admin-b");
  assert.equal(useAdminStore.getState().sources.users.rows.length,0);
  assert.equal(await cachedRequest("test",loader),3);
});
test("snapshot additions, edits and deletions update date metrics without queries",()=>{
  const store=useAdminStore.getState();
  store.resetSession("test");
  for(const name of ["users","orders","cart","wishlist"]) store.receive(name,[]);
  store.receive("users",raw);
  const calculate=()=>buildCachedDashboard(useAdminStore.getState().sources,{...DEFAULT_FILTERS,range:"Today"},new Date(2026,9,20,12));
  assert.equal(calculate().newUsers.value,1);
  store.receive("users",[...raw,{id:"d",data:{createdAt:stamp("2026-10-20T02:00:00")}}]);
  assert.equal(calculate().newUsers.value,2);
  store.receive("users",raw.filter(row=>row.id!=="a"));
  assert.equal(calculate().newUsers.value,0);
  store.receive("users",[{...raw[1],data:{...raw[1].data,createdAt:stamp("2026-10-20T03:00:00")}}]);
  assert.equal(calculate().newUsers.value,1);
  store.setSource("users",{status:"error",error:"Permission denied"});
  assert.equal(calculate().newUsers.value,null);
  store.receive("users",Array.from({length:SOURCE_LIMIT+1},()=>raw[0]));
  assert.equal(useAdminStore.getState().sources.users.complete,false);
  assert.equal(calculate().newUsers.value,null);
});
