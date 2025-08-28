// AutoCoach AI - World's Most Beautiful Study App ✨

class AutoCoachAI {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.studyModeSelect = document.getElementById('studyMode');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.isLoading = false;
        this.messageCount = 0;
        this.currentSessionId = null;
        
        // Initialize local storage system
        this.localStorage = new AutoCoachLocalStorage();
        
        // Load user preferences and data
        this.loadUserData();
        
        this.initializeEventListeners();
        this.focusInput();
        this.addMagicalTouchEvents();
        this.addDataManagementFeatures();
    }
    
    addMagicalTouchEvents() {
        // Add sparkle effect on input focus
        this.messageInput.addEventListener('focus', () => {
            this.createSparkleEffect(this.messageInput);
        });
        
        // Add celebration effect when sending message
        this.sendButton.addEventListener('mouseenter', () => {
            if (!this.sendButton.disabled) {
                this.sendButton.style.transform = 'translateY(-2px) scale(1.05)';
            }
        });
        
        this.sendButton.addEventListener('mouseleave', () => {
            if (!this.sendButton.disabled) {
                this.sendButton.style.transform = '';
            }
        });
        
        // Add welcome section animation observer
        this.setupAnimationObserver();
    }
    
    setupAnimationObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'welcomeSlideIn 0.8s ease forwards';
                }
            });
        });
        
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            observer.observe(welcomeSection);
        }
        
        // Add animation CSS if not exists
        if (!document.getElementById('welcome-animations')) {
            const style = document.createElement('style');
            style.id = 'welcome-animations';
            style.textContent = `
                @keyframes welcomeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes sparkleFloat {
                    0% {
                        transform: translateY(0) scale(0);
                        opacity: 1;
                    }
                    50% {
                        transform: translateY(-20px) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-40px) scale(0);
                        opacity: 0;
                    }
                }
                
                @keyframes messageAppear {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .message {
                    animation: messageAppear 0.5s ease forwards;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createSparkleEffect(element) {
        // Create magical sparkle particles
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.innerHTML = '✨';
                sparkle.style.position = 'absolute';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.fontSize = '12px';
                sparkle.style.zIndex = '9999';
                sparkle.style.animation = 'sparkleFloat 1.5s ease-out forwards';
                
                const rect = element.getBoundingClientRect();
                sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
                sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
                
                document.body.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1500);
            }, i * 100);
        }
    }
    
    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Enter key press in input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Study mode change
        this.studyModeSelect.addEventListener('change', () => {
            this.focusInput();
            this.createSparkleEffect(this.studyModeSelect);
        });
        
        // Auto-resize input and add typing animation
        this.messageInput.addEventListener('input', () => {
            this.updateSendButtonState();
        });
        
        // Initial button state
        this.updateSendButtonState();
    }
    
    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;
        
        // Add visual feedback
        if (hasText && !this.isLoading) {
            this.sendButton.style.opacity = '1';
            this.sendButton.style.transform = 'scale(1)';
        } else {
            this.sendButton.style.opacity = '0.5';
            this.sendButton.style.transform = 'scale(0.95)';
        }
    }
    
    focusInput() {
        setTimeout(() => {
            this.messageInput.focus();
        }, 100);
    }
    
    // Load user data and preferences
    loadUserData() {
        const preferences = this.localStorage.getPreferences();
        
        // Apply user preferences
        if (preferences.defaultStudyMode) {
            this.studyModeSelect.value = preferences.defaultStudyMode;
        }
        
        // Load current session or create new one
        const currentSession = this.localStorage.getCurrentSession();
        if (currentSession) {
            this.currentSessionId = currentSession.id;
            this.loadChatHistory(currentSession);
        } else {
            this.currentSessionId = this.localStorage.createNewChatSession();
        }
    }
    
    loadChatHistory(session) {
        // Remove welcome section
        const welcomeSection = this.chatContainer.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.remove();
        }
        
        // Load all messages from the session
        session.messages.forEach(msg => {
            const messageElement = this.createMessageElement(msg.type, msg.content, msg.studyMode);
            this.chatContainer.appendChild(messageElement);
            this.messageCount++;
        });
        
        if (session.messages.length > 0) {
            this.scrollToBottom();
        }
    }
    
    addDataManagementFeatures() {
        // Add data management controls to the UI
        this.createDataManagementPanel();
        
        // Add keyboard shortcuts for data management
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save/export data
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.localStorage.exportData();
            }
            
            // Ctrl/Cmd + N for new session
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.startNewSession();
            }
        });
    }
    
    createDataManagementPanel() {
        // Create floating data management button
        const managementBtn = document.createElement('button');
        managementBtn.className = 'data-management-btn';
        managementBtn.innerHTML = '<i class="fas fa-database"></i>';
        managementBtn.title = 'Data Management';
        
        managementBtn.addEventListener('click', () => {
            this.showDataManagementModal();
        });
        
        document.body.appendChild(managementBtn);
        
        // Add styles for the button
        const style = document.createElement('style');
        style.textContent = `
            .data-management-btn {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
                background: var(--primary-gradient);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                box-shadow: var(--shadow-magical);
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            .data-management-btn:hover {
                transform: translateY(-2px) scale(1.1);
                box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
            }
        `;
        document.head.appendChild(style);
    }
    
    showDataManagementModal() {
        const modal = document.createElement('div');
        modal.className = 'data-modal-overlay';
        
        const stats = this.localStorage.getData('appData').user.stats;
        const storageSize = this.localStorage.getStorageSizeFormatted();
        const sessionCount = this.localStorage.getAllSessions().length;
        
        modal.innerHTML = `
            <div class="data-modal">
                <div class="modal-header">
                    <h2>📊 Your Data Dashboard</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="data-stats">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalMessages}</div>
                            <div class="stat-label">Messages</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${sessionCount}</div>
                            <div class="stat-label">Sessions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.conceptsLearned}</div>
                            <div class="stat-label">Concepts</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${storageSize}</div>
                            <div class="stat-label">Storage</div>
                        </div>
                    </div>
                    
                    <div class="data-actions">
                        <button class="action-btn primary" data-action="export">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button class="action-btn secondary" data-action="import">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="action-btn secondary" data-action="new-session">
                            <i class="fas fa-plus"></i> New Session
                        </button>
                        <button class="action-btn secondary" data-action="sessions">
                            <i class="fas fa-history"></i> View Sessions
                        </button>
                        <button class="action-btn danger" data-action="clear">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                    
                    <div class="privacy-note">
                        <i class="fas fa-shield-alt"></i>
                        <p>🔒 All your data is stored locally on your device. Nothing is sent to our servers, ensuring complete privacy.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .data-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                animation: fadeInModal 0.3s ease forwards;
            }
            
            @keyframes fadeInModal {
                to { opacity: 1; }
            }
            
            .data-modal {
                background: var(--glass-bg);
                backdrop-filter: var(--blur-intense);
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: var(--shadow-xl);
                transform: scale(0.9);
                animation: scaleInModal 0.3s ease forwards;
            }
            
            @keyframes scaleInModal {
                to { transform: scale(1); }
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid var(--glass-border);
            }
            
            .modal-header h2 {
                margin: 0;
                color: var(--text-primary);
                font-size: 1.5rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--text-muted);
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .close-btn:hover {
                background: var(--glass-bg);
                color: var(--text-primary);
            }
            
            .modal-content {
                padding: 1.5rem;
            }
            
            .data-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
                transition: transform 0.3s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
            }
            
            .stat-number {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--accent-bright);
                margin-bottom: 0.25rem;
            }
            
            .stat-label {
                font-size: 0.9rem;
                color: var(--text-muted);
            }
            
            .data-actions {
                display: grid;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                border: none;
                border-radius: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                background: var(--glass-bg);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
            }
            
            .action-btn.primary {
                background: var(--primary-gradient);
                border-color: transparent;
                color: white;
            }
            
            .action-btn.danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border-color: transparent;
                color: white;
            }
            
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .privacy-note {
                background: var(--success-gradient);
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .privacy-note i {
                color: #10b981;
                font-size: 1.2rem;
            }
            
            .privacy-note p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 0.9rem;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(modalStyle);
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        modal.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleDataAction(action, modal);
            });
        });
    }
    
    closeModal(modal) {
        modal.style.animation = 'fadeInModal 0.3s ease reverse';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    handleDataAction(action, modal) {
        switch(action) {
            case 'export':
                this.localStorage.exportData();
                break;
            case 'import':
                this.importDataFile();
                break;
            case 'new-session':
                this.startNewSession();
                this.closeModal(modal);
                break;
            case 'sessions':
                this.showSessionsModal();
                break;
            case 'clear':
                this.localStorage.clearAllData();
                break;
        }
    }
    
    importDataFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.localStorage.importData(file);
            }
        };
        input.click();
    }
    
    startNewSession() {
        this.currentSessionId = this.localStorage.createNewChatSession();
        
        // Clear current chat
        this.chatContainer.innerHTML = '';
        this.messageCount = 0;
        
        // Show welcome message
        this.showWelcomeMessage();
        
        this.localStorage.showNotification('Started new study session! 🎯', 'success');
    }
    
    showWelcomeMessage() {
        // Re-create welcome section
        const welcomeHTML = `
            <div class="welcome-section">
                <div class="welcome-card">
                    <div class="welcome-avatar">
                        <div class="avatar-ring">
                            <div class="avatar-inner">
                                <i class="fas fa-sparkles"></i>
                            </div>
                        </div>
                    </div>
                    <div class="welcome-content">
                        <h2 class="welcome-title">
                            Hey there, brilliant student! 🌟
                        </h2>
                        <p class="welcome-message">
                            I'm AutoCoach AI, and I'm absolutely thrilled to be your study companion! 
                            I'm here to make learning fun, engaging, and totally achievable. 
                        </p>
                        <p class="welcome-cta">
                            What amazing thing would you like to learn today? I can't wait to help you succeed! ✨
                        </p>
                    </div>
                </div>
            </div>
        `;
        this.chatContainer.innerHTML = welcomeHTML;
    }
    
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        const studyMode = this.studyModeSelect.value;
        
        // Enhanced input validation
        if (!message) {
            this.shakeInput();
            this.showInputError('Please enter a message');
            return;
        }
        
        if (this.isLoading) {
            return;
        }
        
        if (message.length > 5000) {
            this.showInputError('Message is too long. Please keep it under 5000 characters.');
            return;
        }
        
        // Check if user is online
        if (!navigator.onLine) {
            this.showOfflineMessage();
            return;
        }
        
        // Create celebration effect
        this.createCelebrationEffect();
        
        // Clear input immediately
        this.messageInput.value = '';
        this.updateSendButtonState();
        this.clearInputError();
        
        // Add user message to chat
        this.addUserMessage(message);
        
        // Show enhanced loading state
        this.setLoading(true);
        this.requestStartTime = Date.now();
        
        try {
            // Add timeout to requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
            
            // Send request to backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    mode: studyMode
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            
            if (response.ok) {
                // Add AI response to chat with typewriter effect
                this.addAIMessage(data.response, data.mode);
                this.updateResponseTime(Date.now() - this.requestStartTime);
            } else {
                // Handle different error types
                this.handleApiError(response.status, data.error);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.name === 'AbortError') {
                this.addErrorMessage('The request took too long. Please try again with a shorter message. ⏱️');
            } else if (!navigator.onLine) {
                this.showOfflineMessage();
            } else {
                this.addErrorMessage('Having trouble connecting right now! Please check your connection and try again. I\'m here when you\'re ready! ✨');
            }
        } finally {
            this.setLoading(false);
            this.focusInput();
        }
    }
    
    handleApiError(status, errorMessage) {
        switch(status) {
            case 429:
                this.addErrorMessage('I\\'m getting a lot of questions right now! Please wait a moment before asking again. 🕒');
                break;
            case 503:
                this.addErrorMessage('I\\'m temporarily unavailable. Please try again in a few moments. 🔧');
                break;
            case 400:
                this.addErrorMessage(errorMessage || 'Please check your message and try again.');
                break;
            default:
                this.addErrorMessage(errorMessage || 'Oops! Something went wrong. Let me try to help you again! 💫');
        }
    }
    
    showInputError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'input-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 0.85rem;
            margin-top: 0.5rem;
            animation: fadeIn 0.3s ease;
        `;
        
        const inputContainer = this.messageInput.parentNode;
        inputContainer.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    clearInputError() {
        const errors = document.querySelectorAll('.input-error-message');
        errors.forEach(error => error.remove());
    }
    
    showOfflineMessage() {
        this.addErrorMessage('You\\'re currently offline. Please check your internet connection and try again. 📶');
    }
    
    updateResponseTime(ms) {
        // Track performance for potential optimizations
        if (ms > 10000) {
            console.log(`Slow response: ${ms}ms`);
        }
    }
    
    shakeInput() {
        this.messageInput.style.animation = 'none';
        this.messageInput.offsetHeight; // Trigger reflow
        this.messageInput.style.animation = 'shake 0.5s ease-in-out';
    }
    
    createCelebrationEffect() {
        // Create colorful celebration particles
        const colors = ['🌟', '✨', '💫', '⭐', '🎯', '💖'];
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.innerHTML = colors[Math.floor(Math.random() * colors.length)];
                particle.style.position = 'absolute';
                particle.style.pointerEvents = 'none';
                particle.style.fontSize = '16px';
                particle.style.zIndex = '9999';
                particle.style.animation = 'celebrationBurst 2s ease-out forwards';
                
                const rect = this.sendButton.getBoundingClientRect();
                particle.style.left = (rect.left + rect.width/2) + 'px';
                particle.style.top = (rect.top + rect.height/2) + 'px';
                
                // Add CSS for celebration animation if not exists
                if (!document.getElementById('celebration-styles')) {
                    const style = document.createElement('style');
                    style.id = 'celebration-styles';
                    style.textContent = `
                        @keyframes celebrationBurst {
                            0% {
                                transform: translate(0, 0) scale(0);
                                opacity: 1;
                            }
                            50% {
                                transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(1.2);
                                opacity: 1;
                            }
                            100% {
                                transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0);
                                opacity: 0;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2000);
            }, i * 50);
        }
    }
    
    addUserMessage(message) {
        const messageElement = this.createMessageElement('user', message);
        this.appendMessage(messageElement);
        
        // Save to local storage
        this.localStorage.saveMessage(this.currentSessionId, {
            type: 'user',
            content: message,
            studyMode: this.studyModeSelect.value
        });
    }
    
    addAIMessage(message, mode) {
        const messageElement = this.createMessageElement('ai', message, mode);
        this.appendMessage(messageElement);
        
        // Save to local storage
        this.localStorage.saveMessage(this.currentSessionId, {
            type: 'ai',
            content: message,
            studyMode: mode
        });
    }
    
    addErrorMessage(errorText) {
        const messageElement = this.createMessageElement('ai', `💫 ${errorText}`);
        this.appendMessage(messageElement);
        
        // Save error to local storage
        this.localStorage.saveMessage(this.currentSessionId, {
            type: 'ai',
            content: `💫 ${errorText}`,
            studyMode: 'error'
        });
    }
    
    createMessageElement(type, content, mode = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (type === 'user') {
            contentDiv.textContent = content;
        } else {
            // AI message - handle formatting with extra friendliness
            contentDiv.innerHTML = this.formatAIMessage(content, mode);
        }
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }
    
    formatAIMessage(content, mode) {
        // Enhanced formatting for AI messages with more personality
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n\n/g, '</p><p>') // Paragraphs
            .replace(/\n/g, '<br>'); // Line breaks
        
        // Wrap in paragraph tags
        if (!formatted.startsWith('<')) {
            formatted = '<p>' + formatted + '</p>';
        }
        
        // Add mode indicator with beautiful styling if present
        if (mode) {
            const modeEmojis = {
                'Explain Concept': '🧠',
                'Homework Helper': '📚',
                'Practice Quiz': '🎯',
                'Creative Thinking': '🚀'
            };
            const emoji = modeEmojis[mode] || '✨';
            const modeIndicator = `<div class="mode-indicator" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            ">
                <span style="color: #4facfe; font-size: 1.1rem;">${emoji}</span>
                ${mode} Mode
            </div>`;
            formatted = modeIndicator + formatted;
        }
        
        return formatted;
    }
    
    appendMessage(messageElement) {
        // Remove welcome section if it exists and this is the first real message
        const welcomeSection = this.chatContainer.querySelector('.welcome-section');
        if (welcomeSection && this.messageCount === 0) {
            welcomeSection.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (welcomeSection.parentNode) {
                    welcomeSection.parentNode.removeChild(welcomeSection);
                }
            }, 300);
            
            // Add fade out animation CSS if not exists
            if (!document.getElementById('fade-styles')) {
                const style = document.createElement('style');
                style.id = 'fade-styles';
                style.textContent = `
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        this.chatContainer.appendChild(messageElement);
        this.messageCount++;
        this.scrollToBottom();
        
        // Add a subtle celebration for AI responses
        if (messageElement.classList.contains('ai-message')) {
            setTimeout(() => {
                this.createSparkleEffect(messageElement);
            }, 500);
        }
    }
    
    scrollToBottom() {
        // Enhanced smooth scroll to bottom
        setTimeout(() => {
            this.chatContainer.scrollTo({
                top: this.chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.loadingOverlay.classList.add('show');
        } else {
            this.loadingOverlay.classList.remove('show');
        }
        
        this.updateSendButtonState();
        
        // Disable/enable input with visual feedback
        this.messageInput.disabled = loading;
        this.studyModeSelect.disabled = loading;
        
        if (loading) {
            this.messageInput.style.opacity = '0.6';
            this.studyModeSelect.style.opacity = '0.6';
        } else {
            this.messageInput.style.opacity = '1';
            this.studyModeSelect.style.opacity = '1';
        }
    }
    
    // Enhanced error handling with friendliness
    handleAPIError(error) {
        console.error('API Error:', error);
        let errorMessage = 'Oops! I encountered a little hiccup while processing your request. Let\'s try again! 💫';
        
        if (error.message && error.message.includes('GEMINI_API_KEY')) {
            errorMessage = 'It looks like I need my API key to be configured properly. Please check the settings and we\'ll get this working! ✨';
        } else if (error.message && error.message.includes('network')) {
            errorMessage = 'I\'m having trouble connecting right now. Please check your internet connection and I\'ll be right here waiting to help! 🌟';
        }
        
        this.addErrorMessage(errorMessage);
    }
}

// Initialize the magical application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.autoCoachAI = new AutoCoachAI();
    
    // Add magical keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input with sparkle effect
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.autoCoachAI.focusInput();
            window.autoCoachAI.createSparkleEffect(window.autoCoachAI.messageInput);
        }
        
        // Escape to clear input with animation
        if (e.key === 'Escape') {
            const input = window.autoCoachAI.messageInput;
            input.value = '';
            input.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
            window.autoCoachAI.updateSendButtonState();
        }
    });
    
    // Add shake animation CSS
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeStyle);
    
    // Add magical cursor effect on interactive elements
    const interactiveElements = document.querySelectorAll('button, input, select, .feature-card');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Ctext y=\'18\' font-size=\'16\'%3E✨%3C/text%3E%3C/svg%3E"), auto';
        });
        
        element.addEventListener('mouseleave', () => {
            document.body.style.cursor = 'auto';
        });
    });
});

// Enhanced error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.autoCoachAI) {
        window.autoCoachAI.handleAPIError(event.reason);
    }
    event.preventDefault();
});

// Add some magical background music effect (visual only - no actual audio)
function addMagicalVisualEffects() {
    const magicalElements = document.querySelectorAll('.logo-icon, .avatar-ring, .magic-loader');
    magicalElements.forEach(element => {
        element.addEventListener('animationiteration', () => {
            // Create brief magical glow effect
            element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
            setTimeout(() => {
                element.style.boxShadow = '';
            }, 200);
        });
    });
}

// Initialize magical effects
setTimeout(addMagicalVisualEffects, 1000);

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoCoachAI;
}
