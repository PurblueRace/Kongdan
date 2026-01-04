// ===== Review State =====
const WRONG_KEY = 'patternEnglish_wrong';
const BOOKMARK_KEY = 'patternEnglish_bookmark';

let wrongItems = [];
let bookmarkItems = [];
let flashcardItems = [];
let flashcardIndex = 0;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderLists();
    setupTabs();
    setupFlashcard();
});

function loadData() {
    wrongItems = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
    bookmarkItems = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');

    document.getElementById('wrongCount').textContent = wrongItems.length;
    document.getElementById('bookmarkCount').textContent = bookmarkItems.length;
}

function renderLists() {
    renderWrongList();
    renderBookmarkList();
}

function renderWrongList() {
    const container = document.getElementById('wrongList');
    const empty = document.getElementById('emptyWrong');

    if (wrongItems.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    container.innerHTML = wrongItems.map((item, i) => `
    <div class="review-item" data-index="${i}" onclick="startFlashcard('wrong', ${i})">
      <div class="review-color" style="background:${item.patternColor || '#6366f1'}">
        ${item.day || '?'}
      </div>
      <div class="review-content">
        <div class="review-english">${item.english}</div>
        <div class="review-korean">${item.korean}</div>
        <div class="review-pattern">${item.patternTitle || ''}</div>
      </div>
      <div class="review-actions">
        <button class="action-btn ${isBookmarked(item) ? 'bookmarked' : ''}" onclick="event.stopPropagation(); toggleBookmark(${i}, 'wrong')">⭐</button>
        <button class="action-btn delete" onclick="event.stopPropagation(); deleteWrong(${i})">✕</button>
      </div>
    </div>
  `).join('');
}

function renderBookmarkList() {
    const container = document.getElementById('bookmarkList');
    const empty = document.getElementById('emptyBookmark');

    if (bookmarkItems.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    container.innerHTML = bookmarkItems.map((item, i) => `
    <div class="review-item" onclick="startFlashcard('bookmark', ${i})">
      <div class="review-color" style="background:${item.patternColor || '#6366f1'}">⭐</div>
      <div class="review-content">
        <div class="review-english">${item.english}</div>
        <div class="review-korean">${item.korean}</div>
        <div class="review-pattern">${item.patternTitle || ''}</div>
      </div>
      <div class="review-actions">
        <button class="action-btn delete" onclick="event.stopPropagation(); deleteBookmark(${i})">✕</button>
      </div>
    </div>
  `).join('');
}

// ===== Tabs =====
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById(`${tab}Tab`).classList.add('active');
        };
    });
}

// ===== Actions =====
function isBookmarked(item) {
    return bookmarkItems.some(b => b.english === item.english);
}

function toggleBookmark(index, source) {
    const item = source === 'wrong' ? wrongItems[index] : null;
    if (!item) return;

    const existIndex = bookmarkItems.findIndex(b => b.english === item.english);

    if (existIndex >= 0) {
        bookmarkItems.splice(existIndex, 1);
    } else {
        bookmarkItems.push({ ...item });
    }

    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarkItems));
    loadData();
    renderLists();
}

function deleteWrong(index) {
    wrongItems.splice(index, 1);
    localStorage.setItem(WRONG_KEY, JSON.stringify(wrongItems));
    loadData();
    renderLists();
}

function deleteBookmark(index) {
    bookmarkItems.splice(index, 1);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarkItems));
    loadData();
    renderLists();
}

// ===== Flashcard =====
function setupFlashcard() {
    document.getElementById('closeFlashcard').onclick = closeFlashcard;
    document.getElementById('flashcard').onclick = flipCard;
    document.getElementById('flashPrev').onclick = prevFlashcard;
    document.getElementById('flashNext').onclick = nextFlashcard;

    document.addEventListener('keydown', e => {
        if (document.getElementById('flashcardMode').style.display === 'none') return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flipCard();
        } else if (e.key === 'ArrowLeft') {
            prevFlashcard();
        } else if (e.key === 'ArrowRight') {
            nextFlashcard();
        } else if (e.key === 'Escape') {
            closeFlashcard();
        }
    });
}

function startFlashcard(source, startIndex) {
    flashcardItems = source === 'wrong' ? [...wrongItems] : [...bookmarkItems];
    flashcardIndex = startIndex || 0;

    if (flashcardItems.length === 0) return;

    document.getElementById('flashcardMode').style.display = 'flex';
    showFlashcard();
}

function showFlashcard() {
    const item = flashcardItems[flashcardIndex];
    const card = document.getElementById('flashcard');

    card.classList.remove('flipped');
    document.getElementById('flashcardFront').textContent = item.korean;
    document.getElementById('flashcardBack').textContent = item.english;
    document.getElementById('flashcardProgress').textContent = `${flashcardIndex + 1} / ${flashcardItems.length}`;
}

function flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function prevFlashcard() {
    if (flashcardIndex > 0) {
        flashcardIndex--;
        showFlashcard();
    }
}

function nextFlashcard() {
    if (flashcardIndex < flashcardItems.length - 1) {
        flashcardIndex++;
        showFlashcard();
    }
}

function closeFlashcard() {
    document.getElementById('flashcardMode').style.display = 'none';
}
