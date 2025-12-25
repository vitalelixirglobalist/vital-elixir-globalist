import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { mergeCarts } from './cart-service.js';

const ANON_UID_KEY = 'anonymousUid';

export const mergeAnonymousCartIfNeeded = async (user) => {
  if (!user || user.isAnonymous) return;
  const anonymousUid = localStorage.getItem(ANON_UID_KEY);
  if (!anonymousUid || anonymousUid === user.uid) return;
  try {
    await mergeCarts(anonymousUid, user.uid);
  } catch (error) {
    console.error('Failed to merge anonymous cart', error);
    return;
  }
  localStorage.removeItem(ANON_UID_KEY);
};

export const initAuth = (onUserChanged) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Anonymous auth failed', error);
      }
      return;
    }

    if (user.isAnonymous) {
      localStorage.setItem(ANON_UID_KEY, user.uid);
    } else {
      await mergeAnonymousCartIfNeeded(user);
    }

    if (onUserChanged) {
      onUserChanged(user);
    }
  });
