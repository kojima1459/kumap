/**
 * 市町村名から緯度経度を取得するgeocoding関数
 */
import { makeRequest } from "./_core/map";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

/**
 * 市町村名から緯度経度を取得
 * @param address 市町村名（例: "長野県野沢温泉村"）
 * @returns 緯度経度と整形された住所
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await makeRequest("/maps/api/geocode/json", {
      address: address,
      language: "ja",
      region: "jp",
    }) as any;

    if (response.status !== "OK" || !response.results || response.results.length === 0) {
      console.error(`Geocoding failed for address: ${address}`, response);
      return null;
    }

    const result = response.results[0];
    const location = result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error(`Error geocoding address: ${address}`, error);
    return null;
  }
}

/**
 * 複数の住所を一括でgeocoding（レート制限対策で遅延を入れる）
 * @param addresses 住所のリスト
 * @param delayMs リクエスト間の遅延（ミリ秒）
 * @returns geocoding結果のマップ（address -> GeocodeResult）
 */
export async function batchGeocodeAddresses(
  addresses: string[],
  delayMs: number = 200
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();

  for (const address of addresses) {
    const result = await geocodeAddress(address);
    if (result) {
      results.set(address, result);
    }

    // レート制限対策で遅延
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
