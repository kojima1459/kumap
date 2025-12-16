import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Bell, ChevronLeft, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">メール通知設定</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              <CardTitle className="dark:text-gray-100">メール通知登録</CardTitle>
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
