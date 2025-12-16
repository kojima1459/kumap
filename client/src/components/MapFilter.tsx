/**
 * Map filter component for prefecture and date range selection
 * Supports multiple prefecture selection and custom date range
 * Mobile-optimized with collapsible filter panel
 */
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar as CalendarIcon, MapPin, X, ChevronDown, Filter, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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

// Region groups for easier selection
const REGIONS = {
  "北海道・東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  "近畿": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国・四国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
};

export type DateRange = "all" | "week" | "month" | "3months" | "custom";

export interface CustomDateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface MapFilterProps {
  selectedPrefectures: string[];
  onPrefecturesChange: (prefectures: string[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customDateRange: CustomDateRange;
  onCustomDateRangeChange: (range: CustomDateRange) => void;
  sightingsCount?: number;
}

export function MapFilter({
  selectedPrefectures,
  onPrefecturesChange,
  dateRange,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  sightingsCount,
}: MapFilterProps) {
  const [prefecturePopoverOpen, setPrefecturePopoverOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handlePrefectureToggle = (prefecture: string) => {
    if (selectedPrefectures.includes(prefecture)) {
      onPrefecturesChange(selectedPrefectures.filter(p => p !== prefecture));
    } else {
      onPrefecturesChange([...selectedPrefectures, prefecture]);
    }
  };

  const handleRegionToggle = (region: string) => {
    const regionPrefectures = REGIONS[region as keyof typeof REGIONS];
    const allSelected = regionPrefectures.every(p => selectedPrefectures.includes(p));
    
    if (allSelected) {
      onPrefecturesChange(selectedPrefectures.filter(p => !regionPrefectures.includes(p)));
    } else {
      const newPrefectures = Array.from(new Set([...selectedPrefectures, ...regionPrefectures]));
      onPrefecturesChange(newPrefectures);
    }
  };

  const handleSelectAll = () => {
    onPrefecturesChange([...PREFECTURES]);
  };

  const handleClearAll = () => {
    onPrefecturesChange([]);
  };

  const getPrefectureDisplayText = () => {
    if (selectedPrefectures.length === 0) return "全国";
    if (selectedPrefectures.length === 1) return selectedPrefectures[0];
    if (selectedPrefectures.length === PREFECTURES.length) return "全国";
    return `${selectedPrefectures.length}都道府県`;
  };

  const getDateRangeDisplayText = () => {
    switch (dateRange) {
      case "all": return "全期間";
      case "week": return "過去1週間";
      case "month": return "過去1ヶ月";
      case "3months": return "過去3ヶ月";
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return `${format(customDateRange.from, "M/d", { locale: ja })} - ${format(customDateRange.to, "M/d", { locale: ja })}`;
        }
        return "期間を選択";
      default: return "全期間";
    }
  };

  const hasActiveFilters = selectedPrefectures.length > 0 || dateRange !== "all";

  // Prefecture selection content (shared between desktop and mobile)
  const PrefectureSelectionContent = () => (
    <>
      <div className="p-3 border-b">
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={handleSelectAll}>
            全選択
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearAll}>
            クリア
          </Button>
        </div>
        {selectedPrefectures.length > 0 && selectedPrefectures.length < PREFECTURES.length && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedPrefectures.slice(0, 5).map(pref => (
              <Badge key={pref} variant="secondary" className="text-xs">
                {pref}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrefectureToggle(pref);
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedPrefectures.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedPrefectures.length - 5}
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2">
        {Object.entries(REGIONS).map(([region, prefectures]) => {
          const allSelected = prefectures.every(p => selectedPrefectures.includes(p));
          const someSelected = prefectures.some(p => selectedPrefectures.includes(p));
          
          return (
            <div key={region} className="mb-3">
              <div 
                className="flex items-center gap-2 px-2 py-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleRegionToggle(region)}
              >
                <Checkbox 
                  checked={allSelected}
                  className={someSelected && !allSelected ? "opacity-50" : ""}
                />
                <span className="text-sm font-medium">{region}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 mt-1 pl-2">
                {prefectures.map(pref => (
                  <div 
                    key={pref}
                    className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handlePrefectureToggle(pref)}
                  >
                    <Checkbox checked={selectedPrefectures.includes(pref)} />
                    <span className="text-xs">{pref.replace(/県|府|都/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-4 sm:py-3">
      {/* Mobile Filter Button */}
      <div className="flex sm:hidden items-center justify-between">
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              フィルター
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {(selectedPrefectures.length > 0 ? 1 : 0) + (dateRange !== "all" ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>絞り込み検索</SheetTitle>
            </SheetHeader>
            
            {/* Mobile Prefecture Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <span className="font-medium">地域を選択</span>
                <span className="text-sm text-gray-500">({getPrefectureDisplayText()})</span>
              </div>
              <div className="border rounded-lg max-h-[40vh] overflow-y-auto">
                <PrefectureSelectionContent />
              </div>
            </div>

            {/* Mobile Date Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
                <span className="font-medium">期間を選択</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "全期間" },
                  { value: "week", label: "過去1週間" },
                  { value: "month", label: "過去1ヶ月" },
                  { value: "3months", label: "過去3ヶ月" },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={dateRange === value ? "default" : "outline"}
                    className={dateRange === value ? "bg-orange-600 hover:bg-orange-700" : ""}
                    onClick={() => onDateRangeChange(value as DateRange)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 mt-4"
              onClick={() => setMobileFilterOpen(false)}
            >
              {sightingsCount !== undefined ? `${sightingsCount.toLocaleString()}件を表示` : "適用"}
            </Button>
          </SheetContent>
        </Sheet>

        {/* Mobile Quick Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{getPrefectureDisplayText()}</span>
          <span>•</span>
          <span>{getDateRangeDisplayText()}</span>
          {sightingsCount !== undefined && (
            <>
              <span>•</span>
              <span className="font-medium text-orange-600">{sightingsCount.toLocaleString()}件</span>
            </>
          )}
        </div>
      </div>

      {/* Desktop Filter */}
      <div className="hidden sm:flex container flex-wrap items-center gap-4">
        {/* Prefecture Filter - Multiple Selection */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">地域:</span>
          <Popover open={prefecturePopoverOpen} onOpenChange={setPrefecturePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="min-w-[140px] justify-between text-left font-normal"
              >
                <span className="truncate">{getPrefectureDisplayText()}</span>
                <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start">
              <PrefectureSelectionContent />
              <div className="p-2 border-t">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setPrefecturePopoverOpen(false)}
                >
                  適用
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">期間:</span>
          <Select 
            value={dateRange} 
            onValueChange={(value) => {
              onDateRangeChange(value as DateRange);
              if (value === "custom") {
                setDatePopoverOpen(true);
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue>{getDateRangeDisplayText()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全期間</SelectItem>
              <SelectItem value="week">過去1週間</SelectItem>
              <SelectItem value="month">過去1ヶ月</SelectItem>
              <SelectItem value="3months">過去3ヶ月</SelectItem>
              <SelectItem value="custom">カスタム期間</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Custom Date Range Picker */}
          {dateRange === "custom" && (
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {customDateRange.from && customDateRange.to ? (
                    `${format(customDateRange.from, "yyyy/M/d")} - ${format(customDateRange.to, "yyyy/M/d")}`
                  ) : (
                    "日付を選択"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">開始日</p>
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) => onCustomDateRangeChange({ ...customDateRange, from: date })}
                        locale={ja}
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">終了日</p>
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) => onCustomDateRangeChange({ ...customDateRange, to: date })}
                        locale={ja}
                        disabled={(date) => 
                          date > new Date() || 
                          (customDateRange.from ? date < customDateRange.from : false)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button 
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => setDatePopoverOpen(false)}
                      disabled={!customDateRange.from || !customDateRange.to}
                    >
                      適用
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Sightings Count */}
        {sightingsCount !== undefined && (
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {sightingsCount.toLocaleString()}件の出没情報
          </div>
        )}
      </div>
    </div>
  );
}
