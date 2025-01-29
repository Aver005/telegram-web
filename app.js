// Модуль для работы с сообщениями
class MessageHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.messages = new Map();
    }

    addMessage(chatId, message) 
    {
        if (!this.messages.has(chatId)) {
            this.messages.set(chatId, []);
        }
        this.messages.get(chatId).push({
            ...message,
            id: Date.now(),
            timestamp: new Date()
        });
        this.renderMessages(chatId);
    }

    renderMessages(chatId) 
    {
        const container = document.querySelector('.messages-container');
        const messages = this.messages.get(chatId) || [];

        container.innerHTML = messages.map(msg => `
      <div class="message ${msg.outgoing ? 'outgoing' : 'incoming'}">
        <div class="message-content">
          ${msg.text}
        </div>
        <small class="text-muted">
          ${msg.timestamp.toLocaleTimeString()}
        </small>
      </div>
    `).join('');

        container.scrollTop = container.scrollHeight;
    }
}

// Модуль для работы с чатами
class ChatHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.chats = [];
        this.activeChat = null;
        this.searchTerm = '';
    }

    addChat(chat) {
        this.chats.unshift({
            ...chat,
            id: chat.id || `chat_${Date.now()}`,
            unreadCount: chat.unreadCount || 0,
            online: chat.online || false,
            lastMessage: chat.lastMessage || {}
        });
        this.renderChats();
        this.setActiveChat(chat.id);
    }

    setActiveChat(chatId) {
        this.activeChat = chatId;
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.unreadCount = 0;
        }
        this.renderChats();
        this.updateUI();
    }

    renderChats() {
        const container = document.querySelector('.chats-list');
        if (!container) return;

        const filteredChats = this.chats.filter(chat =>
            chat.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );

        container.innerHTML = filteredChats.map(chat => `
      <div class="chat-item d-flex align-items-center ${this.activeChat === chat.id ? 'active' : ''}" 
           data-chat-id="${chat.id}">
        <div class="avatar me-3">
          ${chat.name[0]}
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between">
            <strong>${chat.name}</strong>
            <small class="text-muted">${chat.lastMessage?.time || ''}</small>
          </div>
          <div class="text-muted small">${chat.lastMessage?.text || ''}</div>
        </div>
        ${chat.unreadCount ? `
          <div class="unread-badge ms-2">${chat.unreadCount}</div>
        ` : ''}
      </div>
    `).join('');
    }

    search(term) {
        this.searchTerm = term;
        this.renderChats();
    }

    updateUI() {
        const chat = this.chats.find(c => c.id === this.activeChat);
        if (chat) {
            const headerContent = `
        <div class="d-flex align-items-center chat-header-content">
          <div class="chat-profile-info" data-chat-id="${chat.id}">
            <div class="avatar me-3">${chat.name[0]}</div>
            <div>
              <h2 class="chat-title mb-0">${chat.name}</h2>
              <small class="chat-status text-muted">${chat.online ? 'в сети' : 'не в сети'}</small>
            </div>
          </div>
          <div class="chat-actions ms-auto">
            <button class="btn btn-icon header-action" data-action="call">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>
            <button class="btn btn-icon header-action" data-action="invite">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
             <button class="btn btn-icon header-action" data-action="notifications">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </button>
            <button class="btn btn-icon chat-options-button">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
            document.querySelector('.chat-header').innerHTML = headerContent;

            // Add click handler for profile info
            document.querySelector('.chat-profile-info')?.addEventListener('click', () => {
                window.app.profileHandler.showProfile(chat.id);
            });
        }
    }
}

// Модуль для работы с файлами
class FileHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.supportedTypes = 
        {
            'image/*': 'Изображения',
            'video/*': 'Видео',
            'audio/*': 'Аудио',
            'application/*': 'Документы'
        };
    }

    handleFileSelect(files) 
    {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const message = {
                    type: 'file',
                    fileType: file.type,
                    fileName: file.name,
                    fileSize: this.formatFileSize(file.size),
                    content: e.target.result
                };
                window.app.messageHandler.addMessage(window.app.chatHandler.activeChat, {
                    ...message,
                    outgoing: true
                });
            };
            reader.readAsDataURL(file);
        });
    }

    formatFileSize(bytes) 
    {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Модуль для работы с меню
class MenuHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.initializeMenus();
        this.initializeButtons();
        this.initializeMobileMenu();
        this.initializeCreateChat();
        this.initializeHeaderButtons();
        this.popupHandler = new PopupHandler();
    }

    initializeMenus() 
    {
        // Chat options menu
        const optionsButton = document.querySelector('.chat-options-button');
        const optionsMenu = document.querySelector('.chat-options-menu');

        optionsButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('show');
        });

        // Attachment menu
        const attachButton = document.querySelector('.attachment-button');
        const attachMenu = document.querySelector('.attachment-menu');

        attachButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            attachMenu.classList.toggle('show');
        });

        // Close menus when clicking outside
        document.addEventListener('click', () => {
            optionsMenu?.classList.remove('show');
            attachMenu?.classList.remove('show');
        });

        // Handle attachment menu items
        document.querySelectorAll('.attachment-menu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.querySelector('.file-input')) {
                    item.querySelector('.file-input').click();
                }
            });
        });
    }

    initializeButtons() 
    {
        // Initialize call button
        const callButton = document.querySelector('.btn-outline-primary');
        if (callButton) {
            callButton.addEventListener('click', () => {
                this.popupHandler.alert('Звонок', 'Функция звонков будет доступна в ближайшее время!');
            });
        }

        // Make all menu items clickable
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.textContent.trim();
                this.handleMenuAction(action);
            });
        });
    }

    initializeMobileMenu() 
    {
        const menuButton = document.querySelector('.menu-button');
        menuButton?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    initializeCreateChat() 
    {
        const createButton = document.querySelector('.create-chat-button');
        createButton?.addEventListener('click', async () => {
            const name = await this.popupHandler.prompt('Создать чат', 'Введите название чата');
            if (name) {
                const newChat = {
                    id: 'chat_' + Date.now(),
                    name: name,
                    lastMessage: { text: 'Чат создан', time: new Date().toLocaleTimeString() },
                    unreadCount: 0,
                    online: true
                };
                window.app.chatHandler.addChat(newChat);
            }
        });
    }

    initializeHeaderButtons() 
    {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.header-action');
            if (!button) return;

            const action = button.dataset.action;
            switch (action) {
                case 'call':
                    this.popupHandler.alert('Звонок', 'Функция звонков будет доступна в ближайшее время');
                    break;
                case 'invite':
                    this.popupHandler.alert('Приглашение', 'Скопируйте ссылку для приглашения пользователей');
                    break;
                case 'notifications':
                    this.popupHandler.alert('Уведомления', 'Уведомления включены');
                    break;
            }
        });
    }

    async handleMenuAction(action) 
    {
        switch (action) {
            case 'Информация о чате':
                await this.popupHandler.alert('Информация', 'Информация о чате будет доступна здесь');
                break;
            case 'Очистить историю':
                if (await this.popupHandler.confirm('Подтверждение', 'Вы уверены, что хотите очистить историю чата?')) {
                    window.app.messageHandler.messages.clear();
                    window.app.messageHandler.renderMessages(window.app.chatHandler.activeChat);
                }
                break;
            case 'Заблокировать':
                await this.popupHandler.alert('Блокировка', 'Пользователь заблокирован');
                break;
            case 'Удалить чат':
                if (await this.popupHandler.confirm('Подтверждение', 'Вы уверены, что хотите удалить этот чат?')) {
                    const activeChat = window.app.chatHandler.activeChat;
                    window.app.chatHandler.chats = window.app.chatHandler.chats.filter(chat => chat.id !== activeChat);
                    window.app.chatHandler.renderChats();
                }
                break;
            // ...rest of the cases
            case 'Документ':
                this.popupHandler.triggerFileInput('application/*');
                break;
            case 'Контакт':
                await this.popupHandler.alert('Контакт', 'Обмен контактами будет доступен в ближайшее время');
                break;
            case 'Геолокация':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const message = {
                                text: `📍 Местоположение: ${position.coords.latitude}, ${position.coords.longitude}`,
                                outgoing: true
                            };
                            window.app.messageHandler.addMessage(window.app.chatHandler.activeChat, message);
                        },
                        () => {
                            this.popupHandler.alert('Ошибка', 'Невозможно определить местоположение');
                        }
                    );
                }
                break;
        }
    }
}

class PopupHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.overlay = this.createOverlay();
        document.body.appendChild(this.overlay);
    }

    createOverlay() 
    {
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.innerHTML = `<div class="popup-content"></div>`;
        return overlay;
    }

    createPopup(title, content, buttons) {
        const popup = this.overlay.querySelector('.popup-content');

        popup.innerHTML = `
      <div class="popup-header">
        <div class="popup-title">${title}</div>
        <div class="popup-close">✕</div>
      </div>
      <div class="popup-body">${content}</div>
      <div class="popup-footer">
        ${buttons.map(btn => `
          <button class="popup-btn ${btn.primary ? 'popup-btn-primary' : 'popup-btn-secondary'}">${btn.text}</button>
        `).join('')}
      </div>
    `;

        return popup;
    }

    show(title, content, buttons) {
        return new Promise((resolve) => {
            const popup = this.createPopup(title, content, buttons);

            const closeBtn = popup.querySelector('.popup-close');
            const allButtons = popup.querySelectorAll('.popup-btn');

            const close = (result) => {
                this.overlay.classList.remove('show');
                setTimeout(() => {
                    popup.innerHTML = '';
                    resolve(result);
                }, 300);
            };

            closeBtn.addEventListener('click', () => close(null));
            allButtons.forEach((btn, index) => {
                btn.addEventListener('click', () => close(index));
            });

            requestAnimationFrame(() => {
                this.overlay.classList.add('show');
            });
        });
    }

    async prompt(title, placeholder = '') {
        const content = `
      <div class="popup-input-container">
        <input type="text" class="popup-input" placeholder="${placeholder}" autofocus>
      </div>
    `;
        const buttons = [
            { text: 'Отмена', primary: false },
            { text: 'OK', primary: true }
        ];

        const result = await this.show(title, content, buttons);
        if (result === 1) {
            const input = this.overlay.querySelector('.popup-input');
            return input?.value?.trim() || '';
        }
        return null;
    }

    async confirm(title, message) {
        const buttons = [
            { text: 'Отмена', primary: false },
            { text: 'OK', primary: true }
        ];
        const result = await this.show(title, message, buttons);
        return result === 1;
    }

    async alert(title, message) {
        const buttons = [{ text: 'OK', primary: true }];
        await this.show(title, message, buttons);
    }

    triggerFileInput(accept) {
        const input = document.querySelector('.file-input');
        if (input) {
            input.accept = accept;
            input.click();
        }
    }
}

class ProfileHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.currentProfile = {
            id: 'self',
            name: 'Current User',
            phone: '+7 999 123 45 67',
            username: '@current_user',
            bio: 'Hey there! I am using Telegram',
            avatar: 'CU'
        };

        this.profiles = new Map([
            ['1', {
                id: '1',
                name: 'Иван Петров',
                phone: '+7 925 111 22 33',
                username: '@ipetrov',
                bio: 'Software Developer',
                avatar: 'ИП'
            }],
            ['2', {
                id: '2',
                name: 'Рабочий чат',
                members: 15,
                description: 'Рабочий чат команды разработчиков',
                avatar: 'РЧ'
            }],
            // ... other profiles
        ]);
    }

    async showProfile(profileId) 
    {
        const profile = this.profiles.get(profileId) || this.currentProfile;
        const isGroup = 'members' in profile;

        const content = `
      <div class="profile-card">
        <div class="profile-avatar large">${profile.avatar}</div>
        <h3 class="profile-name">${profile.name}</h3>
        ${isGroup ? `
          <div class="profile-info">
            <div class="profile-label">Участники</div>
            <div class="profile-value">${profile.members} участников</div>
          </div>
          <div class="profile-info">
            <div class="profile-label">Описание</div>
            <div class="profile-value">${profile.description}</div>
          </div>
        ` : `
          <div class="profile-info">
            <div class="profile-label">Телефон</div>
            <div class="profile-value">${profile.phone}</div>
          </div>
          <div class="profile-info">
            <div class="profile-label">Username</div>
            <div class="profile-value">${profile.username}</div>
          </div>
          <div class="profile-info">
            <div class="profile-label">Bio</div>
            <div class="profile-value">${profile.bio}</div>
          </div>
        `}
      </div>
    `;

        await window.app.popupHandler.show('Профиль', content, [
            { text: 'Закрыть', primary: false }
        ]);
    }
}

class SidebarHandler 
{
    constructor(app) 
    {
        this.app = app;
        this.initializeSidebar();
        this.initializeMenuButton();
    }

    initializeSidebar() 
    {
        const sidebar = document.createElement('div');
        sidebar.className = 'settings-sidebar';
        console.log(this.app.profileHandler);
        const profile = this.app.profileHandler.currentProfile;

        sidebar.innerHTML = `
      <div class="settings-header">
        <div class="settings-title">Меню</div>
        <div class="settings-close">✕</div>
      </div>
      <div class="settings-content">
        <div class="current-account">
          <div class="avatar">${profile.avatar}</div>
          <div class="account-info">
            <div class="account-name">${profile.name}</div>
            <div class="account-phone">${profile.phone}</div>
          </div>
        </div>
        <div class="settings-list">
          <div class="settings-item" data-action="new-group">
            <div class="icon">👥</div>
            <div>Создать группу</div>
          </div>
          <div class="settings-item" data-action="contacts">
            <div class="icon">📱</div>
            <div>Контакты</div>
          </div>
          <div class="settings-item" data-action="settings">
            <div class="icon">⚙️</div>
            <div>Настройки</div>
          </div>
          <div class="settings-item" data-action="help">
            <div class="icon">❓</div>
            <div>Помощь</div>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(sidebar);

        // Handle close button click
        sidebar.querySelector('.settings-close').addEventListener('click', () => {
            sidebar.classList.remove('active');
        });

        // Handle menu items
        sidebar.querySelectorAll('.settings-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleSettingsAction(action);
                sidebar.classList.remove('active');
            });
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-sidebar') &&
                !e.target.closest('.menu-button')) {
                sidebar.classList.remove('active');
            }
        });
    }

    initializeMenuButton() {
        const menuBtn = document.querySelector('.menu-button');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sidebar = document.querySelector('.settings-sidebar');
                if (sidebar) {
                    sidebar.classList.add('active');
                }
            });
        }
    }

    async handleSettingsAction(action) {
        switch (action) {
            case 'new-group':
                const groupName = await window.app.popupHandler.prompt('Новая группа', 'Введите название группы');
                if (groupName) {
                    const newGroup = {
                        id: 'group_' + Date.now(),
                        name: groupName,
                        lastMessage: { text: 'Группа создана', time: new Date().toLocaleTimeString() },
                        unreadCount: 0,
                        online: true,
                        members: 1,
                        description: 'Новая группа'
                    };
                    window.app.chatHandler.addChat(newGroup);
                }
                break;
            case 'contacts':
                await window.app.popupHandler.alert('Контакты', 'Список контактов будет доступен в ближайшее время');
                break;
            case 'settings':
                await window.app.popupHandler.alert('Настройки', 'Настройки будут доступны в ближайшее время');
                break;
            case 'help':
                await window.app.popupHandler.alert('Помощь', 'Раздел помощи будет доступен в ближайшее время');
                break;
        }
    }
}

// Инициализация приложения
class App 
{
    constructor()     
    {
        this.messageHandler = new MessageHandler(this);
        this.chatHandler = new ChatHandler(this);
        this.fileHandler = new FileHandler(this);
        this.menuHandler = new MenuHandler(this);
        this.popupHandler = new PopupHandler(this);
        this.profileHandler = new ProfileHandler(this);
        this.sidebarHandler = new SidebarHandler(this);

        this.initializeEventListeners();
    }

    initializeEventListeners() 
    {
        // Chat selection handler
        const chatsList = document.querySelector('.chats-list');
        if (chatsList) 
        {
            chatsList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) 
                {
                    const chatId = chatItem.dataset.chatId;
                    this.chatHandler.setActiveChat(chatId);
                    this.messageHandler.renderMessages(chatId);
                }
            });
        }

        // Search handler
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.chatHandler.search(e.target.value);
            });
        }

        // File handler
        const fileInput = document.querySelector('.file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.fileHandler.handleFileSelect(e.target.files);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => 
{
    window.app = new App();
    // Add event handler for message input and send button immediately after app initialization
    const messageInput = document.querySelector('.message-input input');
    const sendButton = document.querySelector('.message-input .btn-primary');

    if (messageInput && sendButton) {
        const sendMessage = () => {
            const text = messageInput.value.trim();
            if (text && window.app.chatHandler.activeChat) {
                window.app.messageHandler.addMessage(window.app.chatHandler.activeChat, {
                    text,
                    outgoing: true
                });
                messageInput.value = '';

                // Update last message in chat
                const chat = window.app.chatHandler.chats.find(c => c.id === window.app.chatHandler.activeChat);
                if (chat) {
                    chat.lastMessage = {
                        text,
                        time: new Date().toLocaleTimeString()
                    };
                    window.app.chatHandler.renderChats();
                }
            }
        };

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Load initial mock data
    const mockChats = [
        {
            id: '1',
            name: 'Иван Петров',
            lastMessage: { text: 'Привет! Как дела?', time: '12:30' },
            unreadCount: 2,
            online: true
        },
        {
            id: '2',
            name: 'Рабочий чат',
            lastMessage: { text: 'Встреча в 15:00', time: '12:25' },
            unreadCount: 0,
            online: false
        },
        {
            id: '3',
            name: 'Семья',
            lastMessage: { text: 'Купи хлеба', time: '12:20' },
            unreadCount: 1,
            online: true
        }
    ];

    mockChats.forEach(chat => window.app.chatHandler.addChat(chat));
});