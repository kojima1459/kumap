import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Footer from "@/components/Footer";

export default function EmailConfirm() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [prefectures, setPrefectures] = useState<string[]>([]);

  const confirmMutation = trpc.emailSubscription.confirm.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setPrefectures(data.prefectures || []);
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "確認に失敗しました");
    },
  });

  useEffect(() => {
    if (token) {
      confirmMutation.mutate({ token });
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
                <CardTitle className="dark:text-gray-100">確認中...</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  メールアドレスを確認しています
                </CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="dark:text-gray-100">登録完了</CardTitle>
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
          <CardContent>
            {status === "success" && prefectures.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
                  以下の都道府県の通知を受け取ります:
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {prefectures.join("、")}
                </p>
              </div>
            )}
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              マップに戻る
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
