import { auth, db } from './firebase-config.js';

import {
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';


const form = document.getElementById('adminLoginForm');

const message = document.getElementById('loginMessage');


form.addEventListener('submit', async (e) => {

  e.preventDefault();

  const email = document.getElementById('adminEmail').value;

  const password = document.getElementById('adminPassword').value;

  try {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {

      message.innerText = 'User document not found';
      return;

    }

    const userData = userSnap.data();

    if (userData.role !== 'admin') {

      message.innerText = 'Access denied';
      return;

    }

    window.location.href = 'admin-dashboard.html';

  } catch (error) {

    console.error(error);

    message.innerText = error.message;

  }

});
