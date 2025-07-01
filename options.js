// 默认网站数据 - 与new_tab.js中保持一致
const defaultSites = [
    { id: 1, name: '40℃', url: 'https://weather.com', icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png' },
    { id: 2, name: '待办事项', url: 'https://todoist.com', icon: 'https://cdn-icons-png.flaticon.com/512/2387/2387635.png', badge: 1 },
    { id: 3, name: '笔记', url: 'https://www.notion.so', icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png' },
    { id: 4, name: '历程纪念', url: 'https://calendar.google.com', icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png' },
    { id: 5, name: '书签', url: 'chrome://bookmarks', icon: 'https://cdn-icons-png.flaticon.com/512/1250/1250592.png' },
    { id: 6, name: '文件夹', url: 'file:///C:/', icon: 'https://cdn-icons-png.flaticon.com/512/1383/1383457.png' },
    { id: 7, name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'https://www.bilibili.com/favicon.ico' },
    { id: 8, name: '新浪微博', url: 'https://weibo.com', icon: 'https://weibo.com/favicon.ico' },
    { id: 9, name: '淘宝网', url: 'https://www.taobao.com', icon: 'https://www.taobao.com/favicon.ico' },
    { id: 10, name: '斗鱼', url: 'https://www.douyu.com', icon: 'https://www.douyu.com/favicon.ico' },
    { id: 11, name: '知乎', url: 'https://www.zhihu.com', icon: 'https://www.zhihu.com/favicon.ico' },
    { id: 12, name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' }
];

// 默认设置
const defaultOptions = {
    backgroundUrl: '',
    blurAmount: 5,
    defaultSearchEngine: 'baidu'
};

// DOM 元素
const backgroundUrlInput = document.getElementById('background-url');
const blurAmountInput = document.getElementById('blur-amount');
const blurValueSpan = document.getElementById('blur-value');
const defaultSearchEngineSelect = document.getElementById('default-search-engine');
const saveOptionsButton = document.getElementById('save-options');
const resetOptionsButton = document.getElementById('reset-options');
const resetSitesButton = document.getElementById('reset-sites');
const exportSitesButton = document.getElementById('export-sites');
const importSitesButton = document.getElementById('import-sites');
const importFileInput = document.getElementById('import-file');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的设置
    loadOptions();
    
    // 监听范围滑块变化
    blurAmountInput.addEventListener('input', () => {
        blurValueSpan.textContent = `${blurAmountInput.value}px`;
    });
    
    // 保存设置
    saveOptionsButton.addEventListener('click', saveOptions);
    
    // 恢复默认设置
    resetOptionsButton.addEventListener('click', () => {
        if (confirm('确定要恢复默认设置吗？这将重置所有选项但不会影响您的网站数据。')) {
            resetOptions();
        }
    });
    
    // 恢复默认网站
    resetSitesButton.addEventListener('click', () => {
        if (confirm('确定要恢复默认网站吗？这将删除您添加的所有自定义网站。')) {
            resetSites();
        }
    });
    
    // 导出网站数据
    exportSitesButton.addEventListener('click', exportSites);
    
    // 导入网站数据
    importSitesButton.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', importSites);
});

// 加载保存的设置
function loadOptions() {
    // 从Chrome同步存储加载设置
    chrome.storage.sync.get(['options'], (result) => {
        const options = result.options || defaultOptions;
        
        // 填充表单
        backgroundUrlInput.value = options.backgroundUrl || '';
        blurAmountInput.value = options.blurAmount || 5;
        blurValueSpan.textContent = `${blurAmountInput.value}px`;
        defaultSearchEngineSelect.value = options.defaultSearchEngine || 'baidu';
    });
}

// 保存设置
function saveOptions() {
    const options = {
        backgroundUrl: backgroundUrlInput.value,
        blurAmount: parseInt(blurAmountInput.value),
        defaultSearchEngine: defaultSearchEngineSelect.value
    };
    
    // 保存到Chrome同步存储
    chrome.storage.sync.set({ options }, () => {
        // 如果选择了默认搜索引擎，也更新它
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
            alert('设置已保存！并将在所有设备上同步。');
        });
    });
}

// 恢复默认设置
function resetOptions() {
    backgroundUrlInput.value = defaultOptions.backgroundUrl;
    blurAmountInput.value = defaultOptions.blurAmount;
    blurValueSpan.textContent = `${defaultOptions.blurAmount}px`;
    defaultSearchEngineSelect.value = defaultOptions.defaultSearchEngine;
    
    saveOptions();
}

// 恢复默认网站
function resetSites() {
    chrome.storage.sync.set({ sites: defaultSites }, () => {
        alert('已恢复默认网站！请刷新新标签页查看效果。');
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
                    alert('网站数据导入成功！请刷新新标签页查看效果。');
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