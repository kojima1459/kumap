/**
 * LocationConsentModal Component
 * 
 * Privacy consent modal for location services.
 * Explains what data is collected and how it's used.
 */

import { useEffect } from "react";

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
}

export function LocationConsentModal({
  isOpen,
  onClose,
  onConsent,
}: LocationConsentModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📍</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              位置情報の使用について
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            この機能は、あなたの現在地周辺のクマ出没情報を表示します。
          </p>

          {/* Privacy guarantees */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
              <span>🔒</span> プライバシー保護
            </h3>
            <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>位置情報はサーバーに<strong>送信しません</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>位置情報は端末に<strong>保存しません</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>すべての計算は<strong>お使いの端末内</strong>で行います</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>いつでも設定から<strong>無効化</strong>できます</span>
              </li>
            </ul>
          </div>

          {/* How it works */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span>ℹ️</span> 仕組み
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>ブラウザが現在地を取得します</li>
              <li>端末内でクマ出没データと照合します</li>
              <li>周辺の危険度を計算して表示します</li>
            </ol>
          </div>

          {/* Note for elderly users */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>💡 ご安心ください：</strong>
              この機能を使っても、あなたの居場所が他の人に知られることはありません。
              お使いのスマートフォンやパソコンの中だけで処理されます。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onConsent}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
            >
              同意して使用する
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors"
            >
              使用しない
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-3">
            後からでも設定画面で変更できます
          </p>
        </div>
      </div>
    </div>
  );
}
