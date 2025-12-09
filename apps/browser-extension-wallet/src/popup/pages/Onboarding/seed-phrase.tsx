import { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from '../../components';
import { useUIStore } from '../../stores/ui-store';

const MOCK_SEED_PHRASE = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent',
  'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
  'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
  'across', 'act', 'action', 'actor', 'actress', 'actual',
];

const CLIPBOARD_CLEAR_TIMEOUT = 30000;

export function SeedPhrase() {
  const setRoute = useUIStore((s) => s.setRoute);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const [clearTimer, setClearTimer] = useState<number | null>(null);

  const clearClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimer) clearTimeout(clearTimer);
      clearClipboard();
    };
  }, [clearTimer, clearClipboard]);

  const handleCopyConfirm = async () => {
    setShowCopyWarning(false);
    await navigator.clipboard.writeText(MOCK_SEED_PHRASE.join(' '));
    setCopied(true);

    const timer = window.setTimeout(() => {
      clearClipboard();
      setCopied(false);
    }, CLIPBOARD_CLEAR_TIMEOUT);
    setClearTimer(timer);

    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyClick = () => {
    setShowCopyWarning(true);
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900 p-6">
      <button
        onClick={() => setRoute('create-wallet')}
        className="self-start p-2 -ml-2 text-text-secondary hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-2">Your Seed Phrase</h1>
        <p className="text-text-secondary text-sm mb-4">
          Write down these 24 words in order and store them safely
        </p>

        <div className="relative mb-4">
          <div className={`grid grid-cols-4 gap-1.5 ${!revealed ? 'blur-md select-none' : ''}`}>
            {MOCK_SEED_PHRASE.map((word, i) => (
              <div
                key={i}
                className="bg-midnight-700 rounded-lg px-2 py-1.5 text-center"
              >
                <span className="text-text-muted text-[10px] mr-0.5">{i + 1}.</span>
                <span className="text-white text-xs">{word}</span>
              </div>
            ))}
          </div>

          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button variant="secondary" onClick={() => setRevealed(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Reveal Seed Phrase
              </Button>
            </div>
          )}
        </div>

        {revealed && (
          <button
            onClick={handleCopyClick}
            className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-4"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied! (auto-clears in 30s)
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to clipboard
              </>
            )}
          </button>
        )}

        <Modal
          isOpen={showCopyWarning}
          onClose={() => setShowCopyWarning(false)}
          title="Security Warning"
        >
          <div className="space-y-4">
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4">
              <p className="text-accent-red text-sm">
                Copying your seed phrase to clipboard is risky. Any app on your device can read clipboard contents.
              </p>
            </div>
            <p className="text-text-secondary text-sm">
              The clipboard will be automatically cleared after 30 seconds. Writing it down on paper is safer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowCopyWarning(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleCopyConfirm}
              >
                Copy Anyway
              </Button>
            </div>
          </div>
        </Modal>

        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-accent-red text-xs">
              Never share your seed phrase. Anyone with these words can access your wallet and funds.
            </p>
          </div>
        </div>
      </div>

      <Button fullWidth onClick={() => setRoute('set-password')} disabled={!revealed}>
        I&apos;ve Saved My Seed Phrase
      </Button>
    </div>
  );
}
