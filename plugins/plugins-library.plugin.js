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

// URL репозитория с плагинами (замените на ваш)
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
    id: "plugin-library-sidebar",
    label: "Библиотека плагинов",
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

  // Добавляем страницу деталей плагина
  const detailsHTML = createPluginDetailsHTML();

  context.ui.addPage({
    id: "plugin-details",
    path: "/plugin/plugin-library/details",
    title: "Детали плагина",
    content: detailsHTML,
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
    // Получаем список установленных плагинов из основной системы
    // В реальной реализации это будет через API
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
    <div style="padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto;">
      <!-- Заголовок -->
      <div style="margin-bottom: 2rem; text-align: center;">
        <h1 style="color: #333; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          📚 Библиотека плагинов
        </h1>
        <p style="color: #666; font-size: 1.1em; margin: 0;">
          Откройте для себя новые возможности Hydra Launcher
        </p>
        <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 2rem; font-size: 0.9em; color: #888;">
          <span>📦 ${stats.totalPlugins || 0} плагинов</span>
          <span>⬇️ ${(stats.totalDownloads || 0).toLocaleString()} загрузок</span>
          <span>⭐ ${(stats.averageRating || 0).toFixed(1)} средний рейтинг</span>
        </div>
      </div>

      <!-- Поиск и фильтры -->
      <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #e9ecef;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 300px;">
            <input 
              type="text" 
              id="search-input" 
              placeholder="🔍 Поиск плагинов..."
              style="width: 100%; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s;"
              oninput="filterPlugins()"
              onfocus="this.style.borderColor='#007acc'"
              onblur="this.style.borderColor='#dee2e6'"
            />
          </div>
          <div>
            <select 
              id="category-filter" 
              style="padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 8px; font-size: 1rem; background: white; cursor: pointer;"
              onchange="filterPlugins()"
            >
              <option value="">Все категории</option>
              ${categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <select 
              id="sort-filter" 
              style="padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 8px; font-size: 1rem; background: white; cursor: pointer;"
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

      <!-- Рекомендуемые плагины -->
      ${createFeaturedSection(plugins)}

      <!-- Категории -->
      ${createCategoriesSection(categories)}

      <!-- Список плагинов -->
      <div id="plugins-container">
        ${createPluginsGridHTML(plugins)}
      </div>

      <!-- Модальное окно деталей плагина -->
      <div id="plugin-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; padding: 2rem; box-sizing: border-box;">
        <div style="background: white; border-radius: 12px; max-width: 800px; margin: 0 auto; max-height: 90vh; overflow-y: auto; position: relative;">
          <div id="modal-content"></div>
        </div>
      </div>

      <script>
        // Данные плагинов для JavaScript
        window.pluginRegistry = ${JSON.stringify(pluginRegistry)};
        window.installedPlugins = ${JSON.stringify(installedPlugins)};

        function filterPlugins() {
          const searchTerm = document.getElementById('search-input').value.toLowerCase();
          const categoryFilter = document.getElementById('category-filter').value;
          const sortFilter = document.getElementById('sort-filter').value;
          
          let filteredPlugins = window.pluginRegistry.plugins.filter(plugin => {
            const matchesSearch = plugin.name.toLowerCase().includes(searchTerm) || 
                                plugin.description.toLowerCase().includes(searchTerm) ||
                                plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm));
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

        function createPluginsGrid(plugins) {
          if (plugins.length === 0) {
            return \`
              <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3>Плагины не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
              </div>
            \`;
          }

          return \`
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
              \${plugins.map(plugin => createPluginCard(plugin)).join('')}
            </div>
          \`;
        }

        function createPluginCard(plugin) {
          const isInstalled = window.installedPlugins.some(p => p.id === plugin.id);
          const hasUpdate = isInstalled && window.installedPlugins.find(p => p.id === plugin.id)?.version !== plugin.version;
          
          return \`
            <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; transition: all 0.2s; cursor: pointer; position: relative;" 
                 onclick="showPluginDetails('\${plugin.id}')"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              
              \${plugin.featured ? '<div style="position: absolute; top: -8px; right: 12px; background: #ffd700; color: #333; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8em; font-weight: bold;">⭐ Рекомендуемый</div>' : ''}
              \${plugin.verified ? '<div style="position: absolute; top: 12px; right: 12px; color: #28a745; font-size: 1.2em;" title="Проверенный плагин">✅</div>' : ''}
              
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 2.5rem;">\${plugin.icon || '🔌'}</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 0.25rem 0; color: #333; font-size: 1.2em;">\${plugin.name}</h3>
                  <div style="font-size: 0.9em; color: #666;">v\${plugin.version} • \${plugin.author}</div>
                </div>
              </div>
              
              <p style="color: #555; margin: 0 0 1rem 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                \${plugin.description}
              </p>
              
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                \${plugin.tags.slice(0, 3).map(tag => \`<span style="background: #e9ecef; color: #495057; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em;">\${tag}</span>\`).join('')}
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; color: #666; margin-bottom: 1rem;">
                <span>⬇️ \${(plugin.downloads || 0).toLocaleString()}</span>
                <span>⭐ \${(plugin.rating || 0).toFixed(1)}</span>
                <span>📦 \${plugin.size || 'N/A'}</span>
              </div>
              
              <div style="display: flex; gap: 0.5rem;">
                \${isInstalled 
                  ? (hasUpdate 
                    ? \`<button onclick="event.stopPropagation(); updatePlugin('\${plugin.id}')" style="flex: 1; padding: 0.5rem; background: #ffc107; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🔄 Обновить</button>\`
                    : \`<button style="flex: 1; padding: 0.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: not-allowed;" disabled>✅ Установлен</button>\`)
                  : \`<button onclick="event.stopPropagation(); installPlugin('\${plugin.id}')" style="flex: 1; padding: 0.5rem; background: #007acc; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">📥 Установить</button>\`
                }
                <button onclick="event.stopPropagation(); showPluginDetails('\${plugin.id}')" style="padding: 0.5rem 1rem; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">ℹ️</button>
              </div>
            </div>
          \`;
        }

        function showPluginDetails(pluginId) {
          const plugin = window.pluginRegistry.plugins.find(p => p.id === pluginId);
          if (!plugin) return;

          const isInstalled = window.installedPlugins.some(p => p.id === plugin.id);
          const hasUpdate = isInstalled && window.installedPlugins.find(p => p.id === plugin.id)?.version !== plugin.version;

          document.getElementById('modal-content').innerHTML = \`
            <div style="padding: 2rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="font-size: 3rem;">\${plugin.icon || '🔌'}</div>
                  <div>
                    <h2 style="margin: 0 0 0.5rem 0; color: #333;">\${plugin.name}</h2>
                    <div style="color: #666;">v\${plugin.version} • \${plugin.author}</div>
                  </div>
                </div>
                <button onclick="closeModal()" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 1.2em;">×</button>
              </div>

              <div style="margin-bottom: 2rem;">
                <p style="color: #555; line-height: 1.6; font-size: 1.1em;">\${plugin.longDescription || plugin.description}</p>
              </div>

              \${plugin.screenshots && plugin.screenshots.length > 0 ? \`
                <div style="margin-bottom: 2rem;">
                  <h3 style="color: #333; margin-bottom: 1rem;">📸 Скриншоты</h3>
                  <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem;">
                    \${plugin.screenshots.map(screenshot => \`
                      <img src="\${screenshot}" alt="Скриншот" style="height: 200px; border-radius: 8px; border: 1px solid #dee2e6;" />
                    \`).join('')}
                  </div>
                </div>
              \` : ''}

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #333;">📊 Статистика</h4>
                  <div style="font-size: 0.9em; color: #666;">
                    <div>⬇️ \${(plugin.downloads || 0).toLocaleString()} загрузок</div>
                    <div>⭐ \${(plugin.rating || 0).toFixed(1)} рейтинг</div>
                    <div>📦 \${plugin.size || 'N/A'} размер</div>
                  </div>
                </div>

                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #333;">🏷️ Теги</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    \${plugin.tags.map(tag => \`<span style="background: #e9ecef; color: #495057; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em;">\${tag}</span>\`).join('')}
                  </div>
                </div>
              </div>

              \${plugin.dependencies && plugin.dependencies.length > 0 ? \`
                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #ffeaa7;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #856404;">🔗 Зависимости</h4>
                  <div style="font-size: 0.9em; color: #856404;">
                    Этот плагин требует установки следующих плагинов:
                    <ul style="margin: 0.5rem 0 0 1rem;">
                      \${plugin.dependencies.map(dep => \`<li>\${dep.id} (версия \${dep.version})</li>\`).join('')}
                    </ul>
                  </div>
                </div>
              \` : ''}

              <div style="display: flex; gap: 1rem; justify-content: center;">
                \${isInstalled 
                  ? (hasUpdate 
                    ? \`<button onclick="updatePlugin('\${plugin.id}')" style="padding: 0.75rem 2rem; background: #ffc107; color: #333; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">🔄 Обновить до v\${plugin.version}</button>\`
                    : \`<button style="padding: 0.75rem 2rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: not-allowed; font-size: 1rem;" disabled>✅ Установлен</button>\`)
                  : \`<button onclick="installPlugin('\${plugin.id}')" style="padding: 0.75rem 2rem; background: #007acc; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">📥 Установить плагин</button>\`
                }
                \${plugin.repositoryUrl ? \`<button onclick="window.open('\${plugin.repositoryUrl}', '_blank')" style="padding: 0.75rem 2rem; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">🌐 Репозиторий</button>\` : ''}
              </div>
            </div>
          \`;

          document.getElementById('plugin-modal').style.display = 'block';
        }

        function closeModal() {
          document.getElementById('plugin-modal').style.display = 'none';
        }

        async function installPlugin(pluginId) {
          const plugin = window.pluginRegistry.plugins.find(p => p.id === pluginId);
          if (!plugin) return;

          try {
            showNotification('Установка плагина...', 'info');
            
            // Проверяем зависимости
            if (plugin.dependencies && plugin.dependencies.length > 0) {
              for (const dep of plugin.dependencies) {
                const isDepInstalled = window.installedPlugins.some(p => p.id === dep.id);
                if (!isDepInstalled) {
                  const installDep = confirm(\`Плагин "\${plugin.name}" требует "\${dep.id}". Установить зависимость?\`);
                  if (installDep) {
                    await installPlugin(dep.id);
                  } else {
                    showNotification('Установка отменена: не все зависимости установлены', 'warning');
                    return;
                  }
                }
              }
            }

            // Эмулируем установку (в реальности это будет через API)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Добавляем в список установленных
            window.installedPlugins.push({
              id: plugin.id,
              version: plugin.version,
              installedAt: new Date().toISOString()
            });

            // Сохраняем в storage
            localStorage.setItem('plugin-library-installed', JSON.stringify(window.installedPlugins));

            showNotification(\`Плагин "\${plugin.name}" успешно установлен!\`, 'success');
            
            // Обновляем интерфейс
            filterPlugins();
            closeModal();
            
          } catch (error) {
            console.error('Ошибка установки плагина:', error);
            showNotification('Ошибка при установке плагина', 'error');
          }
        }

        async function updatePlugin(pluginId) {
          await installPlugin(pluginId);
        }

        function showNotification(message, type) {
          console.log(\`[\${type.toUpperCase()}] \${message}\`);
          
          const notification = document.createElement('div');
          notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            background: \${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007acc'};
          \`;
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
        style.textContent = \`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        \`;
        document.head.appendChild(style);
      </script>
    </div>
  `;
}

function createLoadingHTML() {
  return `
    <div style="padding: 4rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
      <h2 style="color: #333; margin-bottom: 1rem;">Загрузка библиотеки плагинов...</h2>
      <p style="color: #666;">Подключаемся к репозиторию плагинов</p>
      
      <div style="margin-top: 2rem;">
        <div style="width: 200px; height: 4px; background: #e9ecef; border-radius: 2px; margin: 0 auto; overflow: hidden;">
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

function createFeaturedSection(plugins) {
  const featuredPlugins = plugins.filter(p => p.featured).slice(0, 3);
  
  if (featuredPlugins.length === 0) {
    return '';
  }

  return `
    <div style="margin-bottom: 3rem;">
      <h2 style="color: #333; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
        ⭐ Рекомендуемые плагины
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
        ${featuredPlugins.map(plugin => `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 2rem; cursor: pointer; transition: transform 0.2s;" 
               onclick="showPluginDetails('${plugin.id}')"
               onmouseover="this.style.transform='scale(1.02)'"
               onmouseout="this.style.transform='scale(1)'">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="font-size: 3rem;">${plugin.icon || '🔌'}</div>
              <div>
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.3em;">${plugin.name}</h3>
                <div style="opacity: 0.9;">v${plugin.version} • ${plugin.author}</div>
              </div>
            </div>
            <p style="margin: 0 0 1rem 0; opacity: 0.9; line-height: 1.4;">
              ${plugin.description}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; opacity: 0.8;">
              <span>⬇️ ${(plugin.downloads || 0).toLocaleString()}</span>
              <span>⭐ ${(plugin.rating || 0).toFixed(1)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createCategoriesSection(categories) {
  if (categories.length === 0) {
    return '';
  }

  return `
    <div style="margin-bottom: 3rem;">
      <h2 style="color: #333; margin-bottom: 1.5rem;">📂 Категории</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${categories.map(category => `
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s;"
               onclick="document.getElementById('category-filter').value='${category.id}'; filterPlugins();"
               onmouseover="this.style.background='#e9ecef'"
               onmouseout="this.style.background='#f8f9fa'">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${category.icon}</div>
            <h4 style="margin: 0 0 0.25rem 0; color: #333;">${category.name}</h4>
            <p style="margin: 0; font-size: 0.9em; color: #666;">${category.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createPluginsGridHTML(plugins) {
  if (plugins.length === 0) {
    return `
      <div style="text-align: center; padding: 3rem; color: #666;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>Плагины не найдены</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
      ${plugins.map(plugin => createPluginCardHTML(plugin)).join('')}
    </div>
  `;
}

function createPluginCardHTML(plugin) {
  return `
    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; transition: all 0.2s; cursor: pointer; position: relative;" 
         onclick="showPluginDetails('${plugin.id}')"
         onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
      
      ${plugin.featured ? '<div style="position: absolute; top: -8px; right: 12px; background: #ffd700; color: #333; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8em; font-weight: bold;">⭐ Рекомендуемый</div>' : ''}
      ${plugin.verified ? '<div style="position: absolute; top: 12px; right: 12px; color: #28a745; font-size: 1.2em;" title="Проверенный плагин">✅</div>' : ''}
      
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div style="font-size: 2.5rem;">${plugin.icon || '🔌'}</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 0.25rem 0; color: #333; font-size: 1.2em;">${plugin.name}</h3>
          <div style="font-size: 0.9em; color: #666;">v${plugin.version} • ${plugin.author}</div>
        </div>
      </div>
      
      <p style="color: #555; margin: 0 0 1rem 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${plugin.description}
      </p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
        ${plugin.tags.slice(0, 3).map(tag => `<span style="background: #e9ecef; color: #495057; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em;">${tag}</span>`).join('')}
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; color: #666; margin-bottom: 1rem;">
        <span>⬇️ ${(plugin.downloads || 0).toLocaleString()}</span>
        <span>⭐ ${(plugin.rating || 0).toFixed(1)}</span>
        <span>📦 ${plugin.size || 'N/A'}</span>
      </div>
      
      <div style="display: flex; gap: 0.5rem;">
        <button onclick="event.stopPropagation(); installPlugin('${plugin.id}')" style="flex: 1; padding: 0.5rem; background: #007acc; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">📥 Установить</button>
        <button onclick="event.stopPropagation(); showPluginDetails('${plugin.id}')" style="padding: 0.5rem 1rem; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">ℹ️</button>
      </div>
    </div>
  `;
}

function createPluginDetailsHTML() {
  return `
    <div style="padding: 2rem; text-align: center;">
      <h2>Детали плагина</h2>
      <p>Эта страница будет показывать детальную информацию о выбранном плагине.</p>
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