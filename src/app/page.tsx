import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-lg bg-white/80 rounded-2xl shadow-xl p-8 sm:p-12 border border-[var(--border)] backdrop-blur-lg">
        <div className="flex flex-col items-center gap-2">
          <img src="/icon.png" alt="iSkate Logo" className="w-20 h-20 mb-2 drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-700 mb-2">iSkate Admin Portal</h1>
          <p className="text-base sm:text-lg text-center text-gray-700 mb-4">The skating world is in your hands now.</p>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-blue-600 text-white px-8 py-3 font-semibold text-lg shadow hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
        >
          Login
        </Link>
      </main>
      <footer className="mt-8 text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Dirty Attic
      </footer>
    </div>
  );
}