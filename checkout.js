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

const checkoutItemsDiv = document.getElementById('checkoutItems');
const orderSummaryDiv = document.getElementById('orderSummary');
const proceedToPaymentBtn = document.getElementById('proceedToPayment');
const paymentSection = document.getElementById('paymentSection');

const getSelectedCurrency = () => window.pricingEngine.getDisplayedCurrency();

const formatForeignCurrency = (value) => {
  return window.pricingEngine.formatLocalAmount(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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

  // If user logged in → ONLY use Firestore
  if (currentUser) {

    try {

      const snapshot = await getDocs(
        collection(db, 'users', currentUser.uid, 'cart')
      );

      const firestoreCart = [];

      snapshot.forEach((docSnap) => {

        firestoreCart.push({
          id: docSnap.id,
          ...docSnap.data()
        });

      });

      return firestoreCart;

    } catch (error) {

      console.error('Error fetching cart from Firestore', error);

      return [];

    }

  }

  // Guest user → use localStorage only
  return JSON.parse(localStorage.getItem('cart')) || [];
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

  const cartPricing = window.pricingEngine.calculateCartPricing(cartItems);
  let hasUnknownPrice = false;

  cartPricing.items.forEach((item) => {
    const pricing = item.pricing;
    const hasPrice = Boolean(pricing.original_price_usd || pricing.original_price_inr);
    const strength = item.strength || item.pack || '';
    const quantity = pricing.quantity;

    if (!hasPrice) {
      hasUnknownPrice = true;
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
        <p class="font-semibold">${hasPrice ? formatForeignCurrency(pricing.final_price_usd) : 'Price on request'}</p>
        ${hasPrice ? `<p class="text-xs text-gray-500">Subtotal: ${formatForeignCurrency(pricing.final_medication_total_usd)} | INR ${pricing.final_medication_total_inr.toFixed(2)}</p>` : ''}
      </div>
    `;
    checkoutItemsDiv.appendChild(itemDiv);
  });

  if (hasUnknownPrice) {
    orderSummaryDiv.innerHTML = `
      <p class="flex items-center justify-between"><span>Subtotal</span><span>Price on request</span></p>
      <p class="flex items-center justify-between"><span>Shipping/Documentation</span><span>${formatForeignCurrency(cartPricing.shippingUSD)} per order</span></p>
      <p class="flex items-center justify-between font-semibold"><span>Total</span><span>Price on request</span></p>
    `;
    return;
  }

  orderSummaryDiv.innerHTML = `
    <p class="flex items-center justify-between"><span>Subtotal</span><span>${formatForeignCurrency(cartPricing.medicationTotalUSD)} | INR ${cartPricing.medicationTotalINR.toFixed(2)}</span></p>
    <p class="flex items-center justify-between"><span>Shipping/Documentation</span><span>${formatForeignCurrency(cartPricing.shippingUSD)} | INR ${cartPricing.shippingINR.toFixed(2)}</span></p>
    <p class="flex items-center justify-between font-semibold"><span>Total</span><span>${formatForeignCurrency(cartPricing.grandTotalUSD)} | INR ${cartPricing.grandTotalINR.toFixed(2)}</span></p>
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
