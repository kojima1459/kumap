/**
 * くまっぷ（Xenon）API クライアント
 * 
 * OpenAPI仕様書: https://kumap-xenon.web.app/openapi.yaml
 * ベースURL: https://xgzsccaaaxadvzzsztde.supabase.co/functions/v1
 */

import { ENV } from "./_core/env";

const KUMAP_BASE_URL = "https://xgzsccaaaxadvzzsztde.supabase.co/functions/v1";

// ポイント種別
export type PointKind = "witness" | "trace" | "injury" | "damage";

// ステータス
export type PointStatus = "active" | "inactive" | "draft";

// 目撃情報の状態
export type WitnessState = "adult" | "cub" | "with_cubs";

// 性別
export type Gender = "male" | "female";

// 位置情報
export interface Location {
  lat: number;
  lng: number;
}

// 追加データ
export interface AdditionalData {
  count?: number;
  state?: WitnessState;
  gender?: Gender;
  trace_kind?: string;
}

// ポイントデータ（実際のAPIレスポンス構造）
export interface KumapPoint {
  id: string;
  location: Location;
  name: PointKind;  // "witness", "trace", "injury", "damage"
  output_name: string;  // "クマ目撃" など
  content?: string;
  additional_data?: AdditionalData;
  event_time: string;
  status: PointStatus;
  created_at: string;
  updated_at: string;
  source?: string;  // "青森県" など
  author_name?: string | null;
  author_email?: string | null;
  author_phone?: string | null;
  images: string[];
  prefecture?: string;
  city?: string;
  address?: string;
  postal_code?: string | null;
  tenant_id?: string | null;
  tenant_slug?: string | null;
  tenant_name?: string | null;
}

// 一覧取得リクエスト
export interface ListPointsRequest {
  limit?: number;
  offset?: number;
  event_time_after?: string;
  event_time_before?: string;
  prefecture?: string;
  city?: string;
  point_kind_ids?: PointKind[];
  tenant_id?: string;
  status?: PointStatus;
}

// 一覧取得レスポンス
export interface ListPointsResponse {
  data: KumapPoint[];
  limit: number;
  offset: number;
}

/**
 * くまっぷAPIクライアント
 */
export class KumapClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ENV.kumapApiKey || "";
    this.baseUrl = KUMAP_BASE_URL;
  }

  /**
   * APIリクエストを送信
   */
  private async request<T>(endpoint: string, body: object): Promise<T> {
    if (!this.apiKey) {
      throw new Error("KUMAP_API_KEY is not set");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kumap API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * ポイント一覧を取得
   */
  async listPoints(params: ListPointsRequest = {}): Promise<ListPointsResponse> {
    const defaultParams: ListPointsRequest = {
      limit: 100,
      offset: 0,
      status: "active",
      ...params,
    };

    return this.request<ListPointsResponse>("/api-points-list", defaultParams);
  }

  /**
   * 全ポイントを取得（ページネーション対応）
   */
  async fetchAllPoints(params: Omit<ListPointsRequest, "limit" | "offset"> = {}): Promise<KumapPoint[]> {
    const allPoints: KumapPoint[] = [];
    let offset = 0;
    const limit = 1000; // 最大値

    while (true) {
      const response = await this.listPoints({
        ...params,
        limit,
        offset,
      });

      allPoints.push(...response.data);

      // データがlimit未満なら終了
      if (response.data.length < limit) {
        break;
      }

      offset += limit;
    }

    return allPoints;
  }

  /**
   * 都道府県別にポイントを取得
   */
  async fetchPointsByPrefecture(prefecture: string, params: Omit<ListPointsRequest, "prefecture"> = {}): Promise<KumapPoint[]> {
    return this.fetchAllPoints({
      ...params,
      prefecture,
    });
  }

  /**
   * 日付範囲でポイントを取得
   */
  async fetchPointsByDateRange(startDate: Date, endDate: Date, params: Omit<ListPointsRequest, "event_time_after" | "event_time_before"> = {}): Promise<KumapPoint[]> {
    return this.fetchAllPoints({
      ...params,
      event_time_after: startDate.toISOString(),
      event_time_before: endDate.toISOString(),
    });
  }

  /**
   * 目撃情報のみを取得
   */
  async fetchWitnessPoints(params: Omit<ListPointsRequest, "point_kind_ids"> = {}): Promise<KumapPoint[]> {
    return this.fetchAllPoints({
      ...params,
      point_kind_ids: ["witness"],
    });
  }

  /**
   * APIキーの有効性をテスト
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.listPoints({ limit: 1 });
      return response.data !== undefined;
    } catch (error) {
      console.error("Kumap API connection test failed:", error);
      return false;
    }
  }
}

// デフォルトクライアントインスタンス
export const kumapClient = new KumapClient();
