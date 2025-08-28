// AutoCoach AI - Advanced Local Storage System 🔒
// Keeps all user data completely private on their device

class AutoCoachLocalStorage {
    constructor() {
        this.storagePrefix = 'autocoach_';
        this.version = '1.0';
        this.maxStorageSize = 50 * 1024 * 1024; // 50MB limit
        
        // Initialize storage structure
        this.initializeStorage();
    }
    
    initializeStorage() {
        // Create default storage structure if it doesn't exist
        const defaultData = {
            version: this.version,
            user: {
                preferences: {
                    theme: 'dark',
                    defaultStudyMode: 'Explain Concept',
                    autoSave: true,
                    notifications: true
                },
                stats: {
                    totalMessages: 0,
                    studyTime: 0,
                    conceptsLearned: 0,
                    quizzesTaken: 0,
                    creativeExercises: 0
                }
            },
            chats: {
                sessions: [],
                currentSessionId: null,
                totalSessions: 0
            },
            bookmarks: [],
            notes: [],
            achievements: []
        };
        
        // Initialize if no data exists
        if (!this.getData('appData')) {
            this.setData('appData', defaultData);
        }
        
        // Migrate data if version mismatch
        this.migrateData();
    }
    
    migrateData() {
        const data = this.getData('appData');
        if (data && data.version !== this.version) {
            console.log('Migrating data to version', this.version);
            data.version = this.version;
            this.setData('appData', data);
        }
    }
    
    // Core storage methods
    setData(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            const fullKey = this.storagePrefix + key;
            
            // Check storage size
            if (this.getStorageSize() + serializedValue.length > this.maxStorageSize) {
                this.cleanupOldData();
            }
            
            localStorage.setItem(fullKey, serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            this.showStorageError('save');
            return false;
        }
    }
    
    getData(key, defaultValue = null) {
        try {
            const fullKey = this.storagePrefix + key;
            const item = localStorage.getItem(fullKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from local storage:', error);
            this.showStorageError('read');
            return defaultValue;
        }
    }
    
    removeData(key) {
        try {
            const fullKey = this.storagePrefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Error removing from local storage:', error);
            return false;
        }
    }
    
    // Chat session management
    createNewChatSession() {
        const appData = this.getData('appData');
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const newSession = {
            id: sessionId,
            createdAt: new Date().toISOString(),
            title: 'New Study Session',
            messages: [],
            studyMode: appData.user.preferences.defaultStudyMode,
            duration: 0,
            conceptsCovered: []
        };
        
        appData.chats.sessions.push(newSession);
        appData.chats.currentSessionId = sessionId;
        appData.chats.totalSessions++;
        
        this.setData('appData', appData);
        return sessionId;
    }
    
    saveMessage(sessionId, message) {
        const appData = this.getData('appData');
        const session = appData.chats.sessions.find(s => s.id === sessionId);
        
        if (session) {
            const messageData = {
                id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                timestamp: new Date().toISOString(),
                type: message.type,
                content: message.content,
                studyMode: message.studyMode || session.studyMode
            };
            
            session.messages.push(messageData);
            
            // Update session title based on first user message
            if (message.type === 'user' && session.messages.length === 1) {
                session.title = this.generateSessionTitle(message.content);
            }
            
            // Update statistics
            appData.user.stats.totalMessages++;
            if (message.type === 'user') {
                this.updateLearningStats(appData, message.studyMode);
            }
            
            this.setData('appData', appData);
            return messageData;
        }
        return null;
    }
    
    getCurrentSession() {
        const appData = this.getData('appData');
        if (appData.chats.currentSessionId) {
            return appData.chats.sessions.find(s => s.id === appData.chats.currentSessionId);
        }
        return null;
    }
    
    getAllSessions() {
        const appData = this.getData('appData');
        return appData.chats.sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    deleteSession(sessionId) {
        const appData = this.getData('appData');
        appData.chats.sessions = appData.chats.sessions.filter(s => s.id !== sessionId);
        
        if (appData.chats.currentSessionId === sessionId) {
            appData.chats.currentSessionId = null;
        }
        
        this.setData('appData', appData);
    }
    
    // User preferences
    updatePreferences(preferences) {
        const appData = this.getData('appData');
        appData.user.preferences = { ...appData.user.preferences, ...preferences };
        this.setData('appData', appData);
    }
    
    getPreferences() {
        const appData = this.getData('appData');
        return appData.user.preferences;
    }
    
    // Bookmarks and notes
    addBookmark(message, sessionId) {
        const appData = this.getData('appData');
        const bookmark = {
            id: 'bookmark_' + Date.now(),
            messageId: message.id,
            sessionId: sessionId,
            content: message.content,
            studyMode: message.studyMode,
            createdAt: new Date().toISOString(),
            tags: []
        };
        
        appData.bookmarks.push(bookmark);
        this.setData('appData', appData);
        return bookmark;
    }
    
    addNote(content, relatedMessageId = null) {
        const appData = this.getData('appData');
        const note = {
            id: 'note_' + Date.now(),
            content: content,
            relatedMessageId: relatedMessageId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: []
        };
        
        appData.notes.push(note);
        this.setData('appData', appData);
        return note;
    }
    
    // Statistics and achievements
    updateLearningStats(appData, studyMode) {
        switch(studyMode) {
            case 'Explain Concept':
                appData.user.stats.conceptsLearned++;
                break;
            case 'Practice Quiz':
                appData.user.stats.quizzesTaken++;
                break;
            case 'Creative Thinking':
                appData.user.stats.creativeExercises++;
                break;
        }
        
        // Check for achievements
        this.checkAchievements(appData);
    }
    
    checkAchievements(appData) {
        const stats = appData.user.stats;
        const achievements = [
            {
                id: 'first_question',
                title: 'First Question! 🌟',
                description: 'Asked your first question',
                condition: stats.totalMessages >= 1,
                unlocked: false
            },
            {
                id: 'curious_learner',
                title: 'Curious Learner 📚',
                description: 'Asked 10 questions',
                condition: stats.totalMessages >= 10,
                unlocked: false
            },
            {
                id: 'concept_master',
                title: 'Concept Master 🧠',
                description: 'Learned 5 concepts',
                condition: stats.conceptsLearned >= 5,
                unlocked: false
            },
            {
                id: 'quiz_champion',
                title: 'Quiz Champion 🎯',
                description: 'Completed 3 practice quizzes',
                condition: stats.quizzesTaken >= 3,
                unlocked: false
            },
            {
                id: 'creative_genius',
                title: 'Creative Genius 🚀',
                description: 'Completed 5 creative exercises',
                condition: stats.creativeExercises >= 5,
                unlocked: false
            }
        ];
        
        achievements.forEach(achievement => {
            if (achievement.condition && !appData.achievements.find(a => a.id === achievement.id)) {
                appData.achievements.push({
                    ...achievement,
                    unlocked: true,
                    unlockedAt: new Date().toISOString()
                });
                this.showAchievement(achievement);
            }
        });
    }
    
    // Data management
    exportData() {
        const appData = this.getData('appData');
        const exportData = {
            ...appData,
            exportedAt: new Date().toISOString(),
            appName: 'AutoCoach AI',
            version: this.version
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `autocoach-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Data exported successfully! 📄', 'success');
    }
    
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (this.validateImportData(importedData)) {
                    const confirmImport = confirm(
                        'This will replace all your current data. Are you sure you want to continue?'
                    );
                    
                    if (confirmImport) {
                        this.setData('appData', importedData);
                        this.showNotification('Data imported successfully! 🎉', 'success');
                        location.reload(); // Refresh to load new data
                    }
                } else {
                    this.showNotification('Invalid data file format', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading data file', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    validateImportData(data) {
        return data && 
               data.user && 
               data.chats && 
               data.version && 
               Array.isArray(data.chats.sessions);
    }
    
    clearAllData() {
        const confirmClear = confirm(
            'This will permanently delete all your chat history, preferences, and data. This cannot be undone. Are you sure?'
        );
        
        if (confirmClear) {
            const doubleConfirm = confirm('Are you absolutely sure? This action is permanent.');
            if (doubleConfirm) {
                // Clear all AutoCoach data from localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.storagePrefix)) {
                        localStorage.removeItem(key);
                    }
                });
                
                this.showNotification('All data cleared', 'info');
                location.reload();
            }
        }
    }
    
    // Utility methods
    generateSessionTitle(firstMessage) {
        const words = firstMessage.split(' ').slice(0, 6);
        return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
    }
    
    getStorageSize() {
        let total = 0;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                total += localStorage.getItem(key).length;
            }
        });
        return total;
    }
    
    getStorageSizeFormatted() {
        const bytes = this.getStorageSize();
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    cleanupOldData() {
        const appData = this.getData('appData');
        
        // Remove old sessions (keep only last 20)
        if (appData.chats.sessions.length > 20) {
            appData.chats.sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            appData.chats.sessions = appData.chats.sessions.slice(0, 20);
        }
        
        // Remove old bookmarks (keep only last 50)
        if (appData.bookmarks.length > 50) {
            appData.bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            appData.bookmarks = appData.bookmarks.slice(0, 50);
        }
        
        this.setData('appData', appData);
        this.showNotification('Cleaned up old data to free space', 'info');
    }
    
    // UI notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `storage-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles if not exists
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .storage-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--glass-bg);
                    backdrop-filter: var(--blur-intense);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    padding: 1rem;
                    z-index: 10000;
                    animation: slideInNotification 0.3s ease;
                    max-width: 300px;
                    box-shadow: var(--shadow-xl);
                }
                
                .storage-notification.success {
                    border-color: #10b981;
                }
                
                .storage-notification.error {
                    border-color: #ef4444;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }
                
                @keyframes slideInNotification {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInNotification 0.3s ease reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    showAchievement(achievement) {
        this.showNotification(`🎉 Achievement Unlocked: ${achievement.title}`, 'success');
    }
    
    showStorageError(operation) {
        this.showNotification(`Error ${operation}ing data. Storage might be full.`, 'error');
    }
}

// Export for use in main app
window.AutoCoachLocalStorage = AutoCoachLocalStorage;
