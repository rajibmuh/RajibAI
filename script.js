// Simple RAJIB AI Chatbot - Enhanced Connection
class SimpleRajibAI {
    constructor() {
        // Multiple API configurations for better reliability
        this.apiConfigs = [
            {
                name: 'OpenRouter',
                apiKey: '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',
                apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
                model: 'mistralai/mistral-7b-instruct'
            },
            {
                name: 'OpenRouter-Alt',
                apiKey: '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',
                apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
                model: 'microsoft/dialoGPT-medium'
            }
        ];
        
        this.currentApiIndex = 0;
        this.messages = [];
        this.isLoading = false;
        this.connectionStatus = 'testing';
        
        this.init();
    }

    init() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        this.setupEventListeners();
        this.showWelcomeMessage();
        
        // Test APIs with delay to avoid rate limiting
        setTimeout(() => this.testAllAPIs(), 1000);
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="message bot">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <h3>🤖 Selamat datang di RAJIB AI!</h3>
                    <p>Saya siap membantu Anda. Silakan ajukan pertanyaan!</p>
                    <div id="apiStatus" class="api-status">
                        <span>🔄 Menguji koneksi API...</span>
                    </div>
                    <div id="connectionDetails" class="connection-details">
                        <small>Mengecek ${this.apiConfigs.length} konfigurasi API...</small>
                    </div>
                </div>
            </div>
        `;
        this.chatContainer.innerHTML = welcomeHTML;
    }

    updateAPIStatus(status, message, details = '') {
        const statusEl = document.getElementById('apiStatus');
        const detailsEl = document.getElementById('connectionDetails');
        
        if (statusEl) {
            const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '🔄';
            statusEl.innerHTML = `<span>${icon} ${message}</span>`;
        }
        
        if (detailsEl && details) {
            detailsEl.innerHTML = `<small>${details}</small>`;
        }
    }

    async testAllAPIs() {
        console.log('🔍 Testing all API configurations...');
        
        for (let i = 0; i < this.apiConfigs.length; i++) {
            const config = this.apiConfigs[i];
            
            try {
                this.updateAPIStatus('testing', `Menguji ${config.name}...`, 
                    `Konfigurasi ${i + 1}/${this.apiConfigs.length}`);
                
                console.log(`Testing ${config.name} with model ${config.model}`);
                
                const testMessage = [{ role: 'user', content: 'Hi' }];
                await this.callAPI(testMessage, config);
                
                this.currentApiIndex = i;
                this.connectionStatus = 'connected';
                this.updateAPIStatus('success', `${config.name} siap digunakan!`, 
                    `Model: ${config.model}`);
                
                console.log(`✅ ${config.name} connected successfully`);
                return;
                
            } catch (error) {
                console.log(`❌ ${config.name} failed:`, error.message);
                
                // Wait before trying next API
                if (i < this.apiConfigs.length - 1) {
                    await this.sleep(2000);
                }
            }
        }
        
        // If all APIs failed
        this.connectionStatus = 'failed';
        this.updateAPIStatus('error', 'Semua API tidak dapat terhubung', 
            'Coba refresh halaman atau hubungi administrator');
        console.log('❌ All API configurations failed');
    }

    async sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || this.isLoading) return;

        if (this.connectionStatus !== 'connected') {
            this.addMessage('bot', '❌ API belum terhubung. Silakan tunggu atau refresh halaman.');
            return;
        }

        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        
        // Show loading
        this.setLoading(true);
        
        try {
            // Prepare messages for API
            const apiMessages = [
                {
                    role: 'system',
                    content: 'Anda adalah RAJIB AI, asisten AI yang membantu dan ramah. Jawablah dalam bahasa Indonesia dengan informatif dan sopan.'
                },
                ...this.messages,
                { role: 'user', content: message }
            ];
            
            // Try current API first, then fallback to others
            const response = await this.callAPIWithFallback(apiMessages);
            
            // Add bot response
            this.addMessage('bot', response);
            
            // Update message history
            this.messages.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response }
            );
            
            // Keep only last 10 messages to prevent token limit
            if (this.messages.length > 10) {
                this.messages = this.messages.slice(-10);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('bot', this.getErrorMessage(error));
        } finally {
            this.setLoading(false);
        }
    }

    async callAPIWithFallback(messages) {
        let lastError = null;
        
        // Try each API configuration
        for (let i = 0; i < this.apiConfigs.length; i++) {
            const configIndex = (this.currentApiIndex + i) % this.apiConfigs.length;
            const config = this.apiConfigs[configIndex];
            
            try {
                console.log(`Trying ${config.name}...`);
                const response = await this.callAPI(messages, config);
                
                // Update current API index if different
                if (configIndex !== this.currentApiIndex) {
                    this.currentApiIndex = configIndex;
                    console.log(`Switched to ${config.name}`);
                }
                
                return response;
                
            } catch (error) {
                lastError = error;
                console.log(`${config.name} failed:`, error.message);
                
                if (i < this.apiConfigs.length - 1) {
                    await this.sleep(1000);
                }
            }
        }
        
        throw lastError || new Error('All APIs failed');
    }

    async callAPI(messages, config = null) {
        const apiConfig = config || this.apiConfigs[this.currentApiIndex];
        
        const requestBody = {
            model: apiConfig.model,
            messages: messages,
            max_tokens: 800,
            temperature: 0.7,
            stream: false
        };

        // Enhanced headers for better compatibility
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Accept': 'application/json'
        };

        // Add additional headers based on environment
        if (window.location.origin && !window.location.hostname.includes('localhost')) {
            headers['Origin'] = window.location.origin;
            headers['Referer'] = window.location.href;
        }

        const response = await fetch(apiConfig.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid API response format');
        }

        return data.choices[0].message.content;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addMessage(type, content) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        
        const avatarIcon = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const formattedContent = this.formatMessage(content);
        
        messageEl.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                ${formattedContent}
            </div>
        `;

        this.chatContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    formatMessage(content) {
        return String(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        if (this.sendBtn) {
            this.sendBtn.disabled = loading;
            this.sendBtn.textContent = loading ? '⏳' : '📤';
        }
        
        if (this.messageInput) {
            this.messageInput.disabled = loading;
        }
        
        if (loading) {
            this.addLoadingMessage();
        } else {
            this.removeLoadingMessage();
        }
    }

    addLoadingMessage() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message bot loading-message';
        loadingEl.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(loadingEl);
        this.scrollToBottom();
    }

    removeLoadingMessage() {
        const loadingMsg = this.chatContainer.querySelector('.loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }

    getErrorMessage(error) {
        if (error.message.includes('401')) {
            return '❌ Kunci API tidak valid. Silakan hubungi administrator.';
        } else if (error.message.includes('429')) {
            return '⏳ Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return '🌐 Tidak dapat terhubung ke server. Kemungkinan:\n- Koneksi internet bermasalah\n- Firewall memblokir akses\n- Server hosting membatasi koneksi keluar';
        } else if (error.message.includes('500')) {
            return '🔧 Server API bermasalah. Silakan coba lagi nanti.';
        } else if (error.message.includes('CORS')) {
            return '🔒 Masalah CORS. Hosting tidak mendukung koneksi ke API eksternal.';
        } else {
            return `❌ Error: ${error.message}`;
        }
    }

    // Public methods for debugging and manual control
    async retryConnection() {
        this.connectionStatus = 'testing';
        this.showWelcomeMessage();
        await this.testAllAPIs();
    }

    clearChat() {
        this.messages = [];
        this.showWelcomeMessage();
        if (this.connectionStatus !== 'connected') {
            this.testAllAPIs();
        }
    }

    getStatus() {
        return {
            connectionStatus: this.connectionStatus,
            currentAPI: this.apiConfigs[this.currentApiIndex]?.name,
            currentModel: this.apiConfigs[this.currentApiIndex]?.model,
            isLoading: this.isLoading,
            messageCount: this.messages.length,
            availableAPIs: this.apiConfigs.map(c => c.name)
        };
    }

    // Force switch to next API
    switchAPI() {
        this.currentApiIndex = (this.currentApiIndex + 1) % this.apiConfigs.length;
        const newConfig = this.apiConfigs[this.currentApiIndex];
        console.log(`Switched to ${newConfig.name} (${newConfig.model})`);
        this.addMessage('bot', `🔄 Beralih ke ${newConfig.name} dengan model ${newConfig.model}`);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.rajibAI = new SimpleRajibAI();
        console.log('🚀 Enhanced RAJIB AI initialized');
        
        // Enhanced debug commands
        window.rajibDebug = {
            status: () => window.rajibAI.getStatus(),
            clear: () => window.rajibAI.clearChat(),
            retry: () => window.rajibAI.retryConnection(),
            switch: () => window.rajibAI.switchAPI(),
            test: () => window.rajibAI.testAllAPIs()
        };
        
        console.log('Debug commands available:');
        console.log('- rajibDebug.status() - Check status');
        console.log('- rajibDebug.clear() - Clear chat');
        console.log('- rajibDebug.retry() - Retry connection');
        console.log('- rajibDebug.switch() - Switch API');
        console.log('- rajibDebug.test() - Test all APIs');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        
        // Show error in UI
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div class="message bot">
                    <div class="message-avatar">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="message-content">
                        <h3>❌ Error Inisialisasi</h3>
                        <p>Terjadi kesalahan saat memuat aplikasi.</p>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Refresh Halaman
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// Enhanced CSS for better visual feedback
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 0;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #666;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
        0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
        30% { transform: scale(1.2); opacity: 1; }
    }
    
    .api-status {
        margin-top: 10px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 6px;
        font-size: 0.9em;
        border-left: 4px solid #007bff;
    }
    
    .connection-details {
        margin-top: 5px;
        color: #666;
        font-size: 0.8em;
    }
    
    .loading-message {
        opacity: 0.7;
    }
    
    .message-content h3 {
        margin: 0 0 10px 0;
        color: #333;
    }
    
    .message-content p {
        margin: 5px 0;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);