// Модуль для работы с сообщениями
class MessageHandler {
    constructor(app) {
        this.app = app;
        this.messages = new Map();
    }

    addMessage(chatId, message) {
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

    addReaction(messageId, reaction) {
        for (const [chatId, messages] of this.messages) {
          const message = messages.find(m => m.id === messageId);
          if (message) {
            if (!message.reactions) message.reactions = {};
            
            // Удаляем предыдущую реакцию пользователя если она есть
            const userReaction = Object.keys(message.reactions)
              .find(r => message.reactions[r].users.includes('currentUser'));
            
            if (userReaction) {
              if (userReaction === reaction) {
                // Если та же реакция - удаляем
                delete message.reactions[reaction];
                if (Object.keys(message.reactions).length === 0) {
                  delete message.reactions;
                }
              } else {
                // Удаляем из предыдущей реакции
                message.reactions[userReaction].count--;
                message.reactions[userReaction].users = 
                  message.reactions[userReaction].users.filter(u => u !== 'currentUser');
                
                // Добавляем новую
                message.reactions[reaction] = {
                  count: 1,
                  users: ['currentUser']
                };
              }
            } else {
              // Новая реакция
              if (message.reactions[reaction]) {
                message.reactions[reaction].count++;
                message.reactions[reaction].users.push('currentUser');
              } else {
                message.reactions[reaction] = {
                  count: 1,
                  users: ['currentUser']
                };
              }
            }
            
            this.renderMessages(chatId);
            return;
          }
        }
      }

    renderMessages(chatId) 
    {
        const container = document.querySelector('.messages-container');
        const messages = this.messages.get(chatId) || [];

        const formatTime = (date) => {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.outgoing ? 'outgoing' : 'incoming'}" data-message-id="${msg.id}">
              <div class="message-content">
                ${msg.text}
                ${msg.reactions ? `
                  <div class="message-reactions">
                    ${Object.entries(msg.reactions).map(([r, data]) => `
                      <div class="reaction ${data.users.includes('currentUser') ? 'selected' : ''}" 
                           data-reaction="${r}">
                        ${r} <span class="reaction-count">${data.count}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
              <small class="message-time">${formatTime(msg.timestamp)}</small>
            </div>
          `).join('');

        container.scrollTop = container.scrollHeight;
    }
}

// Модуль для работы с чатами
class ChatHandler {
    constructor(app) {
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

    setActiveChat(chatId, byUser=false) {
        if (byUser)
            document.getElementById('sidebar').classList.remove('active');

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
        <div class="menu-button" id="mobile-switch">
            <i class="fas fa-bars"></i>
        </div>
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
            <button class="btn btn-icon chat-options-button" data-action="options">
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
class FileHandler {
    constructor(app) {
        this.app = app;
        this.supportedTypes =
        {
            'image/*': 'Изображения',
            'video/*': 'Видео',
            'audio/*': 'Аудио',
            'application/*': 'Документы'
        };
    }

    handleFileSelect(files) {
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Модуль для работы с меню
class MenuHandler {
    constructor(app) {
        this.app = app;
        this.notificationState = 'enabled';
        this.initializeMenus();
        this.initializeButtons();
        this.initializeMobileMenu();
        this.initializeCreateChat();
        // this.initializeHeaderButtons();

        this.initializeNotifications();
        this.initializeInvites();
    }

    initializeMenus() {
        // Chat options menu
        const optionsMenu = document.querySelector('#chat-options');
        // Attachment menu
        const attachButton = document.querySelector('.attachment-button');
        const attachMenu = document.querySelector('#attachment-menu');

        attachButton?.addEventListener('click', (e) => 
        {
            e.stopPropagation();
            attachMenu.classList.toggle('show');
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => 
        {
            const btn = e.target.closest('.chat-options-button');
            console.log(btn, e.target)
            if (!btn)
            {
                optionsMenu.classList.remove('show');
                attachMenu.classList.remove('show');
                return;
            }

            optionsMenu.classList.toggle('show');
        });

        // Handle attachment menu items
        document.querySelectorAll('.attachment-menu .menu-item').forEach(item => 
        {
            item.addEventListener('click', (e) => 
            {
                e.stopPropagation();
                if (item.querySelector('.file-input')) 
                    item.querySelector('.file-input').click();
            });
        });
    }

    initializeButtons() {
        // Initialize call button
        const callButton = document.querySelector('.btn-outline-primary');
        if (callButton) {
            callButton.addEventListener('click', () => {
                this.app.popupHandler.alert('Звонок', 'Функция звонков будет доступна в ближайшее время!');
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

    initializeMobileMenu() {
        document.addEventListener('click', (e) => 
        {
            const btn = e.target.closest('#mobile-switch');
            if (!btn) return;
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    initializeCreateChat() 
    {
        const createChatButton = document.querySelector('.create-chat-button');
        if (createChatButton) {
            createChatButton.addEventListener('click', async () => {
                const chatTypeResult = await this.app.popupHandler.show('Создать', `
                  <div class="create-chat-options">
                    <div class="menu-item" data-type="dialog">
                      <i class="fas fa-user"></i>
                      <span>Диалог</span>
                    </div>
                    <div class="menu-item" data-type="group">
                      <i class="fas fa-users"></i>
                      <span>Беседа</span>
                    </div>
                    <div class="menu-item" data-type="channel">
                      <i class="fas fa-bullhorn"></i>
                      <span>Канал</span>
                    </div>
                  </div>
                  <div class="popup-input-container mt-3" style="display: none;">
                    <input type="text" class="popup-input name-input" placeholder="Введите название">
                    <input type="text" class="popup-input link-input" placeholder="Введите ссылку (например: t.me/channel)" style="display: none; margin-top: 10px;">
                    <div class="contact-selection mt-4" style="display: none;">
                      <h6 class="mb-2">Выберите участников:</h6>
                      <div class="contact-list">
                        <div class="contact-item">
                          <div class="avatar me-3">ИП</div>
                          <div>
                            <div>Иван Петров</div>
                            <small class="text-muted">+7 925 111 22 33</small>
                          </div>
                        </div>
                        <div class="contact-item">
                          <div class="avatar me-3">МС</div>
                          <div>
                            <div>Мария Сидорова</div>
                            <small class="text-muted">+7 925 222 33 44</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `, [{ text: 'Отмена', primary: false }, { text: 'Создать', primary: true }]);

                if (chatTypeResult === 0) 
                {
                    const selectedType = document.querySelector('.create-chat-options .menu-item.selected')?.dataset.type;
                    const nameInput = document.querySelector('.name-input');
                    const linkInput = document.querySelector('.link-input');
                    const selectedContacts = Array.from(document.querySelectorAll('.contact-item input:checked'));

                    if (selectedType && nameInput?.value) {
                        const newChat = {
                            id: `${selectedType}_${Date.now()}`,
                            name: nameInput.value.trim(),
                            type: selectedType,
                            lastMessage: {
                                text: selectedType === 'channel' ? 'Канал создан' :
                                    selectedType === 'group' ? 'Беседа создана' :
                                        'Диаолог создан',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            },
                            unreadCount: 0,
                            online: selectedType === 'dialog',
                            members: selectedType === 'group' ? selectedContacts.length + 1 : undefined,
                            channelLink: selectedType === 'channel' ? linkInput?.value : undefined
                        };

                        this.app.chatHandler.addChat(newChat);
                    }
                }
            });

            // Add click handler for create chat options
            document.addEventListener('click', (e) => 
            {
                const menuItem = e.target.closest('.create-chat-options .menu-item');
                if (menuItem) {
                    const inputContainer = document.querySelector('.popup-input-container');
                    const linkInput = document.querySelector('.link-input');
                    const contactSelection = document.querySelector('.contact-selection');
                    const checkboxes = document.querySelectorAll('.contact-item input[type="checkbox"]');

                    document.querySelectorAll('.create-chat-options .menu-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    menuItem.classList.add('selected');

                    // Show input container
                    if (inputContainer) inputContainer.style.display = 'block';

                    // Handle different chat types
                    const type = menuItem.dataset.type;
                    if (type === 'channel') {
                        if (linkInput) linkInput.style.display = 'block';
                        if (contactSelection) contactSelection.style.display = 'none';
                        checkboxes.forEach(cb => cb.disabled = true);
                    } else if (type === 'group') {
                        if (linkInput) linkInput.style.display = 'none';
                        if (contactSelection) contactSelection.style.display = 'block';
                        checkboxes.forEach(cb => {
                            cb.disabled = false;
                            cb.type = 'checkbox';
                        });
                    } else if (type === 'dialog') {
                        if (linkInput) linkInput.style.display = 'none';
                        if (contactSelection) contactSelection.style.display = 'block';
                        checkboxes.forEach(cb => {
                            cb.disabled = false;
                            cb.type = 'radio';
                            cb.name = 'contact-selection';
                        });
                    }
                }
            });
        }
    }

    initializeNotifications() 
    {
        document.addEventListener('click', (e) => 
        {
            const button = e.target.closest('.header-action[data-action="notifications"]');
            if (!button) return;

            this.app.popupHandler.show('Уведомления', `
                <div class="notification-options">
                    <div class="menu-item ${this.notificationState === 'enabled' ? 'selected' : ''}" data-state="enabled">
                        <i class="fas fa-bell notifications-enabled"></i>
                        <span>Включены</span>
                    </div>
                    <div class="menu-item ${this.notificationState === 'disabled' ? 'selected' : ''}" data-state="disabled">
                        <i class="fas fa-bell-slash notifications-disabled"></i>
                        <span>Выключены</span>
                    </div>
                    <div class="menu-item ${this.notificationState === 'muted' ? 'selected' : ''}" data-state="muted">
                        <i class="fas fa-bell-slash notifications-muted"></i>
                        <span>Временно выключены</span>
                    </div>
                    <div class="menu-item ${this.notificationState === 'mentions' ? 'selected' : ''}" data-state="mentions">
                        <i class="fas fa-bell notifications-mentions"></i>
                        <span>Только упоминания</span>
                    </div>
                </div>
            `, [{ text: 'Закрыть', primary: false }]);

            document.querySelectorAll('.notification-options .menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.notification-options .menu-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.notificationState = item.dataset.state;
                    this.updateNotificationIcon();
                });
            });
        });

        this.updateNotificationIcon();
    }

    initializeInvites() 
    {
        document.addEventListener('click', (e) => 
        {
            const button = e.target.closest('.header-action[data-action="invite"]');
            if (!button) return;
            this.handleInviteContacts();
        });
    }

    updateNotificationIcon() {
        const button = document.querySelector('[data-action="notifications"]');
        if (!button) return;

        const icons = {
            'enabled': '<i class="fas fa-bell notifications-enabled"></i>',
            'disabled': '<i class="fas fa-bell-slash notifications-disabled"></i>',
            'muted': '<i class="fas fa-bell-slash notifications-muted"></i>',
            'mentions': '<i class="fas fa-bell notifications-mentions"></i>'
        };

        button.innerHTML = icons[this.notificationState];
    }

    async handleMenuAction(action) {
        switch (action) {
            case 'Информация о чате':
                await this.app.popupHandler.alert('Информация', 'Информация о чате будет доступна здесь');
                break;
            case 'Очистить историю':
                if (await this.app.popupHandler.confirm('Подтверждение', 'Вы уверены, что хотите очистить историю чата?')) {
                    window.app.messageHandler.messages.clear();
                    window.app.messageHandler.renderMessages(window.app.chatHandler.activeChat);
                }
                break;
            case 'Заблокировать':
                await this.app.popupHandler.alert('Блокировка', 'Пользователь заблокирован');
                break;
            case 'Удалить чат':
                if (await this.app.popupHandler.confirm('Подтверждение', 'Вы уверены, что хотите удалить этот чат?')) {
                    const activeChat = window.app.chatHandler.activeChat;
                    window.app.chatHandler.chats = window.app.chatHandler.chats.filter(chat => chat.id !== activeChat);
                    window.app.chatHandler.renderChats();
                }
                break;
            // ...rest of the cases
            case 'Документ':
                this.app.popupHandler.triggerFileInput('application/*');
                break;
            case 'Контакт':
                await this.app.popupHandler.alert('Контакт', 'Обмен контактами будет доступен в ближайшее время');
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
                            this.app.popupHandler.alert('Ошибка', 'Невозможно определить местоположение');
                        }
                    );
                }
                break;
        }
    }

    async handleInviteContacts() 
    {
        const contacts = 
        [
            { id: '1', name: 'Иван Петров', phone: '+7 925 111 22 33' },
            { id: '2', name: 'Мария Сидорова', phone: '+7 925 222 33 44' },
            // Add more contacts as needed
        ];

        const content = `
            <div class="contact-list">
                ${contacts.map(contact => `
                    <div class="contact-item" data-contact-id="${contact.id}">
                        <div class="avatar me-3">${contact.name[0]}</div>
                        <div>
                            <div>${contact.name}</div>
                            <small class="text-muted">${contact.phone}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.addEventListener('click', (e) =>
        {
            const button = e.target.closest('.contact-item');
            if (!button) return;
            button.className.includes('selected') ? button.classList.remove('selected') : button.classList.add('selected');
        });

        const result = await this.app.popupHandler.show('Пригласить пользователей', content, 
        [
            { text: 'Отмена', primary: false },
            { text: 'Пригласить', primary: true }
        ]);

        if (result === 1) 
        {
            const selectedContacts = Array.from(document.querySelectorAll('.contact-item input:checked'))
                .map(checkbox => checkbox.closest('.contact-item').dataset.contactId);
            // Handle selected contacts...
        }
    }
}

// Модуль для работы с попапами
class PopupHandler {
    constructor(app) {
        this.app = app;
        this.overlay = this.createOverlay();
        document.body.appendChild(this.overlay);
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.innerHTML = `<div class="popup-content"></div>`;
        return overlay;
    }

    createPopup(title, content, buttons = [{ text: 'OK', primary: true }]) {
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

    show(title, content, buttons = [{ text: 'OK', primary: true }]) {
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

// Модуль для работы с профилями
class ProfileHandler {
    constructor(app) {
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

        document.querySelector('.chats-list').addEventListener('click', (e) => {
            const avatar = e.target.closest('.avatar');
            if (avatar) {
                e.stopPropagation();
                const chatItem = avatar.closest('.chat-item');
                if (chatItem) {
                    this.showProfile(chatItem.dataset.chatId);
                }
            }
        });
    }

    async showProfile(profileId) {
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

// Модуль для работы с сайдбаром
class SidebarHandler {
    constructor(app) {
        this.app = app;
        this.inflateSidebar();
        this.initializeMenuButton();
    }

    inflateSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'settings-sidebar';

        sidebar.innerHTML = `
            <div class="settings-header p-3">
                <div class="settings-title h5 mb-0">Меню</div>
                <div class="settings-close"><i class="fas fa-times"></i></div>
            </div>
            <div class="settings-content">
                <div class="current-account p-3 border-bottom">
                    <div class="d-flex align-items-center">
                        <div class="avatar me-3">ТГ</div>
                        <div class="account-info">
                            <div class="account-name">Telegram Web</div>
                            <div class="account-phone text-muted">+7 999 123 45 67</div>
                        </div>
                    </div>
                </div>
                <div class="settings-list">
                    <div class="settings-item p-3" data-action="new-group">
                        <div class="d-flex align-items-center">
                            <div class="icon me-3"><i class="fas fa-users"></i></div>
                            <div>Создать группу</div>
                        </div>
                    </div>
                    <div class="settings-item p-3" data-action="contacts">
                        <div class="d-flex align-items-center">
                            <div class="icon me-3"><i class="fas fa-address-book"></i></div>
                            <div>Контакты</div>
                        </div>
                    </div>
                    <div class="settings-item p-3" data-action="settings">
                        <div class="d-flex align-items-center">
                            <div class="icon me-3"><i class="fas fa-cog"></i></div>
                            <div>Настройки</div>
                        </div>
                    </div>
                    <div class="settings-item p-3" data-action="help">
                        <div class="d-flex align-items-center">
                            <div class="icon me-3"><i class="fas fa-question-circle"></i></div>
                            <div>Помощь</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);

        sidebar.querySelector('.settings-close').addEventListener('click', () => {
            sidebar.classList.remove('active');
        });

        sidebar.querySelectorAll('.settings-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleSettingsAction(action);
                sidebar.classList.remove('active');
            });
        });

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
                        lastMessage: {
                            text: 'Группа создана',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        },
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
class App {
    constructor() {
        this.messageHandler = new MessageHandler(this);
        this.chatHandler = new ChatHandler(this);
        this.fileHandler = new FileHandler(this);
        this.popupHandler = new PopupHandler(this);
        this.profileHandler = new ProfileHandler(this);
        this.menuHandler = new MenuHandler(this);
        this.sidebarHandler = new SidebarHandler(this);

        this.initEventListeners();
    }

    initEventListeners() 
    {
        // Chat selection handler
        const chatsList = document.querySelector('.chats-list');
        if (chatsList) {
            chatsList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) {
                    const chatId = chatItem.dataset.chatId;
                    this.chatHandler.setActiveChat(chatId, true);
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

        document.addEventListener('mouseover', e => 
        {
            const message = e.target.closest('.message');
            if (message) 
            {
                message.classList.add('hovered');
            }
        });

        document.addEventListener('mouseout', e => 
        {
            const message = e.target.closest('.message');
            if (message) 
            {
                message.classList.remove('hovered');
            }
        });

        document.addEventListener('click', e => 
        {
            const reaction = e.target.closest('.reaction');
            const message = e.target.closest('.message');
            const reactionOption = e.target.closest('.reaction-option');
        
            if (reaction && message) 
            {
                const messageId = message.dataset.messageId;
                const reactionType = reaction.dataset.reaction;
                this.messageHandler.addReaction(messageId, reactionType);
            }
        
            if (message) 
            {
                const rect = message.getBoundingClientRect();
                const menu = document.getElementById('reactions-menu');
                menu.style.left = `${rect.left}px`;
                menu.style.top = `${rect.top - 50}px`;
                menu.classList.add('visible');
            }
        
            if (reactionOption) 
            {
                const message = document.querySelector('.message.hovered');
                if (message) 
                {
                    const messageId = message.dataset.messageId;
                    const reaction = reactionOption.dataset.reaction;
                    this.messageHandler.addReaction(messageId, reaction);
                    menu.classList.remove('visible');
                }
            }
        });
        
        document.addEventListener('click', e => 
        {
            if (!e.target.closest('.reactions-menu') && !e.target.closest('.message')) 
            {
                document.getElementById('reactions-menu').classList.remove('visible');
            }
        });

        document.addEventListener('contextmenu', e => 
        {
            const message = e.target.closest('.message');
            if (message)
            {
                e.preventDefault();
                const rect = message.getBoundingClientRect();
                const menu = document.getElementById('reactions-menu');
                menu.style.left = `${rect.left}px`;
                menu.style.top = `${rect.top - 50}px`;
                menu.classList.add('visible');
                message.classList.add('selected-for-reaction');
            }
        });

        // Обработчик выбора реакции
        document.getElementById('reactions-menu').addEventListener('click', e => 
        {
            const reactionOption = e.target.closest('.reaction-option');
            const message = document.querySelector('.message.selected-for-reaction');
            
            if (reactionOption && message) 
            {
                const messageId = message.dataset.messageId;
                const reaction = reactionOption.dataset.reaction;
                this.messageHandler.addReaction(messageId, reaction);
            }
            
            document.getElementById('reactions-menu').classList.remove('visible');
            message?.classList.remove('selected-for-reaction');
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', e => 
        {
            if (!e.target.closest('.reactions-menu')) 
            {
                document.getElementById('reactions-menu').classList.remove('visible');
                document.querySelector('.message.selected-for-reaction')?.classList.remove('selected-for-reaction');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => 
{
    window.app = new App();
    // Add event handler for message input and send button immediately after app initialization
    const messageInput = document.querySelector('.message-input textarea');
    const sendButton = document.querySelector('.message-input .send-button');

    if (messageInput && sendButton) 
    {
        const sendMessage = () => 
        {
            const text = messageInput.value.trim();
            if (text && window.app.chatHandler.activeChat) 
            {
                window.app.messageHandler.addMessage(window.app.chatHandler.activeChat, 
                {
                    text,
                    outgoing: true
                });
                messageInput.value = '';

                // Update last message in chat
                const chat = window.app.chatHandler.chats.find(c => c.id === window.app.chatHandler.activeChat);
                if (chat) 
                {
                    chat.lastMessage = 
                    {
                        text,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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