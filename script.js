 // TodoApp Class - Main Application Logic
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.todoStorage = []; // In-memory storage since localStorage is not available
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.setMinDate();
        this.renderTodos();
        this.updateStats();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTodos(e.target.value);
        });

        // Input validation
        document.getElementById('todoInput').addEventListener('input', this.validateTodoInput.bind(this));
        document.getElementById('dateInput').addEventListener('input', this.validateDateInput.bind(this));
    }

    // Set minimum date to today
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateInput').setAttribute('min', today);
        document.getElementById('dateInput').value = today;
    }

    // Validate todo input
    validateTodoInput() {
        const input = document.getElementById('todoInput');
        const errorElement = document.getElementById('todoError');
        const value = input.value.trim();

        if (value.length === 0) {
            this.showError(errorElement, 'Task description is required');
            return false;
        } else if (value.length < 3) {
            this.showError(errorElement, 'Task must be at least 3 characters long');
            return false;
        } else if (value.length > 100) {
            this.showError(errorElement, 'Task must be less than 100 characters');
            return false;
        } else {
            this.hideError(errorElement);
            return true;
        }
    }

    // Validate date input
    validateDateInput() {
        const input = document.getElementById('dateInput');
        const errorElement = document.getElementById('dateError');
        const selectedDate = new Date(input.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!input.value) {
            this.showError(errorElement, 'Date is required');
            return false;
        } else if (selectedDate < today) {
            this.showError(errorElement, 'Date cannot be in the past');
            return false;
        } else {
            this.hideError(errorElement);
            return true;
        }
    }

    // Show error message
    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    // Hide error message
    hideError(element) {
        element.classList.remove('show');
    }

    // Add new todo
    addTodo() {
        const todoInput = document.getElementById('todoInput');
        const dateInput = document.getElementById('dateInput');

        const isTodoValid = this.validateTodoInput();
        const isDateValid = this.validateDateInput();

        if (!isTodoValid || !isDateValid) {
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: todoInput.value.trim(),
            date: dateInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(newTodo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        // Reset form
        todoInput.value = '';
        this.setMinDate();
        
        // Hide any error messages
        this.hideError(document.getElementById('todoError'));
        this.hideError(document.getElementById('dateError'));

        // Show success feedback
        this.showNotification('Task added successfully!', 'success');
    }

    // Delete todo
    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'info');
        }
    }

    // Toggle todo completion status
    toggleTodo(id) {
        this.todos = this.todos.map(todo => {
            if (todo.id === id) {
                todo.completed = !todo.completed;
            }
            return todo;
        });
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }

    // Set active filter
    setActiveFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTodos();
    }

    // Search todos
    searchTodos(searchTerm) {
        this.renderTodos(searchTerm);
    }

    // Get filtered todos based on current filter and search term
    getFilteredTodos(searchTerm = '') {
        let filteredTodos = [...this.todos];

        // Apply search filter
        if (searchTerm) {
            filteredTodos = filteredTodos.filter(todo =>
                todo.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'completed':
                filteredTodos = filteredTodos.filter(todo => todo.completed);
                break;
            case 'pending':
                filteredTodos = filteredTodos.filter(todo => !todo.completed);
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTodos = filteredTodos.filter(todo => todo.date === today);
                break;
        }

        // Sort by date (newest first) and then by completion status
        filteredTodos.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(a.date) - new Date(b.date);
        });

        return filteredTodos;
    }

    // Render todos to the DOM
    renderTodos(searchTerm = '') {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos(searchTerm);

        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (searchTerm) {
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                `;
            } else if (this.currentFilter !== 'all') {
                emptyState.innerHTML = `
                    <div class="empty-icon">📋</div>
                    <h3>No ${this.currentFilter} tasks</h3>
                    <p>Tasks you've marked as ${this.currentFilter} will appear here</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">📝</div>
                    <h3>No tasks yet</h3>
                    <p>Add your first task to get started!</p>
                `;
            }
            return;
        }

        todoList.style.display = 'block';
        emptyState.style.display = 'none';

        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="app.toggleTodo(${todo.id})"
                >
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">
                        <span class="date-icon">📅</span>
                        ${this.formatDate(todo.date)}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn delete-btn" onclick="app.deleteTodo(${todo.id})" title="Delete task">
                        🗑️
                    </button>
                </div>
            </li>
        `).join('');
    }

    // Update statistics
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateStr === todayStr) {
            return 'Today';
        } else if (dateStr === tomorrowStr) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        // Auto remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Save todos (in-memory storage)
    saveTodos() {
        try {
            // Using in-memory storage since localStorage is not available in Claude artifacts
            this.todoStorage = [...this.todos];
        } catch (error) {
            console.warn('Could not save todos:', error);
        }
    }

    // Load todos (in-memory storage)
    loadTodos() {
        try {
            // Using in-memory storage since localStorage is not available in Claude artifacts
            return this.todoStorage || [];
        } catch (error) {
            console.warn('Could not load todos:', error);
            return [];
        }
    }
}

// Global app instance
let app;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});

// Utility functions for better user experience
document.addEventListener('keydown', (e) => {
    // Quick add shortcut (Ctrl/Cmd + Enter)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const todoForm = document.getElementById('todoForm');
        if (todoForm) {
            todoForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Quick search focus (Ctrl/Cmd + F)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Add some helpful console messages for developers
console.log('🎉 Todo App Loaded Successfully!');
console.log('💡 Keyboard shortcuts:');
console.log('   - Ctrl/Cmd + Enter: Quick add task');
console.log('   - Ctrl/Cmd + F: Focus search');
console.log('📚 Available methods on app object:', Object.getOwnPropertyNames(TodoApp.prototype));