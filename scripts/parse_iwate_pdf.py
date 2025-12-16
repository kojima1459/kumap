#!/usr/bin/env python3.11
# -*- coding: utf-8 -*-
"""
岩手県クマ出没情報PDF解析スクリプト
"""

import pdfplumber
import json
import sys
from pathlib import Path

def parse_iwate_pdf(pdf_path):
    """岩手県のクマ出没情報PDFを解析"""
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"Processing page {page_num}...", file=sys.stderr)
            
            # テーブルを抽出
            tables = page.extract_tables()
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                # ヘッダー行を確認
                header = table[0]
                print(f"Header: {header}", file=sys.stderr)
                
                # データ行を処理
                for row in table[1:]:
                    if not row or len(row) < 3:
                        continue
                    
                    # 空行をスキップ
                    if all(cell is None or str(cell).strip() == '' for cell in row):
                        continue
                    
                    try:
                        # 岩手県PDFの列構造を推定（実際のPDFを確認してから調整）
                        # 仮定: [番号, 日付, 市町村, 場所, 詳細, ...]
                        record = {
                            'date_str': str(row[1]).strip() if len(row) > 1 and row[1] else '',
                            'municipality': str(row[2]).strip() if len(row) > 2 and row[2] else '',
                            'location': str(row[3]).strip() if len(row) > 3 and row[3] else '',
                            'details': str(row[4]).strip() if len(row) > 4 and row[4] else '',
                        }
                        
                        # 日付が有効な場合のみ追加
                        if record['date_str'] and record['municipality']:
                            results.append(record)
                            print(f"Extracted: {record}", file=sys.stderr)
                    
                    except Exception as e:
                        print(f"Error processing row: {row}, error: {e}", file=sys.stderr)
                        continue
    
    return results

if __name__ == '__main__':
    pdf_path = Path(__file__).parent.parent / 'data' / 'pdfs' / 'iwate_shutsubotsu.pdf'
    
    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    results = parse_iwate_pdf(pdf_path)
    
    print(f"Total records extracted: {len(results)}", file=sys.stderr)
    
    # JSON形式で出力
    print(json.dumps(results, ensure_ascii=False, indent=2))
