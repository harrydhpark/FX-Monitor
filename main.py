import os
import re
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
    "EUR": {"ticker": "EURUSD=X", "name": "유로 (EUR/USD)", "symbol": "EUR/USD", "format": "{:.4f}"},
    "GBP": {"ticker": "GBPUSD=X", "name": "영국 파운드 (GBP/USD)", "symbol": "GBP/USD", "format": "{:.4f}"},
    "CZK": {"ticker": "USDCZK=X", "name": "체코 코루나 (USD/CZK)", "symbol": "USD/CZK", "format": "{:.4f}"},
    "HUF": {"ticker": "USDHUF=X", "name": "헝가리 포린트 (USD/HUF)", "symbol": "USD/HUF", "format": "{:.2f}"},
    "PLN": {"ticker": "USDPLN=X", "name": "폴란드 즈로티 (USD/PLN)", "symbol": "USD/PLN", "format": "{:.4f}"},
    "RON": {"ticker": "USDRON=X", "name": "루마니아 레우 (USD/RON)", "symbol": "USD/RON", "format": "{:.4f}"},
    "CHF": {"ticker": "USDCHF=X", "name": "스위스 프랑 (USD/CHF)", "symbol": "USD/CHF", "format": "{:.4f}"},
    "KRW": {"ticker": "USDKRW=X", "name": "대한민국 원 (USD/KRW)", "symbol": "USD/KRW", "format": "{:.2f}"}
}

# Memory Cache for Exchange Rate Data
# Structure: {currency: {"timestamp": datetime, "data": dict}}
DATA_CACHE = {}
CACHE_EXPIRATION_MINUTES = 60

# Current Local Time Simulation: 2026-06-14 (Sunday)
CURRENT_DATE = datetime(2026, 6, 14)

def generate_mock_data(currency: str) -> dict:
    """Generates realistic historical and daily exchange rates for 2026 (Jan to Jun 14)."""
    # Baseline exchange rates
    baselines = {
        "EUR": 1.0850,
        "GBP": 1.2680,
        "CZK": 23.1500,
        "HUF": 365.2000,
        "PLN": 4.0200,
        "RON": 4.6200,
        "CHF": 0.8950,
        "KRW": 1380.0000
    }
    
    base_rate = baselines.get(currency, 1.0)
    
    # Monthly averages (Jan to May 2026)
    # Introducing minor variance per month
    monthly_multipliers = {
        1: 0.985,  # Jan
        2: 0.995,  # Feb
        3: 1.002,  # Mar
        4: 1.015,  # Apr
        5: 1.025   # May
    }
    
    records = []
    
    # Jan to May
    for m in range(1, 6):
        mult = monthly_multipliers[m]
        # Invert logic for EUR/GBP if needed?
        # Standard: multiply baseline by multiplier
        rate_val = base_rate * mult
        month_str = f"2026년 {m:02d}월 평균"
        records.append({
            "label": month_str,
            "date": f"2026-{m:02d}-01",
            "type": "monthly_avg",
            "rate": round(rate_val, 6)
        })
        
    # June Daily Rates (Jun 1 to Jun 14)
    # Skipping weekends (Jun 6-7, Jun 13-14)
    june_rates = []
    for day in range(1, 15):
        d = datetime(2026, 6, day)
        if d.weekday() >= 5:  # Weekend
            continue
        
        # Simulating random walk
        # Using day of month to make it deterministic but realistic
        day_seed = (day * 17) % 31
        change_pct = (day_seed - 15) * 0.0015  # -2.25% to +2.25%
        rate_val = base_rate * (1.025 + change_pct)  # Slightly higher in June
        
        date_str = d.strftime("%Y-%m-%d")
        record = {
            "label": date_str,
            "date": date_str,
            "type": "daily",
            "rate": round(rate_val, 6)
        }
        records.append(record)
        june_rates.append(rate_val)
        
    cum_avg = sum(june_rates) / len(june_rates) if june_rates else base_rate
    
    return {
        "currency": currency,
        "name": CURRENCY_MAP[currency]["name"],
        "symbol": CURRENCY_MAP[currency]["symbol"],
        "format": CURRENCY_MAP[currency]["format"],
        "records": records,
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
        # Fetch historical data for 2026
        # Start date: Jan 1, 2026. End date: June 15, 2026.
        ticker_obj = yf.Ticker(ticker)
        df = ticker_obj.history(start="2026-01-01", end="2026-06-15")
        
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
        
        # 1. Past Monthly Averages (Jan to May)
        df_past = df_2026[df_2026['Date'].dt.month < 6]
        if not df_past.empty:
            df_past_grouped = df_past.groupby(df_past['Date'].dt.month)
            for month, group in df_past_grouped:
                avg_close = group['Close'].mean()
                records.append({
                    "label": f"2026년 {month:02d}월 평균",
                    "date": f"2026-{month:02d}-01",
                    "type": "monthly_avg",
                    "rate": float(avg_close)
                })
        else:
            # Fallback for monthly if not enough history
            mock = generate_mock_data(currency)
            for r in mock["records"]:
                if r["type"] == "monthly_avg":
                    records.append(r)
                    
        # 2. June Daily Rates (Jun 1 to Jun 14)
        df_june = df_2026[(df_2026['Date'].dt.month == 6) & (df_2026['Date'].dt.day <= 14)]
        june_rates = []
        
        if not df_june.empty:
            for idx, row in df_june.iterrows():
                rate_val = float(row['Close'])
                date_str = row['Date'].strftime("%Y-%m-%d")
                records.append({
                    "label": date_str,
                    "date": date_str,
                    "type": "daily",
                    "rate": rate_val
                })
                june_rates.append(rate_val)
        else:
            # Fallback for daily June if yfinance query fails or returns empty
            mock = generate_mock_data(currency)
            for r in mock["records"]:
                if r["type"] == "daily":
                    records.append(r)
                    june_rates.append(r["rate"])
                    
        # Sort records by date to ensure proper order
        records.sort(key=lambda x: x["date"])
        
        # Calculate June cumulative average
        cum_avg = sum(june_rates) / len(june_rates) if june_rates else 0.0
        
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
    """Returns lists of target currencies with metadata."""
    return [
        {"code": code, "name": info["name"], "symbol": info["symbol"]}
        for code, info in CURRENCY_MAP.items()
    ]

@app.get("/api/rates/{currency}")
def get_rates(currency: str):
    """Returns exchange rate data for a specific currency."""
    currency_upper = currency.upper()
    if currency_upper not in CURRENCY_MAP:
        raise HTTPException(status_code=404, detail="Currency not supported")
    return get_exchange_rates(currency_upper)


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
            target_month = 5  # May is last month relative to June 2026
        elif month_match:
            target_month = int(month_match.group(1))
            
        if target_month is not None:
            if 1 <= target_month <= 5:
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
            elif target_month == 6:
                # Cumulative average for June
                val = data["cumulative_average"]
                formatted_val = fmt.format(val)
                return {
                    "answer": f"당월(2026년 6월 1일~14일 누적) {currency_code} 평균 환율은 **{formatted_val}** ({symbol} 기준) 입니다.",
                    "currency": currency_code,
                    "value": val
                }
            else:
                return {
                    "answer": f"죄송합니다. F(x) Tracker DB에는 2026년 1월부터 6월까지의 데이터만 등록되어 있습니다. ({target_month}월 요청)"
                }
        else:
            # General average query (default to June cumulative)
            val = data["cumulative_average"]
            formatted_val = fmt.format(val)
            return {
                "answer": f"현재 당월(6월 누적) {currency_code} 평균 환율은 **{formatted_val}** ({symbol} 기준) 입니다. 이전 월 평균을 보시려면 '5월 평균 환율'과 같이 입력해 주세요.",
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
                "answer": f"당월(6월) {currency_code} 최고 환율은 **{peak_record['label']}**에 기록된 **{formatted_val}** ({symbol}) 입니다.",
                "currency": currency_code,
                "date": peak_record['label'],
                "value": peak_record["rate"]
            }
        else:
            trough_record = min(daily_records, key=lambda x: x["rate"])
            formatted_val = fmt.format(trough_record["rate"])
            return {
                "answer": f"당월(6월) {currency_code} 최저 환율은 **{trough_record['label']}**에 기록된 **{formatted_val}** ({symbol}) 입니다.",
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
