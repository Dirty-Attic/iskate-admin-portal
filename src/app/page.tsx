import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <Image
          src="/next.svg"
          alt="iSkate Admin Portal Logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold text-center">
          Welcome to the iSkate Admin Portal
        </h1>
        <Link
          href="/login"
          className="rounded-full bg-blue-600 text-white px-6 py-3 font-medium text-lg hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* You can add footer links or info here if needed */}
      </footer>
    </div>
  );
}