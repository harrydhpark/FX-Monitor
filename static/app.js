const FX_APP_VERSION = '2.4.0';

function checkAndMigrateStorage() {
    try {
        const storedVer = localStorage.getItem('fx_app_version');
        if (storedVer !== FX_APP_VERSION) {
            console.log(`[Cache Migration] Upgrading version from ${storedVer} to ${FX_APP_VERSION}`);
            ['EUR', 'GBP', 'CZK', 'HUF', 'PLN', 'RON', 'CHF', 'KRW'].forEach(c => {
                localStorage.removeItem(`commentary_${c}`);
            });
            localStorage.setItem('fx_app_version', FX_APP_VERSION);
        }
    } catch(e) {
        console.warn('Storage migration warning:', e);
    }
}
// F(x) Tracker - Frontend Application Logic with Client-Side Fallback (Firewall-proof)

// Target Currencies Configuration
const CURRENCIES = [
    { code: "EUR", name: "유로 (EUR/USD)", symbol: "EUR/USD", format: "{:.3f}" },
    { code: "GBP", name: "영국 파운드 (GBP/USD)", symbol: "GBP/USD", format: "{:.3f}" },
    { code: "CZK", name: "체코 코루나 (USD/CZK)", symbol: "USD/CZK", format: "{:.2f}" },
    { code: "HUF", name: "헝가리 포린트 (USD/HUF)", symbol: "USD/HUF", format: "{:.2f}" },
    { code: "PLN", name: "폴란드 즈로티 (USD/PLN)", symbol: "USD/PLN", format: "{:.2f}" },
    { code: "RON", name: "루마니아 레우 (USD/RON)", symbol: "USD/RON", format: "{:.3f}" },
    { code: "CHF", name: "스위스 프랑 (CHF/USD)", symbol: "CHF/USD", format: "{:.3f}" },
    { code: "KRW", name: "대한민국 원 (USD/KRW)", symbol: "USD/KRW", format: "{:.0f}" }
];

// Offline Commentary & Forecast Fallbacks
const OFFLINE_COMMENTARIES = {
    "EUR": {
        "macro_commentary": "유로화는 9월 들어 **1.160달러 안팎의 견조한 박스권 흐름**을 형성하고 있습니다. 유럽중앙은행(ECB)의 기준금리 인하 기조에도 불구하고, 미국 연방준비제도(Fed)의 9월 금리 인하 사이클 본격 개시 기대가 글로벌 달러화 약세를 견인하며 유로/달러 환율의 든든한 하방 지지대로 작용하고 있습니다. 7월(1.142) 저점 확인 후 8월 월평균 실적 1.159로 반등한 데 이어, 9월 4일 현재 누적 평균은 **1.160**으로 9월차 이동계획(1.156) 대비 **+0.4% 유로 강세**를 기록 중입니다. 독일과 프랑스 등 유로존 핵심 제조업 지표의 부진이 상방을 제한하고 있으나, 서비스 물가 및 임금 상승세의 잔존으로 ECB의 추가 금리 인하 속도는 점진적으로 조절될 것으로 전망됩니다. 블룸버그 및 주요 IB(골드만삭스, ING) 컨센서스에 따르면, 미 연준의 연속 금리 인하 기대와 유로존 경기 연착륙 전망이 맞물려 4분기로 갈수록 완만한 유로화 강세(환율 상승) 기조가 이어질 것으로 예상됩니다.",
        "forecast": {
            "month_end": 1.162,
            "m10": 1.165,
            "m11": 1.168,
            "m12": 1.17,
            "q3_avg": 1.154,
            "q4_avg": 1.168,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "GBP": {
        "macro_commentary": "영국 파운드화는 영란은행(BoE)의 점진적 완화 스탠스와 영국의 견조한 서비스업 경기 회복세에 힘입어 **1.35달러대의 강력한 강세 기조**를 수성하고 있습니다. 8월 월평균 실적 1.353에 이어 9월 4일 누적 평균 또한 **1.352**를 기록하며, 9월차 이동환율(1.340) 대비 **+0.9%의 견조한 파운드 강세**를 유지하고 있습니다. 미국 연준의 금리 인하 사이클 개시와 맞물려 달러 대비 파운드의 실질 금리 매력도가 부각되며 글로벌 투자 자금 유입이 지속되고 있습니다. 영국의 신정부 출범 이후 정책적 안정성이 확립된 점도 파운드화 강세 심리를 견인하는 주요 배경입니다. 주요 글로벌 금융기관들은 영국의 인플레이션 잔존 압력으로 인해 BoE의 완화 속도가 주요국 대비 느릴 것으로 보고 있으며, 이에 따라 4분기에도 파운드화의 점진적 강세 흐름(10월 1.355 → 12월 1.360)이 유지될 것으로 전망하고 있습니다.",
        "forecast": {
            "month_end": 1.353,
            "m10": 1.355,
            "m11": 1.358,
            "m12": 1.36,
            "q3_avg": 1.348,
            "q4_avg": 1.358,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "CZK": {
        "macro_commentary": "체코 코루나화는 체코 중앙은행(CNB)의 점진적인 완화 사이클 속에서도 글로벌 달러 약세의 반사 이익을 누리며 **20.80코루나 수준으로 안정화**되었습니다. 7월 실적(21.19) 대비 8월(20.87)에 이어 9월 누적 평균은 **20.83**을 기록하며, 9월차 이동환율(21.28) 대비 **+2.1% 코루나 강세(환율 하락)** 흐름을 나타내고 있습니다. 유로존 경기 회복 지연이 동유럽 제조업 공급망에 미치는 영향은 잔존하나, 체코 내부 인플레이션의 목표치 안착과 외환보유고 방어 의지가 하방 경직성을 제공하고 있습니다. 글로벌 IB 컨센서스에 따르면 달러화 약세 압력과 맞물려 코루나화는 4분기 동안 20.75에서 20.65 수준으로 완만한 강세(환율 하락) 흐름을 나타내며 4분기 평균 20.70코루나를 형성할 것으로 전망됩니다.",
        "forecast": {
            "month_end": 20.8,
            "m10": 20.75,
            "m11": 20.7,
            "m12": 20.65,
            "q3_avg": 20.95,
            "q4_avg": 20.7,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "HUF": {
        "macro_commentary": "헝가리 포린트화는 헝가리 중앙은행(MNB)의 금리 인하 사이클과 EU 지원금 관련 마찰에도 불구하고, 글로벌 위험자산 선호 심리 회복에 힘입어 **310포린트 초중반에서 등락**하고 있습니다. 9월 4일 기준 누적 평균은 **315.23**으로 9월차 이동환율(312.22) 대비 소폭 약세(△1.0%) 구간에 있으나, 9월 4일 일별 고시환율은 311.53으로 하향 안정세를 나타냈습니다. 헝가리의 경상수지 개선과 에너지 수입 비용 감소가 추가 약세를 방어하는 완충 장치 역할을 수행하고 있습니다. 블룸버그 컨센서스에 따르면 높은 실질금리 메리트와 EU 자금 협상의 점진적 진전 기대감이 유효하여, 10월 311포린트에서 연말 308포린트 수준으로 점진적 강세(환율 하락)를 나타내며 4분기 평균 309.67 수준으로 수렴할 것으로 전망됩니다.",
        "forecast": {
            "month_end": 312.0,
            "m10": 311.0,
            "m11": 310.0,
            "m12": 308.0,
            "q3_avg": 313.51,
            "q4_avg": 309.67,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "PLN": {
        "macro_commentary": "폴란드 즈로티화는 폴란드 중앙은행(NBP)의 지속적인 매파적 기준금리 동결 스탠스와 친유럽 정부의 대규모 EU 회복 기금 집행 승인으로 **3.70~3.74즈로티 대의 견고한 박스권**을 구축하고 있습니다. 7월 실적 3.78 이후 8월 3.72에 이어 9월 누적 평균은 **3.73**을 기록 중이며, 9월차 이동환율(3.70)과 근접한 균형을 유지하고 있습니다. 폴란드 내수 소비와 실질 임금 상승세가 강하게 유지되고 있어 동유럽 국가 중 가장 탄탄한 거시 기초체력을 보이고 있습니다. 글로벌 금융기관들은 NBP의 고금리 장기화 기조와 EU 펀드 유입에 따라 4분기 중 3.70선을 하회(12월 3.68 수준)하는 추가 즈로티 강세(환율 하락)가 전개될 것으로 전망하고 있습니다.",
        "forecast": {
            "month_end": 3.72,
            "m10": 3.71,
            "m11": 3.7,
            "m12": 3.68,
            "q3_avg": 3.74,
            "q4_avg": 3.7,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "RON": {
        "macro_commentary": "루마니아 레우화는 루마니아 중앙은행의 엄격한 관리변동환율제와 외환 유동성 통제 아래 **4.52~4.54레우 수준의 극도로 제한된 변동성**을 유지하고 있습니다. 7월 4.58, 8월 4.53에 이어 9월 4일 기준 누적 평균은 **4.53**이며, 9월 4일 일별 고시는 4.52를 기록하였습니다. 이는 9월차 이동환율(4.58) 대비 **+1.1% 레우 강세** 국면입니다. EU 인프라 자금 유입과 높은 기준금리 수준이 쌍둥이 적자 리스크를 상쇄하고 있어 환차손 위험은 극히 제한적입니다. 컨센서스 전망에 따르면 루마니아 중앙은행의 안정화 정책이 지속되며 10월 4.51레우에서 연말 4.49레우 수준의 완만한 강세 기조 속에 4분기 평균 4.50 수준의 매우 좁은 변동 폭을 이어갈 것으로 전망됩니다.",
        "forecast": {
            "month_end": 4.52,
            "m10": 4.51,
            "m11": 4.5,
            "m12": 4.49,
            "q3_avg": 4.54,
            "q4_avg": 4.5,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "CHF": {
        "macro_commentary": "스위스 프랑화는 글로벌 지정학적 긴장 완화 및 스위스 국립은행(SNB)의 선제적 금리 인하 영향으로 **1.23~1.24프랑 수준의 견조한 흐름**을 유지하고 있습니다. 7월 1.235, 8월 1.238에 이어 9월 누적 평균은 **1.234**를 기록 중이며, 9월 4일 고시환율은 1.238입니다. 9월차 이동환율(1.240) 대비 **△0.4%** 내외의 미세한 편차를 보이며 박스권에서 움직이고 있습니다. 글로벌 안전자산 선호 심리가 다소 진정되고 SNB의 추가 완화 여지가 잔존함에 따라, 주요 IB들은 프랑화가 4분기 동안 1.238에서 1.242프랑 수준으로 소폭 약세(환율 상승) 압력을 받으며 4분기 평균 약 1.240 수준을 기록할 것으로 전망하고 있습니다.",
        "forecast": {
            "month_end": 1.237,
            "m10": 1.238,
            "m11": 1.24,
            "m12": 1.242,
            "q3_avg": 1.237,
            "q4_avg": 1.24,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    },
    "KRW": {
        "macro_commentary": "원화는 8월 중순 이후 **미국 연방준비제도(Fed)의 9월 기준금리 인하 사이클 개시**가 확실시되고 글로벌 달러 인덱스가 하락세를 타면서, 기존 1,400원대 중후반의 고환율 국면에서 **1,360원대로 급격한 원화 강세(환율 하락)**로 전환되었습니다. 한국의 반도체 및 AI/IT 중심 수출 호조세가 지속되는 가운데 외국인 자금의 국내 증시 순매수 재유입 및 하반기 WGBI(세계국채지수) 편입 기대감이 원화 가치를 강력하게 지지하고 있습니다. 9월 4일 기준 일별 고시환율은 1,360원까지 하락하였으며, 9월 누적 평균 환율 또한 **1,368원**으로 전월 실적(1,408원) 대비 40원 낮아진 강세 흐름을 보이고 있습니다. 블룸버그 및 주요 IB(골드만삭스, 모건스탠리, 하나은행 등) 종합 컨센서스에 따르면, 미 연준의 금리 인하 폭 확대와 수출 대금 유입에 힘입어 4분기 원/달러 환율은 10월 1,355원, 11월 1,350원, 12월 1,345원 수준으로 완만한 하향 안정세를 그리며 4분기 평균 1,350원 안착을 시도할 것으로 전망됩니다.",
        "forecast": {
            "month_end": 1361.0,
            "m10": 1355.0,
            "m11": 1350.0,
            "m12": 1345.0,
            "q3_avg": 1423.0,
            "q4_avg": 1350.0,
            "source": "Bloomberg FX Consensus & Major IB (Goldman Sachs / ING 종합)"
        }
    }
};

// 100% Offline Database (Used when backend API is unreachable due to firewalls or server shutdown)
const OFFLINE_DB = {
    "EUR": {
        "name": "유로 (EUR/USD)",
        "symbol": "EUR/USD",
        "format": "{:.3f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1.174
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1.183
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1.157
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1.168
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1.168
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 1.152
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 1.142
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 1.159
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 1.161
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 1.159
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 1.159
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 1.162
            }
        ],
        "cumulative_average": 1.16
    },
    "GBP": {
        "name": "영국 파운드 (GBP/USD)",
        "symbol": "GBP/USD",
        "format": "{:.3f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1.351
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1.358
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1.336
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1.343
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1.348
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 1.333
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 1.338
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 1.353
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 1.355
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 1.351
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 1.348
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 1.353
            }
        ],
        "cumulative_average": 1.352
    },
    "CZK": {
        "name": "체코 코루나 (USD/CZK)",
        "symbol": "USD/CZK",
        "format": "{:.2f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 20.67
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 20.51
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 21.1
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 20.88
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 20.82
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 21.02
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 21.19
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 20.87
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 20.79
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 20.87
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 20.88
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 20.8
            }
        ],
        "cumulative_average": 20.83
    },
    "HUF": {
        "name": "헝가리 포린트 (USD/HUF)",
        "symbol": "USD/HUF",
        "format": "{:.2f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 327.16
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 320.49
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 335.75
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 317.74
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 307.39
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 307.41
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 314.5
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 314.03
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 314.47
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 317.46
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 317.46
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 311.53
            }
        ],
        "cumulative_average": 315.23
    },
    "PLN": {
        "name": "폴란드 즈로티 (USD/PLN)",
        "symbol": "USD/PLN",
        "format": "{:.2f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 3.59
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 3.57
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 3.69
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 3.64
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 3.63
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 3.7
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 3.78
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 3.72
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 3.73
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 3.74
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 3.74
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 3.72
            }
        ],
        "cumulative_average": 3.73
    },
    "RON": {
        "name": "루마니아 레우 (USD/RON)",
        "symbol": "USD/RON",
        "format": "{:.3f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 4.34
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 4.307
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 4.401
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 4.361
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 4.47
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 4.55
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 4.58
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 4.53
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 4.53
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 4.53
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 4.54
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 4.52
            }
        ],
        "cumulative_average": 4.53
    },
    "CHF": {
        "name": "스위스 프랑 (CHF/USD)",
        "symbol": "CHF/USD",
        "format": "{:.3f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1.265
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1.294
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1.272
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1.267
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1.275
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 1.252
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 1.235
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 1.238
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 1.237
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 1.232
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 1.23
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 1.238
            }
        ],
        "cumulative_average": 1.234
    },
    "KRW": {
        "name": "대한민국 원 (USD/KRW)",
        "symbol": "USD/KRW",
        "format": "{:.0f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1455
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1448
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1483
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1488
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1488
            },
            {
                "label": "2026년 06월 평균",
                "date": "2026-06-01",
                "type": "monthly_avg",
                "rate": 1528
            },
            {
                "label": "2026년 07월 평균",
                "date": "2026-07-01",
                "type": "monthly_avg",
                "rate": 1499
            },
            {
                "label": "2026년 08월 평균",
                "date": "2026-08-01",
                "type": "monthly_avg",
                "rate": 1408
            },
            {
                "label": "2026-09-01",
                "date": "2026-09-01",
                "type": "daily",
                "rate": 1374
            },
            {
                "label": "2026-09-02",
                "date": "2026-09-02",
                "type": "daily",
                "rate": 1370
            },
            {
                "label": "2026-09-03",
                "date": "2026-09-03",
                "type": "daily",
                "rate": 1369
            },
            {
                "label": "2026-09-04",
                "date": "2026-09-04",
                "type": "daily",
                "rate": 1360
            }
        ],
        "cumulative_average": 1368
    }
};

// State Variables
const API_BASE = '/api';
let currentCurrency = 'KRW';
let currentData = null;
let useOfflineFallback = false; // Automatically set to true if API fails
let trendChart = null; // Global Chart.js instance

// DOM Elements
const currencyList = document.getElementById('currency-list');
const selectedNameEl = document.getElementById('selected-currency-name');
const selectedSymbolEl = document.getElementById('selected-currency-symbol');
const cardLatestRate = document.getElementById('card-latest-rate');
const cardLatestDate = document.getElementById('card-latest-date');
const cardJuneAvg = document.getElementById('card-june-avg');
const cardMayAvg = document.getElementById('card-may-avg');
const rateTableBody = document.getElementById('rate-table-body');
const refreshBtn = document.getElementById('refresh-data-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const aiSearchInput = document.getElementById('ai-search-input');
const aiSearchBtn = document.getElementById('ai-search-btn');
const aiAnswerCard = document.getElementById('ai-answer-card');
const aiAnswerText = document.getElementById('ai-answer-text');
const closeAiAnswer = document.getElementById('close-ai-answer');
const currentLocalTimeEl = document.getElementById('current-local-time');

// Analysis Editor DOM Elements
const editCommentaryBtn = document.getElementById('edit-commentary-btn');
const editorCard = document.getElementById('commentary-editor-card');
const editorForm = document.getElementById('commentary-editor-form');
const closeEditorBtn = document.getElementById('close-editor-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const inputMacroCommentary = document.getElementById('input-macro-commentary');
const inputForecastSource = document.getElementById('input-forecast-source');
const inputForecastJune = document.getElementById('input-forecast-june');
const inputForecastQ3 = document.getElementById('input-forecast-q3');
const inputForecastQ4 = document.getElementById('input-forecast-q4');
const textMacroDrivers = document.getElementById('text-macro-drivers');
const textForecastSource = document.getElementById('text-forecast-source');

// Official Rates Ingestion DOM Elements
const officialRateUploadBtn = document.getElementById('official-rate-upload-btn');
const officialRateModal = document.getElementById('official-rate-modal');
const closeOfficialModalBtn = document.getElementById('close-official-modal-btn');
const inputOfficialPaste = document.getElementById('input-official-paste');
const btnParsePreview = document.getElementById('btn-parse-preview');
const officialPreviewContainer = document.getElementById('official-preview-container');
const previewSummaryBadge = document.getElementById('preview-summary-badge');
const previewTableHead = document.getElementById('preview-table-head');
const previewTableBody = document.getElementById('preview-table-body');
const btnCancelPreview = document.getElementById('btn-cancel-preview');
const btnConfirmSaveOfficial = document.getElementById('btn-confirm-save-official');
let lastParsedData = null;

// Format Helper matching Python format specifications
function formatRate(value, formatStr) {
    if (value === null || value === undefined) return "-";
    if (formatStr && formatStr.includes(".0f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else if (formatStr && formatStr.includes(".2f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (formatStr && formatStr.includes(".3f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    } else if (formatStr && formatStr.includes(".4f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return value.toString();
}

// Helper to update the UI footer status
function updateFooterStatus() {
    const footerStatus = document.querySelector('.footer-status');
    if (footerStatus) {
        if (useOfflineFallback) {
            footerStatus.innerHTML = '<span class="status-dot" style="background-color: var(--google-blue);"></span> Standalone Client Mode';
            footerStatus.style.color = 'var(--google-blue)';
        } else {
            footerStatus.innerHTML = '<span class="status-dot" style="background-color: var(--google-green);"></span> Connected to Server';
            footerStatus.style.color = 'var(--google-green)';
        }
    }
}

// Check if app is running under file protocol
function checkProtocol() {
    if (window.location.protocol === 'file:') {
        useOfflineFallback = true;
        console.log("Running via local file protocol. Automatically using 100% Offline Mode.");
        updateFooterStatus();
    }
}

// Load and Render Currencies in Sidebar
async function loadCurrencies() {
    try {
        let currencies = [];
        if (!useOfflineFallback) {
            const res = await fetch(`${API_BASE}/currencies`).catch(() => null);
            if (res && res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    currencies = await res.json();
                } else {
                    useOfflineFallback = true;
                    updateFooterStatus();
                }
            } else {
                useOfflineFallback = true;
                updateFooterStatus();
            }
        }
        
        if (useOfflineFallback || currencies.length === 0) {
            currencies = CURRENCIES.map(c => {
                const data = getDynamicOfflineData(c.code);
                let prev_avg = null;
                let change_pct = null;
                if (data) {
                    const now = new Date();
                    const currentMonth = now.getMonth() + 1;
                    const prevMonth = currentMonth === 6 ? 5 : (currentMonth === 1 ? 12 : currentMonth - 1);
                    const prevYear = currentMonth === 1 ? now.getFullYear() - 1 : now.getFullYear();
                    const label = `${prevYear}년 ${String(prevMonth).padStart(2, '0')}월 평균`;
                    
                    const prevRecord = data.records.find(r => r.label === label);
                    if (prevRecord) {
                        prev_avg = prevRecord.rate;
                        if (prev_avg && data.cumulative_average) {
                            change_pct = ((data.cumulative_average - prev_avg) / prev_avg) * 100;
                        }
                    }
                }
                return {
                    ...c,
                    prev_avg: prev_avg,
                    cum_avg: data ? data.cumulative_average : null,
                    change_pct: change_pct
                };
            });
        }
        
        currencyList.innerHTML = '';
        
        currencies.forEach(c => {
            const item = document.createElement('div');
            item.className = `currency-item ${c.code === currentCurrency ? 'active' : ''}`;
            item.dataset.code = c.code;
            
            // Spark trend indicators
            let trendClass = 'trend-up';
            let trendText = '0.00%';
            
            if (c.change_pct !== null && c.change_pct !== undefined) {
                const sign = c.change_pct >= 0 ? '+' : '';
                trendClass = c.change_pct >= 0 ? 'trend-up' : 'trend-down';
                trendText = `${sign}${c.change_pct.toFixed(2)}%`;
            } else {
                if (c.prev_avg && c.cum_avg) {
                    const computedChange = ((c.cum_avg - c.prev_avg) / c.prev_avg) * 100;
                    const sign = computedChange >= 0 ? '+' : '';
                    trendClass = computedChange >= 0 ? 'trend-up' : 'trend-down';
                    trendText = `${sign}${computedChange.toFixed(2)}%`;
                }
            }
            
            item.innerHTML = `
                <div class="currency-info">
                    <span class="currency-code">${c.code}</span>
                    <span class="currency-name">${c.name.split(' (')[0]}</span>
                </div>
                <span class="currency-trend ${trendClass}">${trendText}</span>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.currency-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                switchCurrency(c.code);
            });
            
            currencyList.appendChild(item);
        });
    } catch (err) {
        console.error("Error loading currencies:", err);
        // Fallback render
        currencyList.innerHTML = '';
        CURRENCIES.forEach(c => {
            const item = document.createElement('div');
            item.className = `currency-item ${c.code === currentCurrency ? 'active' : ''}`;
            item.dataset.code = c.code;
            item.innerHTML = `<div class="currency-info"><span class="currency-code">${c.code}</span><span class="currency-name">${c.name}</span></div>`;
            item.addEventListener('click', () => switchCurrency(c.code));
            currencyList.appendChild(item);
        });
    }
}

// Render Interactive Chart using Chart.js

function renderMonthlyForecastCard(data, commentary) {
    const fc = (commentary && commentary.forecast) ? commentary.forecast : {};
    const fmt = data.format;
    
    const formatVal = (val) => {
        if (val === null || val === undefined || isNaN(val)) return "-";
        const num = Number(val);
        if (fmt && fmt.includes(".2f")) {
            return num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (fmt && fmt.includes(".4f")) {
            return num.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        } else if (fmt && fmt.includes(".3f")) {
            return num.toLocaleString('ko-KR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        } else if (fmt && fmt.includes(".0f")) {
            return num.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }
        return num.toLocaleString('ko-KR');
    };

    const calcChange = (cur, base) => {
        if (!cur || !base || isNaN(cur) || isNaN(base)) return { text: "-", cls: "flat" };
        const diff = cur - base;
        const pct = (diff / base) * 100;
        const sign = pct > 0 ? "+" : "";
        const cls = pct > 0 ? "up" : (pct < 0 ? "down" : "flat");
        return { text: `${sign}${pct.toFixed(1)}%`, cls };
    };

    const sepEnd = fc.month_end || fc.june_late || 0;
    const m10 = fc.m10 || 0;
    const m11 = fc.m11 || 0;
    const m12 = fc.m12 || 0;
    const q4 = fc.q4_avg || 0;
    const q3 = fc.q3_avg || 0;

    const elM10 = document.getElementById('fg-m10');
    const elM10C = document.getElementById('fg-m10-change');
    const elM11 = document.getElementById('fg-m11');
    const elM11C = document.getElementById('fg-m11-change');
    const elM12 = document.getElementById('fg-m12');
    const elM12C = document.getElementById('fg-m12-change');
    const elQ4 = document.getElementById('fg-q4');
    const elQ4C = document.getElementById('fg-q4-change');
    const elSepEnd = document.getElementById('fg-sep-end');
    const elQ3Avg = document.getElementById('fg-q3-avg');
    const badgeSource = document.getElementById('badge-forecast-agency');

    if (elM10) elM10.textContent = formatVal(m10);
    if (elM11) elM11.textContent = formatVal(m11);
    if (elM12) elM12.textContent = formatVal(m12);
    if (elQ4) elQ4.textContent = formatVal(q4);
    if (elSepEnd) elSepEnd.textContent = formatVal(sepEnd);
    if (elQ3Avg) elQ3Avg.textContent = formatVal(q3);

    const ch10 = calcChange(m10, sepEnd);
    if (elM10C) { elM10C.textContent = `9월말대비 ${ch10.text}`; elM10C.className = `fg-sub ${ch10.cls}`; }
    const ch11 = calcChange(m11, m10);
    if (elM11C) { elM11C.textContent = `전월대비 ${ch11.text}`; elM11C.className = `fg-sub ${ch11.cls}`; }
    const ch12 = calcChange(m12, m11);
    if (elM12C) { elM12C.textContent = `전월대비 ${ch12.text}`; elM12C.className = `fg-sub ${ch12.cls}`; }
    const chQ4 = calcChange(q4, q3);
    if (elQ4C) { elQ4C.textContent = `3Q대비 ${chQ4.text}`; elQ4C.className = `fg-sub ${chQ4.cls}`; }

    if (badgeSource && fc.source) {
        badgeSource.title = fc.source;
        if (fc.source.includes('Bloomberg')) {
            badgeSource.textContent = 'Bloomberg / IB';
        }
    }
}


// Historical 5-Year Annual Average Rates (2022~2025 Official Annual Fixings)
const HISTORICAL_5YR_RATES = {
    "EUR": { "2022": 1.0530, "2023": 1.0810, "2024": 1.0822, "2025": 1.1274 },
    "GBP": { "2022": 1.2370, "2023": 1.2426, "2024": 1.2782, "2025": 1.3169 },
    "CZK": { "2022": 23.38, "2023": 22.21, "2024": 23.21, "2025": 21.91 },
    "HUF": { "2022": 373.02, "2023": 353.36, "2024": 365.30, "2025": 353.10 },
    "PLN": { "2022": 4.4614, "2023": 4.2030, "2024": 3.9789, "2025": 3.7600 },
    "RON": { "2022": 4.6917, "2023": 4.5763, "2024": 4.5968, "2025": 4.4707 },
    "CHF": { "2022": 1.0472, "2023": 1.1123, "2024": 1.1361, "2025": 1.2029 },
    "KRW": { "2022": 1292.0, "2023": 1305.4, "2024": 1365.2, "2025": 1421.5 }
};

let chartViewMode = '2026'; // '2026' or '5yr'

function calc2026YtdAverage(data) {
    if (!data || !data.records) return null;
    const records = data.records;
    const monthlyAvgs = records.filter(r => r.type === 'monthly_avg' && r.label && r.label.includes('2026년'));
    const dailySep = records.filter(r => r.type === 'daily' && r.date && r.date.startsWith('2026-09'));
    let sepAvg = data.cumulative_average;
    if (!sepAvg && dailySep.length > 0) {
        sepAvg = dailySep.reduce((a, b) => a + b.rate, 0) / dailySep.length;
    }
    const allRates = monthlyAvgs.map(r => r.rate);
    if (sepAvg) allRates.push(sepAvg);
    if (allRates.length === 0) return data.cumulative_average || null;
    return parseFloat((allRates.reduce((a, b) => a + b, 0) / allRates.length).toFixed(4));
}

function updateChart(data, commentary) {
    if (chartViewMode === '5yr') {
        render5YrChart(data);
    } else {
        render2026Chart(data, commentary);
    }
}

function render5YrChart(data) {
    const ctx = document.getElementById('rateTrendChart').getContext('2d');
    const currency = data.currency;
    const fmt = data.format;
    const hist = HISTORICAL_5YR_RATES[currency] || {};
    const ytdRate = calc2026YtdAverage(data) || data.cumulative_average;

    const mainTitleEl = document.getElementById('chart-main-title');
    const subInfoEl = document.getElementById('chart-sub-info');
    if (mainTitleEl) mainTitleEl.textContent = `${data.name} 최근 5개년 연평균 추이`;
    if (subInfoEl) subInfoEl.textContent = '* 2022~2025년은 확정 연평균, 2026년은 1~9월 연간 누적평균(YTD)';

    const labels = ["2022년", "2023년", "2024년", "2025년", "2026년 (YTD)"];
    const chartRates = [hist["2022"] || null, hist["2023"] || null, hist["2024"] || null, hist["2025"] || null, ytdRate];

    if (trendChart) {
        trendChart.destroy();
    }

    const formatValue = (val) => {
        if (val === null || val === undefined) return "";
        if (fmt && fmt.includes(".2f")) {
            return val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (fmt && fmt.includes(".4f")) {
            return val.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        } else if (fmt && fmt.includes(".3f")) {
            return val.toLocaleString('ko-KR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        } else if (fmt && fmt.includes(".0f")) {
            return Math.round(val).toLocaleString('ko-KR');
        }
        return val.toString();
    };

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '연평균 환율 (Annual Avg / YTD)',
                    data: chartRates,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.08)',
                    fill: true,
                    borderWidth: 2.5,
                    pointRadius: [6, 6, 6, 6, 9],
                    pointHoverRadius: [8, 8, 8, 8, 11],
                    pointBackgroundColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#0d9488'],
                    pointBorderColor: ['#0d9488', '#0d9488', '#0d9488', '#0d9488', '#ffffff'],
                    pointBorderWidth: [2.5, 2.5, 2.5, 2.5, 3],
                    tension: 0.25
                }
            ]
        },
        plugins: [
            {
                id: 'customDataLabels',
                afterDatasetsDraw(chart) {
                    const c = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    meta.data.forEach((point, idx) => {
                        const val = chartRates[idx];
                        if (val === null || val === undefined) return;
                        const text = formatValue(val);
                        c.save();
                        c.font = (idx === 4) ? 'bold 12px Inter, sans-serif' : '600 11px Inter, sans-serif';
                        c.fillStyle = (idx === 4) ? '#0d9488' : '#334155';
                        c.textAlign = 'center';
                        c.textBaseline = 'bottom';
                        c.fillText(text, point.x, point.y - 10);
                        c.restore();
                    });
                }
            }
        ],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 15,
                        font: { size: 11, family: 'Inter' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y;
                            const isYtd = (context.dataIndex === 4);
                            return `${context.dataset.label}: ${formatValue(val)} ${isYtd ? '(2026년 1~9월 YTD 누적)' : '(확정 연평균)'}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, family: 'Inter', weight: '500' }
                    }
                },
                y: {
                    grid: { color: '#f1f3f4' },
                    ticks: {
                        font: { size: 10, family: 'Inter' },
                        callback: function(value) {
                            return formatValue(value);
                        }
                    }
                }
            }
        }
    });
}

function render2026Chart(data, commentary) {
    const mainTitleEl = document.getElementById('chart-main-title');
    const subInfoEl = document.getElementById('chart-sub-info');
    if (mainTitleEl) mainTitleEl.textContent = '환율 추이 및 전망 시각화 (Forecast Trend)';
    if (subInfoEl) subInfoEl.textContent = '* 점선(Dashed)은 당월 말 및 4Q 예측선';

    const ctx = document.getElementById('rateTrendChart').getContext('2d');
    const records = data.records;
    const fmt = data.format;
    const forecast = commentary.forecast || { june_late: 0, q3_avg: 0, q4_avg: 0 };
    
    const labels = [];
    const historicalData = [];
    const forecastData = [];
    
    // Process historical records
    records.forEach(r => {
        // Shorten labels for better axis layout
        const shortLabel = r.label.replace("2026년 ", "").replace("2026-", "");
        labels.push(shortLabel);
        historicalData.push(r.rate);
        forecastData.push(null);
    });
    
    // Connect forecast to the last historical point if available
    if (historicalData.length > 0) {
        forecastData[historicalData.length - 1] = historicalData[historicalData.length - 1];
    }
    
    // Add forecast points
    if (forecast.month_end !== undefined || forecast.june_late !== undefined) {
        labels.push("9월말(전망)");
        historicalData.push(null);
        forecastData.push(forecast.month_end || forecast.june_late);
    }
    if (forecast.m10 !== undefined) {
        labels.push("10월(전망)");
        historicalData.push(null);
        forecastData.push(forecast.m10);
    }
    if (forecast.m11 !== undefined) {
        labels.push("11월(전망)");
        historicalData.push(null);
        forecastData.push(forecast.m11);
    }
    if (forecast.m12 !== undefined) {
        labels.push("12월(전망)");
        historicalData.push(null);
        forecastData.push(forecast.m12);
    }
    if (forecast.q4_avg !== undefined) {
        labels.push("4Q평균(전망)");
        historicalData.push(null);
        forecastData.push(forecast.q4_avg);
    }
    
    // Destroy existing chart to prevent rendering overlap
    if (trendChart) {
        trendChart.destroy();
    }
    
    const formatValue = (val) => {
        if (val === null || val === undefined) return "";
        if (fmt && fmt.includes(".2f")) {
            return val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (fmt && fmt.includes(".4f")) {
            return val.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        }
        return val.toString();
    };
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '실적 환율 (Historical)',
                    data: historicalData,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.04)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#1a73e8',
                    tension: 0.1,
                    spanGaps: true
                },
                {
                    label: '전망 환율 (Forecast)',
                    data: forecastData,
                    borderColor: '#d93025',
                    borderDash: [6, 4],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointStyle: 'triangle',
                    pointBackgroundColor: '#d93025',
                    tension: 0.1,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 15,
                        font: { size: 11, family: 'Inter' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatValue(context.parsed.y);
                            }
                            // Append forecast source basis if it's the forecast dataset
                            if (context.datasetIndex === 1 && commentary.forecast && commentary.forecast.source) {
                                label += ` (근거: ${commentary.forecast.source})`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 10, family: 'Inter' },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: { color: '#f1f3f4' },
                    ticks: {
                        font: { size: 10, family: 'Inter' }
                    }
                }
            }
        }
    });
}

// Helper to dynamically generate and rollover offline data up to today
function getDynamicOfflineData(currencyCode) {
    const rawData = OFFLINE_DB[currencyCode];
    if (!rawData) return null;
    
    // Deep copy records
    const baseRecords = JSON.parse(JSON.stringify(rawData.records));
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentDay = now.getDate();
    
    let monthlyRecords = baseRecords.filter(r => r.type === 'monthly_avg');
    let dailyRecords = baseRecords.filter(r => r.type === 'daily');
    
    dailyRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let lastRate = dailyRecords.length > 0 ? dailyRecords[dailyRecords.length - 1].rate : 1.0;
    
    const startYear = 2026;
    const startMonth = 9;
    
    let simulatedDaily = [];
    let year = startYear;
    let month = startMonth;
    
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        const isCurrentMonth = (year === currentYear && month === currentMonth);
        const lastDayOfSimMonth = isCurrentMonth ? currentDay : new Date(year, month, 0).getDate();
        
        let monthRates = [];
        let monthDailyRecords = [];
        
        for (let day = 1; day <= lastDayOfSimMonth; day++) {
            const dateObj = new Date(year, month - 1, day);
            const weekday = dateObj.getDay();
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const existing = dailyRecords.find(r => r.date === dateStr);
            let rateVal;
            if (existing) {
                rateVal = existing.rate;
                lastRate = rateVal;
            } else if (weekday === 0 || weekday === 6) {
                // Weekend: carry over Friday's rate
                rateVal = lastRate;
            } else {
                // Simulate realistic daily change
                const daySeed = (day * 17) % 31;
                const changePct = (daySeed - 15) * 0.001; // -1.5% to +1.5%
                rateVal = lastRate * (1.0 + changePct);
                lastRate = rateVal;
            }
            
            monthRates.push(rateVal);
            monthDailyRecords.push({
                label: dateStr,
                date: dateStr,
                type: "daily",
                rate: parseFloat(rateVal.toFixed(6))
            });
        }
        
        if (isCurrentMonth) {
            simulatedDaily = monthDailyRecords;
        } else {
            if (monthRates.length > 0) {
                const avg = monthRates.reduce((a, b) => a + b, 0) / monthRates.length;
                const labelStr = `${year}년 ${String(month).padStart(2, '0')}월 평균`;
                const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
                if (!monthlyRecords.some(r => r.label === labelStr)) {
                    monthlyRecords.push({
                        label: labelStr,
                        date: dateStr,
                        type: "monthly_avg",
                        rate: parseFloat(avg.toFixed(6))
                    });
                }
            }
        }
        
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    
    const finalRecords = [...monthlyRecords, ...simulatedDaily];
    finalRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const currentMonthRates = simulatedDaily.map(r => r.rate);
    const cumAvg = currentMonthRates.length > 0 
        ? currentMonthRates.reduce((a, b) => a + b, 0) / currentMonthRates.length 
        : lastRate;
        
    return {
        currency: currencyCode,
        name: rawData.name,
        symbol: rawData.symbol,
        format: rawData.format,
        records: finalRecords,
        cumulative_average: parseFloat(cumAvg.toFixed(6))
    };
}

// Fetch Exchange Rates and Populate Dashboard
async function loadRates(currencyCode) {
    rateTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">데이터를 불러오는 중입니다...</td>
        </tr>
    `;
    
    try {
        let data = null;
        if (!useOfflineFallback) {
            const res = await fetch(`${API_BASE}/rates/${currencyCode}`).catch(() => null);
            if (res && res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    useOfflineFallback = true;
                    updateFooterStatus();
                }
            } else {
                useOfflineFallback = true;
                updateFooterStatus();
            }
        }
        
        if (useOfflineFallback || !data) {
            console.log(`Using Offline Database (with dynamic rollover) for ${currencyCode}`);
            data = getDynamicOfflineData(currencyCode);
        }
        
        currentData = data;
        
        // Update Title & Profile Info
        selectedNameEl.textContent = data.name;
        selectedSymbolEl.textContent = `${data.symbol} 실시간 대시보드`;
        
        const records = data.records;
        const fmt = data.format;
        
        // Extract and Render Commentary
        // Always prioritize fresh server commentary when available
        let commentary = data.commentary;
        if (!commentary) {
            const localSaved = localStorage.getItem(`commentary_${currencyCode}`);
            if (localSaved) {
                try {
                    commentary = JSON.parse(localSaved);
                } catch(e) {}
            }
        }
        if (!commentary) {
            commentary = OFFLINE_COMMENTARIES[currencyCode] || {
                "macro_commentary": "환율 동향 분석 데이터가 없습니다. 편집기를 통해 입력해 주세요.",
                "forecast": { "month_end": 0.0, "m10": 0.0, "m11": 0.0, "m12": 0.0, "q3_avg": 0.0, "q4_avg": 0.0, "source": "Bloomberg Consensus" }
            };
        }
        
        // Save current commentary into data object for editor usage
        data.commentary = commentary;
        
        // Render Commentary card texts
        let macroText = commentary.macro_commentary || "";
        macroText = macroText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        textMacroDrivers.innerHTML = macroText;
        
        // Render Forecast Source basis
        const sourceText = (commentary.forecast && commentary.forecast.source) ? commentary.forecast.source : "Bloomberg Consensus";
        textForecastSource.textContent = sourceText;
        
        // Render Interactive Chart
        updateChart(data, commentary);
        renderMonthlyForecastCard(data, commentary);
        
        // 1. Get Previous Month Monthly Average
        const dailyRecords = records.filter(r => r.type === "daily");
        let currentMonthNum = 9; // default fallback
        if (dailyRecords.length > 0) {
            const latestDate = dailyRecords[dailyRecords.length - 1].date; // "2026-07-06"
            currentMonthNum = parseInt(latestDate.split('-')[1]); // 7
        }
        const prevMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
        const prevMonthLabel = `2026년 ${prevMonthNum < 10 ? '0' + prevMonthNum : prevMonthNum}월 평균`;
        const prevRecord = records.find(r => r.label === prevMonthLabel);
        const prevRate = prevRecord ? prevRecord.rate : null;
        cardMayAvg.textContent = prevRate ? formatRate(prevRate, fmt) : "-";
        
        // Update subtext to dynamically reflect the previous month name
        const cardMayAvgSub = cardMayAvg.nextElementSibling;
        if (cardMayAvgSub) {
            cardMayAvgSub.textContent = `${prevMonthNum}월 월간 실적 평균`;
        }
        
        // 2. Get Daily Records
        // (dailyRecords has already been declared above)
        
        // 3. Get Latest Rate from Daily records
        if (dailyRecords.length > 0) {
            const latest = dailyRecords[dailyRecords.length - 1];
            cardLatestRate.textContent = formatRate(latest.rate, fmt);
            cardLatestDate.textContent = `${latest.label} 고시 기준`;
        } else {
            cardLatestRate.textContent = "-";
            cardLatestDate.textContent = "일별 데이터 없음";
        }
        
        // 4. Get Cumulative Average
        cardJuneAvg.textContent = formatRate(data.cumulative_average, fmt);
        
        // Render Table Rows
        rateTableBody.innerHTML = '';
        
        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.className = `row-${r.type}`;
            
            let tagHtml = '';
            if (r.type === 'monthly_avg') {
                tagHtml = `<span class="tag-monthly">월간 평균</span>`;
            } else if (r.origin === 'ecb') {
                tagHtml = `<span class="tag-ecb">ECB 실시간</span>`;
            } else if (r.origin === 'official') {
                tagHtml = `<span class="tag-official">공식 실적</span>`;
            } else if (r.type === 'daily') {
                tagHtml = `<span class="tag-daily">일별 환율</span>`;
            }
            
            tr.innerHTML = `
                <td>${r.label}</td>
                <td class="text-right">${formatRate(r.rate, fmt)}</td>
                <td>${data.symbol}</td>
                <td>${tagHtml}</td>
            `;
            rateTableBody.appendChild(tr);
        });
        
        // 5. Append Cumulative Average Row (Highlighted Bold)
        const cumRow = document.createElement('tr');
        cumRow.className = 'row-cumulative_avg';
        cumRow.innerHTML = `
            <td>당월(${currentMonthNum}월) 누적 평균 실적</td>
            <td class="text-right">${formatRate(data.cumulative_average, fmt)}</td>
            <td>${data.symbol}</td>
            <td><span class="tag-cum-avg">누적 평균</span></td>
        `;
        rateTableBody.appendChild(cumRow);
        
    } catch (err) {
        console.error("Error loading rates:", err);
        rateTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center" style="color: var(--google-red); padding: 40px 0;">
                    <span class="material-icons-outlined" style="font-size: 48px; display: block; margin-bottom: 8px;">error_outline</span>
                    데이터 로드 실패: ${err.message}
                </td>
            </tr>
        `;
    }
}

// Switch Active Currency
function switchCurrency(code) {
    currentCurrency = code;
    loadRates(code);
}

// Offline/Client-side Q&A Processing Engine (Runs directly in browser if backend fails)
function processClientQuery(queryText) {
    queryText = queryText.trim().toLowerCase();
    
    // Match currency
    let matchedCode = null;
    const currencyTerms = {
        "EUR": ["eur", "유로", "euro"],
        "GBP": ["gbp", "파운드", "pound"],
        "CZK": ["czk", "코루나", "koruna"],
        "HUF": ["huf", "포린트", "forint"],
        "PLN": ["pln", "즈로티", "zloty"],
        "RON": ["ron", "레우", "leu"],
        "CHF": ["chf", "프랑", "franc", "스위스"],
        "KRW": ["krw", "원화", "원", "대한민국", "won"]
    };
    
    for (const [code, terms] of Object.entries(currencyTerms)) {
        for (const term of terms) {
            if (queryText.includes(term)) {
                matchedCode = code;
                break;
            }
        }
        if (matchedCode) break;
    }
    
    if (!matchedCode) {
        for (const code of Object.keys(OFFLINE_DB)) {
            if (queryText.toUpperCase().includes(code)) {
                matchedCode = code;
                break;
            }
        }
    }
    
    if (!matchedCode) {
        return {
            answer: "질문에서 대상 통화(EUR, GBP, CZK, HUF, PLN, RON, CHF, KRW 등)를 식별할 수 없습니다. 통화명을 포함하여 질문해 주세요! (예: '지난달 EUR 평균 환율은?')"
        };
    }
    
    const db = OFFLINE_DB[matchedCode];
    const fmt = db.format;
    
    // Match queries
    const isAverage = queryText.includes("평균") || queryText.includes("평균환율");
    const isLastMonth = queryText.includes("지난달") || queryText.includes("지난 달") || queryText.includes("5월") || queryText.includes("전월");
    const isFluctuation = queryText.includes("변동") || queryText.includes("가장 컸던") || queryText.includes("변동폭") || queryText.includes("변동이 심했던");
    const isPeak = queryText.includes("최고") || queryText.includes("가장 높은");
    const isTrough = queryText.includes("최저") || queryText.includes("가장 낮은");
    
    if (isAverage) {
        if (isLastMonth) {
            const record = db.records.find(r => r.label === "2026년 05월 평균");
            if (record) {
                return {
                    answer: `2026년 5월(지난달) **${matchedCode}** 평균 환율은 **${formatRate(record.rate, fmt)}** (${db.symbol} 기준) 입니다.`,
                    currency: matchedCode
                };
            }
        }
        // Check for specific months
        for (let m = 1; m <= 5; m++) {
            if (queryText.includes(`${m}월`)) {
                const record = db.records.find(r => r.label === `2026년 ${String(m).padStart(2, '0')}월 평균`);
                if (record) {
                    return {
                        answer: `2026년 ${m}월 **${matchedCode}** 평균 환율은 **${formatRate(record.rate, fmt)}** (${db.symbol} 기준) 입니다.`,
                        currency: matchedCode
                    };
                }
            }
        }
        
        // Default cumulative average
        return {
            answer: `당월(6월 누적) **${matchedCode}** 평균 환율은 **${formatRate(db.cumulative_average, fmt)}** (${db.symbol} 기준) 입니다.`,
            currency: matchedCode
        };
    }
    
    if (isFluctuation) {
        const daily = db.records.filter(r => r.type === "daily");
        let maxDiff = -1.0;
        let maxDate = null;
        for (let i = 1; i < daily.length; i++) {
            const diff = Math.abs(daily[i].rate - daily[i-1].rate);
            if (diff > maxDiff) {
                maxDiff = diff;
                maxDate = daily[i].label;
            }
        }
        if (maxDate) {
            const dayRate = daily.find(r => r.label === maxDate).rate;
            return {
                answer: `최근 **${matchedCode}** 변동 폭이 가장 컸던 날은 **${maxDate}** 이며, 전일 대비 변동폭은 **${formatRate(maxDiff, fmt)}** (당일 환율: ${formatRate(dayRate, fmt)} ${db.symbol}) 입니다.`,
                currency: matchedCode
            };
        }
    }
    
    if (isPeak || isTrough) {
        const daily = db.records.filter(r => r.type === "daily");
        if (isPeak) {
            const peak = daily.reduce((max, r) => r.rate > max.rate ? r : max, daily[0]);
            return {
                answer: `당월(9월) **${matchedCode}** 최고 환율은 **${peak.label}**에 기록된 **${formatRate(peak.rate, fmt)}** (${db.symbol}) 입니다.`,
                currency: matchedCode
            };
        } else {
            const trough = daily.reduce((min, r) => r.rate < min.rate ? r : min, daily[0]);
            return {
                answer: `당월(9월) **${matchedCode}** 최저 환율은 **${trough.label}**에 기록된 **${formatRate(trough.rate, fmt)}** (${db.symbol}) 입니다.`,
                currency: matchedCode
            };
        }
    }
    
    // Default latest rate
    const daily = db.records.filter(r => r.type === "daily");
    const latest = daily[daily.length - 1];
    return {
        answer: `현재 **${matchedCode}**의 가장 최근 환율 데이터(${latest.label})는 **${formatRate(latest.rate, fmt)}** (${db.symbol}) 입니다.`,
        currency: matchedCode
    };
}

// Execute AI Search Q&A
async function executeSearch() {
    const queryText = aiSearchInput.value.trim();
    if (!queryText) return;
    
    aiAnswerCard.classList.remove('hidden');
    aiAnswerText.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div class="nav-skeleton" style="width: 100%; height: 24px; margin: 0;"></div>
        </div>
    `;
    
    let answerData = null;
    
    // 1. Try backend API query
    if (!useOfflineFallback) {
        try {
            const res = await fetch(`${API_BASE}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText })
            }).catch(() => null);
            if (res && res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    answerData = await res.json();
                } else {
                    useOfflineFallback = true;
                    updateFooterStatus();
                }
            } else {
                useOfflineFallback = true;
                updateFooterStatus();
            }
        } catch (err) {
            useOfflineFallback = true;
            updateFooterStatus();
            console.log("API Query failed, falling back to Client-side Search Engine.");
        }
    }
    
    // 2. Failover to Client Q&A Engine
    if (useOfflineFallback || !answerData) {
        answerData = processClientQuery(queryText);
    }
    
    // Render Q&A Box
    let formattedAnswer = answerData.answer;
    formattedAnswer = formattedAnswer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    aiAnswerText.innerHTML = formattedAnswer;
    
    // Auto switch sidebar tab if currency was parsed
    if (answerData.currency && answerData.currency !== currentCurrency) {
        const currencyItems = document.querySelectorAll('.currency-item');
        currencyItems.forEach(item => {
            if (item.dataset.code === answerData.currency) {
                currencyItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                switchCurrency(answerData.currency);
            }
        });
    }
}

// Export Table Data to CSV
function exportToCSV() {
    if (!currentData) return;
    
    const fmt = currentData.format;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper Korean rendering in Excel
    csvContent += "구분 (기간/일자),환율,표시 단위,데이터 구분\n";
    
    currentData.records.forEach(r => {
        const typeLabel = r.type === 'monthly_avg' ? '월간 평균' : '일별 환율';
        csvContent += `"${r.label}",${r.rate},"${currentData.symbol}","${typeLabel}"\n`;
    });
    
    csvContent += `"당월(9월) 누적 평균 실적",${currentData.cumulative_average},"${currentData.symbol}","누적 평균"\n`;
    
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FxTracker_${currentCurrency}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
    loadRates(currentCurrency);
});

exportCsvBtn.addEventListener('click', exportToCSV);
aiSearchBtn.addEventListener('click', executeSearch);
aiSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
});
closeAiAnswer.addEventListener('click', () => {
    aiAnswerCard.classList.add('hidden');
    aiSearchInput.value = '';
});

// Commentary Editor Events
if (editCommentaryBtn) editCommentaryBtn.addEventListener('click', () => {
    if (!currentData) return;
    
    const commentary = currentData.commentary || {};
    
    inputMacroCommentary.value = commentary.macro_commentary || "";
    
    const fc = commentary.forecast || { june_late: 0, q3_avg: 0, q4_avg: 0, source: "" };
    inputForecastSource.value = fc.source || "Bloomberg Consensus";
    inputForecastJune.value = (fc.month_end || fc.june_late) || 0;
    inputForecastQ3.value = fc.q3_avg || 0;
    inputForecastQ4.value = fc.q4_avg || 0;
    
    document.getElementById('editor-title-text').textContent = `${currentCurrency} 환율 동향 및 전망 편집`;
    editorCard.classList.remove('hidden');
    editorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function hideEditor() {
    editorCard.classList.add('hidden');
    editorForm.reset();
}

if (closeEditorBtn) closeEditorBtn.addEventListener('click', hideEditor);
if (cancelEditBtn) cancelEditBtn.addEventListener('click', hideEditor);

if (editorForm) editorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        macro_commentary: inputMacroCommentary.value.trim(),
        forecast: {
            month_end: parseFloat(inputForecastJune.value),
            june_late: parseFloat(inputForecastJune.value),
            q3_avg: parseFloat(inputForecastQ3.value),
            q4_avg: parseFloat(inputForecastQ4.value),
            source: inputForecastSource.value.trim()
        }
    };
    
    // Always save to localStorage for fallback robustness
    localStorage.setItem(`commentary_${currentCurrency}`, JSON.stringify(payload));
    
    let serverSuccess = false;
    
    if (!useOfflineFallback) {
        try {
            const res = await fetch(`${API_BASE}/commentary/${currentCurrency}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                serverSuccess = true;
                console.log(`Saved commentary for ${currentCurrency} to server.`);
            } else {
                console.log("Server save failed. Saved locally in browser.");
            }
        } catch (err) {
            console.log("Network error saving to server. Saved locally.", err);
        }
    }
    
    hideEditor();
    
    // Update local currentData model instantly
    if (currentData) {
        currentData.commentary = payload;
    }
    
    // Reload rates for display and chart refreshing
    loadRates(currentCurrency);
    
    const statusMsg = serverSuccess 
        ? "분석 및 전망 데이터가 서버와 로컬에 모두 성공적으로 저장되었습니다." 
        : "로컬 브라우저에 저장되었습니다. (오프라인/파일 직접 실행 모드)";
    alert(statusMsg);
});

// Official Rates Ingestion Modal Events
if (officialRateUploadBtn && officialRateModal) {
    if (officialRateUploadBtn) officialRateUploadBtn.addEventListener('click', () => {
        officialRateModal.classList.remove('hidden');
        officialRateModal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        inputOfficialPaste.focus();
    });

    if (closeOfficialModalBtn) closeOfficialModalBtn.addEventListener('click', () => {
        officialRateModal.classList.add('hidden');
        officialPreviewContainer.classList.add('hidden');
    });

    if (btnCancelPreview) btnCancelPreview.addEventListener('click', () => {
        officialRateModal.classList.add('hidden');
        officialPreviewContainer.classList.add('hidden');
    });

    if (btnParsePreview) btnParsePreview.addEventListener('click', async () => {
        const text = inputOfficialPaste.value.trim();
        if (!text) {
            alert('사내 환율 공지 표 텍스트를 먼저 붙여넣어 주세요.');
            return;
        }

        btnParsePreview.disabled = true;
        btnParsePreview.innerHTML = '<span class="material-icons-outlined btn-icon">hourglass_empty</span>분석 중...';

        try {
            const res = await fetch(`${API_BASE}/admin/parse-official-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const parsed = await res.json();
            if (!res.ok || parsed.status === 'error') {
                throw new Error(parsed.detail || parsed.message || '파싱에 실패했습니다.');
            }

            lastParsedData = parsed;

            // Render Preview Table
            previewSummaryBadge.textContent = `${parsed.currencies.length}개 통화 감지 (최신 일자: ${parsed.latest_daily_date || '미정'})`;
            
            // Table Header
            previewTableHead.innerHTML = `
                <tr>
                    <th>구분</th>
                    ${parsed.currencies.map(c => `<th class="text-right">${c}</th>`).join('')}
                </tr>
            `;

            // Table Body
            let rowsHtml = '';
            
            // 1~N Months
            const months = Object.keys(parsed.monthly_averages[parsed.currencies[0]] || {}).sort((a,b) => parseInt(a)-parseInt(b));
            months.forEach(m => {
                rowsHtml += `<tr><td><strong>${m}월 실적</strong></td>`;
                parsed.currencies.forEach(c => {
                    const val = parsed.monthly_averages[c][m];
                    rowsHtml += `<td class="text-right">${val !== undefined ? val : '-'}</td>`;
                });
                rowsHtml += '</tr>';
            });

            // Daily Records
            const sampleDaily = parsed.daily_records[parsed.currencies[0]] || [];
            sampleDaily.forEach(dItem => {
                rowsHtml += `<tr><td>${dItem.date}</td>`;
                parsed.currencies.forEach(c => {
                    const cDaily = parsed.daily_records[c] || [];
                    const match = cDaily.find(d => d.date === dItem.date);
                    rowsHtml += `<td class="text-right">${match ? match.rate : '-'}</td>`;
                });
                rowsHtml += '</tr>';
            });

            // Cumulative average
            if (Object.keys(parsed.cumulative_averages).length > 0) {
                rowsHtml += `<tr style="background-color: #e8f0fe; font-weight: bold;"><td>누적 평균</td>`;
                parsed.currencies.forEach(c => {
                    rowsHtml += `<td class="text-right">${parsed.cumulative_averages[c] || '-'}</td>`;
                });
                rowsHtml += '</tr>';
            }

            // Month-end forecast
            if (Object.keys(parsed.month_end_forecast).length > 0) {
                rowsHtml += `<tr style="background-color: #fef7e0; font-weight: bold;"><td>월말 예상</td>`;
                parsed.currencies.forEach(c => {
                    rowsHtml += `<td class="text-right">${parsed.month_end_forecast[c] || '-'}</td>`;
                });
                rowsHtml += '</tr>';
            }

            previewTableBody.innerHTML = rowsHtml;
            officialPreviewContainer.classList.remove('hidden');

        } catch (err) {
            alert(`파싱 오류: ${err.message}`);
        } finally {
            btnParsePreview.disabled = false;
            btnParsePreview.innerHTML = '<span class="material-icons-outlined btn-icon">search</span>자동 파싱 및 미리보기';
        }
    });

    if (btnConfirmSaveOfficial) btnConfirmSaveOfficial.addEventListener('click', async () => {
        if (!lastParsedData) return;

        if (!confirm('파싱된 공식 환율 실적 데이터를 확정 저장하시겠습니까? 대시보드 데이터가 즉시 갱신됩니다.')) {
            return;
        }

        btnConfirmSaveOfficial.disabled = true;
        btnConfirmSaveOfficial.innerHTML = '<span class="material-icons-outlined btn-icon">hourglass_empty</span>저장 중...';

        try {
            const res = await fetch(`${API_BASE}/admin/save-official-rates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parsed_data: lastParsedData,
                    source_label: '사내 공식 환율 정보 (TV유럽영업2팀 F(x) Tracker 공지)'
                })
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.detail || '저장에 실패했습니다.');
            }

            alert(result.message || '공식 실적이 성공적으로 반영되었습니다.');
            officialRateModal.classList.add('hidden');
            officialPreviewContainer.classList.add('hidden');
            inputOfficialPaste.value = '';
            lastParsedData = null;

            // Reload dashboard data
            await loadCurrencies();
            await loadRates(currentCurrency);

        } catch (err) {
            alert(`저장 오류: ${err.message}`);
        } finally {
            btnConfirmSaveOfficial.disabled = false;
            btnConfirmSaveOfficial.innerHTML = '<span class="material-icons-outlined btn-icon">save</span>실적 확정 저장 및 대시보드 반영';
        }
    });
}

// Fetch live public rates from Frankfurter API to update simulated dates
async function fetchPublicRates() {
    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        // Fetch rates from June 30th to today relative to USD
        const url = `https://api.frankfurter.app/2026-06-30..${yyyy}-${mm}-${dd}?from=USD`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log("Successfully fetched public rates from Frankfurter API:", data);
            
            // Merge into local database
            mergePublicRates(data);
            
            // Re-render UI with newly merged rates
            loadCurrencies();
            loadRates(currentCurrency);
        }
    } catch (err) {
        console.error("Failed to fetch public rates from Frankfurter:", err);
    }
}

// Merge fetched rates into OFFLINE_DB, prioritizing manual/official historical entries
function mergePublicRates(apiData) {
    if (!apiData || !apiData.rates) return;
    
    const dates = Object.keys(apiData.rates).sort();
    
    for (const currencyCode of Object.keys(OFFLINE_DB)) {
        const db = OFFLINE_DB[currencyCode];
        
        dates.forEach(dateStr => {
            const rateObj = apiData.rates[dateStr];
            if (!rateObj) return;
            
            let rateVal = null;
            
            // For EUR and GBP, invert USD base rate
            if (currencyCode === 'EUR' || currencyCode === 'GBP') {
                const baseRate = rateObj[currencyCode];
                if (baseRate) {
                    rateVal = parseFloat((1 / baseRate).toFixed(6));
                }
            } else {
                // Otherwise use directly
                const baseRate = rateObj[currencyCode];
                if (baseRate) {
                    rateVal = parseFloat(baseRate.toFixed(6));
                }
            }
            
            if (rateVal === null) return;
            
            // Check if record already exists in OFFLINE_DB (do NOT overwrite official entries)
            const existingRecord = db.records.find(r => r.date === dateStr && r.type === 'daily');
            
            if (!existingRecord) {
                db.records.push({
                    label: dateStr,
                    date: dateStr,
                    type: "daily",
                    rate: rateVal
                });
            }
        });
        
        // Ensure chronological order
        db.records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Recalculate cumulative average
        const dailyRecords = db.records.filter(r => r.type === 'daily');
        const currentMonthRates = dailyRecords.map(r => r.rate);
        if (currentMonthRates.length > 0) {
            const cumAvg = currentMonthRates.reduce((a, b) => a + b, 0) / currentMonthRates.length;
            db.cumulative_average = parseFloat(cumAvg.toFixed(6));
        }
    }
}

// Init App
document.addEventListener('DOMContentLoaded', () => {
    checkAndMigrateStorage();
    checkProtocol();
    
    // Set real-time current date time based on user's system clock
    const localTime = new Date();
    const yyyy = localTime.getFullYear();
    const mm = String(localTime.getMonth() + 1).padStart(2, '0');
    const dd = String(localTime.getDate()).padStart(2, '0');
    const hh = String(localTime.getHours()).padStart(2, '0');
    const min = String(localTime.getMinutes()).padStart(2, '0');
    const ss = String(localTime.getSeconds()).padStart(2, '0');
    currentLocalTimeEl.textContent = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    
    // Configure share url footer
    const shareUrlEl = document.getElementById('share-url');
    if (shareUrlEl) {
        const currentUrl = window.location.origin;
        if (window.location.protocol === 'file:') {
            // Local file sharing
            shareUrlEl.removeAttribute('href');
            shareUrlEl.style.cursor = 'help';
            shareUrlEl.textContent = 'static.zip 폴더 전달 (더블클릭 실행)';
            shareUrlEl.title = '이 폴더를 압축해서 보내면 동료들이 서버 설치 없이 바로 index.html 더블클릭으로 쓸 수 있습니다.';
            
            const footerShare = document.querySelector('.footer-share');
            if (footerShare) {
                footerShare.innerHTML = '<span class="material-icons-outlined share-icon-mini">folder_zip</span> 간편 공유: <strong>static.zip 전달 (더블클릭 실행)</strong>';
            }
        } else {
            // Cloud deployment sharing (Render/Railway/Local Server)
            shareUrlEl.href = currentUrl;
            shareUrlEl.textContent = currentUrl;
            shareUrlEl.removeAttribute('title');
            shareUrlEl.style.cursor = 'pointer';
            
            const footerShare = document.querySelector('.footer-share');
            if (footerShare) {
                footerShare.innerHTML = `<span class="material-icons-outlined share-icon-mini">share</span> 사내 공유: <a id="share-url" href="${currentUrl}" target="_blank" style="color: var(--google-blue); font-weight: 600; text-decoration: none;">${currentUrl}</a>`;
            }
        }
    }
    
    loadCurrencies();
    loadRates(currentCurrency);
    
    // Asynchronously fetch live public rates to update simulated/missing dates
    fetchPublicRates();

    // Chart View Mode Toggle Event Listeners
    const btnView2026 = document.getElementById('btn-view-2026');
    const btnView5yr = document.getElementById('btn-view-5yr');
    if (btnView2026 && btnView5yr) {
        btnView2026.addEventListener('click', () => {
            if (chartViewMode === '2026') return;
            chartViewMode = '2026';
            btnView2026.classList.add('active');
            btnView5yr.classList.remove('active');
            if (currentData) {
                updateChart(currentData, currentData.commentary);
            }
        });

        btnView5yr.addEventListener('click', () => {
            if (chartViewMode === '5yr') return;
            chartViewMode = '5yr';
            btnView5yr.classList.add('active');
            btnView2026.classList.remove('active');
            if (currentData) {
                updateChart(currentData, currentData.commentary);
            }
        });
    }

});
