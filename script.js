class AIChat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.themeSwitcher = document.getElementById('themeSwitcher');
        
        this.apiEndpoint = 'https://ваш-ai-сервер.com/api/chat'; // Замените на ваш endpoint
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        // Обработчики событий
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Автоматическое изменение высоты textarea
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 150) + 'px';
        });
        
        // Переключение темы
        this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
        
        // Загрузка сохраненной темы
        this.loadTheme();
    }
    
    toggleTheme() {
        const body = document.body;
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Добавляем сообщение пользователя
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        // Показываем индикатор печати
        this.showTypingIndicator();
        
        try {
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            this.addMessage('Извините, произошла ошибка. Пожалуйста, попробуйте позже.', 'bot');
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.isLoading = true;
        
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'message bot';
        indicatorDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.innerHTML = '<span></span><span></span><span></span>';
        
        indicatorDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(indicatorDiv);
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        this.isLoading = false;
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    async getAIResponse(message) {
        // ЗДЕСЬ ВАША ИНТЕГРАЦИЯ С AI
        // Замените этот код на вызов вашего AI
        
        // Пример для тестирования:
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `Это ответ от вашего AI на сообщение: "${message}"`;
        
        // Реальный запрос к вашему API:
        /*
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data.response;
        */
    }
}

// Инициализация Supabase (в начало файла)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient('ВАШ_URL', 'ВАШ_ANON_KEY')

// Функция регистрации
async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    return { data, error }
}

// Функция входа
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    return { data, error }
}

// Проверка авторизации перед отправкой к AI
async function sendMessage() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert('Пожалуйста, войдите в систему')
        return
    }
    // Далее отправка сообщения к AI
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
});
