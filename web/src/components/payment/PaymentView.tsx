import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseWalletReturn } from '../../hooks/useWallet';

// ============================================================================
// AgenC Uno token constants (Solana / Pump.fun)
// ============================================================================

const ROOTIB_COIN_ADDRESS = '6xaadtw1ZsuYXW8gCY4WXfhiv8CmFgp5iwhbA3xSpump';
const AGENC_COIN_ADDRESS  = '5yC9BM8KUsJTPbWPLfA2N8qH1s9V8DQ3Vcw1G6Jdpump';

const ROOTIB_PUMPFUN_URL  = 'https://join.pump.fun/HSag/o08l3qj4b';
const AGENC_PUMPFUN_URL   = 'https://join.pump.fun/HSag/bkkj4yrk';

const PAYPAL_URL = 'https://www.paypal.com/paypalme/barbrickdesign';
const PAYPAL_EMAIL = 'BarbrickDesign@gmail.com';

// ============================================================================
// Deterministic preview ID generator for RootIB device identifiers
// ============================================================================

function generateRootIBPreview(nickname: string): string {
  // Simple djb2-style hash for a deterministic preview
  let h = 5381;
  for (let i = 0; i < nickname.length; i++) {
    h = ((h << 5) + h) ^ nickname.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  const hex = h.toString(16).padStart(8, '0').toUpperCase();
  const slug = nickname.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10).padEnd(4, '0');
  return `ROOTIB-${slug}-${hex}`;
}

interface PaymentViewProps {
  wallet: UseWalletReturn;
}

export function PaymentView({ wallet: w }: PaymentViewProps) {
  const { wallet, loading, airdropping, lastError, refresh, airdrop } = w;
  const isMainnet = wallet?.network === 'mainnet-beta';
  const isDevnet = wallet?.network === 'devnet';
  const [copied, setCopied] = useState(false);
  const [airdropSuccess, setAirdropSuccess] = useState(false);
  const prevSol = useRef(wallet?.sol ?? 0);

  // Device preview ID state
  const [deviceNickname, setDeviceNickname] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGenerateId = useCallback(() => {
    if (deviceNickname.trim()) {
      setPreviewId(generateRootIBPreview(deviceNickname.trim()));
    }
  }, [deviceNickname]);

  const copyToken = useCallback((address: string) => {
    void navigator.clipboard.writeText(address);
    setCopiedToken(address);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  useEffect(() => {
    if (wallet && wallet.sol !== prevSol.current) {
      if (wallet.sol > prevSol.current) {
        setAirdropSuccess(true);
        setTimeout(() => setAirdropSuccess(false), 1500);
      }
      prevSol.current = wallet.sol;
    }
  }, [wallet?.sol]);

  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (wallet?.address) {
      void navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  let idx = 0;
  const delay = () => `${(idx++) * 60}ms`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-tetsuo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-bg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" strokeLinecap="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-tetsuo-800 tracking-tight">Payment</h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-tetsuo-400 hover:text-accent hover:bg-tetsuo-100 transition-all duration-200 active:scale-90 disabled:opacity-50"
          title="Refresh"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6"><div className="max-w-2xl mx-auto space-y-6">
        {/* Balance card */}
        <div className="animate-list-item rounded-xl border border-tetsuo-200 p-5 relative overflow-hidden" style={{ animationDelay: delay() }}>
          {airdropSuccess && <div className="absolute inset-0 animate-shimmer pointer-events-none" />}
          <div className="flex items-center justify-between mb-1 relative">
            <div className="text-xs text-tetsuo-400 uppercase tracking-wider">SOL Balance</div>
          </div>
          {loading && !wallet ? (
            <div className="h-8 w-32 rounded bg-tetsuo-100 animate-pulse" />
          ) : wallet ? (
            <div className="relative">
              <div className={`font-bold text-tetsuo-800 transition-all duration-300 whitespace-nowrap ${airdropSuccess ? 'text-emerald-500' : ''} ${wallet.sol >= 1_000_000 ? 'text-base' : wallet.sol >= 1_000 ? 'text-xl' : 'text-2xl'}`}>
                {wallet.sol.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL
              </div>
              <div className="text-xs text-tetsuo-400 mt-1 capitalize">
                {wallet.network === 'mainnet-beta' ? 'Mainnet' : wallet.network}
              </div>
            </div>
          ) : lastError ? (
            <div className="text-sm text-red-500">{lastError}</div>
          ) : (
            <div className="text-2xl font-bold text-tetsuo-400">--</div>
          )}
        </div>

        {/* Wallet address */}
        {wallet && (
          <div className="animate-list-item" style={{ animationDelay: delay() }}>
            <div className="text-xs text-tetsuo-400 uppercase tracking-wider mb-2">Wallet Address</div>
            <button
              onClick={copyAddress}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-tetsuo-50 border border-tetsuo-200 hover:bg-tetsuo-100 hover:border-tetsuo-300 transition-all duration-200 group active:scale-[0.98]"
              title="Click to copy"
            >
              <span className="text-sm text-tetsuo-600 font-mono truncate">{truncateAddress(wallet.address)}</span>
              {copied ? (
                <svg className="w-4 h-4 text-emerald-500 shrink-0 ml-2 animate-dot-pop" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg className="w-4 h-4 text-tetsuo-400 group-hover:text-tetsuo-600 shrink-0 ml-2 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Protocol Fees */}
        <div className="animate-list-item" style={{ animationDelay: delay() }}>
          <div className="text-xs text-tetsuo-400 uppercase tracking-wider mb-3">Protocol Fees</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-tetsuo-50 border border-tetsuo-200">
              <span className="text-sm text-tetsuo-600">Base fee</span>
              <span className="text-sm text-tetsuo-700">2.5%</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-tetsuo-50 border border-tetsuo-200">
              <span className="text-sm text-tetsuo-600">Fee tier</span>
              <span className="text-sm text-tetsuo-700">Base</span>
            </div>
          </div>
          <p className="text-xs text-tetsuo-400 mt-2">
            Complete more tasks to unlock fee discounts (Bronze 50+, Silver 200+, Gold 1000+).
          </p>
        </div>

        {/* Error */}
        {lastError && (
          <div className="text-xs text-red-500 px-1 animate-panel-enter">{lastError}</div>
        )}

        {/* Actions */}
        <div className="animate-list-item space-y-2" style={{ animationDelay: delay() }}>
          {!isMainnet && (
            <button
              onClick={() => airdrop(1)}
              disabled={airdropping || !wallet}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
                airdropping
                  ? 'bg-accent/70 text-white cursor-wait'
                  : 'bg-accent text-white hover:opacity-90 hover:shadow-lg hover:shadow-accent/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {airdropping ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Requesting Airdrop...
                </span>
              ) : `Airdrop 1 SOL${isDevnet ? ' (Devnet)' : ''}`}
            </button>
          )}
          <button
            onClick={() => wallet?.explorerUrl && window.open(wallet.explorerUrl, '_blank')}
            disabled={!wallet}
            className="w-full py-2.5 rounded-lg border border-tetsuo-200 text-sm font-medium text-tetsuo-700 hover:bg-tetsuo-50 hover:border-tetsuo-300 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View on Explorer
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* AgenC Uno Device Tokens                                     */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="animate-list-item" style={{ animationDelay: delay() }}>
          <div className="text-xs text-tetsuo-400 uppercase tracking-wider mb-3">⛽ Device Fuel Tokens</div>
          <div className="space-y-3">
            {/* RootIB Coin */}
            <div className="rounded-xl border border-tetsuo-200 p-4 bg-tetsuo-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-tetsuo-800">🔐 RootIB Coin</span>
                <a
                  href={ROOTIB_PUMPFUN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  View on Pump.fun ↗
                </a>
              </div>
              <button
                onClick={() => copyToken(ROOTIB_COIN_ADDRESS)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-tetsuo-200 hover:bg-tetsuo-100 hover:border-tetsuo-300 transition-all duration-200 group active:scale-[0.98]"
                title="Click to copy address"
              >
                <span className="text-xs text-tetsuo-600 font-mono truncate">{ROOTIB_COIN_ADDRESS}</span>
                {copiedToken === ROOTIB_COIN_ADDRESS ? (
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-tetsuo-400 group-hover:text-tetsuo-600 shrink-0 ml-2 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-tetsuo-400 mt-1.5">Device Identity — anchors your device key to the ledger.</p>
            </div>

            {/* AgenC Coin */}
            <div className="rounded-xl border border-tetsuo-200 p-4 bg-tetsuo-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-tetsuo-800">⚡ AgenC Coin</span>
                <a
                  href={AGENC_PUMPFUN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  View on Pump.fun ↗
                </a>
              </div>
              <button
                onClick={() => copyToken(AGENC_COIN_ADDRESS)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-tetsuo-200 hover:bg-tetsuo-100 hover:border-tetsuo-300 transition-all duration-200 group active:scale-[0.98]"
                title="Click to copy address"
              >
                <span className="text-xs text-tetsuo-600 font-mono truncate">{AGENC_COIN_ADDRESS}</span>
                {copiedToken === AGENC_COIN_ADDRESS ? (
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-tetsuo-400 group-hover:text-tetsuo-600 shrink-0 ml-2 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-tetsuo-400 mt-1.5">Agent Gas — signs transactions and confirms agent actions.</p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* RootIB Device Preview ID Generator                         */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="animate-list-item" style={{ animationDelay: delay() }}>
          <div className="text-xs text-tetsuo-400 uppercase tracking-wider mb-3">🛰️ RootIB Device Preview ID</div>
          <div className="rounded-xl border border-tetsuo-200 p-4 bg-tetsuo-50 space-y-3">
            <p className="text-xs text-tetsuo-500">
              Enter a device nickname to preview the RootIB format. Your official activated device key is generated and emailed after donation confirmation.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={deviceNickname}
                onChange={(e) => setDeviceNickname(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateId(); }}
                placeholder="Device Nickname"
                maxLength={20}
                className="flex-1 bg-surface border border-tetsuo-200 rounded-lg px-3 py-2 text-sm text-tetsuo-700 placeholder:text-tetsuo-400 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--accent),0.1)] transition-all duration-200"
              />
              <button
                onClick={handleGenerateId}
                disabled={!deviceNickname.trim()}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
            {previewId ? (
              <div className="rounded-lg border border-accent/30 bg-accent-bg px-4 py-3">
                <div className="text-xs text-tetsuo-400 mb-1">Preview ID</div>
                <div className="font-mono text-sm font-bold text-accent break-all">{previewId}</div>
                <p className="text-xs text-amber-500 mt-2">
                  ⚠️ This is a <strong>preview only</strong>. Your activated device key — linked to the live blockchain ledger — is delivered by email after completing one of the Early Access donation tiers below.
                </p>
              </div>
            ) : (
              <div className="text-xs text-tetsuo-400 italic text-center py-1">
                — enter a nickname above and click Generate —
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Early Access Donation Tiers                                 */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="animate-list-item" style={{ animationDelay: delay() }}>
          <div className="text-xs text-tetsuo-400 uppercase tracking-wider mb-3">🚀 Early Access</div>
          <div className="space-y-3">
            {/* Tier 1 */}
            <div className="rounded-xl border border-tetsuo-200 p-4 bg-tetsuo-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-tetsuo-800">Tier 1 — Source Code</span>
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-medium">$6.90 min</span>
                </div>
              </div>
              <p className="text-xs text-tetsuo-500 mb-3">
                Donate $6.90+ via PayPal to <strong className="text-tetsuo-700">{PAYPAL_EMAIL}</strong> — include your email address in the note. The AgenC Uno source code is emailed directly to you.
              </p>
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
              >
                💚 Donate $6.90 — Get Source Code
              </a>
            </div>

            {/* Tier 2 */}
            <div className="rounded-xl border border-tetsuo-200 p-4 bg-tetsuo-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-tetsuo-800">Tier 2 — Physical Device</span>
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">$69.69 min</span>
                </div>
              </div>
              <p className="text-xs text-tetsuo-500 mb-3">
                Donate $69.69+ via PayPal to <strong className="text-tetsuo-700">{PAYPAL_EMAIL}</strong> — include your email address and <strong className="text-tetsuo-700">shipping address</strong> in the note. Receive a Heltec WiFi LoRa 32 (V3/V4) pre-loaded with the full AgenC Uno firmware.
              </p>
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-200"
              >
                💛 Donate $69.69 — Get Physical Device
              </a>
            </div>
          </div>
          <p className="text-xs text-tetsuo-400 mt-2 leading-relaxed">
            Donation is voluntary and non-refundable. Experimental hardware/firmware for developers and hobbyists. Physical devices allow 2–4 weeks for fulfillment and shipping.
          </p>
        </div>
      </div></div>
    </div>
  );
}
