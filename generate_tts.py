"""
Vertex AI Gemini 2.5 Native TTS 오디오 생성 스크립트
모든 영어 문장에 대해 MP3 파일을 미리 생성합니다.

사용법:
1. Google Cloud 인증: gcloud auth application-default login
2. 환경변수 설정: set GOOGLE_CLOUD_PROJECT=your-project-id
3. 실행: python generate_tts.py
"""

import os
import json
import base64
import hashlib
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ google-genai 패키지가 필요합니다.")
    print("   pip install google-genai")
    exit(1)

# ===== 설정 =====
PROJECT_ID = "affable-grin-482008-e4"  # 숏츠 프로젝트와 동일
LOCATION = "us-central1"
OUTPUT_DIR = Path(__file__).parent / "docs" / "audio"
DATA_FILE = Path(__file__).parent / "data" / "patterns.json"

# 서비스 계정 키 파일 설정
CREDENTIALS_FILE = Path(__file__).parent / "affable-grin-482008-e4-f817e80887ef.json"
if CREDENTIALS_FILE.exists():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(CREDENTIALS_FILE)
    print(f"🔑 인증 파일 로드: {CREDENTIALS_FILE.name}")
else:
    print(f"⚠️ 인증 파일 없음: {CREDENTIALS_FILE}")
    print("   gcloud auth application-default login 을 실행하세요.")

# Gemini 클라이언트 초기화
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION
)

def get_audio_filename(text: str) -> str:
    """텍스트를 해시하여 파일명 생성"""
    hash_str = hashlib.md5(text.encode()).hexdigest()[:12]
    return f"{hash_str}.mp3"

def generate_tts(text: str, output_path: Path, max_retries: int = 3) -> bool:
    """Gemini 2.5 Native TTS로 오디오 생성 (재시도 로직 포함)"""
    
    if output_path.exists():
        print(f"  ⏭️  이미 존재: {output_path.name}")
        return True
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=f"Please read this English sentence naturally: \"{text}\"",
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Aoede"  # 자연스러운 영어 음성
                            )
                        )
                    )
                )
            )
            
            # 오디오 데이터 추출
            if response.candidates and response.candidates[0].content.parts:
                audio_data = response.candidates[0].content.parts[0].inline_data.data
                
                # MP3 파일로 저장
                with open(output_path, "wb") as f:
                    f.write(audio_data)
                
                print(f"  ✅ 생성: {output_path.name}")
                return True
            else:
                print(f"  ❌ 응답 없음: {text[:30]}...")
                return False
                
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 15 * (attempt + 1)  # 15초, 30초, 45초
                print(f"  ⏳ Rate limit - {wait_time}초 대기 후 재시도 ({attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"  ❌ 오류: {e}")
                return False
    
    print(f"  ❌ 최대 재시도 횟수 초과")
    return False

def extract_sentences(data: dict) -> list:
    """JSON 데이터에서 모든 영어 문장 추출"""
    sentences = []
    
    for day in data.get("days", []):
        for pattern in day.get("patterns", []):
            for example in pattern.get("examples", []):
                english = example.get("english", "")
                if english:
                    sentences.append({
                        "text": english,
                        "day": day["day"],
                        "pattern_id": pattern["id"]
                    })
    
    return sentences

def generate_audio_mapping(sentences: list) -> dict:
    """문장-파일 매핑 생성"""
    mapping = {}
    for s in sentences:
        filename = get_audio_filename(s["text"])
        mapping[s["text"]] = filename
    return mapping

def main():
    print("🎤 Vertex AI Gemini 2.5 TTS 오디오 생성기")
    print("=" * 50)
    
    # 출력 디렉토리 생성
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 데이터 로드
    if not DATA_FILE.exists():
        print(f"❌ 데이터 파일을 찾을 수 없습니다: {DATA_FILE}")
        return
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 문장 추출
    sentences = extract_sentences(data)
    print(f"📝 총 {len(sentences)}개 문장 발견")
    
    # 오디오 생성
    success_count = 0
    for i, s in enumerate(sentences, 1):
        print(f"\n[{i}/{len(sentences)}] Day {s['day']} - Pattern {s['pattern_id']}")
        print(f"   \"{s['text'][:50]}...\"" if len(s['text']) > 50 else f"   \"{s['text']}\"")
        
        output_path = OUTPUT_DIR / get_audio_filename(s["text"])
        if generate_tts(s["text"], output_path):
            success_count += 1
        
        # API 속도 제한 방지 (분당 30 요청 제한)
        time.sleep(2)
    
    print("\n" + "=" * 50)
    print(f"✅ 완료: {success_count}/{len(sentences)} 파일 생성")
    
    # 매핑 파일 생성
    mapping = generate_audio_mapping(sentences)
    mapping_path = OUTPUT_DIR / "audio_mapping.json"
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"📄 매핑 파일 생성: {mapping_path}")

if __name__ == "__main__":
    main()
