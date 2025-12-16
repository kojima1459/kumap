import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Season = 'spring' | 'autumn' | 'summer' | 'winter' | null;

interface SeasonalWarning {
  season: Season;
  title: string;
  message: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const getSeasonalWarning = (): SeasonalWarning | null => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  // 春（3月〜5月）：冬眠明けで活発
  if (month >= 3 && month <= 5) {
    return {
      season: 'spring',
      title: '🌸 春の注意喚起',
      message: 'クマが冬眠から目覚め、食べ物を求めて活発に活動する時期です。山菜採りや登山の際は特にご注意ください。',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
      borderColor: 'border-pink-300 dark:border-pink-700',
      textColor: 'text-pink-800 dark:text-pink-200',
    };
  }

  // 秋（9月〜11月）：冬眠前で食欲旺盛
  if (month >= 9 && month <= 11) {
    return {
      season: 'autumn',
      title: '🍂 秋の注意喚起',
      message: 'クマが冬眠に備えて食欲旺盛になる時期です。ドングリや柿など餌を求めて人里に出没しやすくなります。',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-800 dark:text-orange-200',
    };
  }

  // 夏（6月〜8月）：繁殖期
  if (month >= 6 && month <= 8) {
    return {
      season: 'summer',
      title: '☀️ 夏の注意喚起',
      message: 'クマの繁殖期です。子連れのクマは特に警戒心が強く危険です。キャンプや川遊びの際はご注意ください。',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    };
  }

  // 冬（12月〜2月）：冬眠期（比較的安全だが注意は必要）
  return null; // 冬は特に警告なし
};

export function SeasonalWarningBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [warning, setWarning] = useState<SeasonalWarning | null>(null);

  useEffect(() => {
    const seasonalWarning = getSeasonalWarning();
    if (!seasonalWarning) return;

    // sessionStorageで閉じた状態を確認
    const dismissedKey = `seasonal-warning-dismissed-${seasonalWarning.season}`;
    const isDismissed = sessionStorage.getItem(dismissedKey) === 'true';

    if (!isDismissed) {
      setWarning(seasonalWarning);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (warning) {
      const dismissedKey = `seasonal-warning-dismissed-${warning.season}`;
      sessionStorage.setItem(dismissedKey, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !warning) return null;

  return (
    <div className={`${warning.bgColor} ${warning.borderColor} border-b px-4 py-3`}>
      <div className="container mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className={`h-5 w-5 ${warning.textColor} flex-shrink-0 mt-0.5`} />
          <div className={warning.textColor}>
            <p className="font-bold text-sm">{warning.title}</p>
            <p className="text-sm mt-1">{warning.message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className={`${warning.textColor} hover:bg-white/50 dark:hover:bg-black/20 p-1 h-auto flex-shrink-0`}
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
