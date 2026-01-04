"""
Kongdan 백엔드 서버
- 챗봇: Vertex AI Gemini 2.0
- TTS: Vertex AI Gemini 2.5 Native TTS
"""

import os
import json
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

# ===== 설정 =====
PORT = 3001
PROJECT_ID = "affable-grin-482008-e4"
LOCATION = "us-central1"

# 서비스 계정 키 파일 설정
CREDENTIALS_FILE = Path(__file__).parent.parent / "affable-grin-482008-e4-f817e80887ef.json"
if CREDENTIALS_FILE.exists():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(CREDENTIALS_FILE)
    print(f"🔑 인증 파일 로드: {CREDENTIALS_FILE.name}")

# Gemini 클라이언트 초기화
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION
    )
    print("✅ Vertex AI 연결 완료")
except ImportError:
    print("❌ google-genai 패키지 필요: pip install google-genai")
    client = None

# ===== 챗봇 시스템 프롬프트 =====
CHATBOT_SYSTEM_PROMPT = """넌 영어를 가르치는 친한 친구야. 이름은 "콩쌤".

규칙:
- 반말로 짧게 답해 (1-2문장)
- 핵심만 딱 말해, 설명 길게 X
- "그냥 외워", "이건 걍 공식임" 이런 식으로 직설적으로
- 필요하면 예문 1개만

예시:
Q: 왜 I'm going to 써?
A: 그냥 외워ㅋ "I'm going to + 동사원형" = ~할 거야. 예: I'm going to eat. (먹을 거야)

Q: would랑 could 차이?
A: would는 "~할 텐데", could는 "~할 수 있을 텐데". would가 더 확실한 느낌!

절대 길게 설명하지 마. 친구한테 카톡하듯이 짧게!"""


class RequestHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_cors_headers()
        self.send_response(204)
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/api/health':
            self.send_json({'status': 'ok', 'gemini': client is not None})
        else:
            self.send_error(404)
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
        except:
            self.send_json({'error': 'Invalid JSON'}, 400)
            return
        
        if self.path == '/api/chat':
            self.handle_chat(data)
        else:
            self.send_error(404)
    
    def handle_chat(self, data):
        """챗봇 API - Vertex AI Gemini"""
        if not client:
            self.send_json({'error': 'Gemini not configured'}, 500)
            return
        
        message = data.get('message', '')
        history = data.get('history', [])
        
        if not message:
            self.send_json({'error': 'Message required'}, 400)
            return
        
        try:
            # 대화 기록 구성
            contents = []
            for h in history:
                role = 'user' if h.get('role') == 'user' else 'model'
                contents.append(types.Content(role=role, parts=[types.Part(text=h.get('text', ''))]))
            
            # 현재 메시지 추가
            contents.append(types.Content(role='user', parts=[types.Part(text=message)]))
            
            # Gemini 호출
            response = client.models.generate_content(
                model="gemini-2.0-flash",  # 최신 모델
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=CHATBOT_SYSTEM_PROMPT,
                    max_output_tokens=500,
                    temperature=0.7
                )
            )
            
            # 응답 추출
            if response.candidates and response.candidates[0].content.parts:
                reply = response.candidates[0].content.parts[0].text
                self.send_json({'reply': reply})
            else:
                self.send_json({'error': 'No response'}, 500)
                
        except Exception as e:
            print(f"❌ Chat error: {e}")
            self.send_json({'error': str(e)}, 500)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {args[0]}")


if __name__ == '__main__':
    print(f"🚀 Kongdan 백엔드 서버 시작: http://localhost:{PORT}")
    print(f"📝 챗봇 API: POST /api/chat {{ message: '...', history: [...] }}")
    
    server = HTTPServer(('', PORT), RequestHandler)
    server.serve_forever()
