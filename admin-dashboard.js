import { auth, db } from './firebase-config.js';

import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';


const totalUsers = document.getElementById('totalUsers');

const totalOrders = document.getElementById('totalOrders');

const totalCarts = document.getElementById('totalCarts');

const usersContainer = document.getElementById('usersContainer');

const logoutBtn = document.getElementById('logoutBtn');

const formatUsd = (value) => `$${Number(value || 0).toFixed(2)}`;

const getDisplayPricing = (cartItem) => {
  if (cartItem.pricing) return cartItem.pricing;
  const normalized = window.pricingEngine.normalizeCartItem(cartItem);
  return normalized.pricing;
};

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = 'admin-login.html';
    return;

  }

  await loadDashboard();

});


async function loadDashboard() {

  try {

    const usersSnapshot = await getDocs(
      collection(db, 'users')
    );

    console.log('Users Found:', usersSnapshot.size);

    totalUsers.innerText = usersSnapshot.size;

    let ordersCount = 0;

    let cartsCount = 0;

    usersContainer.innerHTML = '';

    for (const userDoc of usersSnapshot.docs) {

      try {

        const userData = userDoc.data();

        const uid = userDoc.id;

        console.log('Loading user:', uid);

        let cartSize = 0;

        let orderSize = 0;

        // SAFE CART FETCH

        try {

          const cartSnapshot = await getDocs(
            collection(db, 'users', uid, 'cart')
          );

          cartSize = cartSnapshot.size;

          if (!cartSnapshot.empty) {
            cartsCount++;
          }

        } catch (error) {

          console.log('No cart collection');

        }

        // SAFE ORDER FETCH

        try {

          const ordersSnapshot = await getDocs(
            collection(db, 'users', uid, 'orders')
          );

          orderSize = ordersSnapshot.size;

          ordersCount += orderSize;

          ordersSnapshot.forEach((orderDoc) => {

            const order = orderDoc.data();


          });

        } catch (error) {

          console.log('No orders collection');

        }

        let cartItemsHtml = '';

try {

  const liveCartSnapshot = await getDocs(
    collection(db, 'users', uid, 'cart')
  );

  if (!liveCartSnapshot.empty) {

    liveCartSnapshot.forEach((cartDoc) => {

      const cartItem = cartDoc.data();
      const pricing = getDisplayPricing(cartItem);

      cartItemsHtml += `

        <div class="border rounded-lg p-2 mt-2 bg-slate-50">

          <p>
            <strong>Medicine:</strong>
            ${cartItem.name || 'Unknown'}
          </p>

          <p>
            <strong>Pack:</strong>
            ${cartItem.pack || 'N/A'}
          </p>

          <p>
            <strong>Quantity:</strong>
            ${cartItem.quantity || 1}
          </p>

          <p>
            <strong>Final Price:</strong>
            ${formatUsd(pricing.final_price_usd)}
          </p>

          <p>
          <strong>Shipping Charges:</strong>
          ${formatUsd(pricing.final_shipping_usd)}
         </p>

          <p>
            <strong>Final Total:</strong>
            ${formatUsd(pricing.final_total_usd)}
          </p>

        </div>

      `;

    });

  } else {

    cartItemsHtml =
      '<p class="text-sm text-gray-500">No active cart items</p>';

  }

} catch(error) {

  console.error(error);

}
        // USER CARD

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
              <strong>Phone:</strong>
              ${userData.phone || 'No Phone'}
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
              ${cartSize}
            </p>

            <p>
              <strong>Orders:</strong>
              ${orderSize}
            </p>
            <div class="mt-4 border-t pt-4 space-y-3">

  <h3 class="font-bold text-lg">
    Admin Controls
  </h3>

  <input
    type="text"
    value="${userData.country || ''}"
    placeholder="Country"
    class="countryInput border rounded-lg px-3 py-2 w-full"
  />

  <input
  type="text"
  value="${userData.contactchannel || ''}"
  placeholder="contact channel"
  class="locationInput border rounded-lg px-3 py-2 w-full"
/>

<input
  type="text"
  value="${userData.customerType || ''}"
  placeholder="Customer Type"
  class="customerTypeInput border rounded-lg px-3 py-2 w-full"
/>

  <input
    type="text"
    value="${userData.whatsapp || ''}"
    placeholder="WhatsApp Number"
    class="whatsappInput border rounded-lg px-3 py-2 w-full"
  />

  <select
    class="vipInput border rounded-lg px-3 py-2 w-full"
  >

    <option value="No"
      ${userData.vip !== 'Yes' ? 'selected' : ''}
    >
      Normal Customer
    </option>

    <option value="Yes"
      ${userData.vip === 'Yes' ? 'selected' : ''}
    >
      VIP Customer
    </option>

  </select>

  <textarea
    placeholder="Admin Notes"
    class="adminNotesInput border rounded-lg px-3 py-2 w-full"
  >${userData.adminNotes || ''}</textarea>

  <div class="border-t pt-4 mt-4">

  <h3 class="font-bold text-lg mb-3">
    Order Management
  </h3>

  <input
    type="text"
    value="${userData.orderStatus || ''}"
    placeholder="Order Status"
    class="orderStatusInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.trackingId || ''}"
    placeholder="Live Tracking ID"
    class="trackingIdInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.courier || ''}"
    placeholder="Courier"
    class="courierInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <textarea
    placeholder="Order Details"
    class="orderDetailsInput border rounded-lg px-3 py-2 w-full mb-2"
  >${userData.orderDetails || ''}</textarea>

  <input
    type="text"
    value="${userData.orderedDate || ''}"
    placeholder="Ordered Date"
    class="orderedDateInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.orderedAmount || ''}"
    placeholder="Ordered Amount"
    class="orderedAmountInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.invoiceNo || ''}"
    placeholder="Invoice Number"
    class="invoiceInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.trackingLink || ''}"
    placeholder="Tracking Link"
    class="trackingLinkInput border rounded-lg px-3 py-2 w-full mb-2"
  />

  <input
    type="text"
    value="${userData.crmStaff || ''}"
    placeholder="Staff Allocated"
    class="crmStaffInput border rounded-lg px-3 py-2 w-full mb-2"
  />

</div>

  <button
    class="saveCustomerBtn bg-green-600 text-white px-4 py-2 rounded-lg"
  >
    Save Customer Details
  </button>

</div>
            <div class="mt-4">

  <h3 class="font-bold text-lg mb-2">
    Live Cart Items
  </h3>

  ${cartItemsHtml}

</div>
          </div>

        `;
      const saveCustomerBtn =
  userCard.querySelector('.saveCustomerBtn');

const countryInput =
  userCard.querySelector('.countryInput');

const whatsappInput =
  userCard.querySelector('.whatsappInput');

const locationInput =
  userCard.querySelector('.locationInput');

const customerTypeInput =
  userCard.querySelector('.customerTypeInput');

const vipInput =
  userCard.querySelector('.vipInput');

const adminNotesInput =
  userCard.querySelector('.adminNotesInput');

  const orderStatusInput =
  userCard.querySelector('.orderStatusInput');

const trackingIdInput =
  userCard.querySelector('.trackingIdInput');

const courierInput =
  userCard.querySelector('.courierInput');

const orderDetailsInput =
  userCard.querySelector('.orderDetailsInput');

const orderedDateInput =
  userCard.querySelector('.orderedDateInput');

const orderedAmountInput =
  userCard.querySelector('.orderedAmountInput');

const invoiceInput =
  userCard.querySelector('.invoiceInput');

const trackingLinkInput =
  userCard.querySelector('.trackingLinkInput');

const crmStaffInput =
  userCard.querySelector('.crmStaffInput');

saveCustomerBtn.addEventListener(
  'click',
  async () => {

    try {

      console.log("Trying to update customer..."); 

      await updateDoc(

        doc(db, 'users', uid),

        {

          country:
            countryInput.value,

          whatsapp:
            whatsappInput.value,

          contactchannel:
            locationInput.value,

          customerType:
            customerTypeInput.value,

          vip:
            vipInput.value,

          adminNotes:
            adminNotesInput.value,

          orderStatus:
            orderStatusInput.value,

          trackingId:
            trackingIdInput.value,

          courier:
            courierInput.value,

          orderDetails:
            orderDetailsInput.value,

          orderedDate:
            orderedDateInput.value,

          orderedAmount:
            orderedAmountInput.value,

          invoiceNo:
            invoiceInput.value,

          trackingLink:
            trackingLinkInput.value,

          crmStaff:
            crmStaffInput.value

        }

      );

      console.log("Customer updated successfully!");

      alert(
        'Customer details updated'
      );

    } catch(error) {

      console.error(error);

      alert(
        'Failed to update customer'
      );

    }

  }
);
        usersContainer.appendChild(userCard);

      } catch (error) {

        console.error('User Error:', error);

      }

    }

    totalOrders.innerText = ordersCount;

    totalCarts.innerText = cartsCount;

  } catch (error) {

    console.error('Dashboard Error:', error);

  }

}


logoutBtn.addEventListener('click', async () => {

  await signOut(auth);

  window.location.href = 'admin-login.html';

});
