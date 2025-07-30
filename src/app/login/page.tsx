"use client";

import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/utils/firebase";
import { isUserAdmin } from "@/services/authService";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { setUser } = useUser();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const auth = getAuth(app);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Fetch user profile from Firestore
            const { getFirestore, doc, getDoc } = await import("firebase/firestore");
            const db = getFirestore(app);
            const userDocRef = doc(db, "users/" + user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let photoURL = user.photoURL;
            let username = null;
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                if (data.photoURL) photoURL = data.photoURL;
                if (data.username) username = data.username;
            }
            setUser({
                photoURL,
                username,
                uid: user.uid,
            });

            // Check for Admin Role
            const isAdmin = await isUserAdmin(user.uid);
            if (isAdmin) {
                // Redirect or show admin content
                window.location.href = "/admin/dashboard";
            } else {
                setError("You do not currently have admin access.");
            }
        } catch (err: unknown) {
            let message = "Login failed. Please try again.";
            if (err instanceof Error && err.message) {
                message = err.message;
                if (message.includes("auth/invalid-credential")) {
                    message = "Invalid email or password. Please check your credentials and try again.";
                }
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] transition-colors duration-300">
            <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border border-[var(--color-foreground)/10] bg-[var(--color-background)] backdrop-blur-lg">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-bold text-center text-[var(--color-foreground)] mb-2">Admin Login</h2>
                    <p className="text-sm text-center text-[var(--color-foreground)/70]">Sign in to access the admin dashboard</p>
                </div>
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-[var(--color-foreground)] font-medium">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            required
                            autoComplete="email"
                            onChange={e => setEmail(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-[var(--color-foreground)/20] bg-transparent text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-[var(--color-foreground)] font-medium">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            required
                            autoComplete="current-password"
                            onChange={e => setPassword(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-[var(--color-foreground)/20] bg-transparent text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                Logging in...
                            </span>
                        ) : "Login"}
                    </button>
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center mt-2">
                            {error}
                        </div>
                    )}
                </form>
                <div className="mt-8 text-center text-xs text-[var(--color-foreground)/60]">
                    &copy; {new Date().getFullYear()} Dirty Attic
                </div>
            </div>
        </div>
    );
}