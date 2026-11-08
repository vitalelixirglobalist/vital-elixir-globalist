// Run from repository root: node --test tests/pricing-v2.test.js
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'..','pricing-v2.js'),'utf8');
const window={currencyUtils:{rates:{USD:1,GBP:0.79},getSelectedCurrency:()=> 'USD'}};
vm.runInNewContext(code,{window});
const v2=window.vitalPricingV2;
const strip=(key='P0003',composition='Dapoxetine 60mg')=>({
 manager_key:key,composition,packaging:{label:'10 Tablets/Strip',units_per_pack:10,packs_per_box:10,pack_unit:'strip'},
 pricing_v2:{currency:'USD',price_per_pack_cents:110},display_quantities:[50,100,300,500]
});
test('shipping tiers and fractional boundaries',()=>{
 const points=[[0.7,35],[9,35],[9.1,45],[15,45],[15.5,49],[20,49],[20.01,59],[40,59],[40.1,69],[60,69],[60.1,85],[100,85]];
 points.forEach(([boxes,expected])=>assert.equal(v2.shipping(boxes),expected));
 assert.throws(()=>v2.shipping(100.1),/break.*parts/i);
});
test('7 custom strips equal $7.70, 0.7 boxes, $35 shipping',()=>{
 const p=strip(),q=v2.quote([{managerKey:p.manager_key,packCount:7,pricingMode:'v2'}],[p]);
 assert.equal(q.merchandiseUsd,7.7);
 assert.equal(q.totalBoxes,0.7);
 assert.equal(q.shippingUsd,35);
 assert.equal(q.finalUsd,42.7);
 assert.equal(v2.formatUsd(7.7),'USD 7.70');
});
test('50 strips allowed / 51 strips rejected, maximum 500 tablets and five boxes',()=>{
 const p=strip(); assert.equal(v2.maxPacks(p),50);
 assert.equal(v2.price(p,50),55);
 assert.throws(()=>v2.price(p,51),/Maximum/);
 assert.throws(()=>v2.price(p,1.5),/positive whole number/);
});
test('120 tablets per bottle permits only four bottles',()=>{
 const p={...strip(),packaging:{label:'120 Tablets/Bottle',pack_unit:'bottle',units_per_pack:120,packs_per_box:1}};
 assert.equal(v2.maxPacks(p),4);assert.throws(()=>v2.price(p,5),/Maximum/);
});
test('same composition combined units cannot exceed 500',()=>{
 const p1=strip('P0003','Same composition'),p2=strip('P0004','Same composition');
 assert.throws(()=>v2.quote([{managerKey:'P0003',packCount:30,pricingMode:'v2'},{managerKey:'P0004',packCount:30,pricingMode:'v2'}],[p1,p2]),/Maximum 500 units/);
});
test('combined boxes set shipping for whole mixed cart',()=>{
 const p1=strip('P0003','A'),p2=strip('P0004','B');
 const q=v2.quote([{managerKey:'P0003',packCount:50,pricingMode:'v2'},{managerKey:'P0004',packCount:42,pricingMode:'v2'}],[p1,p2]);
 assert.equal(q.totalBoxes,9.2);assert.equal(q.shippingUsd,45);
});
test('missing price and forged product key fail closed',()=>{
 const p=strip();delete p.pricing_v2;
 assert.equal(v2.isReady(p),false);
 assert.throws(()=>v2.quote([{managerKey:'P9999',packCount:1,pricingMode:'v2'}],[strip()]),/not available/i);
});
