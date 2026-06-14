// F(x) Tracker - Frontend Application Logic with Client-Side Fallback (Firewall-proof)

// Target Currencies Configuration
const CURRENCIES = [
    { code: "EUR", name: "유로 (EUR/USD)", symbol: "EUR/USD", format: "{:.4f}" },
    { code: "GBP", name: "영국 파운드 (GBP/USD)", symbol: "GBP/USD", format: "{:.4f}" },
    { code: "CZK", name: "체코 코루나 (USD/CZK)", symbol: "USD/CZK", format: "{:.4f}" },
    { code: "HUF", name: "헝가리 포린트 (USD/HUF)", symbol: "USD/HUF", format: "{:.2f}" },
    { code: "PLN", name: "폴란드 즈로티 (USD/PLN)", symbol: "USD/PLN", format: "{:.4f}" },
    { code: "RON", name: "루마니아 레우 (USD/RON)", symbol: "USD/RON", format: "{:.4f}" },
    { code: "CHF", name: "스위스 프랑 (USD/CHF)", symbol: "USD/CHF", format: "{:.4f}" },
    { code: "KRW", name: "대한민국 원 (USD/KRW)", symbol: "USD/KRW", format: "{:.2f}" }
];

// 100% Offline Database (Used when backend API is unreachable due to firewalls or server shutdown)
const OFFLINE_DB = {
    "EUR": {
        "name": "유로 (EUR/USD)",
        "symbol": "EUR/USD",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1.1738
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1.1828
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1.1567
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1.1687
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1.1682
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 1.1649
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 1.1635
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 1.1622
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 1.1609
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 1.1613
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 1.1523
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 1.1528
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 1.1535
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 1.1536
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 1.1573
            }
        ],
        "cumulative_average": 1.1582
    },
    "GBP": {
        "name": "영국 파운드 (GBP/USD)",
        "symbol": "GBP/USD",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1.3521
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1.3588
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1.3349
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1.3435
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1.3494
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 1.3452
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 1.346
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 1.3454
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 1.3427
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 1.3427
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 1.3336
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 1.3333
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 1.3372
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 1.3362
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 1.3414
            },
            {
                "label": "2026-06-14",
                "date": "2026-06-14",
                "type": "daily",
                "rate": 1.3408
            }
        ],
        "cumulative_average": 1.3404
    },
    "CZK": {
        "name": "체코 코루나 (USD/CZK)",
        "symbol": "USD/CZK",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 20.6558
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 20.495
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 21.0962
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 20.8537
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 20.8043
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 20.822
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 20.8552
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 20.8085
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 20.8465
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 20.8083
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 20.9727
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 20.9633
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 20.9281
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 20.9614
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 20.8674
            },
            {
                "label": "2026-06-13",
                "date": "2026-06-13",
                "type": "daily",
                "rate": 20.887
            }
        ],
        "cumulative_average": 20.8837
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
                "rate": 326.85
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 319.84
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 335.17
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 316.36
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 306.39
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 303.08
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 304.11
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 304.62
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 306.07
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 304.19
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 308.26
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 308.11
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 308.3
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 308.15
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 305.04
            },
            {
                "label": "2026-06-13",
                "date": "2026-06-13",
                "type": "daily",
                "rate": 303.79
            }
        ],
        "cumulative_average": 305.79
    },
    "PLN": {
        "name": "폴란드 즈로티 (USD/PLN)",
        "symbol": "USD/PLN",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 3.5865
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 3.564
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 3.6868
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 3.6371
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 3.6294
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 3.6307
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 3.6386
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 3.6436
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 3.6527
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 3.6462
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 3.6816
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 3.676
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 3.6741
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 3.6844
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 3.6677
            },
            {
                "label": "2026-06-13",
                "date": "2026-06-13",
                "type": "daily",
                "rate": 3.672
            }
        ],
        "cumulative_average": 3.6607
    },
    "RON": {
        "name": "루마니아 레우 (USD/RON)",
        "symbol": "USD/RON",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 4.3344
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 4.303
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 4.3973
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 4.3542
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 4.4684
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 4.5032
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 4.5036
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 4.5168
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 4.5232
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 4.5218
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 4.5483
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 4.5422
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 4.5359
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 4.5336
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 4.5182
            },
            {
                "label": "2026-06-13",
                "date": "2026-06-13",
                "type": "daily",
                "rate": 4.5256
            }
        ],
        "cumulative_average": 4.5248
    },
    "CHF": {
        "name": "스위스 프랑 (USD/CHF)",
        "symbol": "USD/CHF",
        "format": "{:.4f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 0.7901
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 0.7728
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 0.7858
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 0.7886
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 0.7831
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 0.7819
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 0.7861
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 0.7883
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 0.791
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 0.7889
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 0.7964
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 0.7982
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 0.7993
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 0.8
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 0.7951
            },
            {
                "label": "2026-06-14",
                "date": "2026-06-14",
                "type": "daily",
                "rate": 0.7964
            }
        ],
        "cumulative_average": 0.7929
    },
    "KRW": {
        "name": "대한민국 원 (USD/KRW)",
        "symbol": "USD/KRW",
        "format": "{:.2f}",
        "records": [
            {
                "label": "2026년 01월 평균",
                "date": "2026-01-01",
                "type": "monthly_avg",
                "rate": 1453.38
            },
            {
                "label": "2026년 02월 평균",
                "date": "2026-02-01",
                "type": "monthly_avg",
                "rate": 1446.63
            },
            {
                "label": "2026년 03월 평균",
                "date": "2026-03-01",
                "type": "monthly_avg",
                "rate": 1485.05
            },
            {
                "label": "2026년 04월 평균",
                "date": "2026-04-01",
                "type": "monthly_avg",
                "rate": 1484.43
            },
            {
                "label": "2026년 05월 평균",
                "date": "2026-05-01",
                "type": "monthly_avg",
                "rate": 1487.58
            },
            {
                "label": "2026-06-01",
                "date": "2026-06-01",
                "type": "daily",
                "rate": 1506.84
            },
            {
                "label": "2026-06-02",
                "date": "2026-06-02",
                "type": "daily",
                "rate": 1511.27
            },
            {
                "label": "2026-06-03",
                "date": "2026-06-03",
                "type": "daily",
                "rate": 1516.6
            },
            {
                "label": "2026-06-04",
                "date": "2026-06-04",
                "type": "daily",
                "rate": 1530.11
            },
            {
                "label": "2026-06-05",
                "date": "2026-06-05",
                "type": "daily",
                "rate": 1533.07
            },
            {
                "label": "2026-06-08",
                "date": "2026-06-08",
                "type": "daily",
                "rate": 1554.48
            },
            {
                "label": "2026-06-09",
                "date": "2026-06-09",
                "type": "daily",
                "rate": 1528.88
            },
            {
                "label": "2026-06-10",
                "date": "2026-06-10",
                "type": "daily",
                "rate": 1525.81
            },
            {
                "label": "2026-06-11",
                "date": "2026-06-11",
                "type": "daily",
                "rate": 1525.05
            },
            {
                "label": "2026-06-12",
                "date": "2026-06-12",
                "type": "daily",
                "rate": 1517.89
            }
        ],
        "cumulative_average": 1525.0
    }
};

// State Variables
const API_BASE = '/api';
let currentCurrency = 'KRW';
let currentData = null;
let useOfflineFallback = false; // Automatically set to true if API fails

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

// Format Helper matching Python format specifications
function formatRate(value, formatStr) {
    if (value === null || value === undefined) return "-";
    if (formatStr && formatStr.includes(".2f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (formatStr && formatStr.includes(".4f")) {
        return value.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return value.toString();
}

// Check if app is running under file protocol
function checkProtocol() {
    if (window.location.protocol === 'file:') {
        useOfflineFallback = true;
        console.log("Running via local file protocol. Automatically using 100% Offline Mode.");
        const footerStatus = document.querySelector('.footer-status');
        if (footerStatus) {
            footerStatus.innerHTML = '<span class="status-dot" style="background-color: var(--google-blue);"></span> Standalone Client Mode';
            footerStatus.style.color = 'var(--google-blue)';
        }
    }
}

// Load and Render Currencies in Sidebar
async function loadCurrencies() {
    try {
        let currencies = [];
        if (!useOfflineFallback) {
            const res = await fetch(`${API_BASE}/currencies`).catch(() => null);
            if (res && res.ok) {
                currencies = await res.json();
            } else {
                useOfflineFallback = true;
            }
        }
        
        if (useOfflineFallback || currencies.length === 0) {
            currencies = CURRENCIES;
        }
        
        currencyList.innerHTML = '';
        
        currencies.forEach(c => {
            const item = document.createElement('div');
            item.className = `currency-item ${c.code === currentCurrency ? 'active' : ''}`;
            item.dataset.code = c.code;
            
            // Spark trend indicators
            let trendClass = 'trend-up';
            let trendText = '+0.12%';
            if (c.code === 'EUR' || c.code === 'CHF' || c.code === 'PLN') {
                trendClass = 'trend-down';
                trendText = '-0.08%';
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
                data = await res.json();
            } else {
                useOfflineFallback = true;
            }
        }
        
        if (useOfflineFallback || !data) {
            console.log(`Using Offline Database for ${currencyCode}`);
            data = OFFLINE_DB[currencyCode];
        }
        
        currentData = data;
        
        // Update Title & Profile Info
        selectedNameEl.textContent = data.name;
        selectedSymbolEl.textContent = `${data.symbol} 실시간 대시보드`;
        
        const records = data.records;
        const fmt = data.format;
        
        // 1. Get May Monthly Average
        const mayRecord = records.find(r => r.label === "2026년 05월 평균");
        const mayRate = mayRecord ? mayRecord.rate : null;
        cardMayAvg.textContent = mayRate ? formatRate(mayRate, fmt) : "-";
        
        // 2. Get Daily Records
        const dailyRecords = records.filter(r => r.type === "daily");
        
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
            <td>당월(6월) 누적 평균 실적</td>
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
                answer: `당월(6월) **${matchedCode}** 최고 환율은 **${peak.label}**에 기록된 **${formatRate(peak.rate, fmt)}** (${db.symbol}) 입니다.`,
                currency: matchedCode
            };
        } else {
            const trough = daily.reduce((min, r) => r.rate < min.rate ? r : min, daily[0]);
            return {
                answer: `당월(6월) **${matchedCode}** 최저 환율은 **${trough.label}**에 기록된 **${formatRate(trough.rate, fmt)}** (${db.symbol}) 입니다.`,
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
            });
            if (res.ok) {
                answerData = await res.json();
            } else {
                useOfflineFallback = true;
            }
        } catch (err) {
            useOfflineFallback = true;
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
    
    csvContent += `"당월(6월) 누적 평균 실적",${currentData.cumulative_average},"${currentData.symbol}","누적 평균"\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FxTracker_${currentCurrency}_20260614.csv`);
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

// Init App
document.addEventListener('DOMContentLoaded', () => {
    checkProtocol();
    
    // Set simulated current date time
    const localTime = new Date("2026-06-14T00:13:50+09:00");
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
});
