import { auth, db } from './firebase-config.js';

import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';


const totalUsers = document.getElementById('totalUsers');

const totalOrders = document.getElementById('totalOrders');

const totalCarts = document.getElementById('totalCarts');

const usersContainer = document.getElementById('usersContainer');

const logoutBtn = document.getElementById('logoutBtn');


onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = 'admin-login.html';
    return;

  }

  await loadDashboard();

});


async function loadDashboard() {

  const usersSnapshot = await getDocs(collection(db, 'users'));

  totalUsers.innerText = usersSnapshot.size;

  let ordersCount = 0;

  let cartsCount = 0;

  usersContainer.innerHTML = '';

  for (const userDoc of usersSnapshot.docs) {

    const userData = userDoc.data();

    const uid = userDoc.id;

    const cartSnapshot = await getDocs(
      collection(db, 'users', uid, 'cart')
    );

    const ordersSnapshot = await getDocs(
      collection(db, 'users', uid, 'orders')
    );

    if (!cartSnapshot.empty) {
      cartsCount++;
    }

    ordersCount += ordersSnapshot.size;

    const userCard = document.createElement('div');

    userCard.className =
      'border border-gray-200 rounded-xl p-4';

    userCard.innerHTML = `
      <div class="space-y-1">

        <p>
          <strong>Email:</strong>
          ${userData.email || 'No Email'}
        </p>

        <p>
          <strong>Name:</strong>
          ${userData.name || 'No Name'}
        </p>

        <p>
          <strong>Role:</strong>
          ${userData.role || 'customer'}
        </p>

        <p>
          <strong>Cart Items:</strong>
          ${cartSnapshot.size}
        </p>

        <p>
          <strong>Orders:</strong>
          ${ordersSnapshot.size}
        </p>

      </div>
    `;

    usersContainer.appendChild(userCard);

  }

  totalOrders.innerText = ordersCount;

  totalCarts.innerText = cartsCount;

}


logoutBtn.addEventListener('click', async () => {

  await signOut(auth);

  window.location.href = 'admin-login.html';

});
