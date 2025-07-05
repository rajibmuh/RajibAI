// RAJIB AI Chatbot Script - Fixed Version
class RajibAI {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.currentChatId = null;
        this.chats = new Map();
        this.chatHistory = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadChatHistory();
        this.createNewChat();
    }

    initializeElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.historyList = document.getElementById('historyList');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.sidebar = document.getElementById('sidebar');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
    }

    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });

        // New chat button
        this.newChatBtn.addEventListener('click', () => this.createNewChat());

        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                this.sidebar && !this.sidebar.contains(e.target) && 
                this.mobileMenuBtn && !this.mobileMenuBtn.contains(e.target)) {
                this.sidebar.classList.remove('open');
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.sidebar) {
                this.sidebar.classList.remove('open');
            }
        });
    }

    toggleMobileMenu() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
        }
    }

    generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createNewChat() {
        const chatId = this.generateChatId();
        const chatTitle = `Chat ${this.chatHistory.length + 1}`;
        
        this.currentChatId = chatId;
        this.chats.set(chatId, {
            id: chatId,
            title: chatTitle,
            messages: [],
            createdAt: new Date().toISOString()
        });

        this.clearChatContainer();
        this.showWelcomeMessage();
        this.updateChatHistory();
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }

    clearChatContainer() {
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="welcome-message">
                <div class="bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="welcome-text">
                    <h2>Selamat datang di RAJIB AI!</h2>
                    <p>Saya adalah asisten AI yang siap membantu Anda. Silakan ajukan pertanyaan atau mulai percakapan.</p>
                </div>
            </div>
        `;
        if (this.chatContainer) {
            this.chatContainer.innerHTML = welcomeHTML;
        }
    }

    async sendMessage() {
        const message = this.messageInput ? this.messageInput.value.trim() : '';
        if (!message) return;

        if (!this.currentChatId) {
            this.createNewChat();
        }

        // Disable input during processing
        this.setInputState(false);
        this.showLoading(true);

        // Add user message to chat
        this.addMessage('user', message);
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }

        // Save message to current chat
        const currentChat = this.chats.get(this.currentChatId);
        if (currentChat) {
            currentChat.messages.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Update chat title if it's the first message
            if (currentChat.messages.length === 1) {
                currentChat.title = this.generateChatTitle(message);
                this.updateChatHistory();
            }

            try {
                // Get AI response with retry logic
                const aiResponse = await this.getAIResponseWithRetry(currentChat.messages);
                
                // Add AI response to chat
                this.addMessage('bot', aiResponse);
                
                // Save AI response to current chat
                currentChat.messages.push({
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString()
                });

                // Save to history
                this.saveChatHistory();
                this.retryCount = 0; // Reset retry count on success

            } catch (error) {
                console.error('Error getting AI response:', error);
                this.addMessage('bot', 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi dalam beberapa saat.');
            } finally {
                this.setInputState(true);
                this.showLoading(false);
                this.scrollToBottom();
            }
        }
    }

    generateChatTitle(message) {
        const maxLength = 30;
        if (message.length <= maxLength) {
            return message;
        }
        return message.substring(0, maxLength) + '...';
    }

    async getAIResponseWithRetry(messages) {
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await this.getAIResponse(messages);
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === this.maxRetries - 1) {
                    throw error;
                }
                // Wait before retry with exponential backoff
                await this.sleep(1000 * Math.pow(2, i));
            }
        }
    }

    async getAIResponse(messages) {
        // Prepare messages array properly
        const formattedMessages = [
            {
                role: 'system',
                content: 'Anda adalah RAJIB AI, asisten AI yang membantu dan ramah. Jawablah pertanyaan dengan informatif dan sopan dalam bahasa Indonesia.'
            }
        ];

        // Add user messages with proper formatting
        messages.forEach(msg => {
            if (msg && msg.role && msg.content) {
                formattedMessages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: String(msg.content).trim()
                });
            }
        });

        // Prepare request body
        const requestBody = {
            model: 'mistralai/mistral-7b-instruct',
            messages: formattedMessages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: false
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.origin || 'https://rajib-ai.com',
                'X-Title': 'RAJIB AI'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response structure from API');
        }

        return data.choices[0].message.content || 'Maaf, tidak ada respons dari AI.';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addMessage(type, content) {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        
        const avatarIcon = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                ${this.formatMessage(content)}
            </div>
        `;

        // Remove welcome message if it exists
        const welcomeMessage = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.chatContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatMessage(content) {
        if (!content) return '';
        
        // Basic markdown-like formatting with safety checks
        return String(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    setInputState(enabled) {
        if (this.messageInput) {
            this.messageInput.disabled = !enabled;
        }
        if (this.sendBtn) {
            this.sendBtn.disabled = !enabled;
        }
        
        if (enabled && this.messageInput) {
            this.messageInput.focus();
        }
    }

    showLoading(show) {
        if (this.loadingIndicator) {
            if (show) {
                this.loadingIndicator.classList.add('show');
            } else {
                this.loadingIndicator.classList.remove('show');
            }
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }
        }, 100);
    }

    updateChatHistory() {
        this.chatHistory = Array.from(this.chats.values()).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        this.renderChatHistory();
    }

    renderChatHistory() {
        if (!this.historyList) return;

        this.historyList.innerHTML = '';
        
        if (this.chatHistory.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">Belum ada riwayat chat</div>';
            return;
        }

        this.chatHistory.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = chat.title || 'Untitled Chat';
            
            if (chat.id === this.currentChatId) {
                historyItem.classList.add('active');
            }
            
            historyItem.addEventListener('click', () => this.loadChat(chat.id));
            this.historyList.appendChild(historyItem);
        });
    }

    loadChat(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.clearChatContainer();
        
        if (chat.messages.length === 0) {
            this.showWelcomeMessage();
        } else {
            chat.messages.forEach(msg => {
                if (msg && msg.role && msg.content) {
                    this.addMessage(msg.role === 'user' ? 'user' : 'bot', msg.content);
                }
            });
        }
        
        this.updateChatHistory();
        this.scrollToBottom();
        
        // Close mobile menu after selecting chat
        if (window.innerWidth <= 768 && this.sidebar) {
            this.sidebar.classList.remove('open');
        }
    }

    // Storage methods with better error handling
    saveChatHistory() {
        try {
            const chatData = {};
            this.chats.forEach((chat, id) => {
                chatData[id] = {
                    id: chat.id,
                    title: chat.title,
                    messages: chat.messages || [],
                    createdAt: chat.createdAt
                };
            });
            
            // Use in-memory storage for artifacts environment
            this.persistentData = chatData;
            
            // Try to use sessionStorage if available
            if (typeof Storage !== 'undefined') {
                try {
                    sessionStorage.setItem('rajib_ai_chats', JSON.stringify(chatData));
                } catch (e) {
                    console.log('SessionStorage not available, using in-memory storage');
                }
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            let chatData = null;
            
            // Try to load from sessionStorage first
            if (typeof Storage !== 'undefined') {
                try {
                    const savedChats = sessionStorage.getItem('rajib_ai_chats');
                    if (savedChats) {
                        chatData = JSON.parse(savedChats);
                    }
                } catch (e) {
                    console.log('SessionStorage not available');
                }
            }
            
            // Fallback to in-memory storage
            if (!chatData && this.persistentData) {
                chatData = this.persistentData;
            }
            
            if (chatData) {
                this.chats.clear();
                
                Object.entries(chatData).forEach(([id, chat]) => {
                    if (chat && chat.id) {
                        this.chats.set(id, {
                            id: chat.id,
                            title: chat.title || 'Untitled Chat',
                            messages: chat.messages || [],
                            createdAt: chat.createdAt || new Date().toISOString()
                        });
                    }
                });
                
                this.updateChatHistory();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    // Method to delete a chat
    deleteChat(chatId) {
        if (this.chats.has(chatId)) {
            this.chats.delete(chatId);
            
            // If deleting current chat, create a new one
            if (this.currentChatId === chatId) {
                this.createNewChat();
            }
            
            this.updateChatHistory();
            this.saveChatHistory();
        }
    }

    // Method to clear all chats
    clearAllChats() {
        this.chats.clear();
        this.createNewChat();
        this.saveChatHistory();
    }

    // Method to export chat history
    exportChatHistory() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                chats: Array.from(this.chats.values())
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rajib_ai_chat_history_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting chat history:', error);
        }
    }

    // Method to import chat history
    importChatHistory(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                if (importData.chats && Array.isArray(importData.chats)) {
                    importData.chats.forEach(chat => {
                        if (chat && chat.id) {
                            this.chats.set(chat.id, chat);
                        }
                    });
                    this.updateChatHistory();
                    this.saveChatHistory();
                    console.log('Chat history imported successfully');
                }
            } catch (error) {
                console.error('Error importing chat history:', error);
                alert('Error importing chat history. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    // Method to get chat statistics
    getChatStats() {
        const totalChats = this.chats.size;
        let totalMessages = 0;
        let totalUserMessages = 0;
        let totalBotMessages = 0;
        
        this.chats.forEach(chat => {
            if (chat.messages) {
                totalMessages += chat.messages.length;
                chat.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        totalUserMessages++;
                    } else if (msg.role === 'assistant') {
                        totalBotMessages++;
                    }
                });
            }
        });
        
        return {
            totalChats,
            totalMessages,
            totalUserMessages,
            totalBotMessages
        };
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.rajibAI = new RajibAI();
        console.log('RAJIB AI initialized successfully');
    } catch (error) {
        console.error('Error initializing RAJIB AI:', error);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    try {
        // Ctrl/Cmd + N for new chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (window.rajibAI) {
                window.rajibAI.createNewChat();
            }
        }
        
        // Ctrl/Cmd + / to focus on input
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            if (window.rajibAI && window.rajibAI.messageInput) {
                window.rajibAI.messageInput.focus();
            }
        }
    } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
    }
});

// Add touch support for mobile devices
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', () => {
        // Enable touch interaction
    });
}

// Service Worker registration (if needed for offline functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment if you have a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then((registration) => {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch((registrationError) => {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}