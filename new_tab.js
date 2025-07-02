// 全局变量
let sites = [];
let currentSearchEngine = {
    name: 'baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
};

// API配置
const API_HOST = 'https://goole-new-tab-extension.zengdewan-moxia.workers.dev';
let API_TOKEN = localStorage.getItem('API_TOKEN') || '';

// 拖拽相关全局变量
let draggedItem = null;

// 默认网站数据（当没有保存的数据时使用）
const defaultSites = [
    { id: 1, name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'https://www.bilibili.com/favicon.ico' },
    { id: 2, name: '知乎', url: 'https://www.zhihu.com', icon: 'https://www.zhihu.com/favicon.ico' },
    { id: 3, name: '百度', url: 'https://www.baidu.com', icon: 'https://www.baidu.com/favicon.ico' },
    { id: 4, name: 'Google', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico' },
    { id: 5, name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
    { id: 6, name: '淘宝', url: 'https://www.taobao.com', icon: 'https://www.taobao.com/favicon.ico' }
];

// 搜索引擎数据
const searchEngineData = {
    baidu: {
        name: 'baidu',
        url: 'https://www.baidu.com/s?wd=',
        icon: 'https://www.baidu.com/favicon.ico'
    },
    google: {
        name: 'google',
        url: 'https://www.google.com/search?q=',
        icon: 'https://www.google.com/favicon.ico'
    },
    bing: {
        name: 'bing',
        url: 'https://www.bing.com/search?q=',
        icon: 'https://www.bing.com/favicon.ico'
    },
    sogou: {
        name: 'sogou',
        url: 'https://www.sogou.com/web?query=',
        icon: 'https://www.sogou.com/favicon.ico'
    }
};

// DOM 元素
const sitesGrid = document.getElementById('sites-grid');
const searchInput = document.getElementById('search-input');
const currentEngineIcon = document.getElementById('current-engine-icon');
const searchEngines = document.querySelectorAll('.search-engine');
const addSiteButton = document.getElementById('add-site-button');
const siteModal = document.getElementById('site-modal');
const modalTitle = document.getElementById('modal-title');
const siteForm = document.getElementById('site-form');
const siteIdInput = document.getElementById('site-id');
const siteNameInput = document.getElementById('site-name');
const siteUrlInput = document.getElementById('site-url');
const siteIconInput = document.getElementById('site-icon');
const closeModalButton = document.querySelector('.close-modal');
const cancelButton = document.querySelector('.btn-cancel');

// 设置页面元素
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const backgroundUrlInput = document.getElementById('background-url');
const blurAmountInput = document.getElementById('blur-amount');
const blurValueSpan = document.getElementById('blur-value');
const defaultSearchEngineSelect = document.getElementById('default-search-engine');
const apiTokenInput = document.getElementById('api-token');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initSearchEngine();
    loadSites();
    initEventListeners();
    loadBackgroundSettings();
});

// 初始化搜索引擎
function initSearchEngine() {
    // 从API加载上次使用的搜索引擎
    fetch(`${API_HOST}/kv/currentSearchEngine`, {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('搜索引擎数据加载失败');
        })
        .then(data => {
            if (data) {
                currentSearchEngine = data;
                currentEngineIcon.src = currentSearchEngine.icon;
            }
        })
        .catch(error => {
            console.error('加载搜索引擎设置失败:', error);
        });

    // 搜索引擎选择器点击事件
    const searchEngineSelector = document.querySelector('.search-engine-selector');
    const searchEngineDropdown = document.querySelector('.search-engine-dropdown');

    // 点击选择器显示/隐藏下拉菜单
    searchEngineSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        searchEngineDropdown.classList.toggle('show');
    });

    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', () => {
        searchEngineDropdown.classList.remove('show');
    });

    // 防止点击下拉菜单内部时关闭菜单
    searchEngineDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 搜索引擎切换事件
    searchEngines.forEach(engine => {
        engine.addEventListener('click', () => {
            const engineName = engine.getAttribute('data-engine');
            const engineUrl = engine.getAttribute('data-url');
            const engineIcon = engine.querySelector('img').src;

            currentSearchEngine = {
                name: engineName,
                url: engineUrl,
                icon: engineIcon
            };

            currentEngineIcon.src = engineIcon;
            // 保存搜索引擎设置到API
            fetch(`${API_HOST}/kv/currentSearchEngine`, {
                method: 'PUT',
                body: JSON.stringify(currentSearchEngine),
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`
                }
            }).catch(error => {
                console.error('保存搜索引擎设置失败:', error);
            });

            // 选择后关闭下拉菜单
            searchEngineDropdown.classList.remove('show');
        });
    });

    // 搜索功能
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            const searchTerm = encodeURIComponent(searchInput.value.trim());
            window.location.href = `${currentSearchEngine.url}${searchTerm}`;
        }
    });
}

// 从API加载网站数据
function loadSites() {
    fetch(`${API_HOST}/kv/sites`, {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('站点数据加载失败');
        })
        .then(data => {
            sites = data || defaultSites;
            renderSites();
        })
        .catch(error => {
            console.error('加载站点失败:', error);
            // 加载失败时使用默认站点
            sites = defaultSites;
            renderSites();
        });
}

// 渲染网站图标
function renderSites() {
    sitesGrid.innerHTML = '';

    sites.forEach(site => {
        const siteElement = document.createElement('a');
        siteElement.href = site.url;
        siteElement.className = 'site-item';
        siteElement.title = site.name;
        siteElement.setAttribute('data-id', site.id);
        siteElement.setAttribute('draggable', 'true');

        // 图标
        const img = document.createElement('img');
        img.src = site.icon || `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`;
        img.alt = site.name;
        img.onerror = function () {
            // 图标加载失败时使用默认图标
            this.src = 'icons/icon48.png';
        };

        // 名称 - 截断长名称，保证显示效果
        const nameSpan = document.createElement('span');
        nameSpan.textContent = site.name;

        // 徽章（可选）
        if (site.badge) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = site.badge;
            siteElement.appendChild(badge);
        }

        // 删除按钮
        const deleteButton = document.createElement('div');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteSite(site.id);
        });

        // 编辑功能（右键点击）
        siteElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openEditModal(site);
        });

        // 拖拽相关事件
        siteElement.addEventListener('dragstart', handleDragStart);
        siteElement.addEventListener('dragend', handleDragEnd);
        siteElement.addEventListener('dragover', handleDragOver);
        siteElement.addEventListener('dragenter', handleDragEnter);
        siteElement.addEventListener('dragleave', handleDragLeave);
        siteElement.addEventListener('drop', handleDrop);

        // 防止点击时触发拖拽
        siteElement.addEventListener('mousedown', (e) => {
            if (e.target === deleteButton) {
                siteElement.setAttribute('draggable', 'false');
            }
        });

        siteElement.addEventListener('mouseup', () => {
            siteElement.setAttribute('draggable', 'true');
        });

        siteElement.appendChild(img);
        siteElement.appendChild(nameSpan);
        siteElement.appendChild(deleteButton);
        sitesGrid.appendChild(siteElement);
    });
}

// 初始化事件监听器
function initEventListeners() {
    // 打开添加网站模态框
    addSiteButton.addEventListener('click', () => {
        openAddModal();
    });

    // 打开设置模态框
    settingsButton.addEventListener('click', () => {
        openSettingsModal();
    });

    // 关闭模态框
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });

    document.querySelectorAll('.btn-cancel').forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // 模糊度滑块变化实时显示
    blurAmountInput.addEventListener('input', () => {
        blurValueSpan.textContent = `${blurAmountInput.value}px`;
    });

    // 网站表单提交
    siteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const siteId = siteIdInput.value;
        const siteName = siteNameInput.value;
        const siteUrl = formatUrl(siteUrlInput.value);
        const siteIcon = siteIconInput.value;

        if (siteId) {
            // 编辑现有网站
            updateSite(parseInt(siteId), siteName, siteUrl, siteIcon);
        } else {
            // 添加新网站
            addSite(siteName, siteUrl, siteIcon);
        }

        closeAllModals();
    });

    // 设置表单提交
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });

    // 全局键盘事件处理 - 按 / 键激活搜索框
    document.addEventListener('keydown', (e) => {
        // 如果按下 / 键，且没有模态框打开，且不是在输入框中输入
        if (e.key === '/' &&
            siteModal.style.display !== 'flex' &&
            settingsModal.style.display !== 'flex' &&
            !e.target.matches('input, textarea, select')) {

            // 阻止默认行为（避免"/"字符被输入到搜索框）
            e.preventDefault();

            // 激活搜索框并清空内容
            searchInput.focus();
            searchInput.value = '';
        }
    });
}

// 打开添加网站模态框
function openAddModal() {
    modalTitle.textContent = '添加网站';
    siteIdInput.value = '';
    siteNameInput.value = '';
    siteUrlInput.value = '';
    siteIconInput.value = '';

    // 清除浏览器自动填充历史
    setTimeout(() => {
        siteNameInput.value = '';
        siteUrlInput.value = '';
        siteIconInput.value = '';
    }, 10);

    siteModal.style.display = 'flex';
}

// 打开编辑网站模态框
function openEditModal(site) {
    modalTitle.textContent = '编辑网站';
    siteIdInput.value = site.id;
    siteNameInput.value = site.name;
    siteUrlInput.value = site.url;
    siteIconInput.value = site.icon || '';
    siteModal.style.display = 'flex';
}

// 打开设置模态框
function openSettingsModal() {
    // 加载当前设置
    fetch(`${API_HOST}/kv/options`, {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('设置数据加载失败');
        })
        .then(options => {
            options = options || { backgroundUrl: '', blurAmount: 5, defaultSearchEngine: 'baidu' };

            backgroundUrlInput.value = options.backgroundUrl || '';
            if (options.blurAmount || options.blurAmount === 0) {
                blurAmountInput.value = options.blurAmount
            }
            blurValueSpan.textContent = `${blurAmountInput.value}px`;
            defaultSearchEngineSelect.value = options.defaultSearchEngine || 'baidu';
        })
        .catch(error => {
            console.error('加载设置失败:', error);
            // 使用默认设置
            backgroundUrlInput.value = '';
            blurAmountInput.value = 5;
            blurValueSpan.textContent = '5px';
            defaultSearchEngineSelect.value = 'baidu';
        });

    settingsModal.style.display = 'flex';
}

// 关闭所有模态框
function closeAllModals() {
    siteModal.style.display = 'none';
    settingsModal.style.display = 'none';
}

// 添加网站
function addSite(name, url, icon) {
    const newId = sites.length > 0 ? Math.max(...sites.map(site => site.id)) + 1 : 1;
    const newSite = {
        id: newId,
        name,
        url,
        icon: icon || `https://www.google.com/s2/favicons?domain=${url}&sz=64`
    };

    sites.push(newSite);
    saveSites();
    renderSites();
}

// 更新网站
function updateSite(id, name, url, icon) {
    const siteIndex = sites.findIndex(site => site.id === id);
    if (siteIndex !== -1) {
        sites[siteIndex] = {
            ...sites[siteIndex],
            name,
            url,
            icon: icon || sites[siteIndex].icon
        };
        saveSites();
        renderSites();
    }
}

// 删除网站
function deleteSite(id) {
    if (confirm('确定要删除这个网站吗？')) {
        sites = sites.filter(site => site.id !== id);
        saveSites();
        renderSites();
    }
}

// 保存网站到API
function saveSites() {
    fetch(`${API_HOST}/kv/sites`, {
        method: 'PUT',
        body: JSON.stringify(sites),
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('保存站点数据失败');
            console.log('网站数据已保存到服务器');
        })
        .catch(error => {
            console.error('保存站点失败:', error);
        });
}

// 格式化URL（确保有http前缀）
function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('chrome://')) {
        return `https://${url}`;
    }
    return url;
}

// 加载背景设置
function loadBackgroundSettings() {
    // 从API加载背景设置
    fetch(`${API_HOST}/kv/options`, {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('设置数据加载失败');
        })
        .then(options => {
            options = options || { backgroundUrl: '', blurAmount: 5 };
            const backgroundBlur = document.querySelector('.background-blur');

            // 设置背景图片
            if (options.backgroundUrl) {
                backgroundBlur.style.backgroundImage = `url('${options.backgroundUrl}')`;
            }

            // 设置模糊程度
            backgroundBlur.style.filter = `blur(${options.blurAmount}px)`;
        })
        .catch(error => {
            console.error('加载背景设置失败:', error);
        });
}

// 拖拽开始时
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');

    // 设置拖拽数据
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

// 拖拽结束时
function handleDragEnd() {
    this.classList.remove('dragging');

    // 清除所有目标元素的样式
    document.querySelectorAll('.site-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// 拖拽经过目标元素上方时
function handleDragOver(e) {
    e.preventDefault(); // 允许放置
    return false;
}

// 拖拽进入目标元素时
function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

// 拖拽离开目标元素时
function handleDragLeave() {
    this.classList.remove('drag-over');
}

// 放置拖拽元素时
function handleDrop(e) {
    e.stopPropagation();

    // 如果不是拖到自己身上
    if (draggedItem !== this) {
        // 获取拖拽项和目标项的ID
        const draggedItemId = parseInt(draggedItem.getAttribute('data-id'));
        const targetItemId = parseInt(this.getAttribute('data-id'));

        // 找到对应数据的索引
        const draggedItemIndex = sites.findIndex(site => site.id === draggedItemId);
        const targetItemIndex = sites.findIndex(site => site.id === targetItemId);

        // 更新数组顺序
        if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
            // 移除拖动项
            const [movedItem] = sites.splice(draggedItemIndex, 1);
            // 插入到目标位置
            sites.splice(targetItemIndex, 0, movedItem);

            // 保存并刷新界面
            saveSites();
            renderSites();
        }
    }

    return false;
}

// 保存设置
function saveSettings() {
    API_TOKEN = apiTokenInput.value;
    localStorage.setItem('API_TOKEN', API_TOKEN); // 保存到localStorage

    const options = {
        backgroundUrl: backgroundUrlInput.value.trim(),
        blurAmount: parseInt(blurAmountInput.value),
        defaultSearchEngine: defaultSearchEngineSelect.value
    };

    // 保存到API
    fetch(`${API_HOST}/kv/options`, {
        method: 'PUT',
        body: JSON.stringify(options),
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('保存设置失败');

            // 更新搜索引擎
            return fetch(`${API_HOST}/kv/currentSearchEngine`, {
                method: 'PUT',
                body: JSON.stringify(searchEngineData[options.defaultSearchEngine]),
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`
                }
            });
        })
        .then(response => {
            if (!response.ok) throw new Error('保存搜索引擎设置失败');

            // 应用设置
            loadBackgroundSettings();
            currentSearchEngine = searchEngineData[options.defaultSearchEngine];
            currentEngineIcon.src = currentSearchEngine.icon;

            alert('设置已保存！');
            closeAllModals();
        })
        .catch(error => {
            console.error('保存设置失败:', error);
            alert('保存设置失败，请重试！');
        });
}
