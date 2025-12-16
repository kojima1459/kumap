import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Shield, 
  Phone, 
  Volume2, 
  VolumeX,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Bell,
  MapPin,
  Clock,
  Users,
  Footprints,
  Eye,
  Hand,
  Package,
  Baby,
  Dog,
  Mountain,
  Home,
  Trash2,
  Apple,
  Moon,
  Sun,
  TreePine,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import Footer from "@/components/Footer";

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-left">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EmergencyGuide() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakEmergencyGuide = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const text = `
        クマに遭遇した時の対処法です。
        まず、落ち着いてください。パニックにならないことが最も重要です。
        大声を出したり、走って逃げたりしないでください。
        クマに背を向けず、ゆっくりと後退してください。
        目を合わせ続けないでください。威嚇と受け取られる可能性があります。
        もし荷物を持っていたら、静かに地面に置いて、クマの注意をそらしてください。
        クマが近づいてきた場合は、両手を広げて大きく見せ、低い声で話しかけてください。
        絶対に背を向けて走らないでください。クマは時速50キロで走ることができます。
      `;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                マップに戻る
              </Link>
            </Button>
          </div>

          {/* Emergency Banner */}
          <Card className="p-4 sm:p-6 mb-6 bg-gradient-to-r from-red-600 to-orange-600 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold mb-1">クマ遭遇時の緊急対処ガイド</h1>
                <p className="text-sm sm:text-base opacity-90">落ち着いて行動することが最も重要です</p>
              </div>
              <Button
                onClick={speakEmergencyGuide}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isSpeaking ? "停止" : "音声で聞く"}
              </Button>
            </div>
          </Card>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="font-bold text-red-800 dark:text-red-300">やってはいけない</span>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• 大声を出す</li>
                <li>• 走って逃げる</li>
                <li>• 背を向ける</li>
                <li>• 目を合わせ続ける</li>
              </ul>
            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="font-bold text-green-800 dark:text-green-300">やるべきこと</span>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• 落ち着く</li>
                <li>• ゆっくり後退</li>
                <li>• 荷物を置く</li>
                <li>• 低い声で話す</li>
              </ul>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-blue-800 dark:text-blue-300">緊急連絡先</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-bold text-lg">110番（警察）</p>
                <p>または市町村役場</p>
                <Link href="/contacts" className="text-blue-600 hover:underline flex items-center gap-1 mt-2">
                  地域別連絡先一覧 <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Detailed Guide */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              詳細ガイド
            </h2>

            <AccordionItem
              title="クマに遭遇した瞬間の対応"
              icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
              defaultOpen={true}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                    <Hand className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">1. まず止まる</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      急な動きはクマを刺激します。その場で静止し、状況を把握してください。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                    <Eye className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2. クマの様子を観察</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      クマがこちらに気づいているか、どの方向を向いているかを確認します。
                      直接目を合わせ続けないでください。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                    <Footprints className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">3. ゆっくり後退</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      クマに背を向けず、斜め後ろにゆっくりと下がります。
                      急な動きは避け、静かに距離を取ってください。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">4. 荷物を置く（必要に応じて）</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      クマが近づいてくる場合、リュックや食べ物を静かに地面に置いて、
                      クマの注意をそらすことができます。
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              title="クマが近づいてきた場合"
              icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
            >
              <div className="space-y-3 text-sm">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">威嚇行動の場合</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    クマが立ち上がったり、地面を叩いたりするのは威嚇行動です。
                    落ち着いて、両手を広げて体を大きく見せ、低い声で「おーい」などと話しかけながら、
                    ゆっくり後退してください。
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-red-800 dark:text-red-300 mb-2">攻撃された場合</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    うつ伏せになり、両手で首の後ろを守ってください。リュックを背負っていれば、
                    それが背中を守る役割を果たします。クマが去るまで動かないでください。
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">クマスプレーを持っている場合</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    クマが3〜5メートル以内に近づいた時に使用します。
                    風向きに注意し、クマの顔に向けて噴射してください。
                  </p>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              title="特別な状況での対応"
              icon={<Users className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Baby className="h-5 w-5 text-pink-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">子グマを見かけた場合</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong className="text-red-600">絶対に近づかないでください。</strong>
                      近くに母グマがいる可能性が非常に高く、子グマを守るために攻撃的になります。
                      すぐにその場を離れてください。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Dog className="h-5 w-5 text-brown-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">犬を連れている場合</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      犬を必ずリードで繋いでおいてください。犬がクマに吠えかかると、
                      クマを刺激して危険な状況になる可能性があります。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">グループの場合</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      散らばらずに集まり、一緒にゆっくり後退してください。
                      複数人でいることで、クマに対して大きく見せることができます。
                    </p>
                  </div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              title="クマに出会わないための予防策"
              icon={<Bell className="h-5 w-5 text-green-600" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-green-600" />
                    山や森に入る時
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• クマよけ鈴やラジオを携帯</li>
                    <li>• 複数人で行動し、声を出しながら歩く</li>
                    <li>• 早朝・夕方の活動は特に注意</li>
                    <li>• クマスプレーの携帯を検討</li>
                    <li>• 事前に出没情報を確認</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    生活圏での対策
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 生ゴミは朝に出す（前夜に出さない）</li>
                    <li>• 果樹は早めに収穫</li>
                    <li>• コンポストは蓋付きを使用</li>
                    <li>• ペットフードを外に放置しない</li>
                    <li>• 夜間の外出時は懐中電灯を</li>
                  </ul>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              title="クマの活動時間と季節"
              icon={<Clock className="h-5 w-5 text-purple-600" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold">早朝・夕方</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      クマが最も活発に活動する時間帯です。特に注意が必要です。
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">夜間</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      人里に出没することが多い時間帯。懐中電灯を持ち歩きましょう。
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">季節別の注意点</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                      <TreePine className="h-4 w-4 text-pink-600" />
                      <span><strong>春（4〜5月）：</strong>冬眠明けで空腹</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <TreePine className="h-4 w-4 text-green-600" />
                      <span><strong>夏（6〜8月）：</strong>子連れに注意</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <Apple className="h-4 w-4 text-orange-600" />
                      <span><strong>秋（9〜11月）：</strong>冬眠前で食欲旺盛</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <Moon className="h-4 w-4 text-blue-600" />
                      <span><strong>冬（12〜3月）：</strong>通常は冬眠中</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem
              title="クマを呼び寄せないために"
              icon={<Trash2 className="h-5 w-5 text-gray-600" />}
            >
              <div className="space-y-3 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  クマは非常に嗅覚が優れており、食べ物の匂いに引き寄せられます。
                  以下の点に注意することで、クマを人里に呼び寄せるリスクを減らせます。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-1">ゴミの管理</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 生ゴミは収集日の朝に出す</li>
                      <li>• ゴミ箱は蓋付きを使用</li>
                      <li>• バーベキュー後は完全に片付け</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-1">農作物・果樹</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 熟した果実は早めに収穫</li>
                      <li>• 落果は放置しない</li>
                      <li>• 電気柵の設置を検討</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionItem>
          </div>

          {/* Bottom CTA */}
          <Card className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold mb-1">クマ出没情報をメールで受け取る</h3>
                <p className="text-sm opacity-90">お住まいの地域の出没情報をリアルタイムでお届けします</p>
              </div>
              <Button variant="secondary" asChild>
                <Link href="/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  通知を設定する
                </Link>
              </Button>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-300">緊急時は110番へ</p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  クマによる被害が発生した場合、または危険を感じた場合は、すぐに警察に通報してください。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
