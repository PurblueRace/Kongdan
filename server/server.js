/**
 * TTS 백엔드 서버 (순수 Node.js - 외부 의존성 없음)
 * Google Drive 동기화 폴더에서도 작동
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env 파일 수동 파싱
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const env = {};

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }

    return env;
}

const envConfig = loadEnv();
const PORT = envConfig.PORT || 3001;
const GOOGLE_TTS_API_KEY = envConfig.GOOGLE_TTS_API_KEY;

// JSON 파싱 헬퍼
function parseJSON(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

// CORS 헤더 설정
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Google Cloud TTS API 호출
function callGoogleTTS(text, lang, callback) {
    const voiceConfig = lang === 'ko'
        ? { languageCode: 'ko-KR', name: 'ko-KR-Wavenet-A', ssmlGender: 'FEMALE' }
        : { languageCode: 'en-US', name: 'en-US-Wavenet-D', ssmlGender: 'MALE' };

    const requestBody = JSON.stringify({
        input: { text },
        voice: voiceConfig,
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9,
            pitch: 0
        }
    });

    const options = {
        hostname: 'texttospeech.googleapis.com',
        path: `/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const result = parseJSON(data);
            callback(null, result);
        });
    });

    req.on('error', (e) => callback(e, null));
    req.write(requestBody);
    req.end();
}

// HTTP 서버 생성
const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 헬스체크
    if (req.method === 'GET' && req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            ttsConfigured: !!GOOGLE_TTS_API_KEY
        }));
        return;
    }

    // TTS 엔드포인트
    if (req.method === 'POST' && req.url === '/api/tts') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = parseJSON(body);

            if (!data || !data.text) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Text is required' }));
                return;
            }

            if (!GOOGLE_TTS_API_KEY) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'TTS API key not configured' }));
                return;
            }

            callGoogleTTS(data.text, data.lang || 'en', (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                    return;
                }

                if (result.error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: result.error.message }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ audioContent: result.audioContent }));
            });
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🚀 TTS 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📝 TTS API: POST /api/tts { text: "Hello", lang: "en" }`);

    if (!GOOGLE_TTS_API_KEY) {
        console.warn('⚠️  GOOGLE_TTS_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    } else {
        console.log('✅ Google TTS API 키 로드됨');
    }
});
