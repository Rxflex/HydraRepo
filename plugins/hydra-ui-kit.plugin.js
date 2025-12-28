/**
 * Hydra UI Kit - Набор готовых UI компонентов для плагинов
 * Предоставляет стилизованные компоненты в стиле Hydra Launcher
 */

const manifest = {
  id: "hydra-ui-kit",
  name: "Hydra UI Kit",
  version: "1.0.0",
  description: "Набор готовых UI компонентов в стиле Hydra для использования в других плагинах",
  author: "Hydra Team",
  main: "hydra-ui-kit.js",
  permissions: ["ui"],
  provides: ["HydraUI"], // Указываем что этот плагин предоставляет HydraUI API
};

// Глобальный объект HydraUI для использования другими плагинами
let HydraUI = null;

async function activate(context) {
  console.log("🎨 Hydra UI Kit активирован!");

  // Создаем глобальный объект HydraUI
  HydraUI = createHydraUI(context);
  
  // Делаем HydraUI доступным глобально
  if (typeof window !== 'undefined') {
    window.HydraUI = HydraUI;
  }
  if (typeof global !== 'undefined') {
    global.HydraUI = HydraUI;
  }

  context.app.showNotification(
    "Hydra UI Kit загружен! Компоненты доступны через HydraUI API.",
    "success"
  );

  // Добавляем демо-страницу для показа компонентов
  context.ui.addSidebarItem({
    id: "ui-kit-demo",
    label: "UI Kit Demo",
    icon: "🎨",
    path: "/plugin/hydra-ui-kit/demo",
  });

  const demoHTML = createDemoHTML();

  context.ui.addPage({
    id: "demo",
    path: "/plugin/hydra-ui-kit/demo",
    title: "Hydra UI Kit - Демонстрация",
    content: demoHTML,
  });

  // Добавляем CSS стили в документ
  injectHydraStyles();

  console.log("✅ Hydra UI Kit полностью инициализирован");
}

function createHydraUI(context) {
  return {
    // Версия API
    version: "1.0.0",
    
    // Создание кнопок
    createButton: (text, options = {}) => {
      const {
        type = 'primary',
        size = 'medium',
        disabled = false,
        icon = null,
        onClick = null,
        className = ''
      } = options;

      const button = document.createElement('button');
      button.textContent = icon ? `${icon} ${text}` : text;
      button.className = `hydra-btn hydra-btn-${type} hydra-btn-${size} ${className}`;
      button.disabled = disabled;
      
      if (onClick) {
        button.addEventListener('click', onClick);
      }

      return button;
    },

    // Создание карточек
    createCard: (content, options = {}) => {
      const {
        title = null,
        className = '',
        padding = 'normal',
        shadow = true
      } = options;

      const card = document.createElement('div');
      card.className = `hydra-card hydra-card-${padding} ${shadow ? 'hydra-card-shadow' : ''} ${className}`;
      
      if (title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'hydra-card-title';
        titleEl.textContent = title;
        card.appendChild(titleEl);
      }

      if (typeof content === 'string') {
        const contentEl = document.createElement('div');
        contentEl.innerHTML = content;
        card.appendChild(contentEl);
      } else {
        card.appendChild(content);
      }

      return card;
    },

    // Создание модальных окон
    createModal: (content, options = {}) => {
      const {
        title = 'Модальное окно',
        size = 'medium',
        closable = true,
        onClose = null
      } = options;

      const overlay = document.createElement('div');
      overlay.className = 'hydra-modal-overlay';
      
      const modal = document.createElement('div');
      modal.className = `hydra-modal hydra-modal-${size}`;
      
      const header = document.createElement('div');
      header.className = 'hydra-modal-header';
      
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      
      if (closable) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'hydra-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
          overlay.remove();
          if (onClose) onClose();
        };
        header.appendChild(closeBtn);
      }
      
      const body = document.createElement('div');
      body.className = 'hydra-modal-body';
      
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }
      
      modal.appendChild(header);
      modal.appendChild(body);
      overlay.appendChild(modal);
      
      // Закрытие по клику вне модального окна
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && closable) {
          overlay.remove();
          if (onClose) onClose();
        }
      });

      return {
        element: overlay,
        show: () => document.body.appendChild(overlay),
        hide: () => overlay.remove()
      };
    },

    // Создание уведомлений
    showNotification: (message, options = {}) => {
      const {
        type = 'info',
        duration = 4000,
        position = 'top-right'
      } = options;

      const notification = document.createElement('div');
      notification.className = `hydra-notification hydra-notification-${type} hydra-notification-${position}`;
      notification.innerHTML = `
        <div class="hydra-notification-content">
          <span class="hydra-notification-icon">${getNotificationIcon(type)}</span>
          <span class="hydra-notification-message">${message}</span>
        </div>
      `;

      document.body.appendChild(notification);

      // Автоматическое удаление
      setTimeout(() => {
        notification.classList.add('hydra-notification-fade-out');
        setTimeout(() => notification.remove(), 300);
      }, duration);

      return notification;
    },

    // Создание форм
    createForm: (fields, options = {}) => {
      const {
        onSubmit = null,
        className = ''
      } = options;

      const form = document.createElement('form');
      form.className = `hydra-form ${className}`;
      
      fields.forEach(field => {
        const fieldEl = createFormField(field);
        form.appendChild(fieldEl);
      });

      if (onSubmit) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          onSubmit(data);
        });
      }

      return form;
    },

    // Создание загрузчиков
    createLoader: (options = {}) => {
      const {
        size = 'medium',
        text = 'Загрузка...',
        type = 'spinner'
      } = options;

      const loader = document.createElement('div');
      loader.className = `hydra-loader hydra-loader-${size}`;
      loader.innerHTML = `
        <div class="hydra-loader-${type}"></div>
        ${text ? `<div class="hydra-loader-text">${text}</div>` : ''}
      `;

      return loader;
    },

    // Создание прогресс-баров
    createProgressBar: (value = 0, options = {}) => {
      const {
        max = 100,
        showText = true,
        className = '',
        color = 'primary'
      } = options;

      const container = document.createElement('div');
      container.className = `hydra-progress ${className}`;
      
      const bar = document.createElement('div');
      bar.className = `hydra-progress-bar hydra-progress-bar-${color}`;
      bar.style.width = `${(value / max) * 100}%`;
      
      container.appendChild(bar);
      
      if (showText) {
        const text = document.createElement('div');
        text.className = 'hydra-progress-text';
        text.textContent = `${Math.round((value / max) * 100)}%`;
        container.appendChild(text);
      }

      return {
        element: container,
        setValue: (newValue) => {
          bar.style.width = `${(newValue / max) * 100}%`;
          if (showText) {
            container.querySelector('.hydra-progress-text').textContent = `${Math.round((newValue / max) * 100)}%`;
          }
        }
      };
    },

    // Утилиты для работы с CSS классами
    utils: {
      addClass: (element, className) => element.classList.add(className),
      removeClass: (element, className) => element.classList.remove(className),
      toggleClass: (element, className) => element.classList.toggle(className),
      hasClass: (element, className) => element.classList.contains(className)
    }
  };
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

function createFormField(field) {
  const {
    type = 'text',
    name,
    label,
    placeholder = '',
    required = false,
    options = []
  } = field;

  const fieldContainer = document.createElement('div');
  fieldContainer.className = 'hydra-form-field';

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'hydra-form-label';
    labelEl.textContent = label;
    labelEl.setAttribute('for', name);
    fieldContainer.appendChild(labelEl);
  }

  let input;
  
  switch (type) {
    case 'select':
      input = document.createElement('select');
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        input.appendChild(optionEl);
      });
      break;
    case 'textarea':
      input = document.createElement('textarea');
      input.placeholder = placeholder;
      break;
    default:
      input = document.createElement('input');
      input.type = type;
      input.placeholder = placeholder;
  }

  input.name = name;
  input.id = name;
  input.className = `hydra-form-input hydra-form-input-${type}`;
  input.required = required;

  fieldContainer.appendChild(input);
  return fieldContainer;
}

function injectHydraStyles() {
  if (document.getElementById('hydra-ui-kit-styles')) {
    return; // Стили уже добавлены
  }

  const style = document.createElement('style');
  style.id = 'hydra-ui-kit-styles';
  style.textContent = `
    /* Hydra UI Kit Styles */
    
    /* Кнопки */
    .hydra-btn {
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-family: inherit;
    }
    
    .hydra-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .hydra-btn:active {
      transform: translateY(0);
    }
    
    .hydra-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    /* Размеры кнопок */
    .hydra-btn-small {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .hydra-btn-medium {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
    
    .hydra-btn-large {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
    
    /* Типы кнопок */
    .hydra-btn-primary {
      background: #007acc;
      color: white;
    }
    
    .hydra-btn-primary:hover {
      background: #0056b3;
    }
    
    .hydra-btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .hydra-btn-secondary:hover {
      background: #545b62;
    }
    
    .hydra-btn-success {
      background: #28a745;
      color: white;
    }
    
    .hydra-btn-success:hover {
      background: #1e7e34;
    }
    
    .hydra-btn-danger {
      background: #dc3545;
      color: white;
    }
    
    .hydra-btn-danger:hover {
      background: #c82333;
    }
    
    .hydra-btn-warning {
      background: #ffc107;
      color: #333;
    }
    
    .hydra-btn-warning:hover {
      background: #e0a800;
    }
    
    .hydra-btn-outline {
      background: transparent;
      border: 2px solid #007acc;
      color: #007acc;
    }
    
    .hydra-btn-outline:hover {
      background: #007acc;
      color: white;
    }
    
    /* Карточки */
    .hydra-card {
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      transition: all 0.2s ease;
    }
    
    .hydra-card-shadow {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .hydra-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .hydra-card-small {
      padding: 0.75rem;
    }
    
    .hydra-card-normal {
      padding: 1.5rem;
    }
    
    .hydra-card-large {
      padding: 2rem;
    }
    
    .hydra-card-title {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    /* Модальные окна */
    .hydra-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    
    .hydra-modal {
      background: white;
      border-radius: 8px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease;
    }
    
    .hydra-modal-small {
      width: 90%;
      max-width: 400px;
    }
    
    .hydra-modal-medium {
      width: 90%;
      max-width: 600px;
    }
    
    .hydra-modal-large {
      width: 90%;
      max-width: 800px;
    }
    
    .hydra-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }
    
    .hydra-modal-header h3 {
      margin: 0;
      color: #333;
    }
    
    .hydra-modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .hydra-modal-close:hover {
      background: #f8f9fa;
      color: #333;
    }
    
    .hydra-modal-body {
      padding: 1.5rem;
    }
    
    /* Уведомления */
    .hydra-notification {
      position: fixed;
      z-index: 10001;
      padding: 1rem;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      max-width: 300px;
      animation: slideInNotification 0.3s ease;
    }
    
    .hydra-notification-top-right {
      top: 20px;
      right: 20px;
    }
    
    .hydra-notification-top-left {
      top: 20px;
      left: 20px;
    }
    
    .hydra-notification-bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .hydra-notification-bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .hydra-notification-success {
      background: #28a745;
    }
    
    .hydra-notification-error {
      background: #dc3545;
    }
    
    .hydra-notification-warning {
      background: #ffc107;
      color: #333;
    }
    
    .hydra-notification-info {
      background: #007acc;
    }
    
    .hydra-notification-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .hydra-notification-fade-out {
      animation: fadeOut 0.3s ease forwards;
    }
    
    /* Формы */
    .hydra-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .hydra-form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .hydra-form-label {
      font-weight: 500;
      color: #333;
    }
    
    .hydra-form-input {
      padding: 0.5rem;
      border: 2px solid #dee2e6;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }
    
    .hydra-form-input:focus {
      outline: none;
      border-color: #007acc;
    }
    
    .hydra-form-input-textarea {
      min-height: 100px;
      resize: vertical;
    }
    
    /* Загрузчики */
    .hydra-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .hydra-loader-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .hydra-loader-small .hydra-loader-spinner {
      width: 24px;
      height: 24px;
      border-width: 3px;
    }
    
    .hydra-loader-large .hydra-loader-spinner {
      width: 60px;
      height: 60px;
      border-width: 6px;
    }
    
    .hydra-loader-text {
      color: #666;
      font-size: 0.9rem;
    }
    
    /* Прогресс-бары */
    .hydra-progress {
      position: relative;
      background: #e9ecef;
      border-radius: 4px;
      height: 20px;
      overflow: hidden;
    }
    
    .hydra-progress-bar {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }
    
    .hydra-progress-bar-primary {
      background: #007acc;
    }
    
    .hydra-progress-bar-success {
      background: #28a745;
    }
    
    .hydra-progress-bar-warning {
      background: #ffc107;
    }
    
    .hydra-progress-bar-danger {
      background: #dc3545;
    }
    
    .hydra-progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.8rem;
      font-weight: 500;
      color: #333;
    }
    
    /* Анимации */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
    
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
}

function createDemoHTML() {
  return `
    <div style="padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1000px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="color: #333; margin-bottom: 0.5rem;">🎨 Hydra UI Kit</h1>
        <p style="color: #666; font-size: 1.1em;">Демонстрация компонентов для разработчиков плагинов</p>
        <div style="background: #e8f4fd; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #b3d9ff;">
          <strong>Для разработчиков:</strong> Используйте <code>window.HydraUI</code> для доступа к компонентам в ваших плагинах
        </div>
      </div>

      <!-- Кнопки -->
      <section style="margin-bottom: 3rem;">
        <h2 style="color: #333; margin-bottom: 1rem;">Кнопки</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <button class="hydra-btn hydra-btn-primary hydra-btn-medium">Primary</button>
          <button class="hydra-btn hydra-btn-secondary hydra-btn-medium">Secondary</button>
          <button class="hydra-btn hydra-btn-success hydra-btn-medium">Success</button>
          <button class="hydra-btn hydra-btn-danger hydra-btn-medium">Danger</button>
          <button class="hydra-btn hydra-btn-warning hydra-btn-medium">Warning</button>
          <button class="hydra-btn hydra-btn-outline hydra-btn-medium">Outline</button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
          <button class="hydra-btn hydra-btn-primary hydra-btn-small">Small</button>
          <button class="hydra-btn hydra-btn-primary hydra-btn-medium">Medium</button>
          <button class="hydra-btn hydra-btn-primary hydra-btn-large">Large</button>
          <button class="hydra-btn hydra-btn-primary hydra-btn-medium" disabled>Disabled</button>
        </div>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 1rem; font-family: monospace; font-size: 0.9em;">
          <strong>Пример кода:</strong><br>
          const btn = HydraUI.createButton('Моя кнопка', {<br>
          &nbsp;&nbsp;type: 'primary',<br>
          &nbsp;&nbsp;size: 'medium',<br>
          &nbsp;&nbsp;onClick: () => alert('Клик!')<br>
          });
        </div>
      </section>

      <!-- Карточки -->
      <section style="margin-bottom: 3rem;">
        <h2 style="color: #333; margin-bottom: 1rem;">Карточки</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div class="hydra-card hydra-card-normal hydra-card-shadow">
            <h3 class="hydra-card-title">Обычная карточка</h3>
            <p>Это пример обычной карточки с тенью и стандартным отступом.</p>
          </div>
          <div class="hydra-card hydra-card-small" style="border: 2px solid #007acc;">
            <h3 class="hydra-card-title">Компактная карточка</h3>
            <p>Карточка с маленькими отступами и цветной рамкой.</p>
          </div>
          <div class="hydra-card hydra-card-large hydra-card-shadow" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h3 class="hydra-card-title" style="color: white;">Стилизованная карточка</h3>
            <p>Карточка с градиентным фоном и большими отступами.</p>
          </div>
        </div>
      </section>

      <!-- Формы -->
      <section style="margin-bottom: 3rem;">
        <h2 style="color: #333; margin-bottom: 1rem;">Формы</h2>
        <div class="hydra-card hydra-card-normal hydra-card-shadow" style="max-width: 500px;">
          <form class="hydra-form">
            <div class="hydra-form-field">
              <label class="hydra-form-label" for="demo-name">Имя</label>
              <input class="hydra-form-input" type="text" id="demo-name" name="name" placeholder="Введите ваше имя">
            </div>
            <div class="hydra-form-field">
              <label class="hydra-form-label" for="demo-email">Email</label>
              <input class="hydra-form-input" type="email" id="demo-email" name="email" placeholder="example@email.com">
            </div>
            <div class="hydra-form-field">
              <label class="hydra-form-label" for="demo-category">Категория</label>
              <select class="hydra-form-input" id="demo-category" name="category">
                <option value="">Выберите категорию</option>
                <option value="games">Игры</option>
                <option value="tools">Инструменты</option>
                <option value="themes">Темы</option>
              </select>
            </div>
            <div class="hydra-form-field">
              <label class="hydra-form-label" for="demo-message">Сообщение</label>
              <textarea class="hydra-form-input hydra-form-input-textarea" id="demo-message" name="message" placeholder="Ваше сообщение..."></textarea>
            </div>
            <button type="submit" class="hydra-btn hydra-btn-primary hydra-btn-medium">Отправить</button>
          </form>
        </div>
      </section>

      <!-- Интерактивные примеры -->
      <section style="margin-bottom: 3rem;">
        <h2 style="color: #333; margin-bottom: 1rem;">Интерактивные примеры</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
          
          <!-- Уведомления -->
          <div class="hydra-card hydra-card-normal hydra-card-shadow">
            <h3 class="hydra-card-title">Уведомления</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <button class="hydra-btn hydra-btn-success hydra-btn-small" onclick="showDemoNotification('success')">Success</button>
              <button class="hydra-btn hydra-btn-danger hydra-btn-small" onclick="showDemoNotification('error')">Error</button>
              <button class="hydra-btn hydra-btn-warning hydra-btn-small" onclick="showDemoNotification('warning')">Warning</button>
              <button class="hydra-btn hydra-btn-primary hydra-btn-small" onclick="showDemoNotification('info')">Info</button>
            </div>
          </div>

          <!-- Модальные окна -->
          <div class="hydra-card hydra-card-normal hydra-card-shadow">
            <h3 class="hydra-card-title">Модальные окна</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <button class="hydra-btn hydra-btn-primary hydra-btn-small" onclick="showDemoModal('small')">Small</button>
              <button class="hydra-btn hydra-btn-primary hydra-btn-small" onclick="showDemoModal('medium')">Medium</button>
              <button class="hydra-btn hydra-btn-primary hydra-btn-small" onclick="showDemoModal('large')">Large</button>
            </div>
          </div>

          <!-- Прогресс-бары -->
          <div class="hydra-card hydra-card-normal hydra-card-shadow">
            <h3 class="hydra-card-title">Прогресс-бары</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div class="hydra-progress">
                <div class="hydra-progress-bar hydra-progress-bar-primary" style="width: 75%;"></div>
                <div class="hydra-progress-text">75%</div>
              </div>
              <div class="hydra-progress">
                <div class="hydra-progress-bar hydra-progress-bar-success" style="width: 100%;"></div>
                <div class="hydra-progress-text">100%</div>
              </div>
              <button class="hydra-btn hydra-btn-secondary hydra-btn-small" onclick="animateProgress()">Анимировать</button>
            </div>
          </div>

          <!-- Загрузчик -->
          <div class="hydra-card hydra-card-normal hydra-card-shadow">
            <h3 class="hydra-card-title">Загрузчики</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
              <div class="hydra-loader hydra-loader-medium">
                <div class="hydra-loader-spinner"></div>
                <div class="hydra-loader-text">Загрузка...</div>
              </div>
              <button class="hydra-btn hydra-btn-secondary hydra-btn-small" onclick="toggleLoader()">Показать/Скрыть</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Документация API -->
      <section style="margin-bottom: 3rem;">
        <h2 style="color: #333; margin-bottom: 1rem;">API Документация</h2>
        <div class="hydra-card hydra-card-normal hydra-card-shadow">
          <h3 class="hydra-card-title">Основные методы HydraUI</h3>
          <div style="font-family: monospace; font-size: 0.9em; line-height: 1.6;">
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.createButton(text, options)</strong><br>
              <span style="color: #666;">Создает стилизованную кнопку</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.createCard(content, options)</strong><br>
              <span style="color: #666;">Создает карточку с контентом</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.createModal(content, options)</strong><br>
              <span style="color: #666;">Создает модальное окно</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.showNotification(message, options)</strong><br>
              <span style="color: #666;">Показывает уведомление</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.createForm(fields, options)</strong><br>
              <span style="color: #666;">Создает форму с полями</span>
            </div>
            <div style="margin-bottom: 1rem;">
              <strong>HydraUI.createLoader(options)</strong><br>
              <span style="color: #666;">Создает индикатор загрузки</span>
            </div>
            <div>
              <strong>HydraUI.createProgressBar(value, options)</strong><br>
              <span style="color: #666;">Создает прогресс-бар</span>
            </div>
          </div>
        </div>
      </section>

      <script>
        function showDemoNotification(type) {
          const messages = {
            success: 'Операция выполнена успешно!',
            error: 'Произошла ошибка!',
            warning: 'Внимание! Проверьте данные.',
            info: 'Информационное сообщение.'
          };
          
          if (window.HydraUI) {
            window.HydraUI.showNotification(messages[type], { type });
          }
        }

        function showDemoModal(size) {
          if (window.HydraUI) {
            const content = \`
              <p>Это пример модального окна размера "\${size}".</p>
              <p>Модальные окна отлично подходят для:</p>
              <ul>
                <li>Подтверждения действий</li>
                <li>Форм ввода данных</li>
                <li>Детальной информации</li>
                <li>Настроек плагинов</li>
              </ul>
            \`;
            
            const modal = window.HydraUI.createModal(content, {
              title: \`Модальное окно (\${size})\`,
              size: size
            });
            
            modal.show();
          }
        }

        function animateProgress() {
          const progressBars = document.querySelectorAll('.hydra-progress-bar');
          progressBars.forEach((bar, index) => {
            bar.style.width = '0%';
            setTimeout(() => {
              bar.style.width = index === 0 ? '75%' : '100%';
            }, 100);
          });
        }

        function toggleLoader() {
          const loader = document.querySelector('.hydra-loader');
          loader.style.display = loader.style.display === 'none' ? 'flex' : 'none';
        }

        // Инициализация
        document.addEventListener('DOMContentLoaded', function() {
          console.log('Hydra UI Kit Demo загружен');
          console.log('HydraUI доступен:', !!window.HydraUI);
        });
      </script>
    </div>
  `;
}

function deactivate() {
  console.log("🎨 Hydra UI Kit деактивирован");
  
  // Удаляем глобальный объект
  if (typeof window !== 'undefined') {
    delete window.HydraUI;
  }
  if (typeof global !== 'undefined') {
    delete global.HydraUI;
  }
  
  // Удаляем стили
  const styles = document.getElementById('hydra-ui-kit-styles');
  if (styles) {
    styles.remove();
  }
}

// Экспорт плагина
const plugin = {
  manifest,
  activate,
  deactivate,
};

// Поддержка разных способов экспорта
if (typeof exports !== "undefined") {
  exports.default = plugin;
  exports.plugin = plugin;
} else if (typeof module !== "undefined" && module.exports) {
  module.exports = plugin;
} else {
  // Для браузерной среды
  window.plugin = plugin;
}