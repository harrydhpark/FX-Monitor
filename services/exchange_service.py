import os
import json
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
from fastapi import HTTPException

def generate_mock_data(currency: str, currency_map: dict, real_rates_file: str) -> dict:
    """Generates realistic historical and daily exchange rates for 2026, falling back to real_rates.json template."""
    monthly_records = []
    daily_records = []
    
    baselines = {
        "EUR": 1.1582,
        "GBP": 1.3404,
        "CZK": 20.8837,
        "HUF": 305.7940,
        "PLN": 3.6607,
        "RON": 4.5248,
        "CHF": 0.7929,
        "KRW": 1525.0000
    }
    
    has_real_file = False
    if os.path.exists(real_rates_file):
        try:
            with open(real_rates_file, "r", encoding="utf-8") as f:
                real_data = json.load(f)
            if currency in real_data:
                info = real_data[currency]
                has_real_file = True
                for m_str, rate in info.get("monthly_averages", {}).items():
                    m_int = int(m_str)
                    monthly_records.append({
                        "label": f"2026년 {m_int:02d}월 평균",
                        "date": f"2026-{m_int:02d}-01",
                        "type": "monthly_avg",
                        "rate": float(rate)
                    })
                for key in ["june_daily", "july_daily"]:
                    for r in info.get(key, []):
                        daily_records.append({
                            "label": r["date"],
                            "date": r["date"],
                            "type": "daily",
                            "rate": float(r["rate"])
                        })
        except Exception as e:
            print(f"Error loading real_rates.json: {e}")
            
    if not has_real_file:
        base_rate = baselines.get(currency, 1.0)
        monthly_multipliers = {
            "EUR": {1: 1.0134, 2: 1.0212, 3: 0.9987, 4: 1.0091, 5: 1.0086},
            "GBP": {1: 1.0087, 2: 1.0137, 3: 0.9959, 4: 1.0023, 5: 1.0067},
            "CZK": {1: 0.9891, 2: 0.9814, 3: 1.0102, 4: 0.9986, 5: 0.9962},
            "HUF": {1: 1.0688, 2: 1.0459, 3: 1.0961, 4: 1.0345, 5: 1.0020},
            "PLN": {1: 0.9797, 2: 0.9736, 3: 1.0071, 4: 0.9936, 5: 0.9915},
            "RON": {1: 0.9579, 2: 0.9510, 3: 0.9718, 4: 0.9623, 5: 0.9876},
            "CHF": {1: 0.9966, 2: 0.9747, 3: 0.9911, 4: 0.9946, 5: 0.9877},
            "KRW": {1: 0.9530, 2: 0.9486, 3: 0.9738, 4: 0.9734, 5: 0.9755}
        }.get(currency, {1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0})
        
        for m in range(1, 6):
            mult = monthly_multipliers.get(m, 1.0)
            monthly_records.append({
                "label": f"2026년 {m:02d}월 평균",
                "date": f"2026-{m:02d}-01",
                "type": "monthly_avg",
                "rate": round(base_rate * mult, 6)
            })
            
    now_date = datetime.now()
    current_year = now_date.year
    current_month = now_date.month
    current_day = now_date.day
    
    daily_records.sort(key=lambda x: x["date"])
    last_rate = daily_records[-1]["rate"] if daily_records else (baselines.get(currency, 1.0) if not has_real_file else 1.0)
    
    start_year = 2026
    start_month = 6
    
    simulated_daily = []
    y = start_year
    m = start_month
    
    while y < current_year or (y == current_year and m <= current_month):
        is_curr_m = (y == current_year and m == current_month)
        if m == 12:
            next_m_first = datetime(y + 1, 1, 1)
        else:
            next_m_first = datetime(y, m + 1, 1)
        last_day = (next_m_first - timedelta(days=1)).day
        limit_day = current_day if is_curr_m else last_day
        
        month_rates = []
        month_daily = []
        
        for d in range(1, limit_day + 1):
            try:
                date_obj = datetime(y, m, d)
            except ValueError:
                continue
            date_str = date_obj.strftime("%Y-%m-%d")
            
            existing = next((r for r in daily_records if r["date"] == date_str), None)
            if existing:
                rate_val = existing["rate"]
                last_rate = rate_val
            elif date_obj.weekday() >= 5:
                rate_val = last_rate
            else:
                day_seed = (d * 17) % 31
                change_pct = (day_seed - 15) * 0.001
                rate_val = last_rate * (1.0 + change_pct)
                last_rate = rate_val
                
            month_rates.append(rate_val)
            month_daily.append({
                "label": date_str,
                "date": date_str,
                "type": "daily",
                "rate": round(rate_val, 6)
            })
            
        if is_curr_m:
            simulated_daily = month_daily
        else:
            if month_rates:
                avg_rate = sum(month_rates) / len(month_rates)
                label_str = f"{y}년 {m:02d}월 평균"
                date_str = f"{y}-{m:02d}-01"
                if not any(r["label"] == label_str for r in monthly_records):
                    monthly_records.append({
                        "label": label_str,
                        "date": date_str,
                        "type": "monthly_avg",
                        "rate": round(avg_rate, 6)
                    })
                    
        m += 1
        if m > 12:
            m = 1
            y += 1
            
    all_records = monthly_records + simulated_daily
    all_records.sort(key=lambda x: x["date"])
    
    curr_rates = [r["rate"] for r in simulated_daily]
    cum_avg = sum(curr_rates) / len(curr_rates) if curr_rates else last_rate
    
    return {
        "currency": currency,
        "name": currency_map[currency]["name"],
        "symbol": currency_map[currency]["symbol"],
        "format": currency_map[currency]["format"],
        "records": all_records,
        "cumulative_average": round(cum_avg, 6)
    }

def get_exchange_rates(currency: str, currency_map: dict, data_cache: dict, cache_expire_minutes: int, real_rates_file: str) -> dict:
    """Fetches exchange rates from Yahoo Finance, falling back to mock generator on error."""
    now = datetime.now()
    
    if currency in data_cache:
        cache_time = data_cache[currency]["timestamp"]
        if now - cache_time < timedelta(minutes=cache_expire_minutes):
            return data_cache[currency]["data"]
            
    ticker_info = currency_map.get(currency)
    if not ticker_info:
        raise HTTPException(status_code=404, detail="Currency not supported")
        
    ticker = ticker_info["ticker"]
    baselines = {
        "EUR": 1.1582, "GBP": 1.3404, "CZK": 20.8837, "HUF": 305.7940,
        "PLN": 3.6607, "RON": 4.5248, "CHF": 0.7929, "KRW": 1525.0000
    }
    
    try:
        tomorrow = now + timedelta(days=1)
        end_date_str = tomorrow.strftime("%Y-%m-%d")
        
        ticker_obj = yf.Ticker(ticker)
        df = ticker_obj.history(start="2026-01-01", end=end_date_str)
        
        if df.empty:
            raise ValueError("No historical data found from yfinance")
            
        df = df.reset_index()
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        df_2026 = df[df['Date'].dt.year == 2026]
        
        if df_2026.empty:
            raise ValueError("No 2026 data in yfinance response")
            
        records = []
        current_month = now.month
        current_year = now.year
        
        official_monthly = {}
        official_daily = {}
        if os.path.exists(real_rates_file):
            try:
                with open(real_rates_file, "r", encoding="utf-8") as f:
                    real_data = json.load(f)
                if currency in real_data:
                    info = real_data[currency]
                    for m_str, rate in info.get("monthly_averages", {}).items():
                        official_monthly[int(m_str)] = float(rate)
                    for key in ["june_daily", "july_daily"]:
                        for r in info.get(key, []):
                            official_daily[r["date"]] = float(r["rate"])
            except Exception as e:
                print(f"Error reading real_rates.json in get_exchange_rates: {e}")

        df_past = df_2026[df_2026['Date'].dt.month < current_month]
        for month in range(1, current_month):
            if month in official_monthly:
                val = official_monthly[month]
            else:
                if not df_past.empty:
                    df_month = df_past[df_past['Date'].dt.month == month]
                    if not df_month.empty:
                        val = float(df_month['Close'].mean())
                    else:
                        val = baselines.get(currency, 1.0)
                else:
                    val = baselines.get(currency, 1.0)
                    
            records.append({
                "label": f"{current_year}년 {month:02d}월 평균",
                "date": f"{current_year}-{month:02d}-01",
                "type": "monthly_avg",
                "rate": val
            })
                    
        df_current = df_2026[df_2026['Date'].dt.month == current_month]
        current_rates = []
        fetched_rates = {}
        if not df_current.empty:
            for idx, row in df_current.iterrows():
                d_str = row['Date'].strftime("%Y-%m-%d")
                fetched_rates[d_str] = float(row['Close'])
                
        last_rate = None
        if not df_past.empty:
            last_rate = float(df_past.iloc[-1]['Close'])
        if last_rate is None:
            sorted_dates = sorted(fetched_rates.keys())
            if sorted_dates:
                last_rate = fetched_rates[sorted_dates[0]]
            else:
                last_rate = baselines.get(currency, 1.0)
                
        limit_day = now.day
        for d in range(1, limit_day + 1):
            try:
                date_obj = datetime(current_year, current_month, d)
            except ValueError:
                continue
            date_str = date_obj.strftime("%Y-%m-%d")
            
            if date_str in official_daily:
                rate_val = official_daily[date_str]
                last_rate = rate_val
            elif date_str in fetched_rates:
                rate_val = fetched_rates[date_str]
                last_rate = rate_val
            else:
                rate_val = last_rate
                
            records.append({
                "label": date_str,
                "date": date_str,
                "type": "daily",
                "rate": rate_val
            })
            current_rates.append(rate_val)
                    
        records.sort(key=lambda x: x["date"])
        cum_avg = sum(current_rates) / len(current_rates) if current_rates else 0.0
        
        result = {
            "currency": currency,
            "name": ticker_info["name"],
            "symbol": ticker_info["symbol"],
            "format": ticker_info["format"],
            "records": records,
            "cumulative_average": float(cum_avg)
        }
        
        data_cache[currency] = {
            "timestamp": now,
            "data": result
        }
        return result
        
    except Exception as e:
        print(f"yfinance failed for {currency}: {e}. Falling back to Mock Engine.")
        mock_data = generate_mock_data(currency, currency_map, real_rates_file)
        data_cache[currency] = {
            "timestamp": now,
            "data": mock_data
        }
        return mock_data
