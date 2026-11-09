/* Vital Elixir Pricing V2 — client-side published-catalogue pricing.
   Never reads COST MASTER or calls Apps Script. Public amounts are estimates
   until reviewed by the Vital Elixir team. */
(function(root){
"use strict";
const CENTS=100;
const num=x=>Number(x);
const round2=x=>Math.round((x+Number.EPSILON)*100)/100;
const valid=p=>Boolean(p && p.packaging && p.pricing_v2 &&
  Number.isInteger(num(p.pricing_v2.price_per_pack_cents)) &&
  num(p.pricing_v2.price_per_pack_cents)>0 &&
  Number.isInteger(num(p.packaging.units_per_pack)) && num(p.packaging.units_per_pack)>0 &&
  Number.isInteger(num(p.packaging.packs_per_box)) && num(p.packaging.packs_per_box)>0);
function maxPacks(p){
 if(!valid(p))return 0;
 const pk=p.packaging;
 return Math.max(0,Math.min(Math.floor(500/num(pk.units_per_pack)),5*num(pk.packs_per_box)));
}
function currency(){return root.currencyUtils?.getSelectedCurrency?.()||"USD";}
function formatUsd(usd){const c=currency(); const rate=num(root.currencyUtils?.rates?.[c]||1);
 return c+" "+round2(usd*rate).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
function packName(p){return p.packaging?.pack_unit||"pack";}
function text(el,s){el.textContent=String(s);return el;}
function node(tag,cl,txt){const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)text(e,txt);return e;}
function validatePackCount(product,count){
 if(!valid(product))throw Error("Pricing is not available for this medicine.");
 if(!Number.isInteger(count)||count<1)throw Error("Enter a positive whole number of "+packName(product)+"s.");
 const max=maxPacks(product),pk=product.packaging;
 if(count>max)throw Error("Maximum quantity is 500 units or 5 boxes per medicine ("+max+" "+packName(product)+(max===1?"":"s")+").");
 if(count*pk.units_per_pack>500||count/pk.packs_per_box>5)throw Error("Maximum quantity is 500 units and 5 boxes.");
 return count;
}
function price(product,packCount){return validatePackCount(product,packCount)*num(product.pricing_v2.price_per_pack_cents)/CENTS;}
function shipping(boxes){
 if(!Number.isFinite(boxes)||boxes<=0)throw Error("Select at least one medicine.");
 if(boxes<=9)return 35;
 if(boxes<=15)return 45;
 if(boxes<=20)return 49;
 if(boxes<=40)return 59;
 if(boxes<=60)return 69;
 if(boxes<=100)return 85;
 throw Error("Shipping quantity too big — break your order into parts.");
}
function choices(product){
 const q=product.packaging,m=maxPacks(product);
 let candidates=(product.display_quantities||[])
   .map(x=>Number(x)/q.units_per_pack)
   .filter(x=>Number.isInteger(x)&&x>0&&x<=m);
 if(!candidates.length)candidates=[1,q.packs_per_box,3*q.packs_per_box,5*q.packs_per_box].filter(x=>x<=m);
 return [...new Set(candidates)].sort((a,b)=>a-b);
}
function mountSelector(host,product,callback,selectHost){
 if(!valid(product))return null;
 host.replaceChildren();host.classList.add("bg-blue-50","border","border-blue-200","rounded-2xl","p-4","md:p-5","mb-4");
 host.addEventListener("click",e=>e.stopPropagation());
 host.addEventListener("keydown",e=>e.stopPropagation());
 const pk=product.packaging,max=maxPacks(product),unit=packName(product),plural=unit+"s";
 const summary=node("div","grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5");
 const left=node("div"),right=node("div");
 left.append(node("p","text-xs font-semibold text-slate-500 mb-1","Cost"),node("p","text-xl font-bold text-brand",formatUsd(num(product.pricing_v2.price_per_pack_cents)/100)+" per "+unit));
 const contents=(pk.label.match(/(?:tablets?|capsules?|sachets?)/i)||["units"])[0].toLowerCase();
 const boxDescription=unit==="strip" ? (pk.units_per_pack*pk.packs_per_box)+" "+contents+" per box" : pk.packs_per_box+" "+unit+(pk.packs_per_box===1?"":"s")+" per box";
 right.append(node("p","text-xs font-semibold text-slate-500 mb-1","Pack"),node("p","text-sm md:text-base font-semibold text-slate-700",pk.label+" · "+boxDescription));
 summary.append(left,right);
 const entry=node("div","border-t border-blue-200 mt-3 pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2");
 const field=node("div","flex items-center justify-between md:justify-start gap-3");
 const label=node("label","text-sm font-semibold text-slate-700","Enter the "+plural);
 const input=node("input","w-28 border border-slate-300 bg-white rounded-lg px-3 py-2 text-base");
 input.type="text";input.inputMode="numeric";input.pattern="[0-9]*";input.maxLength=5;input.autocomplete="off";input.placeholder="1–"+max;
 input.id="ve-strips-"+product.manager_key;label.htmlFor=input.id;
 input.setAttribute("aria-label","Enter whole number of "+plural+" (maximum "+max+")");
 field.append(label,input);
 const total=node("p","text-sm md:text-base font-bold text-brand");total.setAttribute("aria-live","polite");
 entry.append(field,total);
 const error=node("p","text-xs text-red-600 mt-2");error.setAttribute("role","alert");
 host.append(summary,entry,error);
 const select=node("select","w-full border border-slate-300 rounded-xl px-3 py-3 text-sm bg-white");
 select.setAttribute("aria-label","Select predefined quantity or custom pack");
 select.addEventListener("click",e=>e.stopPropagation());
 select.addEventListener("keydown",e=>e.stopPropagation());
 const presets=choices(product);
 for(const n of presets){const o=document.createElement("option");o.value=String(n);o.textContent=n*pk.units_per_pack+" units — "+formatUsd(price(product,n));select.append(o)}
 const custom=document.createElement("option");custom.value="custom";custom.textContent="Custom pack";select.append(custom);
 if(selectHost){selectHost.replaceChildren();selectHost.append(select);}
 else{host.append(node("p","text-sm font-semibold mt-3 mb-2","Select Qty"),select)}
 let selected=presets[0]||1;
 function render(mode){error.textContent="";total.textContent=selected+" "+(selected===1?unit:plural)+" = "+formatUsd(price(product,selected));select.value=mode==="custom"?"custom":String(selected);if(callback)callback(selected)}
 select.onchange=()=>{if(select.value==="custom"){selected=null;input.value="";total.textContent="Enter your custom quantity.";input.focus();if(callback)callback(null);return}selected=Number(select.value);input.value="";render("preset")};
 input.onkeydown=e=>{if([".",",","-","+","e","E"].includes(e.key))e.preventDefault()};
 input.oninput=()=>{
  const raw=input.value.trim();select.value="custom";
  if(!/^[1-9][0-9]*$/.test(raw)){selected=null;error.textContent=raw?"Only whole numbers from 1 to "+max+" "+plural+" allowed.":"Enter a whole number.";total.textContent="";if(callback)callback(null);return}
  try{validatePackCount(product,Number(raw));selected=Number(raw);render("custom")}
  catch(e){selected=null;error.textContent=e.message;total.textContent="";if(callback)callback(null)}
 };
 render("preset");
 return {getSelection(){return validatePackCount(product,selected);},getMax(){return max;}};
}
function cartItem(product,packCount){
 const n=validatePackCount(product,Number(packCount));
 return {pricingMode:"v2",managerKey:product.manager_key,productId:product.id,
 name:product.name,brand:product.brand,composition:product.composition,pack:product.packaging.label,
 image:product.thumbnail,packCount:n,selectedQuantity:n*product.packaging.units_per_pack,
 quantity:1,unitsPerPack:product.packaging.units_per_pack,packsPerBox:product.packaging.packs_per_box,
 pricePerPackUsd:product.pricing_v2.price_per_pack_cents/100};
}
function quote(items,catalogue){
 if(!Array.isArray(items)||!items.length)throw Error("Your cart is empty.");
 const byKey=new Map((catalogue||[]).map(p=>[p.manager_key,p]));
 let cents=0,boxes=0;const counts=new Map();const compositions=new Map();const lines=[];
 for(const i of items){
   if(i.pricingMode!=="v2")throw Error("Please reselect legacy saved medicines to get the updated price.");
   const key=String(i.managerKey||""),n=num(i.packCount);
   if(!Number.isInteger(n)||n<1)throw Error("Invalid custom pack quantity.");
   counts.set(key,(counts.get(key)||0)+n);
 }
 for(const [key,n] of counts){
   const p=byKey.get(key);
   validatePackCount(p,n);
   const q=p.packaging,unitCount=n*q.units_per_pack,boxCount=n/q.packs_per_box;
   const comp=String(p.composition||key).trim().toLowerCase();
   const c=compositions.get(comp)||{units:0,boxes:0};
   c.units+=unitCount;c.boxes+=boxCount;compositions.set(comp,c);
   cents+=n*p.pricing_v2.price_per_pack_cents;boxes+=boxCount;
   lines.push({managerKey:key,packCount:n,units:unitCount,boxes:boxCount,
     medicationUsd:n*p.pricing_v2.price_per_pack_cents/100});
 }
 for(const [comp,c] of compositions)if(c.units>500||c.boxes>5+1e-8)
    throw Error("Maximum 500 units or 5 boxes for each composition. Please reduce "+comp+".");
 const shippingUsd=shipping(boxes),merchandiseUsd=cents/100;
 return {pricingVersion:2,currency:"USD",medicineTypeCount:counts.size,
   totalBoxes:round2(boxes),merchandiseUsd,shippingUsd,
   finalUsd:round2(merchandiseUsd+shippingUsd),lines,
   source:"published_catalogue",status:"estimate_pending_team_confirmation"};
}
root.vitalPricingV2={isReady:valid,maxPacks,formatUsd,validatePackCount,price,shipping,mountSelector,cartItem,quote};
})(window);
