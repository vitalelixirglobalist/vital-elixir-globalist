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
function mountSelector(host,product,callback){
 if(!valid(product))return null;
 host.replaceChildren();host.classList.add("ve-v2-selector");
 host.addEventListener("click",e=>e.stopPropagation());
 host.addEventListener("keydown",e=>e.stopPropagation());
 const pkg=product.packaging,max=maxPacks(product),packUnit=packName(product);
 const info=node("p","text-xs text-slate-600 my-2");
 info.textContent=pkg.label+" · "+pkg.packs_per_box+" "+packUnit+"(s) per box · "+(pkg.units_per_pack*pkg.packs_per_box)+" units per box";
 const first=node("div","flex items-end justify-between gap-3 mt-3");
 const left=node("div","flex-1");
 left.append(node("p","text-xs text-slate-500","Price per "+packUnit),node("strong","text-lg text-brand",formatUsd(num(product.pricing_v2.price_per_pack_cents)/100)));
 const right=node("div","w-28");
 const lab=node("label","block text-xs text-slate-600 mb-1","Custom "+packUnit+"s");
 const input=node("input","w-full border rounded-lg p-2 text-sm");
 input.type="number";input.min="1";input.max=String(max);input.step="1";input.inputMode="numeric";
 input.setAttribute("aria-label","Enter custom "+packUnit+" quantity");
 right.append(lab,input);first.append(left,right);
 const heading=node("label","block text-sm font-semibold text-slate-700 mt-3 mb-2","Select Qty");
 const dropdown=node("select","w-full border rounded-lg bg-white px-3 py-3 text-sm");
 dropdown.setAttribute("aria-label","Select predefined quantity or custom pack");
 const choicesList=choices(product);
 for(const n of choicesList){
   const o=document.createElement("option");o.value=String(n);
   o.textContent=(n*pkg.units_per_pack)+" units ("+n+" "+packUnit+(n===1?"":"s")+") — "+formatUsd(price(product,n));
   dropdown.appendChild(o);
 }
 const customOption=document.createElement("option");
 customOption.value="custom";customOption.textContent="Custom pack";dropdown.appendChild(customOption);
 const total=node("div","mt-3 p-2 rounded-lg bg-blue-50 text-sm font-semibold text-slate-800");
 const error=node("p","text-xs text-red-600 mt-1");error.setAttribute("role","alert");
 let selected=choicesList[0]||1;
 function draw(mode){
   error.textContent="";
   total.textContent=selected+" "+packUnit+(selected===1?"":"s")+" ("+(selected*pkg.units_per_pack)+" units) = "+formatUsd(price(product,selected));
   if(mode==="custom")dropdown.value="custom";else dropdown.value=String(selected);
   if(callback)callback(selected);
 }
 input.value=String(selected);
 dropdown.onchange=()=>{
   if(dropdown.value==="custom"){input.focus();return;}
   selected=Number(dropdown.value);input.value=String(selected);draw("preset");
 };
 input.oninput=()=>{
   const candidate=num(input.value);
   try{
     validatePackCount(product,candidate);
     selected=candidate;draw("custom");
   }catch(e){
     dropdown.value="custom";
     error.textContent=e.message;
     total.textContent="Enter a valid quantity to calculate the medication price.";
     if(callback)callback(null);
   }
 };
 host.append(info,first,heading,dropdown,total,error);draw("preset");
 return {getSelection(){return validatePackCount(product,num(input.value));},getMax(){return max;}};
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
