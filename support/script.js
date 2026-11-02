let currentChat = 'bot';
let currentFile = null;

const chatDetails = {
    'bot': { title: '🤖 Бот-помощник', status: 'Пытается помочь' },
    'operator': { title: '📞 Реальный оператор', status: 'Прием багов и репортов' }
};

document.addEventListener('DOMContentLoaded', () => {
    // Звездный фон
    const container = document.getElementById('stars-container');
    if (container) {
        for (let i = 0; i < 40; i++) {
            const star = document.createElement('div');
            star.className = 'stars';
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.setProperty('--o', Math.random() * 0.7);
            star.style.setProperty('--d', `${12 + Math.random() * 20}s`);
            star.style.animationDelay = `${Math.random() * 10}s`;
            container.appendChild(star);
        }
    }

    loadChatMessages(currentChat);
});

// Переключение между ботом и оператором
function switchChat(chatId) {
    currentChat = chatId;
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`chat-tab-${chatId}`).classList.add('active');

    document.getElementById('current-chat-title').textContent = chatDetails[chatId].title;
    document.getElementById('current-chat-status').textContent = chatDetails[chatId].status;

    loadChatMessages(chatId);
}

// Загрузка сообщений
function loadChatMessages(chatId) {
    const container = document.getElementById('chat-messages');
    const history = JSON.parse(localStorage.getItem(`hud_chat_${chatId}`) || '[]');

    if (history.length === 0) {
        if (chatId === 'bot') {
            history.push({ sender: 'bot', text: 'Привет! Я бот-помощник 🤖 Спроси меня про любую игру на сайте, и я постараюсь подсказать решение!' });
        } else {
            history.push({ sender: 'operator', text: 'Здравствуйте! Это чат с реальным оператором. Опишите возникший баг или отправьте скриншот ошибки.' });
        }
        localStorage.setItem(`hud_chat_${chatId}`, JSON.stringify(history));
    }

    container.innerHTML = '';
    history.forEach(msg => appendMessageUI(msg));
    scrollToBottom();
}

// Отрисовка сообщения в чате
function appendMessageUI(msg) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${msg.sender}`;

    let html = `<div>${msg.text}</div>`;

    if (msg.file) {
        if (msg.file.type.startsWith('image/')) {
            html += `<img src="${msg.file.data}" class="chat-img-attach" alt="Вложение">`;
        } else {
            html += `<a href="${msg.file.data}" download="${msg.file.name}" class="file-download-link">📎 ${msg.file.name}</a>`;
        }
    }

    msgDiv.innerHTML = html;
    container.appendChild(msgDiv);
}

// Загрузка файлов
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentFile = {
            name: file.name,
            type: file.type,
            data: e.target.result
        };

        document.getElementById('attachment-name').textContent = `📎 Прикреплено: ${file.name}`;
        document.getElementById('attachment-preview').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function clearAttachment() {
    currentFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('attachment-preview').style.display = 'none';
}

// Отправка
function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();

    if (!text && !currentFile) return;

    const newMsg = {
        sender: 'user',
        text: text || (currentFile ? 'Вложение:' : ''),
        file: currentFile
    };

    appendMessageUI(newMsg);
    saveMessage(currentChat, newMsg);

    input.value = '';
    clearAttachment();
    scrollToBottom();

    // Логика ответов
    if (currentChat === 'bot') {
        // Умный бот, который реально пытается помочь
        setTimeout(() => {
            const botReplyText = getHelpfulBotReply(text);
            const botMsg = { sender: 'bot', text: botReplyText };
            appendMessageUI(botMsg);
            saveMessage(currentChat, botMsg);
            scrollToBottom();
        }, 700);
    } else {
        // Эмуляция ответа оператора через пару секунд
        setTimeout(() => {
            const opMsg = { sender: 'operator', text: 'Ваше сообщение и данные получены. Оператор изучает проблему!' };
            appendMessageUI(opMsg);
            saveMessage(currentChat, opMsg);
            scrollToBottom();
        }, 1200);
    }
}

// Бот, который реально пытается помочь по сайту
function getHelpfulBotReply(userText) {
    const text = userText.toLowerCase();

    if (text.includes('майнкрафт') || text.includes('minecraft') || text.includes('mc')) {
        return '🎮 По поводу Minecraft: старая версия доступна в категории «3D-игры» на главной странице. Нажми на карточку, в левой панели появятся характеристики, и жми зеленую кнопку «Играть»!';
    }
    if (text.includes('игра') || text.includes('запустить') || text.includes(' не работает')) {
        return '🛠️ Если какая-то игра не запускается, попробуй проверить путь к файлу в коде или обновить страницу. Также убедись, что все папки на месте!';
    }
    if (text.includes('профиль') || text.includes('аватар') || text.includes('имя')) {
        return '👤 Настроить профиль можно через иконку человека в правом верхнем углу главной страницы. Там можно загрузить свою аватарку (PNG), выбрать статус и указать дату рождения (возраст считается автоматически).';
    }
    if (text.includes('свернуть') || text.includes('категори')) {
        return '📦 Категории на главном экране можно сворачивать кликом по заголовку со стрелочкой. Твой выбор запоминается браузером!';
    }
    if (text.includes('привет') || text.includes('здаров') || text.includes('хай')) {
        return 'Привет! Я бот-помощник HUD. Чем помочь тебе сегодня? Могу подсказать по играм, багам или интерфейсу.';
    }

    return '🤔 Я внимательно выслушал твой вопрос. Если это сложная техническая ошибка или баг, рекомендую переключиться в соседний чат «Реальный оператор» и отправить туда подробности или скриншот!';
}

function saveMessage(chatId, msg) {
    const history = JSON.parse(localStorage.getItem(`hud_chat_${chatId}`) || '[]');
    history.push(msg);
    localStorage.setItem(`hud_chat_${chatId}`, JSON.stringify(history));
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}