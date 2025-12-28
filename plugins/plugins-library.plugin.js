/**
 * Библиотека плагинов для Hydra Launcher
 * Магазин плагинов с поддержкой категорий, поиска и зависимостей
 */

const manifest = {
  id: "plugin-library",
  name: "Библиотека плагинов",
  version: "1.0.0",
  description: "Магазин плагинов с поиском, категориями и управлением зависимостями",
  author: "Hydra Team",
  main: "plugin-library.js",
  permissions: ["network", "storage"],
};

// URL репозитория с плагинами
const PLUGIN_REGISTRY_URL = "https://raw.githubusercontent.com/Rxflex/HydraRepo/refs/heads/main/registry.json";

let pluginRegistry = null;
let installedPlugins = [];

async function activate(context) {
  console.log("📚 Библиотека плагинов активирована!");

  // Показываем приветственное уведомление
  context.app.showNotification(
    "Библиотека плагинов загружена! Откройте магазин через сайдбар.",
    "success"
  );

  // Добавляем пункт в сайдбар
  context.ui.addSidebarItem({
    id: "plugin-library-store-sidebar",
    label: "Магазин плагинов",
    icon: "📚",
    path: "/plugin/plugin-library/store",
  });

  // Загружаем данные о плагинах
  await loadPluginRegistry(context);
  await loadInstalledPlugins(context);

  // Создаем главную страницу магазина
  const storeHTML = await createStoreHTML(context);

  context.ui.addPage({
    id: "store",
    path: "/plugin/plugin-library/store",
    title: "Библиотека плагинов",
    content: storeHTML,
  });

  // Добавляем пункт меню
  context.ui.addMenuItem({
    id: "plugin-library-menu",
    label: "📚 Библиотека плагинов",
    onClick: () => {
      context.app.showNotification("Откройте библиотеку через сайдбар!", "info");
    },
  });

  console.log("✅ Библиотека плагинов полностью инициализирована");
}

async function loadPluginRegistry(context) {
  try {
    console.log("Загружаем реестр плагинов...");
    
    // Пытаемся загрузить из кэша
    const cachedRegistry = await context.storage.get("plugin-registry");
    const cacheTime = await context.storage.get("registry-cache-time");
    const now = Date.now();
    
    // Если кэш свежий (меньше часа), используем его
    if (cachedRegistry && cacheTime && (now - cacheTime) < 3600000) {
      pluginRegistry = cachedRegistry;
      console.log("Использован кэшированный реестр плагинов");
      return;
    }

    // Загружаем с сервера
    const response = await context.utils.fetch(PLUGIN_REGISTRY_URL);
    if (response.ok) {
      pluginRegistry = await response.json();
      
      // Сохраняем в кэш
      await context.storage.set("plugin-registry", pluginRegistry);
      await context.storage.set("registry-cache-time", now);
      
      console.log(`Загружен реестр с ${pluginRegistry.plugins.length} плагинами`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("Ошибка загрузки реестра плагинов:", error);
    
    // Используем кэш если есть
    const cachedRegistry = await context.storage.get("plugin-registry");
    if (cachedRegistry) {
      pluginRegistry = cachedRegistry;
      console.log("Использован устаревший кэш из-за ошибки сети");
    } else {
      // Создаем пустой реестр
      pluginRegistry = {
        version: "1.0.0",
        categories: [],
        plugins: [],
        stats: { totalPlugins: 0, totalDownloads: 0, averageRating: 0 }
      };
    }
  }
}

async function loadInstalledPlugins(context) {
  try {
    installedPlugins = await context.storage.get("installed-plugins") || [];
  } catch (error) {
    console.error("Ошибка загрузки установленных плагинов:", error);
    installedPlugins = [];
  }
}

async function createStoreHTML(context) {
  if (!pluginRegistry) {
    return createLoadingHTML();
  }

  const categories = pluginRegistry.categories || [];
  const plugins = pluginRegistry.plugins || [];
  const stats = pluginRegistry.stats || {};

  return `
    <div style="padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; background: #1a1a1a; color: #ffffff; min-height: 100vh;">
      <!-- Заголовок -->
      <div style="margin-bottom: 2rem; text-align: center;">
        <h1 style="color: #ffffff; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 2.5rem;">
          📚 Библиотека плагинов
        </h1>
        <p style="color: #b0b0b0; font-size: 1.2em; margin: 0;">
          Откройте для себя новые возможности Hydra Launcher
        </p>
        <div style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 3rem; font-size: 1rem; color: #888;">
          <div style="background: #2a2a2a; padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid #333;">
            <span style="color: #4CAF50;">📦</span> ${stats.totalPlugins || 0} плагинов
          </div>
          <div style="background: #2a2a2a; padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid #333;">
            <span style="color: #2196F3;">⬇️</span> ${(stats.totalDownloads || 0).toLocaleString()} загрузок
          </div>
          <div style="background: #2a2a2a; padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid #333;">
            <span style="color: #FF9800;">⭐</span> ${(stats.averageRating || 0).toFixed(1)} рейтинг
          </div>
        </div>
      </div>

      <!-- Поиск и фильтры -->
      <div style="background: #2a2a2a; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #333;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 300px;">
            <input 
              type="text" 
              id="search-input" 
              placeholder="🔍 Поиск плагинов..."
              style="width: 100%; padding: 1rem; border: 2px solid #444; border-radius: 8px; font-size: 1rem; background: #1a1a1a; color: #fff; transition: border-color 0.2s;"
              oninput="filterPlugins()"
              onfocus="this.style.borderColor='#007acc'"
              onblur="this.style.borderColor='#444'"
            />
          </div>
          <div>
            <select 
              id="category-filter" 
              style="padding: 1rem; border: 2px solid #444; border-radius: 8px; font-size: 1rem; background: #1a1a1a; color: #fff; cursor: pointer;"
              onchange="filterPlugins()"
            >
              <option value="">Все категории</option>
              ${categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <select 
              id="sort-filter" 
              style="padding: 1rem; border: 2px solid #444; border-radius: 8px; font-size: 1rem; background: #1a1a1a; color: #fff; cursor: pointer;"
              onchange="filterPlugins()"
            >
              <option value="featured">Рекомендуемые</option>
              <option value="downloads">По загрузкам</option>
              <option value="rating">По рейтингу</option>
              <option value="name">По названию</option>
              <option value="updated">По дате обновления</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Список плагинов -->
      <div id="plugins-container">
        ${createPluginsGridHTML(plugins)}
      </div>

      <!-- Модальное окно деталей плагина -->
      <div id="plugin-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; padding: 2rem; box-sizing: border-box;">
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; max-width: 800px; margin: 0 auto; max-height: 90vh; overflow-y: auto; position: relative;">
          <div id="modal-content"></div>
        </div>
      </div>

      <script>
        // Данные плагинов для JavaScript
        window.pluginRegistry = ${JSON.stringify(pluginRegistry)};
        window.installedPlugins = ${JSON.stringify(installedPlugins)};

        // Делаем функции глобальными для доступа из HTML
        window.installPlugin = installPlugin;
        window.showPluginDetails = showPluginDetails;
        window.closeModal = closeModal;
        window.filterPlugins = filterPlugins;

        async function installPlugin(pluginId) {
          const plugin = window.pluginRegistry.plugins.find(p => p.id === pluginId);
          if (!plugin) return;

          try {
            showNotification('Установка плагина...', 'info');
            
            // Эмулируем установку
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Добавляем в список установленных
            window.installedPlugins.push({
              id: plugin.id,
              version: plugin.version,
              installedAt: new Date().toISOString()
            });

            // Сохраняем в storage
            localStorage.setItem('plugin-library-installed', JSON.stringify(window.installedPlugins));

            showNotification('Плагин "' + plugin.name + '" успешно установлен!', 'success');
            
            // Обновляем интерфейс
            filterPlugins();
            closeModal();
            
          } catch (error) {
            console.error('Ошибка установки плагина:', error);
            showNotification('Ошибка при установке плагина', 'error');
          }
        };

        function showPluginDetails(pluginId) {
          const plugin = window.pluginRegistry.plugins.find(p => p.id === pluginId);
          if (!plugin) return;

          const isInstalled = window.installedPlugins.some(p => p.id === plugin.id);

          document.getElementById('modal-content').innerHTML = '<div style="padding: 2rem; color: #fff;"><div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;"><div style="display: flex; align-items: center; gap: 1.5rem;"><div style="font-size: 4rem; background: #2a2a2a; padding: 1.5rem; border-radius: 12px; border: 1px solid #333;">' + (plugin.icon || '🔌') + '</div><div><h2 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 2rem;">' + plugin.name + '</h2><div style="color: #888; font-size: 1.1rem;">v' + plugin.version + ' • ' + plugin.author + '</div></div></div><button onclick="closeModal()" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.5em; transition: all 0.2s;">×</button></div><div style="margin-bottom: 2rem;"><p style="color: #b0b0b0; line-height: 1.6; font-size: 1.1em;">' + (plugin.longDescription || plugin.description) + '</p></div><div style="display: flex; gap: 1rem; justify-content: center;"><button onclick="installPlugin(\'' + plugin.id + '\')" style="padding: 1rem 2rem; background: linear-gradient(45deg, #007acc, #0056b3); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1.1rem;">📥 Установить плагин</button></div></div>';

          document.getElementById('plugin-modal').style.display = 'block';
        }

        function closeModal() {
          document.getElementById('plugin-modal').style.display = 'none';
        }

        function filterPlugins() {
          const searchTerm = document.getElementById('search-input').value.toLowerCase();
          const categoryFilter = document.getElementById('category-filter').value;
          const sortFilter = document.getElementById('sort-filter').value;
          
          let filteredPlugins = window.pluginRegistry.plugins.filter(plugin => {
            const matchesSearch = plugin.name.toLowerCase().includes(searchTerm) || 
                                plugin.description.toLowerCase().includes(searchTerm) ||
                                (plugin.tags && plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            const matchesCategory = !categoryFilter || plugin.category === categoryFilter;
            return matchesSearch && matchesCategory;
          });

          // Сортировка
          filteredPlugins.sort((a, b) => {
            switch(sortFilter) {
              case 'downloads':
                return (b.downloads || 0) - (a.downloads || 0);
              case 'rating':
                return (b.rating || 0) - (a.rating || 0);
              case 'name':
                return a.name.localeCompare(b.name);
              case 'updated':
                return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
              case 'featured':
              default:
                return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.downloads || 0) - (a.downloads || 0);
            }
          });

          document.getElementById('plugins-container').innerHTML = createPluginsGrid(filteredPlugins);
        }

        // Делаем функции глобальными
        window.createPluginsGrid = createPluginsGrid;
        window.createPluginCard = createPluginCard;
        window.showNotification = showNotification;

        function createPluginsGrid(plugins) {
          if (plugins.length === 0) {
            return '<div style="text-align: center; padding: 4rem; color: #888;"><div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div><h3 style="color: #fff; margin-bottom: 1rem;">Плагины не найдены</h3><p style="color: #888;">Попробуйте изменить параметры поиска</p></div>';
          }

          return '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 2rem; margin-top: 2rem;">' + plugins.map(plugin => createPluginCard(plugin)).join('') + '</div>';
        }

        function createPluginCard(plugin) {
          const isInstalled = window.installedPlugins.some(p => p.id === plugin.id);
          
          return '<div style="background: #2a2a2a; border-radius: 12px; padding: 2rem; border: 1px solid #333; transition: all 0.3s; cursor: pointer; position: relative;" onclick="showPluginDetails(\'' + plugin.id + '\')" onmouseover="this.style.transform=\'translateY(-4px)\'; this.style.boxShadow=\'0 8px 25px rgba(0,0,0,0.3)\'; this.style.borderColor=\'#007acc\'" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'none\'; this.style.borderColor=\'#333\'"><div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;"><div style="font-size: 3rem; background: #1a1a1a; padding: 1rem; border-radius: 12px; border: 1px solid #333;">' + (plugin.icon || '🔌') + '</div><div style="flex: 1;"><h3 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.3em; font-weight: 600;">' + plugin.name + '</h3><div style="font-size: 1rem; color: #888;">v' + plugin.version + ' • ' + plugin.author + '</div></div></div><p style="color: #b0b0b0; margin: 0 0 1.5rem 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 1rem;">' + plugin.description + '</p><div style="display: flex; gap: 0.75rem;"><button onclick="event.stopPropagation(); installPlugin(\'' + plugin.id + '\')" style="flex: 1; padding: 0.75rem; background: linear-gradient(45deg, #007acc, #0056b3); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.2s;">' + (isInstalled ? '✅ Установлен' : '📥 Установить') + '</button><button onclick="event.stopPropagation(); showPluginDetails(\'' + plugin.id + '\')" style="padding: 0.75rem 1.5rem; background: #333; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s;">ℹ️</button></div></div>';
        }

        function showNotification(message, type) {
          console.log('[' + type.toUpperCase() + '] ' + message);
          
          const notification = document.createElement('div');
          notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 8px; color: white; font-weight: 600; z-index: 10001; animation: slideIn 0.3s ease-out; max-width: 350px; border: 1px solid; background: ' + (type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#FF9800' : '#2196F3') + '; border-color: ' + (type === 'success' ? '#388E3C' : type === 'error' ? '#d32f2f' : type === 'warning' ? '#F57C00' : '#1976D2') + ';';
          notification.textContent = message;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.remove();
          }, 4000);
        }

        // Загружаем сохраненные данные
        document.addEventListener('DOMContentLoaded', function() {
          const saved = localStorage.getItem('plugin-library-installed');
          if (saved) {
            window.installedPlugins = JSON.parse(saved);
          }
        });

        // Закрытие модального окна по клику вне его
        document.getElementById('plugin-modal').addEventListener('click', function(e) {
          if (e.target === this) {
            closeModal();
          }
        });

        // CSS анимации
        const style = document.createElement('style');
        style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); } input:focus, select:focus { outline: none; box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3); } ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1a1a1a; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #444; }';
        document.head.appendChild(style);
      </script>
    </div>
  `;
}

function createLoadingHTML() {
  return `
    <div style="padding: 4rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a1a; color: #fff; min-height: 100vh;">
      <div style="font-size: 4rem; margin-bottom: 2rem;">⏳</div>
      <h2 style="color: #fff; margin-bottom: 1rem; font-size: 2rem;">Загрузка библиотеки плагинов...</h2>
      <p style="color: #888; font-size: 1.1rem;">Подключаемся к репозиторию плагинов</p>
      
      <div style="margin-top: 3rem;">
        <div style="width: 300px; height: 6px; background: #333; border-radius: 3px; margin: 0 auto; overflow: hidden;">
          <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #007acc, #0056b3); animation: loading 2s infinite;"></div>
        </div>
      </div>

      <style>
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      </style>
    </div>
  `;
}

function createPluginsGridHTML(plugins) {
  if (plugins.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem; color: #888;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="color: #fff; margin-bottom: 1rem;">Плагины не найдены</h3>
        <p style="color: #888;">Попробуйте изменить параметры поиска</p>
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 2rem; margin-top: 2rem;">
      ${plugins.map(plugin => createPluginCardHTML(plugin)).join('')}
    </div>
  `;
}

function createPluginCardHTML(plugin) {
  return `
    <div style="background: #2a2a2a; border-radius: 12px; padding: 2rem; border: 1px solid #333; transition: all 0.3s; cursor: pointer; position: relative;" 
         onclick="showPluginDetails('${plugin.id}')"
         onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.3)'; this.style.borderColor='#007acc'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='#333'">
      
      <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; background: #1a1a1a; padding: 1rem; border-radius: 12px; border: 1px solid #333;">${plugin.icon || '🔌'}</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.3em; font-weight: 600;">${plugin.name}</h3>
          <div style="font-size: 1rem; color: #888;">v${plugin.version} • ${plugin.author}</div>
        </div>
      </div>
      
      <p style="color: #b0b0b0; margin: 0 0 1.5rem 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 1rem;">
        ${plugin.description}
      </p>
      
      <div style="display: flex; gap: 0.75rem;">
        <button onclick="event.stopPropagation(); installPlugin('${plugin.id}')" style="flex: 1; padding: 0.75rem; background: linear-gradient(45deg, #007acc, #0056b3); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.2s;">📥 Установить</button>
        <button onclick="event.stopPropagation(); showPluginDetails('${plugin.id}')" style="padding: 0.75rem 1.5rem; background: #333; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s;">ℹ️</button>
      </div>
    </div>
  `;
}

function deactivate() {
  console.log("📚 Библиотека плагинов деактивирована");
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