"""
services/hybrid_rate_service.py
Combines irregular internal official actual rates with external real-time ECB rates.
Stitches official history (up to cut-off date) + live ECB daily rates (cut-off + 1 to today).
"""
import os
import json
from datetime import datetime, timedelta
from services.ecb_service import fetch_ecb_time_series

def get_hybrid_exchange_rates(
    currency: str,
    currency_map: dict,
    real_rates_file: str,
    simulated_today: datetime = None
) -> dict:
    """
    Builds hybrid rate dataset for a given currency.
    - 1~N Monthly Averages: From official actuals (type='monthly_avg')
    - 1~T_official Daily Rates: From official actuals (type='daily', origin='official', badge='공식 실적')
    - T_official+1~Today Daily Rates: From ECB API (type='daily', origin='ecb', badge='ECB 실시간')
    - Recalculates combined cumulative average.
    """
    ticker_info = currency_map.get(currency)
    if not ticker_info:
        raise ValueError(f"Unsupported currency: {currency}")

    now = simulated_today or datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    records = []
    official_daily_records = []
    official_monthly = {}
    official_cum_avg = None
    cutoff_date_str = None

    # 1. Load official actuals from real_rates.json
    if os.path.exists(real_rates_file):
        try:
            with open(real_rates_file, "r", encoding="utf-8") as f:
                real_data = json.load(f)
            if currency in real_data:
                cdata = real_data[currency]
                official_cum_avg = cdata.get("cumulative_average")
                for m_str, rate in cdata.get("monthly_averages", {}).items():
                    m_int = int(m_str)
                    official_monthly[m_int] = float(rate)
                
                # Daily records
                for key in ["september_daily", "july_daily", "june_daily", "daily"]:
                    for r in cdata.get(key, []):
                        official_daily_records.append({
                            "label": r["date"],
                            "date": r["date"],
                            "type": "daily",
                            "origin": "official",
                            "badge": "공식 실적",
                            "rate": float(r["rate"])
                        })
        except Exception as e:
            print(f"Error loading {real_rates_file}: {e}")

    # Build monthly avg records
    current_year = now.year
    for m_int in sorted(official_monthly.keys()):
        records.append({
            "label": f"{current_year}년 {m_int:02d}월 평균",
            "date": f"{current_year}-{m_int:02d}-01",
            "type": "monthly_avg",
            "origin": "official",
            "badge": "월간 평균",
            "rate": official_monthly[m_int]
        })

    # Sort official daily records
    official_daily_records.sort(key=lambda x: x["date"])
    
    # Identify official cut-off date
    if official_daily_records:
        cutoff_date_str = official_daily_records[-1]["date"]
        records.extend(official_daily_records)

    # 2. Check if gap exists between cut-off date and today
    external_records = []
    if cutoff_date_str:
        cutoff_dt = datetime.strptime(cutoff_date_str, "%Y-%m-%d")
        next_day_dt = cutoff_dt + timedelta(days=1)
        if next_day_dt <= now:
            start_str = next_day_dt.strftime("%Y-%m-%d")
            end_str = today_str
            try:
                ecb_data = fetch_ecb_time_series(start_str, end_str)
                for d_str in sorted(ecb_data.keys()):
                    if currency in ecb_data[d_str]:
                        rate_val = ecb_data[d_str][currency]
                        rec = {
                            "label": d_str,
                            "date": d_str,
                            "type": "daily",
                            "origin": "ecb",
                            "badge": "ECB 실시간",
                            "rate": float(rate_val)
                        }
                        external_records.append(rec)
                        records.append(rec)
            except Exception as ex:
                print(f"Failed to fetch ECB rates in hybrid service: {ex}")

    # 3. Calculate Cumulative Average
    current_month_daily = [r for r in records if r["type"] == "daily" and r["date"].startswith(f"{current_year}-{now.month:02d}")]
    if external_records:
        # If we have live external days beyond official cutoff, calculate combined average
        rates_list = [r["rate"] for r in current_month_daily]
        cum_avg = sum(rates_list) / len(rates_list) if rates_list else (official_cum_avg or 0.0)
    else:
        # If within official cutoff, use official cumulative average
        cum_avg = official_cum_avg if official_cum_avg is not None else (
            sum(r["rate"] for r in current_month_daily) / len(current_month_daily) if current_month_daily else 0.0
        )

    records.sort(key=lambda x: x["date"])

    return {
        "currency": currency,
        "name": ticker_info["name"],
        "symbol": ticker_info["symbol"],
        "format": ticker_info["format"],
        "records": records,
        "cumulative_average": round(float(cum_avg), 6 if currency != "KRW" else 1),
        "official_cutoff_date": cutoff_date_str,
        "has_external_data": len(external_records) > 0
    }
