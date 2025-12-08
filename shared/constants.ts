/**
 * Shared constants used across the application
 */

/**
 * List of all prefectures in Japan where bear sightings may occur
 */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

/**
 * Types of bears found in Japan
 */
export const BEAR_TYPES = ["ツキノワグマ", "ヒグマ", "不明"] as const;

/**
 * Date range options for filtering sightings
 */
export const DATE_RANGE_DAYS = {
  week: 7,
  month: 30,
  threeMonths: 90,
} as const;

/**
 * Validation constraints
 */
export const VALIDATION = {
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  DESCRIPTION_MAX_LENGTH: 1000,
  CITY_MAX_LENGTH: 100,
  LOCATION_MAX_LENGTH: 200,
} as const;

/**
 * Source types for bear sightings
 */
export const SOURCE_TYPES = ["official", "user"] as const;

/**
 * Sighting status options
 */
export const SIGHTING_STATUS = ["pending", "approved", "rejected"] as const;
