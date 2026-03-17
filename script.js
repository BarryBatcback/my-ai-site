import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ВСТАВЬТЕ СЮДА ВАШИ КЛЮЧИ ИЗ SUPABASE
const SUPABASE_URL = 'https://ваш-проект.supabase.co'
const SUPABASE_ANON_KEY = 'ваш-anon-ключ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

class AIChat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages')
        this.userInput = document.getElementById('userInput')
        this.sendButton = document.getElementById('sendButton')
        this.menuToggle = document.getElementById('menuToggle')
        this.sidebar = document.getElementById('sidebar')
        this.closeSidebar = document.getElementById('closeSidebar')
        
        // Настройки AI
        this.temperature = 0.7
        this.maxTokens = 500
        this.aiStyle = 'friendly'
        
        this.isLoading = false
        this.currentUser = null
        
        this.init()
        this.initSettingsListeners()
        this.checkAuth()
    }
    
    init() {
        // Открытие/закрытие меню
        this.menuToggle.addEventListener('click', () => {
            this.sidebar.classList.add('open')
        })
        
        this.closeSidebar.addEventListener('click', () => {
            this.sidebar.classList.remove('open')
        })
        
        // Закрытие по клику вне меню
        document.addEventListener('click', (e) => {
            if (!this.sidebar.contains(e.target) && 
                !this.menuToggle.contains(e.target) && 
                this.sidebar.classList.contains('open')) {
                this.sidebar.classList.remove('open')
            }
        })
        
        // Отправка сообщений
        this.sendButton.addEventListener('click', () => this.sendMessage())
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                this.sendMessage()
            }
        })
        
        // Авто-высота textarea
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto'
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 150) + 'px'
        })
        
        // Обработчики авторизации
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleLogin()
        })
        
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleSignup()
        })
        
        // Переключение вкладок
        document.getElementById('loginTab').addEventListener('click', () => {
            document.getElementById('loginTab').classList.add('active')
            document.getElementById('signupTab').classList.remove('active')
            document.getElementById('loginForm').classList.add('active')
            document.getElementById('signupForm').classList.remove('active')
        })
        
        document.getElementById('signupTab').addEventListener('click', () => {
            document.getElementById('signupTab').classList.add('active')
            document.getElementById('loginTab').classList.remove('active')
            document.getElementById('signupForm').classList.add('active')
            document.getElementById('loginForm').classList.remove('active')
        })
        
        // Выход
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout())
    }
    
    initSettingsListeners() {
        // Температура
        const tempInput = document.getElementById('temperature')
        const tempValue = document.getElementById('tempValue')
        
        tempInput.addEventListener('input', (e) => {
            this.temperature = e.target.value
            tempValue.textContent = this.temperature
        })
        
        // Макс токенов
        document.getElementById('maxTokens').addEventListener('change', (e) => {
            this.maxTokens = parseInt(e.target.value)
        })
        
        // Стиль
        document.getElementById('aiStyle').addEventListener('change', (e) => {
            this.aiStyle = e.target.value
        })
    }
    
    async checkAuth() {
        const { data: { user } } = await supabase.auth.getUser()
        this.currentUser = user
        
        if (user) {
            document.getElementById('authModal').style.display = 'none'
            document.getElementById('logoutButton').style.display = 'block'
            
            // Загружаем данные пользователя
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            
            if (profile) {
                document.getElementById('userName').textContent = user.email
                document.getElementById('userPlan').textContent = 
                    profile.subscription_tier === 'free' ? 'Бесплатный тариф' :
                    profile.subscription_tier === 'basic' ? 'Базовый тариф' : 'Про тариф'
            }
        } else {
            document.getElementById('authModal').style.display = 'flex'
            document.getElementById('logoutButton').style.display = 'none'
            document.getElementById('userName').textContent = 'Гость'
            document.getElementById('userPlan').textContent = 'Бесплатный тариф'
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) {
            alert('Ошибка входа: ' + error.message)
            return
        }
        
        await this.checkAuth()
    }
    
    async handleSignup() {
        const email = document.getElementById('signupEmail').value
        const password = document.getElementById('signupPassword').value
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        })
        
        if (error) {
            alert('Ошибка регистрации: ' + error.message)
            return
        }
        
        if (data.user) {
            // Создаем профиль
            await supabase.from('profiles').insert([
                {
                    id: data.user.id,
                    email: email,
                    subscription_tier: 'free',
                    messages_today: 0,
                    last_message_date: new Date().toISOString().split('T')[0]
                }
            ])
            
            alert('Регистрация успешна! Проверьте почту для подтверждения.')
        }
    }
    
    async handleLogout() {
        await supabase.auth.signOut()
        await this.checkAuth()
    }
    
    async checkMessageLimit(userId) {
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
            .from('profiles')
            .select('subscription_tier, messages_today, last_message_date')
            .eq('id', userId)
            .single()
        
        if (error || !data) return { allowed: false }
        
        // Сброс счетчика если новый день
        if (data.last_message_date !== today) {
            await supabase
                .from('profiles')
                .update({ messages_today: 0, last_message_date: today })
                .eq('id', userId)
            data.messages_today = 0
        }
        
        // Проверка лимитов
        if (data.subscription_tier === 'free' && data.messages_today >= 20) {
            return { allowed: false, message: 'Дневной лимит (20 сообщений) исчерпан' }
        }
        
        return { allowed: true, tier: data.subscription_tier }
    }
    
    async incrementMessageCount(userId) {
        await supabase
            .from('profiles')
            .update({ messages_today: supabase.sql`messages_today + 1` })
            .eq('id', userId)
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim()
        if (!message || this.isLoading) return
        
        // Проверка авторизации
        if (!this.currentUser) {
            alert('Пожалуйста, войдите в систему')
            document.getElementById('authModal').style.display = 'flex'
            return
        }
        
        // Проверка лимитов
        const limitCheck = await this.checkMessageLimit(this.currentUser.id)
        if (!limitCheck.allowed) {
            alert(limitCheck.message)
            return
        }
        
        // Добавляем сообщение пользователя
        this.addMessage(message, 'user')
        this.userInput.value = ''
        this.userInput.style.height = 'auto'
        
        // Показываем индикатор печати
        this.showTypingIndicator()
        
        try {
            // Здесь ваш запрос к AI с учетом настроек
            const response = await this.getAIResponse(message)
            
            // Увеличиваем счетчик
            await this.incrementMessageCount(this.currentUser.id)
            
            this.removeTypingIndicator()
            this.addMessage(response, 'bot')
        } catch (error) {
            console.error('Error:', error)
            this.removeTypingIndicator()
            this.addMessage('Извините, произошла ошибка. Пожалуйста, попробуйте позже.', 'bot')
        }
    }
    
    async getAIResponse(message) {
        // ЗДЕСЬ ВАША ИНТЕГРАЦИЯ С AI
        // Используйте this.temperature, this.maxTokens, this.aiStyle
        
        // Пример для тестирования:
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const styles = {
            professional: 'Профессиональный ответ',
            friendly: 'Дружелюбный ответ',
            creative: 'Творческий ответ'
        }
        
        return `${styles[this.aiStyle]} на сообщение: "${message}" (temp: ${this.temperature}, tokens: ${this.maxTokens})`
        
        /* Реальный запрос к вашему API:
        const response = await fetch('URL_ВАШЕГО_AI', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                style: this.aiStyle,
                user_id: this.currentUser?.id
            })
        })
        
        const data = await response.json()
        return data.response
        */
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div')
        messageDiv.className = `message ${sender}`
        
        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content'
        contentDiv.textContent = text
        
        messageDiv.appendChild(contentDiv)
        this.messagesContainer.appendChild(messageDiv)
        this.scrollToBottom()
    }
    
    showTypingIndicator() {
        this.isLoading = true
        
        const indicatorDiv = document.createElement('div')
        indicatorDiv.className = 'message bot'
        indicatorDiv.id = 'typingIndicator'
        
        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content typing-indicator'
        contentDiv.innerHTML = '<span></span><span></span><span></span>'
        
        indicatorDiv.appendChild(contentDiv)
        this.messagesContainer.appendChild(indicatorDiv)
        this.scrollToBottom()
    }
    
    removeTypingIndicator() {
        this.isLoading = false
        const indicator = document.getElementById('typingIndicator')
        if (indicator) {
            indicator.remove()
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new AIChat()
})
