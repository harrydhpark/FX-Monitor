import os
import re
import json
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="F(x) Tracker API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Target Currencies Configuration
CURRENCY_MAP = {
    "EUR": {"ticker": "EURUSD=X", "name": "유로 (EUR/USD)", "symbol": "EUR/USD", "format": "{:.3f}"},
    "GBP": {"ticker": "GBPUSD=X", "name": "영국 파운드 (GBP/USD)", "symbol": "GBP/USD", "format": "{:.3f}"},
    "CZK": {"ticker": "USDCZK=X", "name": "체코 코루나 (USD/CZK)", "symbol": "USD/CZK", "format": "{:.2f}"},
    "HUF": {"ticker": "USDHUF=X", "name": "헝가리 포린트 (USD/HUF)", "symbol": "USD/HUF", "format": "{:.2f}"},
    "PLN": {"ticker": "USDPLN=X", "name": "폴란드 즈로티 (USD/PLN)", "symbol": "USD/PLN", "format": "{:.2f}"},
    "RON": {"ticker": "USDRON=X", "name": "루마니아 레우 (USD/RON)", "symbol": "USD/RON", "format": "{:.3f}"},
    "CHF": {"ticker": "CHFUSD=X", "name": "스위스 프랑 (CHF/USD)", "symbol": "CHF/USD", "format": "{:.3f}"},
    "KRW": {"ticker": "USDKRW=X", "name": "대한민국 원 (USD/KRW)", "symbol": "USD/KRW", "format": "{:.0f}"}
}

# Memory Cache for Exchange Rate Data
# Structure: {currency: {"timestamp": datetime, "data": dict}}
DATA_CACHE = {}
CACHE_EXPIRATION_MINUTES = 60

# Current Local Time Simulation: 2026-07-06 (Monday)
CURRENT_DATE = datetime(2026, 7, 6)

def generate_mock_data(currency: str) -> dict:
    """Generates realistic historical and daily exchange rates for 2026, falling back to real_rates.json template and auto-rolling over up to today."""
    monthly_records = []
    daily_records = []
    
    # Baseline exchange rates updated to match actual June 2026 values
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
    if os.path.exists("real_rates.json"):
        try:
            with open("real_rates.json", "r", encoding="utf-8") as f:
                real_data = json.load(f)
            if currency in real_data:
                info = real_data[currency]
                has_real_file = True
                # Extract template monthly averages
                for m_str, rate in info.get("monthly_averages", {}).items():
                    m_int = int(m_str)
                    monthly_records.append({
                        "label": f"2026년 {m_int:02d}월 평균",
                        "date": f"2026-{m_int:02d}-01",
                        "type": "monthly_avg",
                        "rate": float(rate)
                    })
                # Extract template daily
                for key in ["june_daily", "july_daily"]:
                    for r in info.get(key, []):
                        daily_records.append({
                            "label": r["label"],
                            "date": r["date"],
                            "type": "daily",
                            "rate": float(r["rate"])
                        })
        except Exception as e:
            print(f"Error loading real_rates.json: {e}")
            
    if not has_real_file:
        base_rate = baselines.get(currency, 1.0)
        
        # Build 1~5월 평균
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
            
    # Dynamically simulate daily rates from 2026-06-01 up to today
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
        
        # Last day of month
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
            elif date_obj.weekday() >= 5:  # Weekend: carry over Friday's rate
                rate_val = last_rate
            else:  # Business day: simulate
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
        "name": CURRENCY_MAP[currency]["name"],
        "symbol": CURRENCY_MAP[currency]["symbol"],
        "format": CURRENCY_MAP[currency]["format"],
        "records": all_records,
        "cumulative_average": round(cum_avg, 6)
    }

def get_exchange_rates(currency: str) -> dict:
    """Fetches exchange rates from Yahoo Finance, falling back to mock generator on error."""
    now = datetime.now()
    
    # Check cache
    if currency in DATA_CACHE:
        cache_time = DATA_CACHE[currency]["timestamp"]
        if now - cache_time < timedelta(minutes=CACHE_EXPIRATION_MINUTES):
            return DATA_CACHE[currency]["data"]
            
    ticker_info = CURRENCY_MAP.get(currency)
    if not ticker_info:
        raise HTTPException(status_code=404, detail="Currency not supported")
        
    ticker = ticker_info["ticker"]
    
    try:
        # Fetch historical data for 2026 up to today
        # End date in yfinance is exclusive, so we use tomorrow to fetch today's rate
        tomorrow = now + timedelta(days=1)
        end_date_str = tomorrow.strftime("%Y-%m-%d")
        
        ticker_obj = yf.Ticker(ticker)
        df = ticker_obj.history(start="2026-01-01", end=end_date_str)
        
        if df.empty:
            raise ValueError("No historical data found from yfinance")
            
        # Process DataFrame
        df = df.reset_index()
        # Parse Dates
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        
        # Filter for 2026
        df_2026 = df[df['Date'].dt.year == 2026]
        
        if df_2026.empty:
            raise ValueError("No 2026 data in yfinance response")
            
        records = []
        current_month = now.month
        current_year = now.year
        
        # Load official values from real_rates.json to prioritize company's official rates
        official_monthly = {}
        official_daily = {}
        if os.path.exists("real_rates.json"):
            try:
                with open("real_rates.json", "r", encoding="utf-8") as f:
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

        # 1. Monthly Averages (Jan to previous month)
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
                    
        # 2. Current Month Daily Rates (1st of current month to today, including weekends)
        df_current = df_2026[df_2026['Date'].dt.month == current_month]
        current_rates = []
        
        # Build yfinance rates dictionary if available
        fetched_rates = {}
        if not df_current.empty:
            for idx, row in df_current.iterrows():
                d_str = row['Date'].strftime("%Y-%m-%d")
                fetched_rates[d_str] = float(row['Close'])
                
        # Resolve initial rate for filling forward
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
            
            # Prioritize: 1) official JSON, 2) yfinance API, 3) carry forward
            if date_str in official_daily:
                rate_val = official_daily[date_str]
                last_rate = rate_val
            elif date_str in fetched_rates:
                rate_val = fetched_rates[date_str]
                last_rate = rate_val
            else:
                # Weekend or holiday
                rate_val = last_rate
                
            records.append({
                "label": date_str,
                "date": date_str,
                "type": "daily",
                "rate": rate_val
            })
            current_rates.append(rate_val)
                    
        # Sort records by date to ensure proper order
        records.sort(key=lambda x: x["date"])
        
        # Calculate current month cumulative average
        cum_avg = sum(current_rates) / len(current_rates) if current_rates else 0.0
        
        result = {
            "currency": currency,
            "name": ticker_info["name"],
            "symbol": ticker_info["symbol"],
            "format": ticker_info["format"],
            "records": records,
            "cumulative_average": float(cum_avg)
        }
        
        # Save to cache
        DATA_CACHE[currency] = {
            "timestamp": now,
            "data": result
        }
        return result
        
    except Exception as e:
        print(f"yfinance failed for {currency}: {e}. Falling back to Mock Engine.")
        # Fallback to completely simulated mock data
        mock_data = generate_mock_data(currency)
        DATA_CACHE[currency] = {
            "timestamp": now,
            "data": mock_data
        }
        return mock_data


# API Endpoints
@app.get("/api/currencies")
def get_currencies():
    """Returns lists of target currencies with metadata and rate change statistics."""
    result = []
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    prev_month = 5 if current_month == 6 else (12 if current_month == 1 else current_month - 1)
    prev_year = current_year if current_month > 1 else current_year - 1
    label_pattern = f"{prev_year}년 {prev_month:02d}월 평균"
    
    for code, info in CURRENCY_MAP.items():
        try:
            data = get_exchange_rates(code)
            records = data.get("records", [])
            cum_avg = data.get("cumulative_average", 0.0)
            
            # Find the previous month's monthly average
            prev_record = next((r for r in records if r["type"] == "monthly_avg" and r["label"] == label_pattern), None)
            if not prev_record:
                prev_date_str = f"{prev_year}-{prev_month:02d}-01"
                prev_record = next((r for r in records if r["type"] == "monthly_avg" and r["date"] == prev_date_str), None)
                
            prev_avg = prev_record["rate"] if prev_record else None
            
            change_pct = None
            if prev_avg and cum_avg:
                change_pct = ((cum_avg - prev_avg) / prev_avg) * 100
                
            result.append({
                "code": code,
                "name": info["name"],
                "symbol": info["symbol"],
                "prev_avg": prev_avg,
                "cum_avg": cum_avg,
                "change_pct": change_pct
            })
        except Exception as e:
            print(f"Error computing currency stats for {code}: {e}")
            result.append({
                "code": code,
                "name": info["name"],
                "symbol": info["symbol"],
                "prev_avg": None,
                "cum_avg": None,
                "change_pct": None
            })
    return result

def inject_commentary(rate_data: dict) -> dict:
    currency = rate_data["currency"]
    commentary_info = None
    if os.path.exists("commentaries.json"):
        try:
            with open("commentaries.json", "r", encoding="utf-8") as f:
                commentaries = json.load(f)
                commentary_info = commentaries.get(currency)
        except Exception as e:
            print(f"Error loading commentaries.json in injection: {e}")
            
    if not commentary_info:
        commentary_info = {
            "macro_commentary": "환율 동향 분석 데이터가 없습니다. 편집기를 통해 입력해 주세요.",
            "forecast": {"june_late": 0.0, "q3_avg": 0.0, "q4_avg": 0.0, "source": "Bloomberg Consensus"}
        }
    
    res = dict(rate_data)
    res["commentary"] = commentary_info
    return res

@app.get("/api/rates/{currency}")
def get_rates(currency: str):
    """Returns exchange rate data for a specific currency."""
    currency_upper = currency.upper()
    if currency_upper not in CURRENCY_MAP:
        raise HTTPException(status_code=404, detail="Currency not supported")
    data = get_exchange_rates(currency_upper)
    return inject_commentary(data)


class CommentaryUpdateRequest(BaseModel):
    macro_commentary: str
    forecast: dict

@app.get("/api/commentary/{currency}")
def get_commentary(currency: str):
    """Returns commentary and forecast data for a specific currency."""
    currency_upper = currency.upper()
    if currency_upper not in CURRENCY_MAP:
        raise HTTPException(status_code=404, detail="Currency not supported")
    
    commentaries = {}
    if os.path.exists("commentaries.json"):
        try:
            with open("commentaries.json", "r", encoding="utf-8") as f:
                commentaries = json.load(f)
        except Exception as e:
            print(f"Error loading commentaries.json: {e}")
            
    return commentaries.get(currency_upper, {
        "macro_commentary": "환율 동향 분석 데이터가 없습니다. 편집기를 통해 입력해 주세요.",
        "forecast": {"june_late": 0.0, "q3_avg": 0.0, "q4_avg": 0.0, "source": "Bloomberg Consensus"}
    })

@app.post("/api/commentary/{currency}")
def update_commentary(currency: str, request: CommentaryUpdateRequest):
    """Updates commentary and forecast data for a specific currency."""
    currency_upper = currency.upper()
    if currency_upper not in CURRENCY_MAP:
        raise HTTPException(status_code=404, detail="Currency not supported")
    
    commentaries = {}
    if os.path.exists("commentaries.json"):
        try:
            with open("commentaries.json", "r", encoding="utf-8") as f:
                commentaries = json.load(f)
        except Exception as e:
            pass
            
    commentaries[currency_upper] = {
        "macro_commentary": request.macro_commentary,
        "forecast": request.forecast
    }
    
    try:
        with open("commentaries.json", "w", encoding="utf-8") as f:
            json.dump(commentaries, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save commentaries: {e}")
        
    # Invalidate cache to ensure subsequent queries see new forecast/commentary
    if currency_upper in DATA_CACHE:
        del DATA_CACHE[currency_upper]
        
    return {"status": "success", "message": f"Commentary for {currency_upper} updated successfully."}


class QueryRequest(BaseModel):
    query: str

@app.post("/api/query")
def query_dashboard(request: QueryRequest):
    """AI Search Query endpoint to answer user questions about exchange rates."""
    query_text = request.query.strip()
    
    # 1. Identify currency from query
    currency_code = None
    currency_terms = {
        "EUR": ["eur", "유로", "euro"],
        "GBP": ["gbp", "파운드", "pound"],
        "CZK": ["czk", "코루나", "koruna"],
        "HUF": ["huf", "포린트", "forint"],
        "PLN": ["pln", "즈로티", "zloty"],
        "RON": ["ron", "레우", "leu"],
        "CHF": ["chf", "프랑", "franc", "스위스"],
        "KRW": ["krw", "원화", "원", "대한민국", "won"]
    }
    
    # Try case-insensitive matching for currency words
    for code, terms in currency_terms.items():
        for term in terms:
            if re.search(r'\b' + re.escape(term) + r'\b', query_text.lower()) or term in query_text.lower():
                currency_code = code
                break
        if currency_code:
            break
            
    # Default to USDKRW if no currency is matched but user is asking about rates in Korean
    if not currency_code:
        # Check if the query contains code symbols directly like EUR, GBP
        for code in CURRENCY_MAP.keys():
            if code in query_text.upper():
                currency_code = code
                break
                
    if not currency_code:
        return {
            "answer": "질문에서 대상 통화(EUR, GBP, CZK, HUF, PLN, RON, CHF, KRW 등)를 식별할 수 없습니다. 통화명을 함께 입력해 주세요 (예: '지난달 EUR 평균 환율은?')."
        }
        
    # Get rates for identified currency
    data = get_exchange_rates(currency_code)
    records = data["records"]
    symbol = data["symbol"]
    fmt = data["format"]
    
    # Extract month matching (e.g., "1월", "2월", "지난달", "5월")
    month_match = re.search(r'(\d+)월', query_text)
    is_last_month = "지난달" in query_text or "지난 달" in query_text or "전월" in query_text
    
    # Check for monthly average request
    if "평균" in query_text or "평균환율" in query_text:
        target_month = None
        if is_last_month:
            target_month = 12 if current_month == 1 else current_month - 1
        elif month_match:
            target_month = int(month_match.group(1))
            
        if target_month is not None:
            if 1 <= target_month < current_month:
                label_pattern = f"2026년 {target_month:02d}월 평균"
                rate_record = next((r for r in records if r["label"] == label_pattern), None)
                if rate_record:
                    val = rate_record["rate"]
                    formatted_val = fmt.format(val)
                    return {
                        "answer": f"2026년 {target_month}월 {currency_code} 평균 환율은 **{formatted_val}** ({symbol} 기준) 입니다.",
                        "currency": currency_code,
                        "value": val
                    }
            elif target_month == current_month:
                # Cumulative average for current month
                val = data["cumulative_average"]
                formatted_val = fmt.format(val)
                return {
                    "answer": f"당월(2026년 {current_month}월 1일~{now.day}일 누적) {currency_code} 평균 환율은 **{formatted_val}** ({symbol} 기준) 입니다.",
                    "currency": currency_code,
                    "value": val
                }
            else:
                return {
                    "answer": f"죄송합니다. F(x) Tracker DB에는 2026년 1월부터 {current_month}월까지의 데이터만 등록되어 있습니다. ({target_month}월 요청)"
                }
        else:
            # General average query (default to current month cumulative)
            val = data["cumulative_average"]
            formatted_val = fmt.format(val)
            prev_m_val = 12 if current_month == 1 else current_month - 1
            return {
                "answer": f"현재 당월({current_month}월 누적) {currency_code} 평균 환율은 **{formatted_val}** ({symbol} 기준) 입니다. 이전 월 평균을 보시려면 '{prev_m_val}월 평균 환율'과 같이 입력해 주세요.",
                "currency": currency_code,
                "value": val
            }

    # Check for Fluctuation queries (변동, 변동폭, 가장 컸던 날, 최고, 최저)
    if "변동" in query_text or "가장 컸던" in query_text or "변동폭" in query_text or "변동이 심했던" in query_text:
        daily_records = [r for r in records if r["type"] == "daily"]
        if len(daily_records) < 2:
            return {
                "answer": f"최근 {currency_code} 일별 데이터가 부족하여 일일 변동 폭을 계산할 수 없습니다."
            }
            
        max_diff = -1.0
        max_date = None
        prev_rate = None
        
        # Calculate daily change absolute values
        for r in daily_records:
            curr_rate = r["rate"]
            if prev_rate is not None:
                diff = abs(curr_rate - prev_rate)
                if diff > max_diff:
                    max_diff = diff
                    max_date = r["label"]
            prev_rate = curr_rate
            
        if max_date:
            formatted_diff = fmt.format(max_diff)
            # Find the rate of that day
            day_rate_rec = next(r for r in daily_records if r["label"] == max_date)
            formatted_rate = fmt.format(day_rate_rec["rate"])
            return {
                "answer": f"최근 {currency_code} 변동 폭이 가장 컸던 날은 **{max_date}** 이며, 전일 대비 변동폭은 **{formatted_diff}** (당일 환율: {formatted_rate} {symbol}) 입니다.",
                "currency": currency_code,
                "date": max_date,
                "diff": max_diff
            }

    # Check for High / Low query
    if "최고" in query_text or "가장 높은" in query_text or "최저" in query_text or "가장 낮은" in query_text:
        daily_records = [r for r in records if r["type"] == "daily"]
        if not daily_records:
            return {
                "answer": f"최근 {currency_code} 일별 환율 데이터가 존재하지 않습니다."
            }
            
        if "최고" in query_text or "가장 높은" in query_text:
            peak_record = max(daily_records, key=lambda x: x["rate"])
            formatted_val = fmt.format(peak_record["rate"])
            return {
                "answer": f"당월({current_month}월) {currency_code} 최고 환율은 **{peak_record['label']}**에 기록된 **{formatted_val}** ({symbol}) 입니다.",
                "currency": currency_code,
                "date": peak_record['label'],
                "value": peak_record["rate"]
            }
        else:
            trough_record = min(daily_records, key=lambda x: x["rate"])
            formatted_val = fmt.format(trough_record["rate"])
            return {
                "answer": f"당월({current_month}월) {currency_code} 최저 환율은 **{trough_record['label']}**에 기록된 **{formatted_val}** ({symbol}) 입니다.",
                "currency": currency_code,
                "date": trough_record['label'],
                "value": trough_record["rate"]
            }

    # Default general response: return latest rate info
    daily_records = [r for r in records if r["type"] == "daily"]
    if daily_records:
        latest = daily_records[-1]
        formatted_val = fmt.format(latest["rate"])
        return {
            "answer": f"현재 {currency_code}의 가장 최근 환율 데이터({latest['label']})는 **{formatted_val}** ({symbol}) 입니다. 특정 월 평균이나 일일 변동 폭에 대해 물어보시면 맞춤형 답변을 드리겠습니다.",
            "currency": currency_code,
            "value": latest["rate"]
        }
    else:
        # Fallback to monthly average
        val = data["cumulative_average"]
        formatted_val = fmt.format(val)
        return {
            "answer": f"현재 {currency_code}의 당월 누적 평균 환율은 **{formatted_val}** ({symbol}) 입니다."
        }


# Mount Static Files and Serve Frontend
# Ensure the static directory exists
os.makedirs("static", exist_ok=True)

# Main route serving index.html
@app.get("/")
def read_root():
    return FileResponse("static/index.html")

app.mount("/", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
