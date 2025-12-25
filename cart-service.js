import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const CART_COLLECTION = 'carts';

const buildCartRef = (uid) => doc(db, CART_COLLECTION, uid);

const mergeCartItems = (baseItems = [], incomingItems = []) => {
  const merged = [...baseItems];
  incomingItems.forEach((incoming) => {
    const existingIndex = merged.findIndex((item) => item.productId === incoming.productId);
    if (existingIndex >= 0) {
      const existing = merged[existingIndex];
      merged[existingIndex] = {
        ...existing,
        ...incoming,
        qty: (existing.qty || 1) + (incoming.qty || 1)
      };
    } else {
      merged.push({ ...incoming, qty: incoming.qty || 1 });
    }
  });
  return merged;
};

export const getCart = async (uid) => {
  const snap = await getDoc(buildCartRef(uid));
  if (!snap.exists()) {
    return { items: [] };
  }
  return snap.data();
};

const saveCart = async (uid, items) => {
  await setDoc(
    buildCartRef(uid),
    {
      items,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const addItem = async (uid, item) => {
  const cart = await getCart(uid);
  const items = mergeCartItems(cart.items || [], [item]);
  await saveCart(uid, items);
};

export const updateQty = async (uid, productId, qty) => {
  const cart = await getCart(uid);
  const items = (cart.items || [])
    .map((item) => (item.productId === productId ? { ...item, qty } : item))
    .filter((item) => (item.qty || 0) > 0);
  await saveCart(uid, items);
};

export const removeItem = async (uid, productId) => {
  const cart = await getCart(uid);
  const items = (cart.items || []).filter((item) => item.productId !== productId);
  await saveCart(uid, items);
};

export const clearCart = async (uid) => {
  await saveCart(uid, []);
};

export const subscribeCart = (uid, callback) =>
  onSnapshot(buildCartRef(uid), (snap) => {
    const data = snap.exists() ? snap.data() : { items: [] };
    callback(data.items || []);
  });

export const mergeCarts = async (sourceUid, targetUid) => {
  if (!sourceUid || !targetUid || sourceUid === targetUid) return;
  const [sourceCart, targetCart] = await Promise.all([
    getCart(sourceUid),
    getCart(targetUid)
  ]);
  const mergedItems = mergeCartItems(targetCart.items || [], sourceCart.items || []);
  if (mergedItems.length) {
    await saveCart(targetUid, mergedItems);
  }
  await deleteDoc(buildCartRef(sourceUid));
};
