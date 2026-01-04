"""
Day 1 감정 TTS 테스트
패턴별로 감정을 넣어서 재생성
"""

import os
import json
import hashlib
import time
from pathlib import Path

from google import genai
from google.genai import types

# ===== 설정 =====
PROJECT_ID = "affable-grin-482008-e4"
LOCATION = "us-central1"
OUTPUT_DIR = Path(__file__).parent / "docs" / "audio"
DATA_FILE = Path(__file__).parent / "data" / "patterns.json"

# 서비스 계정 키 파일 설정
CREDENTIALS_FILE = Path(__file__).parent / "affable-grin-482008-e4-f817e80887ef.json"
if CREDENTIALS_FILE.exists():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(CREDENTIALS_FILE)
    print(f"🔑 인증 파일 로드: {CREDENTIALS_FILE.name}")

# ===== 패턴별 감정 프롬프트 =====
EMOTION_PROMPTS = {
    "I'm going to ~": "Read with confidence and determination, like making a firm decision",
    "I want to ~": "Read with excitement and eagerness, like you really desire something",
    "Can I ~?": "Read with a polite, slightly hopeful tone, like making a gentle request",
    "Do you want to ~?": "Read with a friendly, inviting tone, like suggesting something fun",
}

def get_emotion_prompt(pattern_title: str) -> str:
    """패턴에 맞는 감정 프롬프트 반환"""
    for pattern, emotion in EMOTION_PROMPTS.items():
        if pattern.replace(" ~", "") in pattern_title or pattern_title.startswith(pattern.split()[0]):
            return emotion
    return "Read with natural, expressive emotion appropriate for the sentence meaning"

# Gemini 클라이언트
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

def get_audio_filename(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:12] + ".mp3"

def generate_tts_with_emotion(text: str, emotion: str, output_path: Path) -> bool:
    """감정이 포함된 TTS 생성"""
    
    # 기존 파일 삭제
    if output_path.exists():
        output_path.unlink()
        print(f"  🗑️  기존 파일 삭제")
    
    prompt = f"{emotion}. Say: \"{text}\""
    
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Puck"  # 더 활발한 음성
                            )
                        )
                    )
                )
            )
            
            if response.candidates and response.candidates[0].content.parts:
                audio_data = response.candidates[0].content.parts[0].inline_data.data
                with open(output_path, "wb") as f:
                    f.write(audio_data)
                print(f"  ✅ 생성 완료!")
                return True
                
        except Exception as e:
            if "429" in str(e):
                wait = 15 * (attempt + 1)
                print(f"  ⏳ Rate limit - {wait}초 대기")
                time.sleep(wait)
            else:
                print(f"  ❌ 오류: {e}")
                return False
    return False

def main():
    print("🎭 Day 1 감정 TTS 테스트")
    print("=" * 50)
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Day 1만 처리
    day1 = data["days"][0]
    print(f"📅 {day1['title']}")
    
    success = 0
    total = 0
    
    for pattern in day1["patterns"]:
        pattern_title = pattern["title"]
        emotion = get_emotion_prompt(pattern_title)
        
        print(f"\n🎯 패턴: {pattern_title}")
        print(f"   감정: {emotion[:50]}...")
        
        for example in pattern["examples"]:
            text = example["english"]
            total += 1
            
            print(f"\n[{total}] \"{text}\"")
            
            output_path = OUTPUT_DIR / get_audio_filename(text)
            if generate_tts_with_emotion(text, emotion, output_path):
                success += 1
            
            time.sleep(2)  # Rate limit 방지
    
    print("\n" + "=" * 50)
    print(f"✅ 완료: {success}/{total} 파일")

if __name__ == "__main__":
    main()
