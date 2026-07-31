import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from main import app

if __name__ == "__main__":
    # hedej가 환경 변수로 포트를 주입해 줄 수도 있으므로 PORT 변수를 우선 사용하고, 기본값은 8501로 잡습니다.
    port = int(os.environ.get("PORT", 8501))
    print(f"Starting FastAPI via app.py on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

