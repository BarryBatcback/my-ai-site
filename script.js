// Инициализация Supabase (в начало файла)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 
const SUPABASE_URL = 'https://zmbpbnyukbezpwoiguoq.supabase.co'  // Вставьте ваш Project URL
const SUPABASE_ANON_KEY = 'sb_publishable_HpJZFZBoEK0haduxr2w93g_1f_7r6xn'              // Вставьте ваш anon public key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

init() {

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

    // Проверка, авторизован ли пользователь
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// Регистрация
async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                subscription_tier: 'free',
                messages_today: 0
            }
        }
    })
    
    if (error) {
        alert('Ошибка регистрации: ' + error.message)
        return null
    }
    
    // Создаем запись в таблице profiles
    if (data.user) {
        await supabase.from('profiles').insert([
            {
                id: data.user.id,
                email: email,
                subscription_tier: 'free',
                messages_today: 0,
                last_message_date: new Date().toISOString().split('T')[0]
            }
        ])
    }
    
    alert('Регистрация успешна! Проверьте почту для подтверждения.')
    return data.user
}

// Вход
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    if (error) {
        alert('Ошибка входа: ' + error.message)
        return null
    }
    
    return data.user
}

// Выход
async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        alert('Ошибка при выходе: ' + error.message)
    }
}

// Проверка лимита сообщений (для бесплатного тарифа)
async function checkMessageLimit(userId) {
    const today = new Date().toISOString().split('T')[0]
    
    // Получаем данные пользователя
    const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, messages_today, last_message_date')
        .eq('id', userId)
        .single()
    
    if (error || !data) return { allowed: false, message: 'Ошибка проверки лимита' }
    
    // Если дата последнего сообщения не сегодня, обнуляем счетчик
    if (data.last_message_date !== today) {
        await supabase
            .from('profiles')
            .update({ messages_today: 0, last_message_date: today })
            .eq('id', userId)
        data.messages_today = 0
    }
    
    // Проверяем лимиты по тарифу
    if (data.subscription_tier === 'free' && data.messages_today >= 20) {
        return { allowed: false, message: 'Дневной лимит (20 сообщений) исчерпан' }
    }
    
    return { allowed: true, tier: data.subscription_tier }
}

// Увеличиваем счетчик сообщений
async function incrementMessageCount(userId) {
    await supabase.rpc('increment_message_count', { user_id: userId })
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
async sendMessage() {
    const message = this.userInput.value.trim();
    if (!message || this.isLoading) return;
    
    // Проверяем, авторизован ли пользователь
    const user = await checkUser();
    if (!user) {
        alert('Пожалуйста, войдите в систему');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    // Проверяем лимиты
    const limitCheck = await checkMessageLimit(user.id);
    if (!limitCheck.allowed) {
        alert(limitCheck.message);
        return;
    }
    
    // Добавляем сообщение пользователя
    this.addMessage(message, 'user');
    this.userInput.value = '';
    this.userInput.style.height = 'auto';
    
    // Показываем индикатор печати
    this.showTypingIndicator();
    
    try {
        // Здесь ваш запрос к AI (как и раньше)
        const response = await this.getAIResponse(message);
        
        // Увеличиваем счетчик сообщений
        await incrementMessageCount(user.id);
        
        this.removeTypingIndicator();
        this.addMessage(response, 'bot');
    } catch (error) {
        console.error('Error:', error);
        this.removeTypingIndicator();
        this.addMessage('Извините, произошла ошибка. Пожалуйста, попробуйте позже.', 'bot');
    }
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
// Обработчики для авторизации
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const user = await signIn(email, password);
        if (user) {
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
        }
    });
    
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const user = await signUp(email, password);
        if (user) {
            document.getElementById('authModal').style.display = 'none';
        }
    });
    
    document.getElementById('logoutButton').addEventListener('click', async () => {
        await signOut();
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
    });
    
    // Переключение между вкладками входа и регистрации
    document.getElementById('loginTab').addEventListener('click', () => {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('signupForm').classList.remove('active');
    });
    
    document.getElementById('signupTab').addEventListener('click', () => {
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('signupForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
    });
    
    // Проверяем, может пользователь уже вошел
    checkUser().then(user => {
        if (user) {
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
        } else {
            document.getElementById('authModal').style.display = 'flex';
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
});
