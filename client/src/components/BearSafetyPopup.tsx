import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, FileText, CheckCircle, X } from "lucide-react";

const POPUP_SHOWN_KEY = "kumap_safety_popup_shown";

export default function BearSafetyPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup has been shown before
    const hasShown = localStorage.getItem(POPUP_SHOWN_KEY);
    if (!hasShown) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-orange-600">
            <span className="text-xl sm:text-2xl">🐻</span>
            クマに出会った時の対応
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            あなたの安全を守るための重要な情報です
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* クマに出会った時の対応 */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5" />
              クマに出会ったら
            </h3>
            <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>落ち着いて行動</strong> - 大声を出したり走って逃げない</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>ゆっくり後退</strong> - クマに背を向けず、静かに距離をとる</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>目を合わせない</strong> - 威嚇と受け取られる可能性がある</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>荷物を置いて逃げる</strong> - クマの注意をそらせる場合がある</span>
              </li>
            </ul>
          </div>

          {/* 予防策 */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-3">
              <span className="text-lg">🔔</span>
              クマに出会わないために
            </h3>
            <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>クマよけ鈴</strong>を携帯する</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>複数人で行動</strong>し、声を出しながら歩く</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>早朝・夕方</strong>の活動は特に注意</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>食べ物の匂い</strong>に注意（ゴミは持ち帰る）</span>
              </li>
            </ul>
          </div>

          {/* 通報のお願い */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
              <Phone className="h-5 w-5" />
              目撃したらご連絡ください
            </h3>
            <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <div>
                  <strong>行政機関への通報</strong>
                  <p className="text-xs mt-1">
                    お住まいの市町村役場、または警察（110番）にご連絡ください。
                    緊急の場合は110番へ。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <div>
                  <strong>本サイトへの情報提供</strong>
                  <p className="text-xs mt-1">
                    他の方の安全のため、目撃情報をお寄せください。
                    メール通知を登録している方にお知らせが届きます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* メール通知のお願い */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5" />
              メール通知のご案内
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              お住まいの地域でクマが出没した際、メールでお知らせを受け取れます。
              <strong>会員登録不要</strong>で、メールアドレスを入力するだけで登録できます。
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleClose}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          >
            了解しました
          </Button>
        </DialogFooter>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
