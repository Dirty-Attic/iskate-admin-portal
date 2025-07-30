"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../utils/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export type User = {
  photoURL: string | null;
  username: string | null;
  uid: string;
};

const UserContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
}>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("iskate-admin-user");
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        setUserState(null);
      }
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch Firestore profile
        const db = getFirestore(app);
        const userDocRef = doc(db, "users/" + firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let photoURL = firebaseUser.photoURL;
        let username = firebaseUser.displayName;
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.photoURL) photoURL = data.photoURL;
          if (data.username) username = data.username;
        }
        const userObj = {
          photoURL,
          username,
          uid: firebaseUser.uid,
        };
        setUserState(userObj);
        localStorage.setItem("iskate-admin-user", JSON.stringify(userObj));
      } else {
        setUserState(null);
        localStorage.removeItem("iskate-admin-user");
      }
    });
    return () => unsubscribe();
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("iskate-admin-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("iskate-admin-user");
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}