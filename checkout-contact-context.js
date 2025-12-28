import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

let cachedUser = null;

onAuthStateChanged(auth, user => {
  cachedUser = user;
});

async function fetchFirestoreCart(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'cart'));
  const items = [];
  snapshot.forEach(doc => items.push(doc.data()));
  return items;
}

function buildCartMessage(cartItems) {
  let message = `Hello Team,%0A%0AI've finalized the following order:%0A%0A`;
  let totalINR = 0;
  let totalUSD = 0;

  cartItems.forEach((item, index) => {
    const qty = item.quantity || 1;
    const usd = Number(item.total_price_usd || item.price_usd || 0) * qty;
    const inr = Number(item.total_price_inr || item.price_inr || 0) * qty;
    totalUSD += usd;
    totalINR += inr;

    message += `${index + 1}. ${item.name}%0A`;
    if (item.pack) message += `Pack: ${item.pack}%0A`;
    message += `Quantity: ${qty}%0A`;
    message += `Item Total: USD ${usd.toFixed(2)} | INR ${inr.toFixed(2)}%0A%0A`;
  });

  message += `Final Payable Amount:%0AUSD ${totalUSD.toFixed(2)} | INR ${totalINR.toFixed(2)}%0A%0A`;
  message += `Please assist me with order processing.`;

  return message;
}

function removeExistingPopup() {
  document.getElementById('checkout-contact-popup')?.remove();
}

function createPopup(anchorEl, message) {
  removeExistingPopup();

  const rect = anchorEl.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.id = 'checkout-contact-popup';
  popup.className = 'absolute bg-white border rounded-xl shadow-xl p-4 z-50 w-72';

  popup.style.top = `${window.scrollY + rect.bottom + 8}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;

  popup.innerHTML = `
    <h4 class="font-semibold mb-3">Contact Order Team</h4>
    <div class="grid grid-cols-3 gap-3 text-center text-sm">
      <a href="https://wa.me/918275595850?text=${message}" target="_blank">WhatsApp</a>
      <a href="https://t.me/vitalelixirglobalist?text=${message}" target="_blank">Telegram</a>
      <a href="https://ig.me/m/vitalelixirglobalist?text=${message}" target="_blank">Instagram</a>
    </div>
    <button class="mt-4 text-xs text-gray-500" onclick="document.getElementById('checkout-contact-popup').remove()">Close</button>
  `;

  document.body.appendChild(popup);
}

window.openCheckoutContactPopup = async function (buttonEl) {
  if (!cachedUser) {
    alert('Please log in to continue. Your cart details will be shared automatically.');
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  const cartItems = await fetchFirestoreCart(cachedUser.uid);
  if (!cartItems.length) {
    alert('Your cart is empty.');
    return;
  }

  const message = buildCartMessage(cartItems);
  createPopup(buttonEl, message);
};
