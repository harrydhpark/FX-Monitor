"""
services/parser_service.py
Parses internal official exchange rate announcement texts (tab/space/CSV copied from Excel or Outlook).
Extracts monthly actuals, daily records, cumulative averages, and forecasts for all 8 currencies.
"""
import re
from datetime import datetime

CURRENCIES_ORDER = ["EUR", "GBP", "CZK", "HUF", "PLN", "RON", "CHF", "KRW"]

def parse_official_announcement_text(raw_text: str) -> dict:
    """
    Parses raw pasted text from the official daily/monthly monitoring table.
    Returns:
    {
        "status": "success",
        "currencies": ["EUR", "GBP", ...],
        "monthly_averages": { "EUR": {"1": 1.174, ...}, ... },
        "daily_records": { "EUR": [{"date": "2026-09-01", "rate": 1.161}, ...], ... },
        "cumulative_averages": { "EUR": 1.160, ... },
        "month_end_forecast": { "EUR": 1.162, ... },
        "moving_rates": { "8": {...}, "9": {...} },
        "latest_daily_date": "2026-09-04",
        "detected_rows_count": 14
    }
    """
    lines = [l.strip() for l in raw_text.strip().splitlines() if l.strip()]
    if not lines:
        return {"status": "error", "message": "입력된 텍스트가 없습니다."}

    currencies = list(CURRENCIES_ORDER)
    
    monthly_averages = {c: {} for c in currencies}
    daily_records = {c: [] for c in currencies}
    cumulative_averages = {}
    month_end_forecast = {}
    moving_rates = {}
    latest_daily_date = None

    detected_rows = 0

    for line in lines:
        # Normalize delimiters (tabs, commas, multiple spaces)
        parts = re.split(r'[\t,|]+|\s{2,}', line)
        parts = [p.strip().replace(',', '') for p in parts if p.strip()]
        if not parts:
            continue

        row_label = parts[0]
        
        # Check header
        if "EUR" in line and "GBP" in line:
            # Custom currency header detected
            header_currs = []
            for p in parts[1:]:
                c_clean = p.upper().replace('/USD', '').replace('USD/', '').strip()
                if c_clean in CURRENCIES_ORDER:
                    header_currs.append(c_clean)
            if len(header_currs) >= 4:
                currencies = header_currs
            continue

        values = []
        for p in parts[1:]:
            val_clean = p.replace('%', '').replace('△', '-').replace('▲', '')
            try:
                values.append(float(val_clean))
            except ValueError:
                pass

        if not values or len(values) < len(currencies):
            # Try splitting by single space if tabs weren't used
            space_parts = line.split()
            if len(space_parts) > len(currencies):
                row_label = space_parts[0]
                values = []
                for p in space_parts[1:]:
                    val_clean = p.replace(',', '').replace('%', '').replace('△', '-').replace('▲', '')
                    try:
                        values.append(float(val_clean))
                    except ValueError:
                        pass

        if len(values) < len(currencies):
            continue

        detected_rows += 1

        # 1. Monthly actuals: e.g. "1월 실적", "1월", "01월 실적"
        m_match = re.match(r'(\d+)월\s*(?:실적)?', row_label)
        if m_match and "이동" not in row_label and "환율" not in row_label:
            month_num = str(int(m_match.group(1)))
            for idx, c in enumerate(currencies):
                if idx < len(values):
                    monthly_averages[c][month_num] = values[idx]
            continue

        # 2. Moving rates: e.g. "8월차 이동", "9월차 이동"
        move_match = re.match(r'(\d+)월차\s*이동', row_label)
        if move_match:
            move_m = str(int(move_match.group(1)))
            moving_rates[move_m] = {currencies[i]: values[i] for i in range(len(currencies)) if i < len(values)}
            continue

        # 3. Daily actuals: e.g. "20260901", "2026-09-01", "0901"
        d_match = re.match(r'(?:2026)?(\d{2})(\d{2})', row_label.replace('-', ''))
        if d_match and len(row_label.replace('-', '')) in [4, 8]:
            m_part = d_match.group(1)
            d_part = d_match.group(2)
            formatted_date = f"2026-{m_part}-{d_part}"
            latest_daily_date = formatted_date
            for idx, c in enumerate(currencies):
                if idx < len(values):
                    daily_records[c].append({
                        "date": formatted_date,
                        "rate": values[idx]
                    })
            continue

        # 4. Cumulative average: "누적 평균", "누적평균"
        if "누적" in row_label and "평균" in row_label:
            for idx, c in enumerate(currencies):
                if idx < len(values):
                    cumulative_averages[c] = values[idx]
            continue

        # 5. Month-end forecast: "월말 예상", "월말예상", "월말"
        if "월말" in row_label and "예상" in row_label:
            for idx, c in enumerate(currencies):
                if idx < len(values):
                    month_end_forecast[c] = values[idx]
            continue

    if detected_rows == 0:
        return {"status": "error", "message": "유효한 환율 표 행을 감지하지 못했습니다. 형식을 확인해 주세요."}

    return {
        "status": "success",
        "currencies": currencies,
        "monthly_averages": monthly_averages,
        "daily_records": daily_records,
        "cumulative_averages": cumulative_averages,
        "month_end_forecast": month_end_forecast,
        "moving_rates": moving_rates,
        "latest_daily_date": latest_daily_date,
        "detected_rows_count": detected_rows
    }
