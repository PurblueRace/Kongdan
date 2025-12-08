// ===== 상태 관리 =====
let patternsData = null;
let currentDay = 1;
let completedItems = new Set();
let clearedDays = new Set();

const STORAGE_KEY = 'patternEnglish_completed';
const CLEARED_KEY = 'patternEnglish_cleared';

// ===== TTS (Text-to-Speech) =====
let preferredVoice = null;

function initTTS() {
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
  }
}

function speakEnglish(text, event) {
  if (event) {
    event.stopPropagation();
  }

  if (!('speechSynthesis' in window)) {
    alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
    return;
  }

  // 이전 재생 중지
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // 약간 느리게 (학습용)
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // 재생 중 버튼 스타일 변경
  const btn = event?.target?.closest('.speak-btn');
  if (btn) {
    btn.classList.add('speaking');
    utterance.onend = () => btn.classList.remove('speaking');
    utterance.onerror = () => btn.classList.remove('speaking');
  }

  speechSynthesis.speak(utterance);
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  initTTS();
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
  if (day === 1) return true;
  return clearedDays.has(day - 1);
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
function renderPatterns() {
  const grid = document.getElementById('patternsGrid');

  if (!patternsData || !patternsData.days) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);">데이터를 불러올 수 없습니다.</p>';
    return;
  }

  const dayData = patternsData.days.find(d => d.day === currentDay);
  if (!dayData) return;

  const cleared = clearedDays.has(currentDay);

  // 주요 단어 섹션 HTML
  const vocabHtml = dayData.vocabulary ? `
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
        ${dayData.vocabulary.map(v => {
    const escapedWord = v.word.replace(/'/g, "\\'");
    const escapedExample = v.example.replace(/'/g, "\\'");
    return `
          <div class="vocab-item">
            <div class="vocab-word-wrap">
              <span class="vocab-word">${v.word}</span>
              <button class="speak-btn small" onclick="speakEnglish('${escapedWord}', event)" title="단어 발음">🔊</button>
            </div>
            <div class="vocab-meaning">${v.meaning}</div>
            <div class="vocab-example">
              <span>"${v.example}"</span>
              <button class="speak-btn small" onclick="speakEnglish('${escapedExample}', event)" title="예문 발음">🔊</button>
            </div>
          </div>
        `}).join('')}
      </div>
    </section>
  ` : '';

  grid.innerHTML = `
    ${cleared ? '<div class="day-cleared-badge">✅ Day ' + currentDay + ' 클리어!</div>' : ''}
    ${vocabHtml}
    ${dayData.patterns.map((pattern, index) => `
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
        ${pattern.examples.map((ex, exIndex) => {
    const itemId = `${currentDay}_${pattern.id}_${exIndex}`;
    const isCompleted = completedItems.has(itemId);
    const escapedEnglish = ex.english.replace(/'/g, "\\'");
    return `
            <div class="example-item ${isCompleted ? 'completed' : ''}" 
                 data-item-id="${itemId}">
              <div class="example-checkbox" onclick="toggleExample('${itemId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div class="example-content" onclick="toggleExample('${itemId}')">
                <p class="example-english">${ex.english}</p>
                <p class="example-korean">${ex.korean}</p>
              </div>
              <button class="speak-btn" onclick="speakEnglish('${escapedEnglish}', event)" title="발음 듣기">
                🔊
              </button>
            </div>
          `;
  }).join('')}
      </div>
    </article>
  `).join('')}`;

  document.getElementById('totalCount').textContent = dayData.patterns.reduce((sum, p) => sum + p.examples.length, 0);
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
