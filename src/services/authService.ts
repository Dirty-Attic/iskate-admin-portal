import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../utils/firebase';

const db = getFirestore(app);

export async function isUserAdmin(userId: string): Promise<boolean> {
    const adminDocRef = doc(db, `users/${userId}/roles/admin`);
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
        const data = adminDocSnap.data();
        return data.active === true;
    }
    return false;
}