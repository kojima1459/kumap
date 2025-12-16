import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2, BellOff } from "lucide-react";
import Footer from "@/components/Footer";

export default function EmailUnsubscribe() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [prefecture, setPrefecture] = useState("");

  const unsubscribeMutation = trpc.emailSubscription.unsubscribe.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setPrefecture(data.prefecture || "");
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "解除に失敗しました");
    },
  });

  useEffect(() => {
    if (token) {
      unsubscribeMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("無効なリンクです");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto mb-4">
                  <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
                </div>
                <CardTitle className="dark:text-gray-100">処理中...</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  通知を解除しています
                </CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <div className="mx-auto mb-4">
                  <BellOff className="h-12 w-12 text-gray-500" />
                </div>
                <CardTitle className="dark:text-gray-100">通知を解除しました</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {message}
                </CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <div className="mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle className="dark:text-gray-100">エラー</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {message}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  今後、{prefecture}のクマ出没情報の通知は送信されません。
                  再度通知を受け取りたい場合は、通知設定ページから登録してください。
                </p>
              </div>
            )}
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              マップに戻る
            </Button>
            {status === "success" && (
              <Button
                variant="outline"
                onClick={() => setLocation("/notifications")}
                className="w-full"
              >
                通知設定を変更する
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
