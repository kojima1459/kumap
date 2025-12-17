import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, BarChart3, Info, Database, Clock, Shield, ExternalLink, Bell, Mail, CheckCircle, Navigation } from "lucide-react";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-orange-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_kumap.png" alt="クマップ" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-orange-600">クマップ</h1>
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">クマ出没情報マップ</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">マップ</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stats">
                <BarChart3 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">統計</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notifications">
                <Bell className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">通知設定</span>
              </Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">クマップについて</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            全国のクマ出没情報を地図で確認できるサービスです
          </p>
        </div>

        {/* What is Kumap - 高齢者向けに分かりやすく */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <Info className="h-6 w-6 text-orange-600" />
              クマップとは？
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg prose-gray max-w-none dark:prose-invert">
            <p className="text-lg leading-relaxed dark:text-gray-300">
              <strong>クマップ</strong>は、日本全国のクマ（ツキノワグマ・ヒグマ）の目撃情報を
              <strong>地図上で確認できる無料のサービス</strong>です。
            </p>
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 my-4">
              <p className="text-green-800 dark:text-green-300 text-lg font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                会員登録なしで、どなたでも無料でご利用いただけます
              </p>
            </div>
            <p className="text-lg leading-relaxed dark:text-gray-300">
              登山、ハイキング、山菜採り、畑仕事などで山や野外に出かける前に、
              クマの出没エリアを確認して、安全な行動計画を立てるのにお役立てください。
            </p>
          </CardContent>
        </Card>

        {/* How to Use - 高齢者向けステップバイステップ */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <MapPin className="h-6 w-6 text-orange-600" />
              使い方ガイド
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">地図を見る</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    トップページを開くと、日本地図が表示されます。
                    <strong className="text-orange-600">赤いマーク</strong>がクマの目撃された場所です。
                    マークをタップ（クリック）すると、詳しい情報が見られます。
                  </p>
                  <Button asChild className="mt-3 bg-orange-600 hover:bg-orange-700">
                    <Link href="/">
                      <MapPin className="h-4 w-4 mr-2" />
                      地図を見る
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">地域を絞り込む</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    画面上部の「都道府県」から、お住まいの地域や行き先を選ぶと、
                    その地域のクマ情報だけを表示できます。
                    「期間」を選ぶと、最近の情報だけを見ることもできます。
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">危険な場所を確認する</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    「ヒートマップ」ボタンを押すと、クマがよく出る場所が
                    <strong className="text-red-600">赤く</strong>表示されます。
                    赤い場所は特に注意が必要です。
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">統計を見る</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    「統計」ページでは、都道府県ごとのクマ出没件数をグラフで確認できます。
                    どの地域でクマが多く出ているかが一目でわかります。
                  </p>
                  <Button asChild variant="outline" className="mt-3">
                    <Link href="/stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      統計を見る
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Feature - 新規追加 */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-800 dark:text-blue-300">
              <Mail className="h-6 w-6" />
              メール通知機能（新機能）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg text-blue-800 dark:text-blue-300 leading-relaxed">
                お住まいの地域や気になる地域でクマが出没したとき、
                <strong>メールでお知らせ</strong>を受け取ることができます。
              </p>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>会員登録は不要です</strong> - メールアドレスを入力するだけで登録できます
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>どんなメールでもOK</strong> - Gmail、Yahoo!メール、携帯メール（docomo、au、SoftBank）など
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>いつでも解除できます</strong> - メールに記載のリンクから簡単に解除できます
                  </p>
                </div>
              </div>

              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-300 text-base">
                  <strong>ご注意：</strong>メールが届かない場合は、「迷惑メールフォルダ」をご確認ください。
                  携帯メールをお使いの方は、受信設定をご確認ください。
                </p>
              </div>

              <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Link href="/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  通知を設定する
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <Shield className="h-6 w-6 text-orange-600" />
              主な機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">出没マップ</h3>
                  <p className="text-gray-600 dark:text-gray-300">全国のクマ目撃情報を地図上に表示。都道府県・期間で絞り込みできます。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">危険度ヒートマップ</h3>
                  <p className="text-gray-600 dark:text-gray-300">クマがよく出る場所を色で表示。赤い場所は特に注意が必要です。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">統計情報</h3>
                  <p className="text-gray-600 dark:text-gray-300">都道府県別・月別の出没件数をグラフで表示。傾向がわかります。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">メール通知</h3>
                  <p className="text-gray-600 dark:text-gray-300">選んだ地域で新しい出没情報があると、メールでお知らせします。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">現在地周辺の危険度（新機能）</h3>
                  <p className="text-gray-600 dark:text-gray-300">GPSを使って、今いる場所の周辺でクマが出ているか確認できます。位置情報はサーバーに送信されません。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <Database className="h-6 w-6 text-orange-600" />
              情報の出どころ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              クマップの情報は、以下の信頼できる情報源から集めています：
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">くまっぷ（株式会社Xenon）</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  全国のクマ目撃情報を集めているサービスです。
                </p>
                <a href="https://kumap-xenon.web.app/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline flex items-center gap-1 mt-1">
                  くまっぷ公式サイト <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">長野県公式情報</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  長野県が公開しているクマ出没情報から詳細データを取得しています。
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">各都道府県公式サイト</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  20以上の都道府県が公開しているクマ出没情報マップへのリンクを提供しています。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Schedule */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
              <Clock className="h-6 w-6 text-orange-600" />
              情報の更新について
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                クマップの情報は<strong>毎日午前2時（日本時間）</strong>に自動で更新されます。
                最新の情報を確認するには、ページを再読み込みしてください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-yellow-800 dark:text-yellow-300">
              <Shield className="h-6 w-6" />
              ご注意ください
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-800 dark:text-yellow-300">
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>このサービスの情報は参考情報です。完全な正確性は保証できません。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>クマとの遭遇を完全に防ぐことを保証するものではありません。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>山や野外に出かける際は、<strong>必ず最新の公式情報を確認</strong>し、クマよけ鈴などの対策をしてください。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>このサービスの利用により生じた損害について、運営者は責任を負いません。</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6">
            <Link href="/">
              <MapPin className="h-6 w-6 mr-2" />
              マップを見る
            </Link>
          </Button>
          <p className="text-gray-500 dark:text-gray-400">
            ご不明な点がございましたら、お気軽にお問い合わせください
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
