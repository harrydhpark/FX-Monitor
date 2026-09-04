"""
services/ecb_service.py
European Central Bank (ECB) official reference rate and reliable FX API client.
Provides free, unlimited daily exchange rates for EUR, GBP, CZK, HUF, PLN, RON, CHF, KRW.
"""
import json
import logging
import urllib.request
from datetime import datetime, timedelta

logger = logging.getLogger("fx_monitor.ecb")

CACHE_ECB = {}
CACHE_TTL_MINUTES = 30

def fetch_ecb_time_series(start_date: str, end_date: str) -> dict:
    """
    Fetches daily rates between start_date and end_date (inclusive).
    Returns dict: { "YYYY-MM-DD": { "EUR": rate, "GBP": rate, ... } }
    """
    cache_key = f"{start_date}_{end_date}"
    now = datetime.now()
    if cache_key in CACHE_ECB:
        cached_entry = CACHE_ECB[cache_key]
        if now - cached_entry["time"] < timedelta(minutes=CACHE_TTL_MINUTES):
            return cached_entry["data"]

    results = {}
    headers = {"User-Agent": "LGE-FX-Monitor/2.5"}

    # 1. Fetch ECB rates from Frankfurter
    try:
        url = f"https://api.frankfurter.app/{start_date}..{end_date}?from=USD"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            daily_rates = data.get("rates", {})
            for d_str, rates_map in daily_rates.items():
                if d_str not in results:
                    results[d_str] = {}
                # USD/CZK, USD/HUF, USD/PLN, USD/RON
                for cur in ["CZK", "HUF", "PLN", "RON"]:
                    if cur in rates_map:
                        results[d_str][cur] = float(rates_map[cur])
                
                # Invert for EUR/USD, GBP/USD, CHF/USD
                if "EUR" in rates_map and rates_map["EUR"]:
                    results[d_str]["EUR"] = round(1.0 / float(rates_map["EUR"]), 4)
                if "GBP" in rates_map and rates_map["GBP"]:
                    results[d_str]["GBP"] = round(1.0 / float(rates_map["GBP"]), 4)
                if "CHF" in rates_map and rates_map["CHF"]:
                    results[d_str]["CHF"] = round(1.0 / float(rates_map["CHF"]), 4)

    except urllib.error.HTTPError as he:
        # If 404 on weekend range, try fetching latest available ECB rate
        if he.code == 404:
            try:
                latest_url = "https://api.frankfurter.app/latest?from=USD"
                req_lat = urllib.request.Request(latest_url, headers=headers)
                with urllib.request.urlopen(req_lat, timeout=4) as lat_resp:
                    lat_data = json.loads(lat_resp.read().decode())
                    lat_date = lat_data.get("date", end_date)
                    rates_map = lat_data.get("rates", {})
                    results[lat_date] = {}
                    for cur in ["CZK", "HUF", "PLN", "RON"]:
                        if cur in rates_map:
                            results[lat_date][cur] = float(rates_map[cur])
                    if "EUR" in rates_map and rates_map["EUR"]:
                        results[lat_date]["EUR"] = round(1.0 / float(rates_map["EUR"]), 4)
                    if "GBP" in rates_map and rates_map["GBP"]:
                        results[lat_date]["GBP"] = round(1.0 / float(rates_map["GBP"]), 4)
                    if "CHF" in rates_map and rates_map["CHF"]:
                        results[lat_date]["CHF"] = round(1.0 / float(rates_map["CHF"]), 4)
            except Exception as e_lat:
                logger.warning(f"Fallback latest ECB fetch failed: {e_lat}")
        else:
            logger.warning(f"ECB HTTP error {he.code}: {he}")
    except Exception as e:
        logger.warning(f"Failed to fetch ECB rates via Frankfurter ({start_date}..{end_date}): {e}")

    # 2. Fetch KRW (USD/KRW) from open.er-api
    try:
        krw_url = "https://open.er-api.com/v6/latest/USD"
        req_krw = urllib.request.Request(krw_url, headers=headers)
        with urllib.request.urlopen(req_krw, timeout=3) as resp:
            krw_data = json.loads(resp.read().decode())
            latest_krw = float(krw_data.get("rates", {}).get("KRW", 1360.0))
            for d_str in results.keys():
                results[d_str]["KRW"] = round(latest_krw, 1)
    except Exception as e:
        logger.warning(f"Failed to fetch KRW rate from ER-API: {e}")

    CACHE_ECB[cache_key] = {"time": now, "data": results}
    return results

def get_latest_external_rate(currency: str) -> float:
    """Gets the single latest rate for a given currency from ECB / external feed."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
    data = fetch_ecb_time_series(yesterday_str, today_str)
    if data:
        sorted_dates = sorted(data.keys())
        for d in reversed(sorted_dates):
            if currency in data[d]:
                return data[d][currency]
    return None
