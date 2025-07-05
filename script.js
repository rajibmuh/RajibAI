// Simple RAJIB AI Chatbot - Enhanced Connection
class SimpleRajibAI {
  constructor() {
    this.apiConfigs = [
      {
        name: "LocalProxy-1",
        apiKey: "",
        apiUrl: "/api/chat",
        model: "mistralai/mistral-7b-instruct",
      },
      {
        name: "LocalProxy-2",
        apiKey: "",
        apiUrl: "/api/chat",
        model: "microsoft/dialoGPT-medium",
      },
    ];

    this.currentApiIndex = 0;
    this.messages = [];
    this.isLoading = false;
    this.connectionStatus = "testing";

    this.init();
  }

  init() {
    this.chatContainer = document.getElementById("chatContainer");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");

    this.setupEventListeners();
    this.showWelcomeMessage();

    setTimeout(() => this.testAllAPIs(), 1000);
  }

  setupEventListeners() {
    this.sendBtn?.addEventListener("click", () => this.sendMessage());
    this.messageInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  showWelcomeMessage() {
    this.chatContainer.innerHTML = `
      <div class="message bot">
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
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
  }

  updateAPIStatus(status, message, details = "") {
    const statusEl = document.getElementById("apiStatus");
    const detailsEl = document.getElementById("connectionDetails");

    if (statusEl) {
      const icon = status === "success" ? "✅" : status === "error" ? "❌" : "🔄";
      statusEl.innerHTML = `<span>${icon} ${message}</span>`;
    }
    if (detailsEl && details) {
      detailsEl.innerHTML = `<small>${details}</small>`;
    }
  }

  async testAllAPIs() {
    for (let i = 0; i < this.apiConfigs.length; i++) {
      const config = this.apiConfigs[i];
      try {
        this.updateAPIStatus("testing", `Menguji ${config.name}...`, `Konfigurasi ${i + 1}/${this.apiConfigs.length}`);
        const testMessage = [{ role: "user", content: "Hi" }];
        await this.callAPI(testMessage, config);

        this.currentApiIndex = i;
        this.connectionStatus = "connected";
        this.updateAPIStatus("success", `${config.name} siap digunakan!`, `Model: ${config.model}`);
        return;
      } catch (err) {
        console.warn(`❌ ${config.name} gagal:`, err.message);
        if (i < this.apiConfigs.length - 1) await this.sleep(1000);
      }
    }
    this.connectionStatus = "failed";
    this.updateAPIStatus("error", "Semua API tidak dapat terhubung", "Coba refresh halaman atau hubungi admin.");
  }

  async sendMessage() {
    const message = this.messageInput?.value.trim();
    if (!message || this.isLoading) return;

    if (this.connectionStatus !== "connected") {
      this.addMessage("bot", "❌ API belum terhubung. Silakan tunggu atau refresh halaman.");
      return;
    }

    this.addMessage("user", message);
    this.messageInput.value = "";
    this.setLoading(true);

    try {
      const apiMessages = [
        {
          role: "system",
          content:
            "Anda adalah RAJIB AI, asisten AI yang membantu dan ramah. Jawablah dalam bahasa Indonesia dengan informatif dan sopan.",
        },
        ...this.messages,
        { role: "user", content: message },
      ];

      const response = await this.callAPIWithFallback(apiMessages);

      this.addMessage("bot", response);
      this.messages.push({ role: "user", content: message }, { role: "assistant", content: response });
      if (this.messages.length > 10) this.messages = this.messages.slice(-10);
    } catch (err) {
      console.error(err);
      this.addMessage("bot", this.getErrorMessage(err));
    } finally {
      this.setLoading(false);
    }
  }

  async callAPIWithFallback(messages) {
    let lastErr = null;
    for (let i = 0; i < this.apiConfigs.length; i++) {
      const configIndex = (this.currentApiIndex + i) % this.apiConfigs.length;
      const config = this.apiConfigs[configIndex];
      try {
        const result = await this.callAPI(messages, config);
        this.currentApiIndex = configIndex;
        return result;
      } catch (err) {
        lastErr = err;
        if (i < this.apiConfigs.length - 1) await this.sleep(1000);
      }
    }
    throw lastErr ?? new Error("Semua API gagal.");
  }

  async callAPI(messages, config) {
    const apiConfig = config ?? this.apiConfigs[this.currentApiIndex];
    const body = {
      model: apiConfig.model,
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const resp = await fetch(apiConfig.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);

    const data = await resp.json();
    if (!data?.choices?.[0]?.message?.content) throw new Error("Invalid API response");
    return data.choices[0].message.content;
  }

  setLoading(state) {
    this.isLoading = state;
    if (this.sendBtn) {
      this.sendBtn.disabled = state;
      this.sendBtn.textContent = state ? "⏳" : "📤";
    }
    if (this.messageInput) this.messageInput.disabled = state;
    state ? this.addLoadingMessage() : this.removeLoadingMessage();
  }

  addLoadingMessage() {
    const el = document.createElement("div");
    el.className = "message bot loading-message";
    el.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-content">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    this.chatContainer.appendChild(el);
    this.scrollToBottom();
  }

  removeLoadingMessage() {
    this.chatContainer.querySelector(".loading-message")?.remove();
  }

  addMessage(type, content) {
    const el = document.createElement("div");
    el.className = `message ${type}`;
    const icon = type === "user" ? "fas fa-user" : "fas fa-robot";
    el.innerHTML = `
      <div class="message-avatar"><i class="${icon}"></i></div>
      <div class="message-content">${this.formatMessage(content)}</div>
    `;
    this.chatContainer.appendChild(el);
    this.scrollToBottom();
  }

  formatMessage(content) {
    return String(content).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }, 100);
  }

  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  getErrorMessage(err) {
    const msg = err.message;
    if (msg.includes("401")) return "❌ Kunci API tidak valid.";
    if (msg.includes("429")) return "⏳ Terlalu banyak permintaan. Tunggu sebentar.";
    if (msg.includes("Failed to fetch")) return "🌐 Tidak terhubung ke server. Cek internet atau hosting.";
    if (msg.includes("500")) return "🔧 Server API error.";
    return `❌ Error: ${msg}`;
  }
}

// boot
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.rajibAI = new SimpleRajibAI();
    console.log("🚀 RAJIB AI aktif");
  } catch (err) {
    console.error("❌ Startup error:", err);
  }
});
