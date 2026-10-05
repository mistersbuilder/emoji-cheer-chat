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

// Настройки скорости/задержки ответа бота
const DELAY_PRESETS = [
  { delay: 400, label: '0.4s', icon: '⚡', title: 'Быстрый ответ (0.4 сек)' },
  { delay: 1000, label: '1.0s', icon: '⏳', title: 'Реалистичный набор (1.0 сек)' },
  { delay: 40, label: '0.0s', icon: '🚀', title: 'Мгновенный ответ (без задержки)' }
];
let currentDelayIndex = parseInt(localStorage.getItem('orqanix_delay_index') || '0', 10);
if (isNaN(currentDelayIndex) || currentDelayIndex < 0 || currentDelayIndex >= DELAY_PRESETS.length) {
  currentDelayIndex = 0;
}

function updateDelayUI() {
  const label = document.getElementById('delay-label');
  const icon = document.getElementById('delay-icon');
  const btn = document.getElementById('delay-toggle-btn');
  const preset = DELAY_PRESETS[currentDelayIndex];
  if (label) label.textContent = preset.label;
  if (icon) icon.textContent = preset.icon;
  if (btn) btn.title = preset.title;
}

function cycleTypingDelay() {
  currentDelayIndex = (currentDelayIndex + 1) % DELAY_PRESETS.length;
  localStorage.setItem('orqanix_delay_index', String(currentDelayIndex));
  updateDelayUI();
  playPopSound();
}

// Звуковые эффекты через Web Audio API
let audioCtx = null;
let soundEnabled = localStorage.getItem('orqanix_sound_enabled') !== 'false';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPopSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(340, now);
  osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

function playCheerSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50];
  const startTime = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = startTime + idx * 0.07;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.2, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteTime);
    osc.stop(noteTime + 0.32);
  });
}

function playSendSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

function updateSoundUI() {
  const onIcon = document.getElementById('sound-icon-on');
  const offIcon = document.getElementById('sound-icon-off');
  const btn = document.getElementById('sound-toggle');
  if (!onIcon || !offIcon || !btn) return;

  if (soundEnabled) {
    onIcon.classList.remove('hidden');
    offIcon.classList.add('hidden');
    btn.title = 'Звуковые эффекты включены';
  } else {
    onIcon.classList.add('hidden');
    offIcon.classList.remove('hidden');
    btn.title = 'Звуковые эффекты отключены';
  }
}

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
  updateSoundUI();
  updateDelayUI();
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

      // Блок интерактивных реакций на ответ бота
      const reactionsBar = document.createElement('div');
      reactionsBar.className = 'reactions-bar';
      if (msg.userReaction) {
        reactionsBar.classList.add('has-active');
      }

      const availableReactions = ['❤️', '🔥', '😂', '👏'];
      availableReactions.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `reaction-btn ${msg.userReaction === emoji ? 'active' : ''}`;
        btn.innerHTML = `<span>${emoji}</span>${msg.userReaction === emoji ? '<span class="reaction-count">1</span>' : ''}`;
        btn.title = `Отреагировать ${emoji}`;
        btn.onclick = (e) => {
          e.stopPropagation();
          if (msg.userReaction === emoji) {
            delete msg.userReaction;
          } else {
            msg.userReaction = emoji;
            playPopSound();
          }
          saveState();
          renderMessages();
        };
        reactionsBar.appendChild(btn);
      });
      col.appendChild(reactionsBar);

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
  playSendSound();
  input.value = '';
  input.style.height = 'auto';

  renderMessages();
  updateStreakUI();
  updateCounterUI();
  saveState();

  // 2. Отображаем анимированный индикатор набора текста
  const currentDelay = DELAY_PRESETS[currentDelayIndex].delay;
  if (currentDelay > 60) {
    const container = document.getElementById('messages-container');
    const typingWrapper = document.createElement('div');
    typingWrapper.id = 'typing-indicator-wrapper';
    typingWrapper.className = 'message-wrapper bot';
    typingWrapper.innerHTML = `
      <div class="bot-row">
        <div class="bot-content-col">
          <div class="typing-indicator-box">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(typingWrapper);
    container.scrollTop = container.scrollHeight;
  }

  // 3. Ответ бота после настраиваемой задержки
  setTimeout(() => {
    const indicator = document.getElementById('typing-indicator-wrapper');
    if (indicator) indicator.remove();

    let botMsg;
    // Каждый третий вопрос — мотивационный заряд
    if (userQuestionsCount % 3 === 0) {
      botMsg = {
        role: 'bot',
        text: getRandomItem(MOTIVATIONS),
        isMotivation: true,
        time: getCurrentTime()
      };
      playCheerSound();
    } else {
      // Иначе смайлик
      botMsg = {
        role: 'bot',
        text: getRandomItem(EMOJIS),
        isEmoji: true,
        time: getCurrentTime()
      };
      playPopSound();
    }

    activeChat.messages.push(botMsg);
    renderMessages();
    renderSidebar();
    saveState();
  }, currentDelay);
}

// Навешивание обработчиков событий
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const newChatBtn = document.getElementById('new-chat-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const soundToggleBtn = document.getElementById('sound-toggle');

if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('orqanix_sound_enabled', String(soundEnabled));
    updateSoundUI();
    if (soundEnabled) {
      playPopSound();
    }
  });
}

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

// Кнопка переключения задержки ответа
const delayToggleBtn = document.getElementById('delay-toggle-btn');
if (delayToggleBtn) {
  delayToggleBtn.addEventListener('click', cycleTypingDelay);
}

// Кнопка экспорта чата
const exportChatBtn = document.getElementById('export-chat-btn');
if (exportChatBtn) {
  exportChatBtn.addEventListener('click', exportCurrentChat);
}

// Кнопка очистки истории
const clearChatBtn = document.getElementById('clear-chat-btn');
if (clearChatBtn) {
  clearChatBtn.addEventListener('click', clearCurrentChat);
}

function clearCurrentChat() {
  const activeChat = getActiveChat();
  if (!activeChat) return;

  if (confirm('Очистить сообщения в этом диалоге?')) {
    activeChat.messages = [{
      role: 'bot',
      text: '👋',
      isEmoji: true,
      time: getCurrentTime()
    }];
    saveState();
    renderMessages();
    renderSidebar();
    playPopSound();
  }
}

// Экспорт текущего чата в текстовый файл
function exportCurrentChat() {
  const activeChat = getActiveChat();
  if (!activeChat || activeChat.messages.length === 0) {
    alert('Чат пока пуст. Напишите что-нибудь перед экспортом!');
    return;
  }

  const dateStr = new Date().toLocaleString();
  let content = `========================================\n`;
  content += `Orqanix Emoji & Cheer Chat — Export\n`;
  content += `Диалог: ${activeChat.title}\n`;
  content += `Дата экспорта: ${dateStr}\n`;
  content += `Всего сообщений: ${activeChat.messages.length}\n`;
  content += `========================================\n\n`;

  activeChat.messages.forEach(msg => {
    const sender = msg.role === 'user' ? 'Вы' : 'Orqanix Bot';
    content += `[${msg.time}] ${sender}:\n`;
    if (msg.isMotivation) {
      content += `⚡ Мотивация: ${msg.text}\n`;
    } else {
      content += `${msg.text}\n`;
    }
    if (msg.userReaction) {
      content += `Реакция: ${msg.userReaction}\n`;
    }
    content += `\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (activeChat.title || 'chat')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]/gi, '_')
    .slice(0, 30);
  const fileName = `chat-${safeTitle}-${Date.now().toString().slice(-6)}.txt`;

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  playPopSound();
}

// Запуск приложения
initApp();
