# TTS 백엔드 서버

Google Cloud TTS API를 안전하게 호출하기 위한 Express 백엔드 서버입니다.

## 설치

```bash
cd server
npm install
```

## 설정

1. `.env.example`을 복사하여 `.env` 파일 생성:
```bash
cp .env.example .env
```

2. `.env` 파일에 Google Cloud TTS API 키 입력:
```
GOOGLE_TTS_API_KEY=YOUR_API_KEY_HERE
PORT=3001
```

### Google Cloud TTS API 키 발급 방법

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스** > **라이브러리** > "Cloud Text-to-Speech API" 검색 후 활성화
4. **API 및 서비스** > **사용자 인증 정보** > **API 키 만들기**
5. 생성된 키를 `.env` 파일에 복사

## 실행

```bash
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### POST /api/tts

텍스트를 음성으로 변환합니다.

**요청:**
```json
{
  "text": "Hello, how are you?",
  "lang": "en"
}
```

**응답:**
```json
{
  "audioContent": "base64_encoded_audio_data..."
}
```

### GET /api/health

서버 상태 확인

**응답:**
```json
{
  "status": "ok",
  "ttsConfigured": true
}
```

## 무료 한도

- Google Cloud TTS: 월 100만 자 무료 (WaveNet 음성)
- 자세한 내용: [Google Cloud TTS 가격](https://cloud.google.com/text-to-speech/pricing)
