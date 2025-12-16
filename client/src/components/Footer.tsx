import { Clock, RefreshCw } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* ロゴと自動更新情報 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/kumap-logo.webp" alt="クマップ" className="h-8 w-8 sm:h-10 sm:w-10" />
            <span className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">クマップ</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium">毎日午前2時に自動更新</span>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
            <span>製作者: <a href="https://x.com/kojima920" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 hover:underline">@kojima920</a></span>
            <span className="hidden sm:inline">|</span>
            <span>問い合わせ: <a href="mailto:mk19830920@gmail.com" className="text-orange-600 hover:text-orange-700 hover:underline">mk19830920@gmail.com</a></span>
          </div>
          <div className="text-center">
            <span>寄付先: <span className="font-mono">PayPayID: kojima1459</span></span>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-center">
            © 2025 クマップ - Bear Sighting Information Map
          </div>
        </div>
        
        {/* データソース情報 */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center">
          <p className="leading-relaxed">データソース: くまっぷ（Xenon）API、長野県公式PDF、Yahoo!ニュース、各都道府県公式サイト</p>
          <p className="mt-1">※ 会員登録なしで誰でも無料でご利用いただけます</p>
        </div>
      </div>
    </footer>
  );
}
