import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Play, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function AdminScraper() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [lastResult, setLastResult] = useState<{ total: number; saved: number; skipped?: number } | null>(null);

  const scraperMutation = trpc.scraper.runScraper.useMutation({
    onSuccess: (result) => {
      setLastResult(result);
      toast.success(`スクレイピング完了: ${result.saved}件保存、${result.skipped || 0}件スキップ`);
    },
    onError: (error) => {
      toast.error(`スクレイピング失敗: ${error.message}`);
    },
  });

  const handleRunScraper = () => {
    if (confirm("Yahoo!ニュースからクマ出没情報をスクレイピングしますか？")) {
      scraperMutation.mutate();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">
            管理者機能を使用するには、ログインが必要です。
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>ログイン</a>
          </Button>
        </Card>
      </div>
    );
  }

  // Check if user is the project owner
  if (user.openId !== import.meta.env.VITE_OWNER_OPEN_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Card className="p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">アクセスが拒否されました</h2>
          <p className="text-gray-600 mb-6">
            このページはプロジェクトオーナー専用です。経済的負担とセキュリティ保護のため、一般ユーザーはアクセスできません。
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            マップに戻る
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/")}>
              ← マップに戻る
            </Button>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">スクレイピング管理</h1>
                <p className="text-sm text-gray-600">Yahoo!ニュースから最新のクマ出没情報を取得</p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">自動スクレイピングについて</h3>
              <p className="text-sm text-blue-800">
                このアプリは毎日午前2時（日本時間）に自動的にYahoo!ニュースのクマ出没情報をスクレイピングします。
                手動で実行する場合は、下のボタンをクリックしてください。
              </p>
            </div>

            {/* Manual Trigger */}
            <div className="space-y-4">
              <Button
                onClick={handleRunScraper}
                disabled={scraperMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                {scraperMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    スクレイピング実行中...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    今すぐスクレイピングを実行
                  </>
                )}
              </Button>

              {/* Last Result */}
              {lastResult && (
                <Card className="p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    実行結果
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{lastResult.total}</div>
                      <div className="text-sm text-gray-600">取得件数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{lastResult.saved}</div>
                      <div className="text-sm text-gray-600">保存件数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{lastResult.skipped || 0}</div>
                      <div className="text-sm text-gray-600">スキップ</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Schedule Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">スケジュール設定</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>実行時刻: 毎日午前2時（日本時間）</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>重複チェック: 都道府県 + ソースURLで自動判定</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>対象サイト: Yahoo!ニュース クマ出没情報</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
