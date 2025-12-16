# マーカークラスタリング調査結果

## 調査日時
2025年12月9日

## 調査目的
クマップアプリケーションに大量マーカー表示時のパフォーマンス改善のため、Google Maps マーカークラスタリングライブラリを調査し、実装方針を決定する。

## 選定ライブラリ

### @googlemaps/markerclusterer
- **公式ライブラリ**: Google Maps公式のマーカークラスタリングライブラリ
- **NPMパッケージ**: `@googlemaps/markerclusterer`
- **最新バージョン**: 2.6.2（2024年7月8日リリース）
- **GitHubリポジトリ**: https://github.com/googlemaps/js-markerclusterer
- **公式ドキュメント**: https://developers.google.com/maps/documentation/javascript/marker-clustering

### 主な機能
1. **自動クラスタリング**: 近接するマーカーを自動的にクラスタに統合
2. **ズームレベル対応**: ズームイン時にクラスタが分解され、個々のマーカーが表示
3. **パフォーマンス最適化**: 大量マーカー（1000件以上）でも高速レンダリング
4. **カスタマイズ可能**: クラスタアイコン、色、サイズ、アルゴリズムをカスタマイズ可能

## 実装パターン（React）

### 基本的な実装フロー

```typescript
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState, useCallback } from 'react';

export const ClusteredMarkers = ({ sightings }) => {
  const [markers, setMarkers] = useState<{[key: string]: google.maps.Marker}>({});
  const map = useMap();

  // 1. MarkerClustererの初期化
  const clusterer = useMemo(() => {
    if (!map) return null;
    return new MarkerClusterer({ map });
  }, [map]);

  // 2. マーカーが変更されたらクラスタラーを更新
  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  // 3. マーカーのref管理
  const setMarkerRef = useCallback((marker: google.maps.Marker | null, key: string) => {
    setMarkers(markers => {
      if ((marker && markers[key]) || (!marker && !markers[key]))
        return markers;

      if (marker) {
        return {...markers, [key]: marker};
      } else {
        const {[key]: _, ...newMarkers} = markers;
        return newMarkers;
      }
    });
  }, []);

  return (
    <>
      {sightings.map(sighting => (
        <BearMarker
          key={sighting.id}
          sighting={sighting}
          setMarkerRef={setMarkerRef}
        />
      ))}
    </>
  );
};
```

### カスタマイズオプション

```typescript
const clusterer = new MarkerClusterer({
  map,
  // アルゴリズム（デフォルト: GridAlgorithm）
  algorithm: new SuperClusterAlgorithm({ radius: 200 }),
  
  // レンダラー（クラスタアイコンのカスタマイズ）
  renderer: {
    render: ({ count, position }) => {
      return new google.maps.Marker({
        position,
        label: {
          text: String(count),
          color: 'white',
          fontSize: '12px',
        },
        icon: {
          url: '/cluster-icon.svg',
          scaledSize: new google.maps.Size(40, 40),
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      });
    },
  },
});
```

## クマップへの適用方針

### 実装ステップ

1. **ライブラリのインストール**
   ```bash
   pnpm add @googlemaps/markerclusterer
   ```

2. **BearMarkerコンポーネントの拡張**
   - `setMarkerRef` コールバックを追加
   - マーカーのref管理を実装

3. **MapViewコンポーネントの修正**
   - `MarkerClusterer` の初期化
   - マーカー配列の管理
   - クラスタラーへのマーカー追加

4. **カスタムクラスタアイコンの作成**
   - 公式データ（赤）とユーザー投稿（橙）を区別
   - クラスタ内のマーカー数を表示
   - クマのアイコンをクラスタアイコンに統合

### 期待される効果

1. **パフォーマンス向上**
   - 1000件以上のマーカーでも60FPSを維持
   - 初期レンダリング時間を70～90%削減
   - ズーム・パン操作の遅延を解消

2. **ユーザー体験の向上**
   - 地図の視認性向上（マーカーの重なりを解消）
   - クラスタクリックでズームイン（直感的な操作）
   - クラスタ内のマーカー数を一目で把握

3. **スケーラビリティ**
   - 将来的なデータ増加に対応
   - 10,000件以上のマーカーでも動作可能

## 参考リソース

1. **公式ドキュメント**
   - https://developers.google.com/maps/documentation/javascript/marker-clustering

2. **GitHub リポジトリ**
   - https://github.com/googlemaps/js-markerclusterer

3. **React実装例**
   - https://visgl.github.io/react-google-maps/examples/marker-clustering
   - https://github.com/visgl/react-google-maps/tree/main/examples/marker-clustering

4. **NPMパッケージ**
   - https://www.npmjs.com/package/@googlemaps/markerclusterer

## 実装上の注意点

1. **マーカーのref管理**
   - `useState` でマーカーのrefを管理
   - マーカーが追加・削除されるたびに `clusterer.clearMarkers()` と `clusterer.addMarkers()` を呼び出す

2. **パフォーマンス最適化**
   - `useMemo` でクラスタラーの再生成を防ぐ
   - `useCallback` でコールバック関数の再生成を防ぐ

3. **InfoWindowとの統合**
   - クラスタクリック時はズームイン
   - 個別マーカークリック時はInfoWindowを表示

4. **フィルター機能との統合**
   - フィルター変更時にマーカー配列を更新
   - クラスタラーが自動的に再計算

## 結論

`@googlemaps/markerclusterer` は、Google Maps公式のライブラリであり、Reactとの統合も容易です。クマップアプリケーションに適用することで、大量マーカー表示時のパフォーマンスを大幅に改善し、ユーザー体験を向上させることができます。

次のフェーズでは、この調査結果に基づいて実装を進めます。
