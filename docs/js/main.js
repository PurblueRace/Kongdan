// ===== 상태 관리 =====
let patternsData = null;
let currentDay = 1;
let completedItems = new Set();
let clearedDays = new Set();

const STORAGE_KEY = 'patternEnglish_completed';
const CLEARED_KEY = 'patternEnglish_cleared';

// ===== TTS (Text-to-Speech) =====
let preferredVoice = null;
let audioMapping = null; // 문장-파일 매핑

// MD5 해시 함수 (파일명 생성용)
function md5Hash(str) {
  // 간단한 해시 - 서버에서 생성한 것과 동일하게 맞춰야 함
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // MD5 대신 간단한 해시 사용 시 -> 실제로는 audio_mapping.json 사용
  return Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
}

// 오디오 매핑 로드
async function loadAudioMapping() {
  try {
    const response = await fetch('audio/audio_mapping.json');
    if (response.ok) {
      audioMapping = await response.json();
      console.log('✅ 오디오 매핑 로드 완료:', Object.keys(audioMapping).length, '개 문장');
    }
  } catch (e) {
    console.log('📢 오디오 매핑 없음 - 브라우저 TTS 사용');
  }
}

function initTTS() {
  // 오디오 매핑 로드
  loadAudioMapping();

  // 음성 목록이 로드되면 최적의 영어 음성 선택
  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Google 영어 음성 우선 (가장 자연스러움)
      preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
        || voices.find(v => v.name.includes('Samantha')) // macOS
        || voices.find(v => v.name.includes('Microsoft Zira')) // Windows
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    // iOS Safari 버그 해결: 첫 번째 speak() 호출이 무시되는 문제
    // 빈 utterance를 미리 실행하여 TTS 엔진을 활성화
    const warmUp = new SpeechSynthesisUtterance('');
    warmUp.volume = 0;
    speechSynthesis.speak(warmUp);
  }
}

async function speakEnglish(text, event) {
  // speakText를 영어 모드로 호출
  await speakText(text, 'en', event);
}

// 언어별 TTS (영어/한글 모드에 따라 변경)
async function speakText(text, lang, event) {
  if (event) {
    event.stopPropagation();
  }

  const btn = event?.target?.closest('.speak-btn');
  if (btn) btn.classList.add('speaking');

  const finishSpeaking = () => btn?.classList.remove('speaking');

  // ===== Kokoro TTS (로컬 WebGPU - 완전 무료) =====
  if (lang === 'en') {
    try {
      if (!window.Kokoro) {
        showToast('⏳ AI 엔진 로딩 중... 잠시 후 다시 시도해주세요.');
        return;
      }
      if (!window.kokoroModel) {
        showToast('⏳ 최신 AI 모델(Kokoro) 다운로드 중... (약 1분 소요)');
        // 모델 초기화
        window.kokoroModel = await window.Kokoro.KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
          dtype: "fp32" // fp32가 안정적 (q8은 더 작지만 호환성 탈 수 있음)
        });
      }

      showToast('🔊 Kokoro AI가 읽어주는 중...');

      // 음성 생성
      const audio = await window.kokoroModel.generate(text, {
        voice: "af_bella", // 미국 여성 (가장 인기 있는 음성)
        speed: 1.0
      });

      // 오디오 재생
      const blob = new Blob([audio.toWav()], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audioEl = new Audio(audioUrl);

      audioEl.onended = () => {
        finishSpeaking();
        URL.revokeObjectURL(audioUrl);
      };
      audioEl.onerror = () => {
        console.error('Kokoro 오디오 재생 실패');
        playBrowserTTS(text, lang, finishSpeaking);
      };

      await audioEl.play();
      return;

    } catch (e) {
      console.error('Kokoro TTS 오류:', e);
      // WebGPU 미지원 브라우저 등을 위한 안내
      showToast('⚠️ Kokoro 오류: ' + (e.message || '지원하지 않는 브라우저일 수 있습니다.'));
      finishSpeaking();
      return; // 폴백 방지
    }
  }

  // ===== 로컬 오디오 파일 재생 (한글 또는 폴백) =====
  // (영어는 위에서 처리했으므로 여기서는 건너뜀, 필요시 유지 가능)
  if (lang !== 'en' && audioMapping && audioMapping[text]) {
    try {
      const audioFile = `audio/${audioMapping[text]}`;
      const audio = new Audio(audioFile);
      audio.onended = finishSpeaking;
      audio.onerror = () => {
        playBrowserTTS(text, lang, finishSpeaking);
      };
      await audio.play();
      return;
    } catch (e) {
      console.error('오디오 재생 오류:', e);
    }
  }

  // ===== 브라우저 기본 TTS (폴백) =====
  playBrowserTTS(text, lang, finishSpeaking);
}

function playBrowserTTS(text, lang, finishSpeaking) {
  if (!('speechSynthesis' in window)) {
    alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
    finishSpeaking();
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (lang === 'en' && preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onend = finishSpeaking;
  utterance.onerror = finishSpeaking;

  speechSynthesis.speak(utterance);
}

// ===== 토스트 메시지 =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== 설정 UI 관리 =====
let geminiApiKey = localStorage.getItem('GEMINI_API_KEY') || ''; // 챗봇용

function initSettingsUI() {
  const modal = document.getElementById('settingsModal');
  const btn = document.getElementById('settingsBtn');
  const closeBtn = document.querySelector('.close-btn');
  const saveBtn = document.getElementById('saveApiKeyBtn');
  const geminiKeyInput = document.getElementById('apiKeyInput');

  // 모달 열기
  btn.onclick = () => {
    modal.classList.add('show');
    geminiKeyInput.value = geminiApiKey;
  };

  // 모달 닫기
  const closeModal = () => modal.classList.remove('show');
  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // 저장
  saveBtn.onclick = () => {
    geminiApiKey = geminiKeyInput.value.trim();
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    alert('설정이 저장되었습니다.');
    closeModal();
  };
}

// ===== 챗봇 (Gemini API) =====
const CHATBOT_SYSTEM_PROMPT = `넌 영어를 가르치는 친한 친구야. 이름은 "콩쌤".

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

절대 길게 설명하지 마. 친구한테 카톡하듯이 짧게!`;

let chatHistory = [];

function initChatbot() {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('closeChatBtn');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  // 채팅창 열기/닫기
  fab.onclick = () => panel.classList.toggle('show');
  closeBtn.onclick = () => panel.classList.remove('show');

  // 메시지 전송
  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    // 사용자 메시지 표시
    addChatMessage('user', text);
    input.value = '';

    // 로딩 표시 (스피너)
    const loadingId = addChatMessage('bot', '', true);

    try {
      // 대화 기록 구성
      const history = chatHistory.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        text: h.parts[0].text
      }));

      // 백엔드 API 호출 (Vertex AI Gemini)
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await response.json();
      console.log('Chat response:', data);

      // 로딩 메시지 제거
      document.getElementById(loadingId)?.remove();

      if (data.error) {
        addChatMessage('bot', `⚠️ 오류: ${data.error}`);
        return;
      }

      if (data.reply) {
        addChatMessage('bot', data.reply);
        chatHistory.push({ role: 'user', parts: [{ text }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });

        // 대화 기록 20개로 제한
        if (chatHistory.length > 20) {
          chatHistory = chatHistory.slice(-20);
        }
      } else {
        addChatMessage('bot', '응답이 없어요. 서버를 확인해주세요.');
      }
    } catch (e) {
      document.getElementById(loadingId)?.remove();
      console.error('Chat error:', e);
      addChatMessage('bot', '⚠️ 서버에 연결할 수 없어요. 백엔드 서버를 실행해주세요!');
    }
  };

  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
}

function addChatMessage(type, text, isLoading = false) {
  const container = document.getElementById('chatMessages');
  const id = 'msg_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = `chat-message ${type}${isLoading ? ' loading' : ''}`;

  if (isLoading) {
    div.innerHTML = `<div class="chat-spinner"></div>`;
  } else {
    div.innerHTML = `<p>${text}</p>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  initTTS();
  initSettingsUI();
  initChatbot();
  patternsData = PATTERNS_DATA;
  renderDaySelector();
  renderPatterns();
  updateProgress();
});

// ===== 로컬 스토리지 =====
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    completedItems = new Set(JSON.parse(saved));
  }

  const cleared = localStorage.getItem(CLEARED_KEY);
  if (cleared) {
    clearedDays = new Set(JSON.parse(cleared));
  }
  clearedDays.add(0);
}

function saveCompletedToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedItems]));
}

// ===== Day 잠금 체크 =====
function isDayUnlocked(day) {
  // 모든 Day 잠금 해제
  return true;
}

// ===== Day 선택 =====
function renderDaySelector() {
  const selector = document.getElementById('daySelector');

  selector.innerHTML = patternsData.days.map(day => {
    const unlocked = isDayUnlocked(day.day);
    const cleared = clearedDays.has(day.day);

    return `
      <button class="day-btn ${day.day === currentDay ? 'active' : ''} ${!unlocked ? 'locked' : ''} ${cleared ? 'cleared' : ''}" 
              data-day="${day.day}"
              onclick="${unlocked ? `selectDay(${day.day})` : 'showLockedMessage()'}"
              ${!unlocked ? 'disabled' : ''}>
        ${unlocked ? '' : '🔒 '}Day ${day.day}${cleared ? ' ✓' : ''}
      </button>
    `;
  }).join('');
}

function selectDay(day) {
  if (!isDayUnlocked(day)) {
    showLockedMessage();
    return;
  }

  currentDay = day;

  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.day) === day);
  });

  renderPatterns();
  updateProgress();
}

function showLockedMessage() {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = '🔒 이전 Day 시험을 100% 통과해야 해금됩니다!';
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== 렌더링 =====
// 언어 모드 상태 (패턴별)
let patternLangMode = {}; // { patternId: 'both' | 'english' | 'korean' }

function renderPatterns() {
  const grid = document.getElementById('patternsGrid');

  if (!patternsData || !patternsData.days) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);">데이터를 불러올 수 없습니다.</p>';
    return;
  }

  const dayData = patternsData.days.find(d => d.day === currentDay);
  if (!dayData) return;

  const cleared = clearedDays.has(currentDay);

  // 주요 단어 섹션 HTML (완성된 버전)
  const vocabHtml = dayData.vocabulary && dayData.vocabulary.length > 0 ? `
    <section class="vocab-section">
      <div class="vocab-header" onclick="toggleVocabSection()">
        <div class="vocab-icon">📝</div>
        <div class="vocab-title-wrap">
          <h3 class="vocab-title">오늘의 주요 단어</h3>
          <p class="vocab-subtitle">${dayData.vocabulary.length}개 단어 미리 학습하기</p>
        </div>
        <div class="vocab-toggle" id="vocabToggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      <div class="vocab-list" id="vocabList">
        ${dayData.vocabulary.map(v => `
          <div class="vocab-item">
            <span class="vocab-word">${v.word}</span>
            <span class="vocab-meaning">${v.meaning}</span>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  grid.innerHTML = `
    ${cleared ? '<div class="day-cleared-badge">✅ Day ' + currentDay + ' 클리어!</div>' : ''}
    ${vocabHtml}
    ${dayData.patterns.map((pattern, index) => {
    const mode = patternLangMode[pattern.id] || 'both';
    return `
    <article class="pattern-card" style="animation-delay: ${index * 0.08}s" data-pattern-id="${pattern.id}">
      <div class="pattern-header" onclick="togglePattern(${pattern.id})">
        <div class="pattern-color" style="background: ${pattern.color}">${pattern.id}</div>
        <div class="pattern-info">
          <h2 class="pattern-title">${pattern.title}</h2>
          <p class="pattern-desc">${pattern.description}</p>
        </div>
        <div class="pattern-progress" id="patternProgress_${pattern.id}">
          ${getPatternProgressHtml(pattern)}
        </div>
        <div class="pattern-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      <div class="examples-list">
        <div class="lang-switch-bar">
          <button class="lang-btn ${mode === 'both' ? 'active' : ''}" onclick="setLangMode(${pattern.id}, 'both', event)">🔄 둘 다</button>
          <button class="lang-btn ${mode === 'english' ? 'active' : ''}" onclick="setLangMode(${pattern.id}, 'english', event)">🇺🇸 영어</button>
          <button class="lang-btn ${mode === 'korean' ? 'active' : ''}" onclick="setLangMode(${pattern.id}, 'korean', event)">🇰🇷 한글</button>
        </div>
        ${pattern.examples.map((ex, exIndex) => {
      const itemId = `${currentDay}_${pattern.id}_${exIndex}`;
      const isCompleted = completedItems.has(itemId);
      const escapedEnglish = ex.english.replace(/'/g, "\\'");
      const escapedKorean = ex.korean.replace(/'/g, "\\'");
      const showEnglish = mode === 'both' || mode === 'english';
      const showKorean = mode === 'both' || mode === 'korean';
      const ttsText = mode === 'korean' ? escapedKorean : escapedEnglish;
      const ttsLang = mode === 'korean' ? 'ko' : 'en';
      return `
            <div class="example-item ${isCompleted ? 'completed' : ''}" 
                 data-item-id="${itemId}">
              <div class="example-checkbox" onclick="toggleExample('${itemId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div class="example-content" onclick="toggleExample('${itemId}')">
                ${showEnglish ? `<p class="example-english">${ex.english}</p>` : ''}
                ${showKorean ? `<p class="example-korean">${ex.korean}</p>` : ''}
              </div>
              <button class="speak-btn" onclick="speakText('${ttsText}', '${ttsLang}', event)" title="발음 듣기">
                🔊
              </button>
            </div>
          `;
    }).join('')}
      </div>
    </article>
  `;
  }).join('')}`;

  document.getElementById('totalCount').textContent = dayData.patterns.reduce((sum, p) => sum + p.examples.length, 0);
}

// 언어 모드 변경
function setLangMode(patternId, mode, event) {
  event.stopPropagation();
  patternLangMode[patternId] = mode;
  renderPatterns();
  // 드롭다운 열린 상태 유지
  setTimeout(() => {
    const card = document.querySelector(`[data-pattern-id="${patternId}"]`);
    if (card) card.classList.add('expanded');
  }, 0);
}

// 주요 단어 섹션 토글
function toggleVocabSection() {
  const list = document.getElementById('vocabList');
  const toggle = document.getElementById('vocabToggle');
  list.classList.toggle('expanded');
  toggle.classList.toggle('expanded');
}

function getPatternProgressHtml(pattern) {
  const completedCount = pattern.examples.filter((_, idx) =>
    completedItems.has(`${currentDay}_${pattern.id}_${idx}`)
  ).length;
  const total = pattern.examples.length;
  const isComplete = completedCount === total;

  return `<span class="${isComplete ? 'complete' : ''}">${completedCount}/${total}</span>${isComplete ? '<span>✓</span>' : ''}`;
}

// ===== 상호작용 =====
function togglePattern(patternId) {
  document.querySelector(`[data-pattern-id="${patternId}"]`).classList.toggle('expanded');
}

function toggleExample(itemId) {
  const element = document.querySelector(`[data-item-id="${itemId}"]`);

  if (completedItems.has(itemId)) {
    completedItems.delete(itemId);
    element.classList.remove('completed');
  } else {
    completedItems.add(itemId);
    element.classList.add('completed');
    if (completedItems.size % 10 === 0) showCelebration();
  }

  const parts = itemId.split('_');
  const dayData = patternsData.days.find(d => d.day === currentDay);
  const pattern = dayData.patterns.find(p => p.id == parts[1]);
  document.getElementById(`patternProgress_${parts[1]}`).innerHTML = getPatternProgressHtml(pattern);

  saveCompletedToStorage();
  updateProgress();
}

function updateProgress() {
  const dayData = patternsData.days.find(d => d.day === currentDay);
  if (!dayData) return;

  const totalCount = dayData.patterns.reduce((sum, p) => sum + p.examples.length, 0);
  let completed = 0;

  dayData.patterns.forEach(pattern => {
    pattern.examples.forEach((_, idx) => {
      if (completedItems.has(`${currentDay}_${pattern.id}_${idx}`)) completed++;
    });
  });

  document.getElementById('completedCount').textContent = completed;
  document.getElementById('progressBar').style.width = `${(completed / totalCount) * 100}%`;

  if (completed === totalCount && totalCount > 0) showCelebration('🎉');
}

function showCelebration(emoji = '🌟') {
  const celebration = document.createElement('div');
  celebration.className = 'celebration';
  celebration.textContent = emoji;
  document.body.appendChild(celebration);
  setTimeout(() => celebration.remove(), 1000);
}
