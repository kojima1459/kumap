import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Bell, BellOff, ChevronLeft } from "lucide-react";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function NotificationSettings() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: preferences, isLoading: preferencesLoading } =
    trpc.notifications.getPreferences.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const upsertMutation = trpc.notifications.upsertPreference.useMutation({
    onSuccess: () => {
      toast.success("通知設定を更新しました");
      trpc.useUtils().notifications.getPreferences.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleToggle = async (prefecture: string, enabled: boolean) => {
    await upsertMutation.mutateAsync({ prefecture, enabled });
  };

  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
            <CardDescription>
              通知設定を管理するには、ログインしてください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full">
              ログイン
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledPrefectures = new Set(
    preferences?.filter((p) => p.enabled === 1).map((p) => p.prefecture) || []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <h1 className="text-xl font-bold">通知設定</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>都道府県別通知設定</CardTitle>
            <CardDescription>
              クマの出没情報を受け取りたい都道府県を選択してください。
              新しい出没情報が追加されると、通知が送信されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PREFECTURES.map((prefecture) => {
                const isEnabled = enabledPrefectures.has(prefecture);
                return (
                  <div
                    key={prefecture}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Label
                      htmlFor={`pref-${prefecture}`}
                      className="flex-1 cursor-pointer"
                    >
                      {prefecture}
                    </Label>
                    <Switch
                      id={`pref-${prefecture}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(prefecture, checked)}
                      disabled={upsertMutation.isPending}
                    />
                  </div>
                );
              })}
            </div>

            {enabledPrefectures.size === 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <BellOff className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">通知が設定されていません</p>
                  <p className="mt-1">
                    上記のスイッチをオンにして、通知を受け取る都道府県を選択してください。
                  </p>
                </div>
              </div>
            )}

            {enabledPrefectures.size > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-medium">{enabledPrefectures.size}件</span>の都道府県で通知が有効になっています
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
