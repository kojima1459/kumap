/**
 * Map filter component for prefecture and date range selection
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin } from "lucide-react";

const PREFECTURES = [
  "全国",
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "高知県"
];

export type DateRange = "all" | "week" | "month" | "3months";

interface MapFilterProps {
  selectedPrefecture: string;
  onPrefectureChange: (prefecture: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  sightingsCount?: number;
}

export function MapFilter({
  selectedPrefecture,
  onPrefectureChange,
  dateRange,
  onDateRangeChange,
  sightingsCount,
}: MapFilterProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="container flex items-center gap-6">
        {/* Prefecture Filter */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-gray-700">地域:</span>
          <Select value={selectedPrefecture} onValueChange={onPrefectureChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
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

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-gray-700">期間:</span>
          <Select value={dateRange} onValueChange={(value) => onDateRangeChange(value as DateRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全期間</SelectItem>
              <SelectItem value="week">過去1週間</SelectItem>
              <SelectItem value="month">過去1ヶ月</SelectItem>
              <SelectItem value="3months">過去3ヶ月</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sightings Count */}
        {sightingsCount !== undefined && (
          <div className="ml-auto text-sm text-gray-600">
            {sightingsCount}件の出没情報
          </div>
        )}
      </div>
    </div>
  );
}
