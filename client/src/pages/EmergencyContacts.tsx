import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Phone, 
  Building2, 
  Search,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Shield
} from "lucide-react";
import Footer from "@/components/Footer";

interface ContactInfo {
  prefecture: string;
  department: string;
  phone: string;
  url?: string;
  notes?: string;
}

// 都道府県別の野生動物対策窓口（主要な連絡先）
const emergencyContacts: ContactInfo[] = [
  { prefecture: "北海道", department: "環境生活部自然環境課", phone: "011-204-5205", url: "https://www.pref.hokkaido.lg.jp/ks/skn/higuma/", notes: "ヒグマ対策室あり" },
  { prefecture: "青森県", department: "環境生活部自然保護課", phone: "017-734-9257", url: "https://www.pref.aomori.lg.jp/soshiki/kankyo/shizen/" },
  { prefecture: "岩手県", department: "環境生活部自然保護課", phone: "019-629-5371", url: "https://www.pref.iwate.jp/kurashikankyou/shizen/yasei/" },
  { prefecture: "宮城県", department: "環境生活部自然保護課", phone: "022-211-2673", url: "https://www.pref.miyagi.jp/soshiki/sizenhogo/" },
  { prefecture: "秋田県", department: "生活環境部自然保護課", phone: "018-860-1613", url: "https://www.pref.akita.lg.jp/pages/genre/11000" },
  { prefecture: "山形県", department: "環境エネルギー部みどり自然課", phone: "023-630-3404", url: "https://www.pref.yamagata.jp/ou/kankyoenergy/050011/" },
  { prefecture: "福島県", department: "生活環境部自然保護課", phone: "024-521-7251", url: "https://www.pref.fukushima.lg.jp/sec/16035a/" },
  { prefecture: "茨城県", department: "県民生活環境部環境政策課", phone: "029-301-2946", url: "https://www.pref.ibaraki.jp/seikatsukankyo/kansei/" },
  { prefecture: "栃木県", department: "環境森林部自然環境課", phone: "028-623-3261", url: "https://www.pref.tochigi.lg.jp/d04/" },
  { prefecture: "群馬県", department: "環境森林部自然環境課", phone: "027-226-2872", url: "https://www.pref.gunma.jp/site/wild-animals/" },
  { prefecture: "埼玉県", department: "環境部みどり自然課", phone: "048-830-3143", url: "https://www.pref.saitama.lg.jp/a0508/" },
  { prefecture: "千葉県", department: "環境生活部自然保護課", phone: "043-223-2972", url: "https://www.pref.chiba.lg.jp/shizen/" },
  { prefecture: "東京都", department: "環境局自然環境部", phone: "03-5388-3505", url: "https://www.kankyo.metro.tokyo.lg.jp/nature/" },
  { prefecture: "神奈川県", department: "環境農政局緑政部自然環境保全課", phone: "045-210-4319", url: "https://www.pref.kanagawa.jp/docs/t4i/" },
  { prefecture: "新潟県", department: "県民生活・環境部環境企画課", phone: "025-280-5152", url: "https://www.pref.niigata.lg.jp/sec/kankyokikaku/" },
  { prefecture: "富山県", department: "生活環境文化部自然保護課", phone: "076-444-3396", url: "https://www.pref.toyama.jp/1709/" },
  { prefecture: "石川県", department: "生活環境部自然環境課", phone: "076-225-1477", url: "https://www.pref.ishikawa.lg.jp/sizen/" },
  { prefecture: "福井県", department: "安全環境部自然環境課", phone: "0776-20-0306", url: "https://www.pref.fukui.lg.jp/doc/shizen/" },
  { prefecture: "山梨県", department: "森林環境部みどり自然課", phone: "055-223-1520", url: "https://www.pref.yamanashi.jp/shizen/" },
  { prefecture: "長野県", department: "環境部自然保護課", phone: "026-235-7178", url: "https://www.pref.nagano.lg.jp/shizenhogo/", notes: "ツキノワグマ情報あり" },
  { prefecture: "岐阜県", department: "環境生活部環境企画課", phone: "058-272-8231", url: "https://www.pref.gifu.lg.jp/page/1706.html" },
  { prefecture: "静岡県", department: "くらし・環境部環境局自然保護課", phone: "054-221-2719", url: "https://www.pref.shizuoka.jp/kankyou/ka-070/" },
  { prefecture: "愛知県", department: "環境局自然環境課", phone: "052-954-6230", url: "https://www.pref.aichi.jp/soshiki/shizen/" },
  { prefecture: "三重県", department: "農林水産部みどり共生推進課", phone: "059-224-2578", url: "https://www.pref.mie.lg.jp/MIDORI/" },
  { prefecture: "滋賀県", department: "琵琶湖環境部自然環境保全課", phone: "077-528-3483", url: "https://www.pref.shiga.lg.jp/ippan/kankyoshizen/shizen/" },
  { prefecture: "京都府", department: "環境部自然環境保全課", phone: "075-414-4706", url: "https://www.pref.kyoto.jp/shizen/" },
  { prefecture: "大阪府", department: "環境農林水産部みどり推進室", phone: "06-6210-9555", url: "https://www.pref.osaka.lg.jp/midori/" },
  { prefecture: "兵庫県", department: "農政環境部環境創造局自然環境課", phone: "078-362-3389", url: "https://web.pref.hyogo.lg.jp/nk19/" },
  { prefecture: "奈良県", department: "くらし創造部景観・自然環境課", phone: "0742-27-8757", url: "https://www.pref.nara.jp/1706.htm" },
  { prefecture: "和歌山県", department: "環境生活部環境政策局自然環境室", phone: "073-441-2779", url: "https://www.pref.wakayama.lg.jp/prefg/032000/" },
  { prefecture: "鳥取県", department: "生活環境部緑豊かな自然課", phone: "0857-26-7872", url: "https://www.pref.tottori.lg.jp/midorishizen/" },
  { prefecture: "島根県", department: "環境生活部自然環境課", phone: "0852-22-6377", url: "https://www.pref.shimane.lg.jp/infra/nature/shizen/" },
  { prefecture: "岡山県", department: "環境文化部自然環境課", phone: "086-226-7312", url: "https://www.pref.okayama.jp/site/16/" },
  { prefecture: "広島県", department: "環境県民局自然環境課", phone: "082-513-2933", url: "https://www.pref.hiroshima.lg.jp/soshiki/53/" },
  { prefecture: "山口県", department: "環境生活部自然保護課", phone: "083-933-3050", url: "https://www.pref.yamaguchi.lg.jp/cms/a15500/" },
  { prefecture: "徳島県", department: "県民環境部環境首都課", phone: "088-621-2210", url: "https://www.pref.tokushima.lg.jp/kankyo/" },
  { prefecture: "香川県", department: "環境森林部みどり保全課", phone: "087-832-3212", url: "https://www.pref.kagawa.lg.jp/midorihozen/" },
  { prefecture: "愛媛県", department: "県民環境部自然保護課", phone: "089-912-2365", url: "https://www.pref.ehime.jp/h15800/" },
  { prefecture: "高知県", department: "林業振興・環境部自然共生課", phone: "088-821-4868", url: "https://www.pref.kochi.lg.jp/soshiki/030701/" },
  { prefecture: "福岡県", department: "環境部自然環境課", phone: "092-643-3367", url: "https://www.pref.fukuoka.lg.jp/soshiki/4601103/" },
  { prefecture: "佐賀県", department: "県民環境部有明海再生・自然環境課", phone: "0952-25-7080", url: "https://www.pref.saga.lg.jp/kiji00317461/" },
  { prefecture: "長崎県", department: "環境部自然環境課", phone: "095-895-2381", url: "https://www.pref.nagasaki.jp/bunrui/kurashi-kankyo/shizenkankyo/" },
  { prefecture: "熊本県", department: "環境生活部自然保護課", phone: "096-333-2275", url: "https://www.pref.kumamoto.jp/soshiki/49/" },
  { prefecture: "大分県", department: "生活環境部自然保護推進室", phone: "097-506-3022", url: "https://www.pref.oita.jp/soshiki/13040/" },
  { prefecture: "宮崎県", department: "環境森林部自然環境課", phone: "0985-26-7291", url: "https://www.pref.miyazaki.lg.jp/shizen/" },
  { prefecture: "鹿児島県", department: "環境林務部自然保護課", phone: "099-286-2616", url: "https://www.pref.kagoshima.jp/ad04/" },
  { prefecture: "沖縄県", department: "環境部自然保護課", phone: "098-866-2243", url: "https://www.pref.okinawa.jp/site/kankyo/shizen/" },
];

// 地方別にグループ化
const regions = [
  { name: "北海道", prefectures: ["北海道"] },
  { name: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

export default function EmergencyContacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    let contacts = emergencyContacts;

    if (selectedRegion) {
      const region = regions.find(r => r.name === selectedRegion);
      if (region) {
        contacts = contacts.filter(c => region.prefectures.includes(c.prefecture));
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      contacts = contacts.filter(c => 
        c.prefecture.toLowerCase().includes(query) ||
        c.department.toLowerCase().includes(query)
      );
    }

    return contacts;
  }, [searchQuery, selectedRegion]);

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

          {/* Title Card */}
          <Card className="p-4 sm:p-6 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Phone className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-1">地域別緊急連絡先一覧</h1>
                <p className="text-sm sm:text-base opacity-90">クマ目撃時の通報先・相談窓口</p>
              </div>
            </div>
          </Card>

          {/* Emergency Notice */}
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-300 mb-1">緊急時は110番へ</p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  クマに襲われた、または今まさにクマと遭遇している場合は、すぐに110番（警察）に通報してください。
                  下記の連絡先は、目撃情報の通報や相談用です。
                </p>
              </div>
            </div>
          </Card>

          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="都道府県名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRegion === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegion(null)}
              >
                全国
              </Button>
              {regions.map(region => (
                <Button
                  key={region.name}
                  variant={selectedRegion === region.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(region.name)}
                >
                  {region.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="space-y-3">
            {filteredContacts.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                該当する連絡先が見つかりません
              </Card>
            ) : (
              filteredContacts.map((contact) => (
                <Card key={contact.prefecture} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                        <MapPin className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{contact.prefecture}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contact.department}
                        </p>
                        {contact.notes && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {contact.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-10 sm:ml-0">
                      <a
                        href={`tel:${contact.phone.replace(/-/g, "")}`}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="font-mono">{contact.phone}</span>
                      </a>
                      {contact.url && (
                        <a
                          href={contact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="公式サイトを開く"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Additional Info */}
          <Card className="mt-6 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              通報時のポイント
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <li>• <strong>場所</strong>：できるだけ具体的に（住所、目印となる建物など）</li>
              <li>• <strong>時間</strong>：目撃した日時</li>
              <li>• <strong>クマの様子</strong>：大きさ、頭数、行動（歩いていた、餌を食べていたなど）</li>
              <li>• <strong>進行方向</strong>：クマがどちらに向かったか</li>
              <li>• <strong>あなたの連絡先</strong>：折り返し連絡が必要な場合に備えて</li>
            </ul>
          </Card>

          {/* Bottom CTA */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Link href="/emergency-guide" className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8" />
                <div>
                  <p className="font-bold">クマ遭遇時の対処法</p>
                  <p className="text-sm opacity-90">緊急時に備えて確認</p>
                </div>
              </Link>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <Link href="/notifications" className="flex items-center gap-3">
                <Phone className="h-8 w-8" />
                <div>
                  <p className="font-bold">メール通知を設定</p>
                  <p className="text-sm opacity-90">出没情報をリアルタイムで</p>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
