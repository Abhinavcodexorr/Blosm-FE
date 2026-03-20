import Link from "next/link";

export default function WalletPage() {
  return (
    <main className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl font-light text-charcoal mb-4">Wallet</h1>
        <p className="text-gray-600 mb-6">Loyalty & rewards coming soon.</p>
        <Link href="/" className="text-rose-700 hover:text-rose-800 transition-colors">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
