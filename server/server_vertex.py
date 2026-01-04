"""
Vertex AI Gemini 2.5 TTS Backend Server
Replaces the Node.js server to provide Vertex AI integration on Port 3001.
"""

import os
import json
import base64
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import sys

# 필요한 패키지 체크
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ google-genai 패키지가 필요합니다.")
    print("   pip install google-genai")
    sys.exit(1)

# ===== 설정 =====
PORT = 3001
PROJECT_ID = "affable-grin-482008-e4"
LOCATION = "us-central1"
CREDENTIALS_FILE = Path(__file__).parent.parent / "affable-grin-482008-e4-f817e80887ef.json"

# 인증 설정
if CREDENTIALS_FILE.exists():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(CREDENTIALS_FILE)
    print(f"🔑 인증 파일 로드 완료: {CREDENTIALS_FILE.name}")
else:
    print(f"⚠️ 인증 파일 없음: {CREDENTIALS_FILE}")
    print("   gcloud auth application-default login 필요")

# Gemini 클라이언트
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
print(f"🤖 Gemini Client 초기화 완료 (Project: {PROJECT_ID})")

class TTSRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/api/health':
            self._set_headers()
            response = {"status": "ok", "backend": "Python/VertexAI"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

    def do_POST(self):
        if self.path == '/api/tts':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text')
                
                if not text:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Text is required"}).encode('utf-8'))
                    return

                print(f"🎤 TTS 요청 수신: \"{text[:30]}...\"")

                # Gemini 2.5 TTS 호출
                # 프롬프트: 격한 감정 요청
                prompt = (
                    f"Read the following text with intense, strong emotion (e.g. excitement, anger, sorrow, joy, urgency) "
                    f"matching the context. Express the feelings vividly. "
                    f"Text: \"{text}\""
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash-preview-tts",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name="Aoede" 
                                )
                            )
                        )
                    )
                )

                if response.candidates and response.candidates[0].content.parts:
                    audio_bytes = response.candidates[0].content.parts[0].inline_data.data
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    
                    self._set_headers(200)
                    response_data = {"audioContent": audio_base64}
                    self.wfile.write(json.dumps(response_data).encode('utf-8'))
                    print("✅ 오디오 생성 및 전송 완료")
                else:
                    raise Exception("Gemini 응답에 오디오가 없습니다.")

            except Exception as e:
                print(f"❌ 오류 발생: {str(e)}")
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        
        elif self.path == '/api/chat':
            # 챗봇용 프록시 (기존 server.js 기능 유지)
            # 여기서는 구현 생략하거나 필요시 추가. 
            # 일단 TTS가 주 목적이므로 TTS부터.
            self._set_headers(501)
            self.wfile.write(json.dumps({"error": "Chatbot not implemented in Python server yet"}).encode('utf-8'))
        
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=TTSRequestHandler, port=PORT):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"🚀 Python TTS 서버 실행 중: http://localhost:{port}")
    print(f"model: gemini-2.5-flash-preview-tts")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
