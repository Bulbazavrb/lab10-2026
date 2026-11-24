const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const playerNameInput = document.getElementById('player-name');
const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');

const progressText = document.getElementById('progress-text');
const timerSpan = document.getElementById('timer');
const questionTitle = document.getElementById('question-title');
const optionsContainer = document.getElementById('options-container');
const resultSummary = document.getElementById('result-summary');
const detailsList = document.getElementById('details-list');

const TIME_LIMITS = { easy: 45, medium: 40, hard: 30 };

let questions = [];
let currentIndex = 0;
let userAnswers = {};
let timerInterval = null;
let totalTimeLimit = 45;
let timeLeft = 45;

startBtn.addEventListener('click', async () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Будь ласка, введіть ваше ім\'я перед початком вікторини!');
        return;
    }

    const difficulty = difficultySelect.value;
    const response = await fetch(`/api/questions/${difficulty}`);
    const data = await response.json();

    questions = data.questions;
    currentIndex = 0;
    userAnswers = {};
    totalTimeLimit = TIME_LIMITS[difficulty] || 45;
    timeLeft = totalTimeLimit;

    setupScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');

    renderQuestion();
    startTimer();
});

function startTimer() {
    clearInterval(timerInterval);
    timerSpan.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishQuiz();
        }
    }, 1000);
}

function renderQuestion() {
    const q = questions[currentIndex];
    progressText.textContent = `Питання ${currentIndex + 1} з ${questions.length}`;
    questionTitle.textContent = q.question;
    optionsContainer.innerHTML = '';
    nextBtn.disabled = true;
    nextBtn.textContent = currentIndex === questions.length - 1 ? 'Завершити тест' : 'Наступне питання';

    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        btn.textContent = option;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userAnswers[q.id] = option;
            nextBtn.disabled = false;
        });

        optionsContainer.appendChild(btn);
    });
}

nextBtn.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
        currentIndex += 1;
        renderQuestion();
    } else {
        finishQuiz();
    }
});

async function finishQuiz() {
    clearInterval(timerInterval);
    const timeSpent = totalTimeLimit - timeLeft;

    const payload = {
        player_name: playerNameInput.value.trim(),
        difficulty: difficultySelect.value,
        answers: userAnswers,
        time_spent: timeSpent
    };

    const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    resultSummary.textContent = `Гравець: ${result.player_name} | Результат: ${result.score} з ${result.total} балів (за ${result.time_spent} с)`;

    detailsList.innerHTML = '';
    result.details.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `detail-item ${item.is_correct ? 'correct' : 'wrong'}`;
        div.innerHTML = `
            <strong>${idx + 1}. ${item.question}</strong><br>
            Ваша відповідь: ${item.chosen} | Правильна: ${item.correct}
        `;
        detailsList.appendChild(div);
    });
}

restartBtn.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
});