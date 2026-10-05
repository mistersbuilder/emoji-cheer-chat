// Набор эмодзи для обычных ответов
const EMOJIS = [
  '😊', '😎', '🚀', '🥳', '🔥', '✨', '🌟', '🎯', 
  '🎉', '🦾', '💡', '🥑', '🎈', '🍕', '☕', '⚡', 
  '🏆', '🤙', '🦄', '🦁', '💯', '🏄‍♂️', '🪐', '💎'
];

// Набор мотивирующих фраз для каждого третьего вопроса в стиле Orqanix
const MOTIVATIONS = [
  'Продолжай, я в тебя верю! 🚀',
  'Ты отлично справляешься, так держать! 💪',
  'Не останавливайся, ты на верном пути! 🌟',
  'У тебя всё получается, верь в свои силы! 🔥',
  'Ты способен на большее, чем думаешь! ✨',
  'Шаг за шагом — и цель будет достигнута! 🎯',
  'Ты просто космос! Не сбавляй обороты! 🌈',
  'Твоя настойчивость вдохновляет! 🦾',
  'Каждая попытка делает тебя сильнее! 💎'
];

// Состояние приложения
let chats = [];
let activeChatId = null;
let userQuestionsCount = 0;

// Инициализация
function initApp() {
  const savedData = localStorage.getItem('orqanix_cheer_chat_state');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      chats = parsed.chats || [];
      activeChatId = parsed.activeChatId || null;
      userQuestionsCount = parsed.userQuestionsCount || 0;
    } catch (e) {
      console.error('Ошибка загрузки данных из localStorage', e);
    }
  }

  // Загрузка темы оформления
  const savedTheme = localStorage.getItem('orqanix_cheer_theme') || 'dark';
  document.documentElement.className = savedTheme;

  if (!chats || chats.length === 0) {
    createNewChat('Стартовый диалог', false);
    const firstChat = chats[0];
    firstChat.messages.push({
      role: 'bot',
      text: '👋',
      isEmoji: true,
      time: getCurrentTime()
    });
  } else if (!activeChatId || !chats.some(c => c.id === activeChatId)) {
    activeChatId = chats[0].id;
  }

  renderSidebar();
  renderMessages();
  updateStreakUI();
  updateCounterUI();
}

function saveState() {
  localStorage.setItem('orqanix_cheer_chat_state', JSON.stringify({
    chats,
    activeChatId,
    userQuestionsCount
  }));
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createNewChat(customTitle = null, switchNow = true) {
  const id = 'session_' + Date.now();
  const title = customTitle || `Диалог ${chats.length + 1}`;
  const newChat = {
    id,
    title,
    messages: []
  };

  chats.unshift(newChat);
  if (switchNow) {
    activeChatId = id;
  }
  saveState();
  renderSidebar();
  if (switchNow) {
    renderMessages();
    const input = document.getElementById('message-input');
    if (input) input.focus();
  }
  return newChat;
}

function getActiveChat() {
  return chats.find(c => c.id === activeChatId) || chats[0];
}

// Рендер сайдбара
function renderSidebar() {
  const listEl = document.getElementById('chat-list');
  listEl.innerHTML = '';

  chats.forEach(chat => {
    const li = document.createElement('li');
    li.className = `session-item ${chat.id === activeChatId ? 'active' : ''}`;
    li.onclick = () => {
      activeChatId = chat.id;
      saveState();
      renderSidebar();
      renderMessages();
    };

    const nameSpan = document.createElement('span');
    nameSpan.className = 'session-name';
    nameSpan.textContent = chat.title;

    const countBadge = document.createElement('span');
    countBadge.className = 'session-badge';
    countBadge.textContent = chat.messages.length;

    li.appendChild(nameSpan);
    li.appendChild(countBadge);
    listEl.appendChild(li);
  });

  const activeChat = getActiveChat();
  if (activeChat) {
    document.getElementById('active-chat-title').textContent = activeChat.title;
  }
}

// Рендер ленты сообщений
function renderMessages() {
  const container = document.getElementById('messages-container');
  container.innerHTML = '';

  const activeChat = getActiveChat();
  if (!activeChat) return;

  activeChat.messages.forEach(msg => {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${msg.role}`;

    if (msg.role === 'user') {
      const bubble = document.createElement('div');
      bubble.className = 'user-bubble';
      bubble.textContent = msg.text;

      const meta = document.createElement('div');
      meta.className = 'user-meta';
      meta.textContent = msg.time;

      wrapper.appendChild(bubble);
      wrapper.appendChild(meta);
    } else {
      // Сообщение бота (без иконки/аватара)
      const row = document.createElement('div');
      row.className = 'bot-row';

      const col = document.createElement('div');
      col.className = 'bot-content-col';

      if (msg.isMotivation) {
        const card = document.createElement('div');
        card.className = 'bot-motivation-card';
        card.innerHTML = `
          <div class="motivation-header">
            <span class="motivation-tag">⚡ Импульс мотивации</span>
          </div>
          <div class="motivation-text">${escapeHtml(msg.text)}</div>
        `;
        col.appendChild(card);
      } else {
        const emojiBox = document.createElement('div');
        emojiBox.className = 'bot-emoji-box';
        emojiBox.textContent = msg.text;
        col.appendChild(emojiBox);
      }

      const meta = document.createElement('div');
      meta.className = 'bot-meta';
      meta.textContent = msg.time;
      col.appendChild(meta);

      row.appendChild(col);
      wrapper.appendChild(row);
    }

    container.appendChild(wrapper);
  });

  // Автоскролл вниз
  container.scrollTop = container.scrollHeight;
}

// Индикатор шагов до мотивации
function updateStreakUI() {
  const remainder = userQuestionsCount % 3;
  const currentStep = remainder === 0 && userQuestionsCount > 0 ? 3 : remainder;
  const pills = document.querySelectorAll('.streak-dots .step-pill');

  pills.forEach((pill, idx) => {
    if (idx < currentStep) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

function updateCounterUI() {
  document.getElementById('counter-badge').textContent = userQuestionsCount;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Обработка отправки сообщения
function handleSendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  const activeChat = getActiveChat();
  if (!activeChat) return;

  // Автоматическое название диалога по первому вопросу
  if (activeChat.messages.filter(m => m.role === 'user').length === 0 && activeChat.title.startsWith('Диалог')) {
    activeChat.title = text.length > 24 ? text.slice(0, 24) + '...' : text;
  }

  // 1. Добавляем сообщение пользователя
  activeChat.messages.push({
    role: 'user',
    text: text,
    time: getCurrentTime()
  });

  userQuestionsCount++;
  input.value = '';
  input.style.height = 'auto';

  renderMessages();
  updateStreakUI();
  updateCounterUI();
  saveState();

  // 2. Ответ бота через короткую задержку
  setTimeout(() => {
    let botMsg;
    // Каждый третий вопрос — мотивационный заряд
    if (userQuestionsCount % 3 === 0) {
      botMsg = {
        role: 'bot',
        text: getRandomItem(MOTIVATIONS),
        isMotivation: true,
        time: getCurrentTime()
      };
    } else {
      // Иначе смайлик
      botMsg = {
        role: 'bot',
        text: getRandomItem(EMOJIS),
        isEmoji: true,
        time: getCurrentTime()
      };
    }

    activeChat.messages.push(botMsg);
    renderMessages();
    renderSidebar();
    saveState();
  }, 220);
}

// Навешивание обработчиков событий
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const newChatBtn = document.getElementById('new-chat-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSendMessage();
});

// Отправка по нажатию Enter (без Shift)
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Авторесайз высоты инпута
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// Новый чат
newChatBtn.addEventListener('click', () => {
  createNewChat();
});

// Горячая клавиша Cmd+N / Ctrl+N для создания нового чата
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    createNewChat();
  }
});

// Переключатель светлой/тёмной темы
themeToggleBtn.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const nextTheme = isDark ? 'light' : 'dark';
  html.className = nextTheme;
  localStorage.setItem('orqanix_cheer_theme', nextTheme);
});

// Запуск приложения
initApp();
