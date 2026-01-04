// ===== Quiz State =====
let patternsData = null;
let currentDay = 1;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongAnswers = [];
let clearedDays = new Set();
let recognition = null;
let isListening = false;

const WRONG_KEY = 'patternEnglish_wrong';
const CLEARED_KEY = 'patternEnglish_cleared';

document.addEventListener('DOMContentLoaded', () => {
  loadClearedDays();
  patternsData = PATTERNS_DATA;
  setupDaySelect();
  setupEventListeners();
  initSpeechRecognition();
});

function loadClearedDays() {
  const cleared = localStorage.getItem(CLEARED_KEY);
  if (cleared) clearedDays = new Set(JSON.parse(cleared));
}

function saveClearedDays() {
  localStorage.setItem(CLEARED_KEY, JSON.stringify([...clearedDays]));
}

function isDayUnlocked(day) {
  // 모든 Day 잠금 해제
  return true;
}

// ===== Speech Recognition =====
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.log('Speech Recognition not supported');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;  // 시간제한 없이 계속 인식
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    isListening = true;
    updateMicButton(true);
  };

  recognition.onend = () => {
    isListening = false;
    updateMicButton(false);
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const input = document.getElementById('answerInput');
    if (finalTranscript) {
      input.value = finalTranscript;
      // 자동 정답 확인
      setTimeout(() => checkAnswer(), 300);
    } else if (interimTranscript) {
      input.value = interimTranscript;
      input.style.opacity = '0.7';
    }
  };

  recognition.onerror = (event) => {
    console.log('Speech recognition error:', event.error);
    isListening = false;
    updateMicButton(false);

    if (event.error === 'not-allowed') {
      alert('마이크 권한을 허용해주세요.');
    }
  };
}

function updateMicButton(listening) {
  const btn = document.getElementById('micBtn');
  if (btn) {
    btn.classList.toggle('listening', listening);
    btn.innerHTML = listening ? '🔴' : '🎤';
  }
}

function toggleSpeechRecognition() {
  if (!recognition) {
    alert('이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome 브라우저를 사용해주세요.');
    return;
  }

  const q = questions[currentIndex];
  // 영어로 답해야 하는 경우만 영어 인식
  recognition.lang = q.type === 'korean' ? 'en-US' : 'ko-KR';

  if (isListening) {
    recognition.stop();
  } else {
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').style.opacity = '1';
    recognition.start();
  }
}

function setupDaySelect() {
  const select = document.getElementById('daySelect');
  patternsData.days.forEach(day => {
    const unlocked = isDayUnlocked(day.day);
    const cleared = clearedDays.has(day.day);
    const opt = document.createElement('option');
    opt.value = day.day;
    opt.textContent = `${unlocked ? '' : '🔒 '}Day ${day.day} - ${day.title}${cleared ? ' ✓' : ''}`;
    opt.disabled = !unlocked;
    select.appendChild(opt);
  });
}

function setupEventListeners() {
  document.getElementById('startQuiz').onclick = startQuiz;
  document.getElementById('checkBtn').onclick = checkAnswer;
  document.getElementById('nextBtn').onclick = nextQuestion;
  document.getElementById('retryBtn').onclick = () => location.reload();
  document.getElementById('reviewBtn').onclick = () => location.href = 'review.html';

  document.getElementById('answerInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const checkBtn = document.getElementById('checkBtn');
      if (checkBtn.style.display !== 'none') checkAnswer();
      else nextQuestion();
    }
  });
}

function startQuiz() {
  currentDay = parseInt(document.getElementById('daySelect').value);
  if (!isDayUnlocked(currentDay)) {
    alert('🔒 이전 Day를 먼저 클리어해야 합니다!');
    return;
  }

  const count = parseInt(document.getElementById('questionCount').value);
  const type = document.getElementById('quizType').value;
  const day = patternsData.days.find(d => d.day === currentDay);
  let allExamples = [];

  day.patterns.forEach(p => p.examples.forEach(ex => allExamples.push({ ...ex, patternTitle: p.title, patternColor: p.color })));
  allExamples = allExamples.sort(() => Math.random() - 0.5);

  questions = allExamples.slice(0, count).map(ex => {
    let qType = type === 'mixed' ? (Math.random() > 0.5 ? 'korean' : 'english') : type;
    return { ...ex, type: qType, question: qType === 'korean' ? ex.korean : ex.english, answer: qType === 'korean' ? ex.english : ex.korean };
  });

  currentIndex = 0; correctCount = 0; wrongAnswers = [];
  document.getElementById('quizSetup').style.display = 'none';
  document.getElementById('quizArea').style.display = 'block';
  document.getElementById('totalQ').textContent = questions.length;
  showQuestion();
}

function showQuestion() {
  const q = questions[currentIndex];
  document.getElementById('currentQ').textContent = currentIndex + 1;
  document.getElementById('quizProgressBar').style.width = `${(currentIndex / questions.length) * 100}%`;
  document.getElementById('typeBadge').textContent = q.type === 'korean' ? '한글 → 영어' : '영어 → 한글';
  document.getElementById('question').textContent = q.question;
  const input = document.getElementById('answerInput');
  input.value = ''; input.className = 'answer-input'; input.style.opacity = '1'; input.focus();
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('checkBtn').style.display = 'block';
  document.getElementById('nextBtn').style.display = 'none';

  // 마이크 버튼 표시
  const micBtn = document.getElementById('micBtn');
  if (micBtn) {
    micBtn.style.display = 'flex';
    micBtn.classList.remove('listening');
    micBtn.innerHTML = '🎤';
  }
}

function checkAnswer() {
  // 음성 인식 중이면 중지
  if (recognition && isListening) {
    recognition.stop();
  }

  const q = questions[currentIndex];
  const input = document.getElementById('answerInput');
  const userAnswer = input.value.trim().toLowerCase().replace(/[.,!?]/g, '');
  const correctAnswer = q.answer.toLowerCase().replace(/[.,!?]/g, '');

  // 유연한 정답 체크 (공백, 구두점 무시)
  const isCorrect = userAnswer === correctAnswer ||
    userAnswer.replace(/\s+/g, '') === correctAnswer.replace(/\s+/g, '');

  const feedback = document.getElementById('feedback');

  if (isCorrect) {
    correctCount++;
    input.className = 'answer-input correct';
    feedback.className = 'feedback correct';
    feedback.innerHTML = '✓ 정답입니다!';
  } else {
    input.className = 'answer-input wrong';
    feedback.className = 'feedback wrong';
    feedback.innerHTML = `✗ 오답<br>정답: <strong>${q.answer}</strong>`;
    wrongAnswers.push(q);
    saveWrongAnswer(q);
  }
  document.getElementById('checkBtn').style.display = 'none';
  document.getElementById('nextBtn').style.display = 'block';

  // 마이크 버튼 숨기기
  const micBtn = document.getElementById('micBtn');
  if (micBtn) micBtn.style.display = 'none';
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) showResult();
  else showQuestion();
}

function showResult() {
  document.getElementById('quizArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'block';

  const percent = Math.round((correctCount / questions.length) * 100);
  const isPerfect = correctCount === questions.length;
  const isFullQuiz = questions.length === 40;

  document.getElementById('correctCount').textContent = correctCount;
  document.getElementById('totalCount').textContent = questions.length;
  document.getElementById('resultPercent').textContent = `${percent}%`;

  let emoji, message;

  if (isPerfect && isFullQuiz) {
    clearedDays.add(currentDay);
    saveClearedDays();
    emoji = '🎉'; message = `Day ${currentDay} 클리어! Day ${currentDay + 1}이 해금되었습니다!`;
    document.getElementById('resultArea').innerHTML = `
      <div class="result-card cleared">
        <span class="result-emoji">🎉</span>
        <h2>Day ${currentDay} 클리어!</h2>
        <div class="unlock-badge">🔓 Day ${currentDay + 1} 해금!</div>
        <div class="result-score">${correctCount} / ${questions.length}</div>
        <div class="result-percent">100%</div>
        <div class="result-message">완벽합니다! 다음 단계로 진행하세요!</div>
        <div class="result-buttons">
          <a href="index.html" class="retry-btn">학습 페이지로</a>
          <button onclick="location.reload()" class="review-btn">다른 Day 시험보기</button>
        </div>
      </div>`;
    return;
  } else if (percent === 100) { emoji = '🎉'; message = '완벽해요!'; }
  else if (percent >= 80) { emoji = '👏'; message = '훌륭해요!'; }
  else if (percent >= 60) { emoji = '💪'; message = '조금만 더!'; }
  else { emoji = '📚'; message = '다시 학습해보세요!'; }

  if (!isFullQuiz && percent === 100) message += '<br><strong>💡 Day 클리어는 40문제 필요!</strong>';

  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultMessage').innerHTML = message;

  if (wrongAnswers.length > 0) {
    document.getElementById('wrongList').innerHTML = '<h3 style="margin-bottom:12px;font-size:14px;color:var(--text-secondary);">틀린 문제</h3>' +
      wrongAnswers.map(w => `<div class="wrong-item"><div class="q">${w.question}</div><div class="a">정답: ${w.answer}</div></div>`).join('');
  }
}

function saveWrongAnswer(q) {
  let wrongs = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
  if (!wrongs.find(w => w.english === q.english)) {
    wrongs.push({ english: q.english, korean: q.korean, patternTitle: q.patternTitle, patternColor: q.patternColor, day: currentDay, timestamp: Date.now() });
    localStorage.setItem(WRONG_KEY, JSON.stringify(wrongs));
  }
}
