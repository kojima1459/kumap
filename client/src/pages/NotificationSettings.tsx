import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Bell, ChevronLeft, Mail, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePushNotification } from "@/hooks/usePushNotification";

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
  const [, setLocation] = useLocation();

  // Email subscription state
  const [email, setEmail] = useState("");
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Push notification state
  const [pushPrefecture, setPushPrefecture] = useState<string>("");
  const pushNotification = usePushNotification();

  const emailSubscribeMutation = trpc.emailSubscription.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setEmailSubmitted(true);
        toast.success("確認メールを送信しました");
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handlePrefectureToggle = (prefecture: string) => {
    setSelectedPrefectures((prev) =>
      prev.includes(prefecture)
        ? prev.filter((p) => p !== prefecture)
        : [...prev, prefecture]
    );
  };

  const handleSelectAll = () => {
    if (selectedPrefectures.length === PREFECTURES.length) {
      setSelectedPrefectures([]);
    } else {
      setSelectedPrefectures([...PREFECTURES]);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedPrefectures.length === 0) {
      toast.error("メールアドレスと都道府県を入力してください");
      return;
    }
    await emailSubscribeMutation.mutateAsync({
      email,
      prefectures: selectedPrefectures,
    });
  };

  const handlePushSubscribe = async () => {
    if (!pushPrefecture) {
      toast.error("都道府県を選択してください");
      return;
    }
    const success = await pushNotification.subscribe(pushPrefecture);
    if (success) {
      toast.success("プッシュ通知を登録しました");
    } else if (pushNotification.error) {
      toast.error(pushNotification.error);
    }
  };

  const handlePushUnsubscribe = async () => {
    const success = await pushNotification.unsubscribe();
    if (success) {
      toast.success("プッシュ通知を解除しました");
    } else if (pushNotification.error) {
      toast.error(pushNotification.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">通知設定</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl flex-1 space-y-6">
        {/* Push Notification Card */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange-500" />
              <CardTitle className="dark:text-gray-100">プッシュ通知</CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              ブラウザを閉じていても、新しいクマ出没情報をリアルタイムで受け取れます。
              {!pushNotification.isSupported && (
                <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                  ※ このブラウザはプッシュ通知に対応していません
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pushNotification.isSupported ? (
              <div className="space-y-4">
                {pushNotification.isSubscribed ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="text-sm text-green-700 dark:text-green-400">
                        <p className="font-medium">プッシュ通知が有効です</p>
                        <p className="mt-1">
                          新しいクマ出没情報が追加されると、このデバイスに通知が届きます。
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handlePushUnsubscribe}
                      disabled={pushNotification.isLoading}
                      className="w-full"
                    >
                      {pushNotification.isLoading ? "処理中..." : "プッシュ通知を解除"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pushNotification.permission === "denied" ? (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700 dark:text-red-400">
                          <p className="font-medium">通知がブロックされています</p>
                          <p className="mt-1">
                            ブラウザの設定から通知の許可を有効にしてください。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="dark:text-gray-200">通知を受け取る都道府県</Label>
                          <Select value={pushPrefecture} onValueChange={setPushPrefecture}>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                              <SelectValue placeholder="都道府県を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {PREFECTURES.map((pref) => (
                                <SelectItem key={pref} value={pref}>
                                  {pref}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            プッシュ通知は1つの都道府県のみ選択できます。複数の都道府県を登録したい場合はメール通知をご利用ください。
                          </p>
                        </div>
                        <Button
                          onClick={handlePushSubscribe}
                          disabled={pushNotification.isLoading || !pushPrefecture}
                          className="w-full"
                        >
                          {pushNotification.isLoading ? "登録中..." : "プッシュ通知を有効にする"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  <p className="font-medium">プッシュ通知は利用できません</p>
                  <p className="mt-1">
                    このブラウザまたはデバイスはプッシュ通知に対応していません。
                    メール通知をご利用ください。
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                    <li>iOSの場合：Safari 16.4以降でホーム画面に追加が必要です</li>
                    <li>Androidの場合：Chrome、Firefox、Edgeで利用可能です</li>
                    <li>PCの場合：Chrome、Firefox、Edge、Safariで利用可能です</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Notification Card */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              <CardTitle className="dark:text-gray-100">メール通知</CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              ログイン不要でメール通知を受け取れます。
              選択した都道府県で新しいクマ出没情報が追加されると、メールでお知らせします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSubmitted ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="text-sm text-green-700 dark:text-green-400">
                    <p className="font-medium">確認メールを送信しました</p>
                    <p className="mt-1">
                      {email} に確認メールを送信しました。
                      メールに記載されたリンクをクリックして登録を完了してください。
                    </p>
                  </div>
                </div>

                {/* 迷惑メールフォルダの注意 */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    <p className="font-medium">メールが届かない場合</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>迷惑メールフォルダをご確認ください</li>
                      <li>キャリアメール（docomo、au、SoftBank）をお使いの場合は、ドメイン指定受信の設定をご確認ください</li>
                      <li>数分待ってもメールが届かない場合は、再度登録をお試しください</li>
                    </ul>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSubmitted(false);
                    setEmail("");
                    setSelectedPrefectures([]);
                  }}
                  className="w-full"
                >
                  別のメールアドレスで登録する
                </Button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-200">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gmail、Yahoo!メール、キャリアメール（docomo、au、SoftBank）など、どのメールアドレスでも登録できます。
                  </p>
                </div>

                {/* Prefecture Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="dark:text-gray-200">通知を受け取る都道府県</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedPrefectures.length === PREFECTURES.length ? "すべて解除" : "すべて選択"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg dark:border-gray-600">
                    {PREFECTURES.map((prefecture) => (
                      <div key={prefecture} className="flex items-center space-x-2">
                        <Checkbox
                          id={`email-pref-${prefecture}`}
                          checked={selectedPrefectures.includes(prefecture)}
                          onCheckedChange={() => handlePrefectureToggle(prefecture)}
                        />
                        <Label
                          htmlFor={`email-pref-${prefecture}`}
                          className="text-sm cursor-pointer dark:text-gray-300"
                        >
                          {prefecture}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedPrefectures.length > 0 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {selectedPrefectures.length}件の都道府県を選択中
                    </p>
                  )}
                </div>

                {/* Warning Message */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-medium">確認メールをお送りします</p>
                    <p className="mt-1">
                      登録後、確認メールをお送りします。メールに記載されたリンクをクリックして登録を完了してください。
                      迷惑メールフォルダもご確認ください。
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailSubscribeMutation.isPending || !email || selectedPrefectures.length === 0}
                >
                  {emailSubscribeMutation.isPending ? "送信中..." : "確認メールを送信"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
