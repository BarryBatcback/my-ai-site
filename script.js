import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ВСТАВЬТЕ СЮДА ВАШИ КЛЮЧИ ИЗ SUPABASE
const SUPABASE_URL = 'https://zmbpbnyukbezpwoiguoq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYnBibnl1a2JlenB3b2lndW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxOTgyMjEsImV4cCI6MjA1Nzc3NDIyMX0.3NREY0vA7dMG_9qN-xKzMKYBcbLqVjVQUS0KXWYbYSA'

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
        
        // Ждем загрузки DOM перед инициализацией
        document.addEventListener('DOMContentLoaded', () => {
            this.init()
            this.initSettingsListeners()
            this.checkAuth()
        })
    }
    
    init() {
        console.log('Инициализация чата...')
        
        // Проверяем, что все элементы существуют
        if (!this.menuToggle || !this.sidebar || !this.closeSidebar) {
            console.error('Не найдены элементы меню')
            return
        }
        
        // Открытие меню
        this.menuToggle.addEventListener('click', (e) => {
            e.preventDefault()
            this.sidebar.classList.add('open')
        })
        
        // Закрытие меню
        this.closeSidebar.addEventListener('click', (e) => {
            e.preventDefault()
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
        if (this.sendButton) {
            this.sendButton.addEventListener('click', (e) => {
                e.preventDefault()
                this.sendMessage()
            })
        }
        
        if (this.userInput) {
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
        }
        
        // Инициализация форм авторизации
        this.initAuthForms()
        
        // Проверяем параметры URL (для подтверждения email)
        this.checkEmailConfirmation()
    }
    
    // Проверка подтверждения email при возврате на сайт
    async checkEmailConfirmation() {
        const params = new URLSearchParams(window.location.search)
        
        // Supabase добавляет параметры после подтверждения
        if (params.get('error')) {
            alert('Ошибка подтверждения email: ' + params.get('error_description'))
        }
        
        // Проверяем сессию после подтверждения
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
            if (user.email_confirmed_at) {
                // Email подтвержден
                alert('Email успешно подтвержден! Теперь вы можете войти.')
            }
        }
    }
    
    initAuthForms() {
        console.log('Инициализация форм авторизации...')
        
        // Форма входа
        const loginForm = document.getElementById('loginForm')
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                e.stopPropagation()
                await this.handleLogin()
            })
        } else {
            console.error('Форма loginForm не найдена')
        }
        
        // Форма регистрации
        const signupForm = document.getElementById('signupForm')
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                e.stopPropagation()
                await this.handleSignup()
            })
        } else {
            console.error('Форма signupForm не найдена')
        }
        
        // Переключение вкладок
        const loginTab = document.getElementById('loginTab')
        const signupTab = document.getElementById('signupTab')
        
        if (loginTab) {
            loginTab.addEventListener('click', () => {
                document.getElementById('loginTab').classList.add('active')
                document.getElementById('signupTab').classList.remove('active')
                document.getElementById('loginForm').classList.add('active')
                document.getElementById('signupForm').classList.remove('active')
            })
        }
        
        if (signupTab) {
            signupTab.addEventListener('click', () => {
                document.getElementById('signupTab').classList.add('active')
                document.getElementById('loginTab').classList.remove('active')
                document.getElementById('signupForm').classList.add('active')
                document.getElementById('loginForm').classList.remove('active')
            })
        }
        
        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutButton')
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout())
        }
    }
    
    initSettingsListeners() {
        // Температура
        const tempInput = document.getElementById('temperature')
        const tempValue = document.getElementById('tempValue')
        
        if (tempInput && tempValue) {
            tempInput.addEventListener('input', (e) => {
                this.temperature = e.target.value
                tempValue.textContent = this.temperature
            })
        }
        
        // Макс токенов
        const maxTokens = document.getElementById('maxTokens')
        if (maxTokens) {
            maxTokens.addEventListener('change', (e) => {
                this.maxTokens = parseInt(e.target.value)
            })
        }
        
        // Стиль
        const aiStyle = document.getElementById('aiStyle')
        if (aiStyle) {
            aiStyle.addEventListener('change', (e) => {
                this.aiStyle = e.target.value
            })
        }
    }
    
    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            
            if (error) {
                console.error('Ошибка проверки авторизации:', error)
                this.currentUser = null
            } else {
                this.currentUser = user
            }
            
            const authModal = document.getElementById('authModal')
            const logoutBtn = document.getElementById('logoutButton')
            const userName = document.getElementById('userName')
            const userPlan = document.getElementById('userPlan')
            
            if (this.currentUser) {
                // Проверяем, подтвержден ли email
                if (!this.currentUser.email_confirmed_at) {
                    // Email не подтвержден, показываем предупреждение
                    alert('Пожалуйста, подтвердите ваш email. Проверьте почту.')
                }
                
                if (authModal) authModal.style.display = 'none'
                if (logoutBtn) logoutBtn.style.display = 'block'
                if (userName) userName.textContent = this.currentUser.email || 'Пользователь'
                if (userPlan) userPlan.textContent = 'Бесплатный тариф'
                
                // Загружаем данные профиля
                await this.loadUserProfile()
            } else {
                if (authModal) authModal.style.display = 'flex'
                if (logoutBtn) logoutBtn.style.display = 'none'
                if (userName) userName.textContent = 'Гость'
                if (userPlan) userPlan.textContent = 'Бесплатный тариф'
            }
        } catch (error) {
            console.error('Ошибка в checkAuth:', error)
        }
    }
    
    async loadUserProfile() {
        if (!this.currentUser) return
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single()
            
            if (error) {
                console.error('Ошибка загрузки профиля:', error)
                return
            }
            
            if (data) {
                const userPlan = document.getElementById('userPlan')
                if (userPlan) {
                    userPlan.textContent = data.subscription_tier === 'free' ? 'Бесплатный тариф' :
                                          data.subscription_tier === 'basic' ? 'Базовый тариф' : 'Про тариф'
                }
            }
        } catch (error) {
            console.error('Ошибка:', error)
        }
    }
    
    async handleLogin() {
        try {
            const email = document.getElementById('loginEmail')?.value
            const password = document.getElementById('loginPassword')?.value
            
            if (!email || !password) {
                alert('Введите email и пароль')
                return
            }
            
            console.log('Попытка входа:', email)
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })
            
            if (error) {
                console.error('Ошибка входа:', error)
                
                // Проверяем, не нужно ли подтвердить email
                if (error.message.includes('Email not confirmed')) {
                    alert('Пожалуйста, подтвердите ваш email. Проверьте почту.')
                    
                    // Отправляем повторное письмо
                    await supabase.auth.resend({
                        type: 'signup',
                        email: email
                    })
                } else {
                    alert('Ошибка входа: ' + error.message)
                }
                return
            }
            
            console.log('Вход успешен:', data)
            await this.checkAuth()
            
        } catch (error) {
            console.error('Ошибка:', error)
            alert('Произошла ошибка при входе')
        }
    }
    
    async handleSignup() {
        try {
            const email = document.getElementById('signupEmail')?.value
            const password = document.getElementById('signupPassword')?.value
            
            if (!email || !password) {
                alert('Введите email и пароль')
                return
            }
            
            if (password.length < 6) {
                alert('Пароль должен быть не менее 6 символов')
                return
            }
            
            // Простая проверка формата email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                alert('Введите корректный email адрес')
                return
            }
            
            console.log('Попытка регистрации:', email)
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            })
            
            if (error) {
                console.error('Ошибка регистрации:', error)
                
                // Проверяем на дубликат email
                if (error.message.includes('User already registered')) {
                    alert('Этот email уже зарегистрирован. Попробуйте войти или восстановить пароль.')
                } else {
                    alert('Ошибка регистрации: ' + error.message)
                }
                return
            }
            
            console.log('Регистрация успешна:', data)
            
            if (data.user) {
                if (data.user.identities && data.user.identities.length === 0) {
                    alert('Этот email уже зарегистрирован, но требует подтверждения. Проверьте почту.')
                } else {
                    alert('Регистрация успешна! На ваш email отправлено письмо с подтверждением.')
                }
                
                // Очищаем поля
                document.getElementById('signupEmail').value = ''
                document.getElementById('signupPassword').value = ''
                
                // Переключаемся на вкладку входа
                document.getElementById('loginTab')?.click()
            }
            
        } catch (error) {
            console.error('Ошибка:', error)
            alert('Произошла ошибка при регистрации')
        }
    }
    
    async handleLogout() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Ошибка выхода:', error)
                alert('Ошибка при выходе: ' + error.message)
                return
            }
            
            await this.checkAuth()
            
        } catch (error) {
            console.error('Ошибка:', error)
        }
    }
    
    async checkMessageLimit(userId) {
        try {
            const today = new Date().toISOString().split('T')[0]
            
            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_tier, messages_today, last_message_date')
                .eq('id', userId)
                .single()
            
            if (error || !data) {
                console.error('Ошибка проверки лимита:', error)
                return { allowed: true }
            }
            
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
            
        } catch (error) {
            console.error('Ошибка:', error)
            return { allowed: true }
        }
    }
    
    async incrementMessageCount(userId) {
        try {
            await supabase
                .from('profiles')
                .update({ messages_today: supabase.sql`messages_today + 1` })
                .eq('id', userId)
        } catch (error) {
            console.error('Ошибка увеличения счетчика:', error)
        }
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
        
        // Проверка подтверждения email
        if (!this.currentUser.email_confirmed_at) {
            alert('Пожалуйста, подтвердите ваш email перед отправкой сообщений')
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
        
        return `${styles[this.aiStyle] || 'Ответ'} на: "${message}" (креативность: ${this.temperature})`
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

// Создаем экземпляр класса при загрузке страницы
const chat = new AIChat()
