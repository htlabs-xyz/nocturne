export function App() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-midnight-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent-purple flex items-center justify-center">
          <span className="text-2xl font-bold">M</span>
        </div>
        <h1 className="text-xl font-semibold">Midnight Wallet</h1>
        <p className="text-sm text-gray-400">Secure wallet for Midnight Network</p>
      </div>
    </div>
  );
}
