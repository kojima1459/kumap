import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapView } from "@/components/Map";
import { Loader2, MapPin, Send, AlertTriangle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "高知県"
];

const BEAR_TYPES = ["ツキノワグマ", "ヒグマ", "不明"];

export default function SubmitSighting() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  const [formData, setFormData] = useState({
    prefecture: "",
    city: "",
    location: "",
    latitude: "",
    longitude: "",
    sightedAt: new Date().toISOString().slice(0, 16),
    bearType: "",
    description: "",
  });

  const submitMutation = trpc.bearSightings.submit.useMutation({
    onSuccess: () => {
      toast.success("投稿が完了しました！");
      navigate("/");
    },
    onError: (error) => {
      toast.error(`投稿に失敗しました: ${error.message}`);
    },
  });

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    // Add click listener to place marker
    mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Update form data
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));

      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Add new marker
      const newMarker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: "クマ目撃地点",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      setMarker(newMarker);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prefecture || !formData.latitude || !formData.longitude) {
      toast.error("都道府県と位置情報を入力してください");
      return;
    }

    submitMutation.mutate({
      ...formData,
      sightedAt: new Date(formData.sightedAt),
    });
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
            クマ出没情報を投稿するには、ログインが必要です。
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>ログイン</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/")}>
              ← マップに戻る
            </Button>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">クマ出没情報を投稿</h1>
                <p className="text-sm text-gray-600">目撃情報を共有して、地域の安全に貢献しましょう</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="prefecture">都道府県 *</Label>
                  <Select
                    value={formData.prefecture}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, prefecture: value }))
                    }
                  >
                    <SelectTrigger id="prefecture">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFECTURES.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">市区町村</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="例: 札幌市中央区"
                  />
                </div>

                <div>
                  <Label htmlFor="location">詳細な場所</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="例: ○○公園付近"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">緯度 *</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      readOnly
                      placeholder="マップをクリック"
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">経度 *</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      readOnly
                      placeholder="マップをクリック"
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sightedAt">目撃日時 *</Label>
                  <Input
                    id="sightedAt"
                    type="datetime-local"
                    value={formData.sightedAt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sightedAt: e.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    クマを目撃した日時を入力してください
                  </p>
                </div>

                <div>
                  <Label htmlFor="bearType">クマの種類</Label>
                  <Select
                    value={formData.bearType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, bearType: value }))
                    }
                  >
                    <SelectTrigger id="bearType">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {BEAR_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">詳細説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="クマの様子、状況など詳しく記入してください"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      投稿中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      投稿する
                    </>
                  )}
                </Button>
              </form>

              {/* Map */}
              <div>
                <Label className="mb-2 block">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  目撃地点をクリックして選択 *
                </Label>
                <Card className="h-[600px] overflow-hidden">
                  <MapView
                    onMapReady={handleMapReady}
                    initialCenter={{ lat: 36.5, lng: 138.0 }}
                    initialZoom={6}
                  />
                </Card>
                <p className="text-sm text-gray-600 mt-2">
                  マップをクリックすると、その位置の緯度・経度が自動入力されます
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
