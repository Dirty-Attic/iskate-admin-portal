import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export async function banUser(uid: string, reason?: string) {
  await setDoc(doc(db, `users/${uid}`), {
    status: {
      banned: true,
      reason: reason || '',
      bannedAt: Timestamp.now(),
      unsuspendDate: null,
    }
  }, { merge: true });
}

export async function suspendUser(uid: string, until: Date, reason?: string) {
  await setDoc(doc(db, `users/${uid}`), {
    status: {
      suspended: true,
      reason: reason || '',
      suspendedAt: Timestamp.now(),
      unsuspendDate: Timestamp.fromDate(until),
    }
  }, { merge: true });
}

export async function unsuspendUser(uid: string) {
  await setDoc(doc(db, `users/${uid}`), {
    status: {
      banned: false,
      suspended: false,
      unsuspendDate: null,
      reason: '',
    }
  }, { merge: true });
}

export async function updateUserRole(uid: string, role: string, give: boolean) {
  const db = getFirestore(app);
  const roleDocRef = doc(db, `users/${uid}/roles/${role}`);
  if (give) {
    await setDoc(roleDocRef, {
      active: true,
      timeStamp: Timestamp.now(),
    }, { merge: true });
  } else {
    await setDoc(roleDocRef, {
      active: false
    }, { merge: true });
  }
}
