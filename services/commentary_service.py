import os
import json
from fastapi import HTTPException

def inject_commentary(rate_data: dict, commentaries_file: str) -> dict:
    currency = rate_data["currency"]
    commentary_info = None
    if os.path.exists(commentaries_file):
        try:
            with open(commentaries_file, "r", encoding="utf-8") as f:
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

def get_commentary_data(currency_upper: str, currency_map: dict, commentaries_file: str) -> dict:
    if currency_upper not in currency_map:
        raise HTTPException(status_code=404, detail="Currency not supported")
    
    commentaries = {}
    if os.path.exists(commentaries_file):
        try:
            with open(commentaries_file, "r", encoding="utf-8") as f:
                commentaries = json.load(f)
        except Exception as e:
            print(f"Error loading commentaries.json: {e}")
            
    return commentaries.get(currency_upper, {
        "macro_commentary": "환율 동향 분석 데이터가 없습니다. 편집기를 통해 입력해 주세요.",
        "forecast": {"june_late": 0.0, "q3_avg": 0.0, "q4_avg": 0.0, "source": "Bloomberg Consensus"}
    })

def update_commentary_data(currency_upper: str, macro_commentary: str, forecast: dict, currency_map: dict, commentaries_file: str, data_cache: dict) -> dict:
    if currency_upper not in currency_map:
        raise HTTPException(status_code=404, detail="Currency not supported")
    
    commentaries = {}
    if os.path.exists(commentaries_file):
        try:
            with open(commentaries_file, "r", encoding="utf-8") as f:
                commentaries = json.load(f)
        except Exception as e:
            pass
            
    commentaries[currency_upper] = {
        "macro_commentary": macro_commentary,
        "forecast": forecast
    }
    
    try:
        with open(commentaries_file, "w", encoding="utf-8") as f:
            json.dump(commentaries, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save commentaries: {e}")
        
    if currency_upper in data_cache:
        del data_cache[currency_upper]
        
    return {"status": "success", "message": f"Commentary for {currency_upper} updated successfully."}
