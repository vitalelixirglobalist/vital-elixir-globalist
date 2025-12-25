import { auth, db } from './firebase-config.js';
import { initAuth } from './auth.js';
import { subscribeCart, updateQty, removeItem, clearCart } from './cart-service.js';
import {
  addDoc,
  collection
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const SHIPPING_USD = 35;

const getSelectedCurrency = () => window.currencyUtils?.getSelectedCurrency?.() || 'GBP';

const formatForeignCurrency = (value) => {
  const currency = getSelectedCurrency();
  const converted = window.currencyUtils?.convertFromUsd
    ? window.currencyUtils.convertFromUsd(value, currency)
    : value;
  return `${currency} ${Number(converted || 0).toFixed(2)}`;
};

const calculateShippingInr = (medicineUsd, medicineInr, existingShippingInr) => {
  if (existingShippingInr !== undefined && existingShippingInr !== null) {
    return Number(existingShippingInr);
  }
  if (!medicineUsd) return 0;
  const rate = medicineInr / medicineUsd;
  const computed = rate * SHIPPING_USD;
  return parseFloat(computed.toFixed(2));
};

const calculateLineTotals = (item) => {
  const qty = Number(item.qty || 1);
  const medicineUsd = Number(item.price_usd || 0);
  const medicineInr = Number(item.price_inr || 0);
  const shippingUsd = item.shipping_usd !== undefined && item.shipping_usd !== null
    ? Number(item.shipping_usd)
    : SHIPPING_USD;
  const shippingInr = calculateShippingInr(medicineUsd, medicineInr, item.shipping_inr);
  const lineMedicineUsd = parseFloat((medicineUsd * qty).toFixed(2));
  const lineMedicineInr = parseFloat((medicineInr * qty).toFixed(2));
  const lineShippingUsd = parseFloat((shippingUsd * qty).toFixed(2));
  const lineShippingInr = parseFloat((shippingInr * qty).toFixed(2));
  const lineTotalUsd = parseFloat(((medicineUsd + shippingUsd) * qty).toFixed(2));
  const lineTotalInr = parseFloat(((medicineInr + shippingInr) * qty).toFixed(2));
  return {
    qty,
    medicineUsd,
    medicineInr,
    shippingUsd,
    shippingInr,
    lineMedicineUsd,
    lineMedicineInr,
    lineShippingUsd,
    lineShippingInr,
    lineTotalUsd,
    lineTotalInr
  };
};

const cartItemsDiv = document.getElementById('cartItems');
const cartSummaryDiv = document.getElementById('cartSummary');
const detailsSection = document.getElementById('detailsSection');
const payButton = document.getElementById('payButton');

let currentUser = null;
let cartItems = [];
let unsubscribeCart = null;

const renderCart = (items) => {
  cartItemsDiv.innerHTML = '';
  cartSummaryDiv.innerHTML = '';

  if (!items.length) {
    cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  let subtotalINR = 0;
  let subtotalUSD = 0;
  let shippingTotalINR = 0;
  let shippingTotalUSD = 0;

  items.forEach((item) => {
    const totals = calculateLineTotals(item);
    subtotalINR += totals.lineMedicineInr;
    subtotalUSD += totals.lineMedicineUsd;
    shippingTotalINR += totals.lineShippingInr;
    shippingTotalUSD += totals.lineShippingUsd;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex flex-col gap-4 p-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between';
    itemDiv.innerHTML = `
      <div class="flex items-center gap-4">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain rounded" />
        <div>
          <h3 class="font-semibold">${item.name}</h3>
          <p class="text-sm text-gray-500">${item.pack}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="qty-btn border px-2 py-1 rounded" data-action="decrease" data-product-id="${item.productId}">-</button>
        <span class="text-sm font-medium">${totals.qty}</span>
        <button class="qty-btn border px-2 py-1 rounded" data-action="increase" data-product-id="${item.productId}">+</button>
      </div>
      <div class="text-sm text-right space-y-1">
        <p>Medicine: ${formatForeignCurrency(totals.lineMedicineUsd)} | INR ${totals.lineMedicineInr.toFixed(2)}</p>
        <p>Shipping: ${formatForeignCurrency(totals.lineShippingUsd)} | INR ${totals.lineShippingInr.toFixed(2)}</p>
        <p class="font-semibold text-brand">Total: ${formatForeignCurrency(totals.lineTotalUsd)} | INR ${totals.lineTotalInr.toFixed(2)}</p>
        <button class="block ml-auto text-red-500 text-xs removeItemBtn" data-product-id="${item.productId}">Remove</button>
      </div>
    `;
    cartItemsDiv.appendChild(itemDiv);
  });

  const grandTotalUSD = subtotalUSD + shippingTotalUSD;
  const grandTotalINR = subtotalINR + shippingTotalINR;
  cartSummaryDiv.innerHTML = `
    <div class="bg-white p-4 rounded-lg shadow space-y-2">
      <p>Subtotal: ${formatForeignCurrency(subtotalUSD)} | INR ${subtotalINR.toFixed(2)}</p>
      <p>Shipping (+${formatForeignCurrency(SHIPPING_USD)} per item): ${formatForeignCurrency(shippingTotalUSD)} | INR ${shippingTotalINR.toFixed(2)}</p>
      <p class="font-bold text-brand text-lg">Total: ${formatForeignCurrency(grandTotalUSD)} | INR ${grandTotalINR.toFixed(2)}</p>
    </div>
  `;
};

const bindCartActions = () => {
  cartItemsDiv.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const productId = target.getAttribute('data-product-id');
    if (!productId || !currentUser) return;

    if (target.classList.contains('removeItemBtn')) {
      await removeItem(currentUser.uid, productId);
      return;
    }

    if (target.classList.contains('qty-btn')) {
      const action = target.getAttribute('data-action');
      const item = cartItems.find((entry) => entry.productId === productId);
      if (!item) return;
      const currentQty = Number(item.qty || 1);
      const nextQty = action === 'increase' ? currentQty + 1 : currentQty - 1;
      await updateQty(currentUser.uid, productId, nextQty);
    }
  });
};

const startCartSubscription = (user) => {
  if (unsubscribeCart) {
    unsubscribeCart();
  }
  unsubscribeCart = subscribeCart(user.uid, (items) => {
    cartItems = items;
    renderCart(items);
  });
};

initAuth((user) => {
  currentUser = user;
  startCartSubscription(user);
  if (user.email) {
    document.getElementById('customerEmail').value = user.email;
  }
});

bindCartActions();

document.addEventListener('currency:change', () => {
  renderCart(cartItems);
});

payButton.addEventListener('click', async () => {
  if (!currentUser) {
    alert('Setting up your cart. Please try again in a moment.');
    return;
  }

  if (!cartItems.length) {
    alert('Your cart is empty. Please add products before checkout.');
    return;
  }

  const name = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const country = document.getElementById('customerCountry').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  if (!name || !email) {
    alert('Please provide your name and email.');
    return;
  }

  let totalINR = 0;
  cartItems.forEach((item) => {
    const { lineTotalInr } = calculateLineTotals(item);
    totalINR += lineTotalInr;
  });

  const amountPaise = Math.round(totalINR * 100);
  const options = {
    key: 'RAZORPAY_KEY_ID',
    amount: amountPaise,
    currency: 'INR',
    name: 'Vital Elixir Globalist',
    description: 'Purchase of Medicines',
    handler: async function (response) {
      const orderData = {
        items: cartItems,
        date: new Date().toISOString(),
        status: 'success',
        orderId: response.razorpay_payment_id,
        trackingId: '',
        customer: {
          name: name,
          email: email,
          phone: phone,
          country: country,
          address: address
        }
      };
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'orders'), orderData);
      } catch (err) {
        console.error('Error saving order to Firestore', err);
      }

      await clearCart(currentUser.uid);

      const mailBody = encodeURIComponent(`New order placed by ${name} (Email: ${email}).\n\nItems:\n${cartItems.map((i) => i.name + ' - ' + i.pack).join(', ')}\nTotal INR: ${totalINR}\nOrder ID: ${response.razorpay_payment_id}`);
      window.open(`mailto:vitalelixirglobalist@gmail.com?subject=New Order&body=${mailBody}`);
      window.location.href = 'thankyou.html';
    },
    prefill: {
      name: name,
      email: email,
      contact: phone
    },
    notes: {
      address: address,
      country: country
    },
    theme: {
      color: '#0284c7'
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
});
