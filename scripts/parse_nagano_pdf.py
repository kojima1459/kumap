#!/usr/bin/env python3.11
"""
長野県のクマ出没情報PDFを解析してJSONに変換するスクリプト
"""
import pdfplumber
import json
import re
from datetime import datetime
import sys

def parse_nagano_pdf(pdf_path):
    """
    長野県のPDFファイルを解析してクマ出没情報を抽出
    
    Args:
        pdf_path: PDFファイルのパス
        
    Returns:
        list: 出没情報のリスト
    """
    sightings = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # テーブルを抽出
            tables = page.extract_tables()
            
            if not tables:
                # テーブルがない場合はテキストを抽出
                text = page.extract_text()
                print(f"Page {page_num} - No tables found. Text preview:")
                print(text[:500] if text else "No text found")
                continue
            
            for table_idx, table in enumerate(tables):
                print(f"\n=== Page {page_num}, Table {table_idx + 1} ===")
                print(f"Rows: {len(table)}, Columns: {len(table[0]) if table else 0}")
                
                # ヘッダー行を探す
                header_row = None
                data_start_row = 0
                
                for idx, row in enumerate(table):
                    if row and any(cell and ('日' in str(cell) or '市町村' in str(cell) or '地区' in str(cell)) for cell in row):
                        header_row = row
                        data_start_row = idx + 1
                        print(f"Header found at row {idx}: {header_row}")
                        break
                
                if not header_row:
                    print("No header found, using first row as header")
                    header_row = table[0] if table else []
                    data_start_row = 1
                
                # データ行を処理
                for row_idx in range(data_start_row, len(table)):
                    row = table[row_idx]
                    
                    if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                        continue
                    
                    # デバッグ出力
                    print(f"Row {row_idx}: {row}")
                    
                    try:
                        # 日付、市町村、地区、目撃状況などを抽出
                        # PDFの構造に応じて調整が必要
                        sighting = {
                            'prefecture': '長野県',
                            'source_type': 'official',
                            'raw_data': row,
                            'page': page_num,
                            'table': table_idx + 1,
                            'row': row_idx
                        }
                        
                        # 長野県PDFの列構造: [№, 出没月日, 市町村名, 区分, 目撃・痕跡別, クマの大きさ, 頭数, 状況]
                        if len(row) >= 8:
                            sighting['number'] = str(row[0]).strip() if row[0] else ''
                            sighting['date_str'] = str(row[1]).strip() if row[1] else ''  # 2025/12/4形式
                            sighting['municipality'] = str(row[2]).strip() if row[2] else ''  # 市町村名
                            sighting['area_type'] = str(row[3]).strip() if row[3] else ''  # 里地/林内
                            sighting['sighting_type'] = str(row[4]).strip() if row[4] else ''  # 目撃/痕跡
                            sighting['bear_size'] = str(row[5]).strip() if row[5] else ''  # 成獣/幼獣/親子
                            sighting['bear_count'] = str(row[6]).strip() if row[6] else ''  # １頭/２頭
                            sighting['details'] = str(row[7]).strip() if row[7] else ''  # 状況詳細
                            
                            # 市町村名から都道府県コードを推定
                            sighting['location'] = f"{sighting['municipality']}"
                        elif len(row) >= 3:
                            # フォールバック: 列数が少ない場合
                            sighting['date_str'] = str(row[0]).strip() if row[0] else ''
                            sighting['municipality'] = str(row[1]).strip() if row[1] else ''
                            sighting['location'] = str(row[2]).strip() if row[2] else ''
                            
                            if len(row) >= 4:
                                sighting['details'] = str(row[3]).strip() if row[3] else ''
                            
                            if len(row) >= 5:
                                sighting['remarks'] = str(row[4]).strip() if row[4] else ''
                        
                        sightings.append(sighting)
                        
                    except Exception as e:
                        print(f"Error processing row {row_idx}: {e}")
                        continue
    
    return sightings

def main():
    if len(sys.argv) < 2:
        print("Usage: python3.11 parse_nagano_pdf.py <pdf_path> [output_json_path]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else pdf_path.replace('.pdf', '_parsed.json')
    
    print(f"Parsing PDF: {pdf_path}")
    sightings = parse_nagano_pdf(pdf_path)
    
    print(f"\n=== Summary ===")
    print(f"Total sightings extracted: {len(sightings)}")
    
    # JSONに保存
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sightings, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to: {output_path}")
    
    # サンプルを表示
    if sightings:
        print(f"\n=== Sample (first 3 records) ===")
        for i, sighting in enumerate(sightings[:3], 1):
            print(f"\n{i}. {json.dumps(sighting, ensure_ascii=False, indent=2)}")

if __name__ == '__main__':
    main()
