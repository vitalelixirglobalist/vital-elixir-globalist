import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBsSrWpk0I6YnjNJcGRBnXg23WePsgdRx4',
  authDomain: 'vital-elixir-globalist.firebaseapp.com',
  projectId: 'vital-elixir-globalist',
  storageBucket: 'vital-elixir-globalist.appspot.com',
  messagingSenderId: '87028221342',
  appId: '1:87028221342:web:0c7719acc703566e8fc28f',
  measurementId: 'G-5MWKWE2C4J'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SHIPPING_USD = 35;

const checkoutItemsDiv = document.getElementById('checkoutItems');
const orderSummaryDiv = document.getElementById('orderSummary');
const proceedToPaymentBtn = document.getElementById('proceedToPayment');
const paymentSection = document.getElementById('paymentSection');

const getSelectedCurrency = () => window.currencyUtils?.getSelectedCurrency?.() || 'GBP';

const formatForeignCurrency = (value) => {
  const currency = getSelectedCurrency();
  const converted = window.currencyUtils?.convertFromUsd
    ? window.currencyUtils.convertFromUsd(value, currency)
    : value;
  return `${currency} ${Number(converted || 0).toFixed(2)}`;
};

const calculateLineTotals = (item) => {
  const medicineUsd = Number(item.price_usd || 0);
  const medicineInr = Number(item.price_inr || 0);
  const shippingUsd = item.shipping_usd !== undefined && item.shipping_usd !== null
    ? Number(item.shipping_usd)
    : SHIPPING_USD;
  const shippingInr = item.shipping_inr !== undefined && item.shipping_inr !== null
    ? Number(item.shipping_inr)
    : 0;
  const totalUsd = item.total_price_usd !== undefined && item.total_price_usd !== null
    ? Number(item.total_price_usd)
    : parseFloat((medicineUsd + shippingUsd).toFixed(2));
  const totalInr = item.total_price_inr !== undefined && item.total_price_inr !== null
    ? Number(item.total_price_inr)
    : parseFloat((medicineInr + shippingInr).toFixed(2));
  return { medicineUsd, medicineInr, shippingUsd, shippingInr, totalUsd, totalInr };
};

async function loadHeader() {
  const header = await fetch('header.html');
  document.getElementById('header-placeholder').innerHTML = await header.text();
  if (window.initCurrencySelect) {
    window.initCurrencySelect();
  }
  const menuBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('close-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  const sidebar = document.getElementById('sidebar');
  if (menuBtn && sidebar && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      setTimeout(() => sidebar.classList.remove('translate-x-full'), 10);
    });
    closeBtn.addEventListener('click', () => {
      sidebar.classList.add('translate-x-full');
      setTimeout(() => mobileMenu.classList.add('hidden'), 300);
    });
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        sidebar.classList.add('translate-x-full');
        setTimeout(() => mobileMenu.classList.add('hidden'), 300);
      }
    });
  }
}

async function getCartItems(currentUser) {
  const localCart = JSON.parse(localStorage.getItem('cart')) || [];
  let firestoreCart = [];
  if (currentUser) {
    try {
      const snapshot = await getDocs(collection(db, 'users', currentUser.uid, 'cart'));
      snapshot.forEach((docSnap) => {
        firestoreCart.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (error) {
      console.error('Error fetching cart from Firestore', error);
    }
  }
  return [...firestoreCart, ...localCart];
}

function renderPaymentPanels(selectedValue) {
  document.querySelectorAll('[data-payment-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.paymentPanel !== selectedValue);
  });
}

function bindPaymentSelection() {
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      renderPaymentPanels(radio.value);
    });
  });
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  if (checked) {
    renderPaymentPanels(checked.value);
  }
}

function renderCheckout(cartItems) {
  checkoutItemsDiv.innerHTML = '';
  orderSummaryDiv.innerHTML = '';

  if (!cartItems.length) {
    checkoutItemsDiv.innerHTML = '<p class="text-sm text-gray-600">Your cart is empty.</p>';
    orderSummaryDiv.innerHTML = '<p class="text-sm text-gray-600">Add items to view totals.</p>';
    return;
  }

  let subtotalUSD = 0;
  let subtotalINR = 0;
  let shippingTotalUSD = 0;
  let shippingTotalINR = 0;
  let hasUnknownPrice = false;

  cartItems.forEach((item) => {
    const { medicineUsd, medicineInr, shippingUsd, shippingInr, totalUsd, totalInr } = calculateLineTotals(item);
    const hasPrice = Boolean(item.price_usd || item.price_inr || item.total_price_usd || item.total_price_inr);
    const strength = item.strength || item.pack || '';
    const quantity = item.quantity || 1;

    if (!hasPrice) {
      hasUnknownPrice = true;
    } else {
      subtotalUSD += medicineUsd;
      subtotalINR += medicineInr;
      shippingTotalUSD += shippingUsd;
      shippingTotalINR += shippingInr;
    }

    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-gray-200 rounded-lg';
    itemDiv.innerHTML = `
      <div class="flex items-start gap-4 flex-1">
        <img src="${item.image || ''}" alt="${item.name || 'Product'}" class="w-16 h-16 object-contain rounded bg-white border" />
        <div class="space-y-1">
          <h4 class="font-semibold">${item.name || 'Item'}</h4>
          ${strength ? `<p class="text-sm text-gray-500">Strength: ${strength}</p>` : ''}
          <p class="text-sm text-gray-500">Quantity: ${quantity}</p>
        </div>
      </div>
      <div class="text-sm text-gray-700 sm:text-right space-y-1">
        <p class="font-semibold">${hasPrice ? formatForeignCurrency(medicineUsd) : 'Price on request'}</p>
        ${hasPrice ? `<p class="text-xs text-gray-500">Subtotal: ${formatForeignCurrency(totalUsd)} | INR ${totalInr.toFixed(2)}</p>` : ''}
      </div>
    `;
    checkoutItemsDiv.appendChild(itemDiv);
  });

  if (hasUnknownPrice) {
    orderSummaryDiv.innerHTML = `
      <p class="flex items-center justify-between"><span>Subtotal</span><span>Price on request</span></p>
      <p class="flex items-center justify-between"><span>Shipping/Documentation</span><span>${formatForeignCurrency(SHIPPING_USD)} per item</span></p>
      <p class="flex items-center justify-between font-semibold"><span>Total</span><span>Price on request</span></p>
    `;
    return;
  }

  const totalUSD = subtotalUSD + shippingTotalUSD;
  const totalINR = subtotalINR + shippingTotalINR;

  orderSummaryDiv.innerHTML = `
    <p class="flex items-center justify-between"><span>Subtotal</span><span>${formatForeignCurrency(subtotalUSD)} | INR ${subtotalINR.toFixed(2)}</span></p>
    <p class="flex items-center justify-between"><span>Shipping/Documentation</span><span>${formatForeignCurrency(shippingTotalUSD)} | INR ${shippingTotalINR.toFixed(2)}</span></p>
    <p class="flex items-center justify-between font-semibold"><span>Total</span><span>${formatForeignCurrency(totalUSD)} | INR ${totalINR.toFixed(2)}</span></p>
  `;
}

proceedToPaymentBtn.addEventListener('click', () => {
  paymentSection.scrollIntoView({ behavior: 'smooth' });
});

onAuthStateChanged(auth, async (user) => {
  const cartItems = await getCartItems(user);
  renderCheckout(cartItems);
});

document.addEventListener('currency:change', async () => {
  const user = auth.currentUser;
  const cartItems = await getCartItems(user);
  renderCheckout(cartItems);
});

loadHeader();
bindPaymentSelection();
