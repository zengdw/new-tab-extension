// 全局变量
let sites = [];
let currentSearchEngine = {
    name: 'baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
};

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
const resetSitesButton = document.getElementById('reset-sites');
const exportSitesButton = document.getElementById('export-sites');
const importSitesButton = document.getElementById('import-sites');
const importFileInput = document.getElementById('import-file');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initSearchEngine();
    loadSites();
    initEventListeners();
    loadBackgroundSettings();
});

// 初始化搜索引擎
function initSearchEngine() {
    // 从Chrome存储加载上次使用的搜索引擎
    chrome.storage.sync.get(['currentSearchEngine'], (result) => {
        if (result.currentSearchEngine) {
            currentSearchEngine = result.currentSearchEngine;
            currentEngineIcon.src = currentSearchEngine.icon;
        }
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
            chrome.storage.sync.set({ currentSearchEngine: currentSearchEngine });

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

// 从Chrome存储加载网站数据
function loadSites() {
    chrome.storage.sync.get(['sites'], (result) => {
        sites = result.sites || defaultSites;
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
    
    // 恢复默认网站
    resetSitesButton.addEventListener('click', () => {
        if (confirm('确定要恢复默认网站吗？这将删除您添加的所有自定义网站。')) {
            chrome.storage.sync.set({ sites: defaultSites }, () => {
                alert('已恢复默认网站！');
                loadSites();
            });
        }
    });
    
    // 导出网站数据
    exportSitesButton.addEventListener('click', exportSites);
    
    // 导入网站数据
    importSitesButton.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', importSites);
    
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
    chrome.storage.sync.get(['options'], (result) => {
        const options = result.options || { backgroundUrl: '', blurAmount: 5, defaultSearchEngine: 'baidu' };
        
        backgroundUrlInput.value = options.backgroundUrl || '';
        blurAmountInput.value = options.blurAmount || 5;
        blurValueSpan.textContent = `${blurAmountInput.value}px`;
        defaultSearchEngineSelect.value = options.defaultSearchEngine || 'baidu';
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

// 保存网站到Chrome存储同步
function saveSites() {
    chrome.storage.sync.set({ sites: sites }, () => {
        console.log('网站数据已同步到Google账号');
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
    // 从Chrome存储中加载背景设置
    chrome.storage.sync.get(['options'], (result) => {
        const options = result.options || { backgroundUrl: '', blurAmount: 5 };
        const backgroundBlur = document.querySelector('.background-blur');

        // 设置背景图片
        if (options.backgroundUrl) {
            backgroundBlur.style.backgroundImage = `url('${options.backgroundUrl}')`;
        }

        // 设置模糊程度
        backgroundBlur.style.filter = `blur(${options.blurAmount}px)`;
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
    const options = {
        backgroundUrl: backgroundUrlInput.value.trim(),
        blurAmount: parseInt(blurAmountInput.value),
        defaultSearchEngine: defaultSearchEngineSelect.value
    };
    
    // 保存到Chrome同步存储
    chrome.storage.sync.set({ options }, () => {
        // 更新搜索引擎
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
        
        chrome.storage.sync.set({ currentSearchEngine: searchEngineData[options.defaultSearchEngine] }, () => {
            // 应用设置
            loadBackgroundSettings();
            currentSearchEngine = searchEngineData[options.defaultSearchEngine];
            currentEngineIcon.src = currentSearchEngine.icon;
            
            alert('设置已保存！');
            closeAllModals();
        });
    });
}

// 导出网站数据
function exportSites() {
    chrome.storage.sync.get(['sites'], (result) => {
        const sitesData = JSON.stringify(result.sites || defaultSites);
        
        // 创建下载链接
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(sitesData);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "new_tab_sites.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
}

// 导入网站数据
function importSites(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const sitesData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (Array.isArray(sitesData) && sitesData.length > 0 && sitesData[0].hasOwnProperty('id') && sitesData[0].hasOwnProperty('name') && sitesData[0].hasOwnProperty('url')) {
                chrome.storage.sync.set({ sites: sitesData }, () => {
                    alert('网站数据导入成功！');
                    loadSites();
                });
            } else {
                alert('导入失败：无效的数据格式。');
            }
        } catch (error) {
            alert('导入失败：' + error.message);
        }
    };
    reader.readAsText(file);
    
    // 清空文件输入，以便可以再次选择同一文件
    event.target.value = '';
} 