import os
import re
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from services.exchange_service import (
    generate_mock_data as service_generate_mock_data,
    get_exchange_rates as service_get_exchange_rates
)
from services.commentary_service import (
    inject_commentary as service_inject_commentary,
    get_commentary_data,
    update_commentary_data
)
from services.parser_service import parse_official_announcement_text

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

# Data File Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
REAL_RATES_FILE = os.path.join(DATA_DIR, "real_rates.json")
COMMENTARIES_FILE = os.path.join(DATA_DIR, "commentaries.json")

# Memory Cache for Exchange Rate Data
# Structure: {currency: {"timestamp": datetime, "data": dict}}
DATA_CACHE = {}
CACHE_EXPIRATION_MINUTES = int(os.environ.get("CACHE_EXPIRE_MINUTES", 60))

# Current Local Time Simulation: 2026-09-14 (Monday)
CURRENT_DATE = datetime(2026, 9, 14)

def generate_mock_data(currency: str) -> dict:
    """Delegates mock data generation to exchange_service."""
    return service_generate_mock_data(currency, CURRENCY_MAP, REAL_RATES_FILE)

def get_exchange_rates(currency: str) -> dict:
    """Delegates exchange rates calculation/fetching to exchange_service."""
    return service_get_exchange_rates(currency, CURRENCY_MAP, DATA_CACHE, CACHE_EXPIRATION_MINUTES, REAL_RATES_FILE)


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
    """Injects commentary using commentary_service."""
    return service_inject_commentary(rate_data, COMMENTARIES_FILE)

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
    return get_commentary_data(currency_upper, CURRENCY_MAP, COMMENTARIES_FILE)

@app.post("/api/commentary/{currency}")
def update_commentary(currency: str, request: CommentaryUpdateRequest):
    """Updates commentary and forecast data for a specific currency."""
    currency_upper = currency.upper()
    return update_commentary_data(
        currency_upper,
        request.macro_commentary,
        request.forecast,
        CURRENCY_MAP,
        COMMENTARIES_FILE,
        DATA_CACHE
    )


@app.get("/healthz")
def healthz():
    return {"status": "ok", "time": datetime.now().isoformat()}

class ParseTextRequest(BaseModel):
    text: str

@app.post("/api/admin/parse-official-text")
def api_parse_official_text(req: ParseTextRequest):
    """Parses pasted text from official email/excel announcement and returns preview."""
    res = parse_official_announcement_text(req.text)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

class SaveOfficialRatesRequest(BaseModel):
    parsed_data: dict
    source_label: str = "사내 공식 환율 정보 (TV유럽영업2팀 F(x) Tracker)"

@app.post("/api/admin/save-official-rates")
def api_save_official_rates(req: SaveOfficialRatesRequest):
    """Saves parsed official rates into real_rates.json and commentaries.json."""
    parsed = req.parsed_data
    if not parsed or "currencies" not in parsed:
        raise HTTPException(status_code=400, detail="Invalid parsed data")

    try:
        real_data = {}
        if os.path.exists(REAL_RATES_FILE):
            with open(REAL_RATES_FILE, "r", encoding="utf-8") as f:
                real_data = json.load(f)

        comm_data = {}
        if os.path.exists(COMMENTARIES_FILE):
            with open(COMMENTARIES_FILE, "r", encoding="utf-8") as f:
                comm_data = json.load(f)

        for cur in parsed["currencies"]:
            if cur not in real_data:
                real_data[cur] = {"monthly_averages": {}, "september_daily": [], "cumulative_average": 0.0}

            # Update monthly averages
            if cur in parsed.get("monthly_averages", {}):
                real_data[cur]["monthly_averages"].update(parsed["monthly_averages"][cur])

            # Update daily records
            if cur in parsed.get("daily_records", {}) and parsed["daily_records"][cur]:
                real_data[cur]["september_daily"] = parsed["daily_records"][cur]

            # Update cumulative average
            if cur in parsed.get("cumulative_averages", {}):
                real_data[cur]["cumulative_average"] = parsed["cumulative_averages"][cur]

            # Update commentaries forecast
            if cur in comm_data:
                fc = comm_data[cur].get("forecast", {})
                if cur in parsed.get("month_end_forecast", {}):
                    fc["month_end"] = parsed["month_end_forecast"][cur]
                    fc["june_late"] = parsed["month_end_forecast"][cur]
                fc["source"] = req.source_label
                # Recalculate 3Q average if 7, 8, month_end available
                m_avg = real_data[cur].get("monthly_averages", {})
                if "7" in m_avg and "8" in m_avg and "month_end" in fc:
                    q3 = (float(m_avg["7"]) + float(m_avg["8"]) + float(fc["month_end"])) / 3.0
                    fc["q3_avg"] = round(q3, 3 if cur not in ["KRW", "CZK", "HUF", "PLN"] else (1 if cur == "KRW" else 2))
                comm_data[cur]["forecast"] = fc

        # Save files atomically
        with open(REAL_RATES_FILE, "w", encoding="utf-8") as f:
            json.dump(real_data, f, ensure_ascii=False, indent=2)

        with open(COMMENTARIES_FILE, "w", encoding="utf-8") as f:
            json.dump(comm_data, f, ensure_ascii=False, indent=2)

        DATA_CACHE.clear()
        return {
            "status": "success",
            "message": "사내 공식 환율 실적이 성공적으로 기록되었습니다.",
            "updated_currencies": parsed["currencies"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save official rates: {e}")


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

# Note: Execution entrypoint has been centralized in app.py
# Run server using: python app.py

