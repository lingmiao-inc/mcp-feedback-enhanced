/**
 * MCP Feedback Enhanced - 快捷指令管理模組
 * ========================================
 * 
 * 處理快捷指令的載入、管理和操作
 * 從遠程API獲取快捷指令數據並提供分組功能
 */

(function() {
    'use strict';

    // 確保命名空間存在
    window.MCPFeedback = window.MCPFeedback || {};
    window.MCPFeedback.Shortcut = window.MCPFeedback.Shortcut || {};
    const Utils = window.MCPFeedback.Utils;

    /**
     * 快捷指令管理器建構函數
     */
    function ShortcutManager(options) {
        options = options || {};
        
        // API 設定 - 從環境變量或配置獲取
        this.apiUrl = this.getApiUrlFromEnvironment();
        this.apiKey = this.getApiKeyFromEnvironment();
        this.requestTimeout = options.timeout || 10000; // 10秒超時
        
        // 數據狀態
        this.shortcuts = [];
        this.groups = [];
        this.isLoading = false;
        this.lastError = null;
        this.lastLoadTime = null;
        
        // 緩存設定
        this.cacheTimeout = options.cacheTimeout || 300000; // 5分鐘緩存
        this.enableCache = options.enableCache !== false;
        
        // 回調函數列表
        this.onLoadStartCallbacks = [];
        this.onLoadSuccessCallbacks = [];
        this.onLoadErrorCallbacks = [];
        this.onDataChangeCallbacks = [];
        this.onConfigErrorCallbacks = [];
        
        // 初始化API配置检查
        this.configCheckPromise = null;
        this.isConfigValid = false;
        
        console.log('✅ ShortcutManager 初始化完成');
    }

    /**
     * 获取API服务器URL从环境变量配置
     */
    ShortcutManager.prototype.getApiUrlFromEnvironment = function() {
        // 默认URL，将由后端配置替代
        return null;
    };

    /**
     * 获取API密钥从环境变量配置  
     */
    ShortcutManager.prototype.getApiKeyFromEnvironment = function() {
        // 将由后端配置提供
        return null;
    };

    /**
     * 从后端获取快捷指令配置
     */
    ShortcutManager.prototype.loadConfigFromBackend = function() {
        const self = this;
        
        if (this.configCheckPromise) {
            return this.configCheckPromise;
        }
        
        this.configCheckPromise = fetch('/api/shortcut-config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        })
        .then(function(config) {
            console.log('📡 快捷指令配置加载成功:', config);
            
            if (config.configComplete && config.apiServer) {
                // 构建完整的API URL
                const baseUrl = config.apiServer.endsWith('/') ? config.apiServer.slice(0, -1) : config.apiServer;
                self.apiUrl = baseUrl + '/api/shortcuts';
                self.apiKey = config.apiKey;
                self.isConfigValid = true;
                
                console.log('✅ API配置已设置:', {
                    url: self.apiUrl,
                    hasKey: !!self.apiKey
                });
            } else {
                self.isConfigValid = false;
                const missingItems = [];
                if (!config.apiServer) missingItems.push('FEEDBACK_API_SERVER');
                if (!config.apiKey) missingItems.push('FEEDBACK_API_KEY');
                
                const error = new Error('环境变量配置不完整，缺少: ' + missingItems.join(', '));
                error.missingConfig = missingItems;
                throw error;
            }
            
            return config;
        })
        .catch(function(error) {
            console.error('❌ 快捷指令配置加载失败:', error);
            self.isConfigValid = false;
            self.triggerConfigErrorCallbacks(error);
            throw error;
        });
        
        return this.configCheckPromise;
    };

    /**
     * 添加配置错误回调
     */
    ShortcutManager.prototype.addConfigErrorCallback = function(callback) {
        if (typeof callback === 'function') {
            this.onConfigErrorCallbacks.push(callback);
        }
    };

    /**
     * 触发配置错误回调
     */
    ShortcutManager.prototype.triggerConfigErrorCallbacks = function(error) {
        this.onConfigErrorCallbacks.forEach(function(callback) {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('❌ 配置错误回调执行失败:', callbackError);
            }
        });
    };

    /**
     * 初始化快捷指令管理器
     */
    ShortcutManager.prototype.init = function() {
        console.log('📋 ShortcutManager 初始化完成');
        return this;
    };

    /**
     * 添加載入開始回調
     */
    ShortcutManager.prototype.addLoadStartCallback = function(callback) {
        if (typeof callback === 'function') {
            this.onLoadStartCallbacks.push(callback);
        }
    };

    /**
     * 添加載入成功回調
     */
    ShortcutManager.prototype.addLoadSuccessCallback = function(callback) {
        if (typeof callback === 'function') {
            this.onLoadSuccessCallbacks.push(callback);
        }
    };

    /**
     * 添加載入錯誤回調
     */
    ShortcutManager.prototype.addLoadErrorCallback = function(callback) {
        if (typeof callback === 'function') {
            this.onLoadErrorCallbacks.push(callback);
        }
    };

    /**
     * 添加數據變更回調
     */
    ShortcutManager.prototype.addDataChangeCallback = function(callback) {
        if (typeof callback === 'function') {
            this.onDataChangeCallbacks.push(callback);
        }
    };

    /**
     * 觸發載入開始回調
     */
    ShortcutManager.prototype.triggerLoadStartCallbacks = function() {
        this.onLoadStartCallbacks.forEach(function(callback) {
            try {
                callback();
            } catch (error) {
                console.error('❌ 載入開始回調執行失敗:', error);
            }
        });
    };

    /**
     * 觸發載入成功回調
     */
    ShortcutManager.prototype.triggerLoadSuccessCallbacks = function(data) {
        this.onLoadSuccessCallbacks.forEach(function(callback) {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ 載入成功回調執行失敗:', error);
            }
        });
    };

    /**
     * 觸發載入錯誤回調
     */
    ShortcutManager.prototype.triggerLoadErrorCallbacks = function(error) {
        this.onLoadErrorCallbacks.forEach(function(callback) {
            try {
                callback(error);
            } catch (error) {
                console.error('❌ 載入錯誤回調執行失敗:', error);
            }
        });
    };

    /**
     * 觸發數據變更回調
     */
    ShortcutManager.prototype.triggerDataChangeCallbacks = function() {
        const data = {
            shortcuts: this.shortcuts,
            groups: this.groups,
            isLoading: this.isLoading,
            lastError: this.lastError
        };
        
        this.onDataChangeCallbacks.forEach(function(callback) {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ 數據變更回調執行失敗:', error);
            }
        });
    };

    /**
     * 檢查緩存是否有效
     */
    ShortcutManager.prototype.isCacheValid = function() {
        if (!this.enableCache || !this.lastLoadTime) {
            return false;
        }
        
        const now = Date.now();
        const timeDiff = now - this.lastLoadTime;
        return timeDiff < this.cacheTimeout;
    };

    /**
     * 从API載入快捷指令數據
     */
    ShortcutManager.prototype.loadShortcuts = function(forceReload) {
        const self = this;
        
        // 检查缓存
        if (!forceReload && this.isCacheValid() && this.shortcuts.length > 0) {
            console.log('📋 使用緩存的快捷指令數據');
            this.triggerLoadSuccessCallbacks({
                shortcuts: this.shortcuts,
                groups: this.groups,
                fromCache: true
            });
            return Promise.resolve({
                shortcuts: this.shortcuts,
                groups: this.groups,
                fromCache: true
            });
        }
        
        // 防止重複載入
        if (this.isLoading) {
            console.log('⚠️ 快捷指令正在載入中，跳過重複請求');
            return Promise.reject(new Error('正在載入中'));
        }
        
        this.isLoading = true;
        this.lastError = null;
        this.triggerLoadStartCallbacks();
        this.triggerDataChangeCallbacks();
        
        console.log('🔄 開始載入快捷指令數據...');
        
        // 首先加载配置
        return this.loadConfigFromBackend()
        .then(function(config) {
            if (!self.isConfigValid || !self.apiUrl) {
                throw new Error('API配置无效');
            }
            
            console.log('📡 使用API URL:', self.apiUrl);
            console.log('⏱️ 請求超時:', self.requestTimeout + 'ms');

            // 创建带超时的 fetch 请求
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('⏰ 請求超時，中止請求');
                controller.abort();
            }, self.requestTimeout);

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            
            // 如果有API密钥，添加到请求头
            if (self.apiKey) {
                headers['Authorization'] = 'Bearer ' + self.apiKey;
            }

            return fetch(self.apiUrl, {
                method: 'GET',
                headers: headers,
                signal: controller.signal
            })
            .then(function(response) {
                clearTimeout(timeoutId);
                console.log('📥 收到API響應:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }

                return response.json();
            })
        })
        .then(function(data) {
            console.log('📥 快捷指令數據載入成功:', data);

            // 處理API響應格式
            let shortcutsArray;
            if (data && typeof data === 'object') {
                if (data.success && Array.isArray(data.data)) {
                    // 格式: {success: true, data: [...]}
                    shortcutsArray = data.data;
                    console.log('📋 檢測到包裝格式，提取data數組，共', data.data.length, '項');
                } else if (Array.isArray(data)) {
                    // 格式: [...]
                    shortcutsArray = data;
                    console.log('📋 檢測到直接數組格式，共', data.length, '項');
                } else {
                    throw new Error('API返回的數據格式不正確，期望數組或包含data字段的對象');
                }
            } else {
                throw new Error('API返回的數據格式不正確，期望對象或數組');
            }

            // 處理數據
            self.processShortcutData(shortcutsArray);
            
            // 更新狀態
            self.isLoading = false;
            self.lastLoadTime = Date.now();
            self.lastError = null;
            
            // 觸發回調
            const result = {
                shortcuts: self.shortcuts,
                groups: self.groups,
                fromCache: false
            };
            
            self.triggerLoadSuccessCallbacks(result);
            self.triggerDataChangeCallbacks();
            
            console.log('✅ 快捷指令載入完成，共', self.shortcuts.length, '個指令，', self.groups.length, '個分組');
            
            return result;
        })
        .catch(function(error) {
            clearTimeout(timeoutId);

            self.isLoading = false;
            self.lastError = error.message || '載入快捷指令失敗';

            console.error('❌ 快捷指令載入失敗:', error);
            console.error('錯誤類型:', error.name);
            console.error('錯誤訊息:', error.message);
            if (error.name === 'AbortError') {
                console.error('請求被中止（可能是超時）');
            } else if (error.name === 'TypeError') {
                console.error('網路錯誤或CORS問題');
            }

            // 觸發回調
            self.triggerLoadErrorCallbacks(error);
            self.triggerDataChangeCallbacks();

            throw error;
        });
    };

    /**
     * 處理快捷指令數據
     */
    ShortcutManager.prototype.processShortcutData = function(data) {
        // 驗證和清理數據
        this.shortcuts = data.filter(function(item) {
            return item &&
                   typeof item.id === 'string' &&
                   typeof item.name === 'string' &&
                   typeof item.prompt === 'string' &&
                   typeof item.group === 'string';
        }).map(function(item) {
            return {
                id: item.id.trim(),
                name: item.name.trim(),
                prompt: item.prompt.trim(),
                group: item.group.trim(),
                order: typeof item.order === 'number' ? item.order : 0
            };
        });

        // 按order字段排序
        this.shortcuts.sort(function(a, b) {
            return a.order - b.order;
        });

        // 生成分組數據
        this.generateGroups();

        console.log('📊 數據處理完成:', this.shortcuts.length, '個快捷指令，', this.groups.length, '個分組');
    };

    /**
     * 生成分組數據
     */
    ShortcutManager.prototype.generateGroups = function() {
        const groupMap = new Map();

        // 收集所有分組
        this.shortcuts.forEach(function(shortcut) {
            if (!groupMap.has(shortcut.group)) {
                groupMap.set(shortcut.group, {
                    name: shortcut.group,
                    shortcuts: []
                });
            }
            groupMap.get(shortcut.group).shortcuts.push(shortcut);
        });

        // 轉換為數組並進行特殊排序
        const allGroups = Array.from(groupMap.values());

        // 分離快捷回復分組和其他分組
        const quickReplyGroup = allGroups.find(g => g.name === '快捷回復');
        const otherGroups = allGroups.filter(g => g.name !== '快捷回復');

        // 對其他分組進行排序
        otherGroups.sort(function(a, b) {
            return a.name.localeCompare(b.name, 'zh-CN');
        });

        // 快捷回復分組固定在第一位，其他分組按字母順序排列
        this.groups = quickReplyGroup ? [quickReplyGroup, ...otherGroups] : otherGroups;

        console.log('📂 分組生成完成:', this.groups.map(g => g.name + '(' + g.shortcuts.length + ')').join(', '));
    };

    /**
     * 獲取所有快捷指令
     */
    ShortcutManager.prototype.getAllShortcuts = function() {
        return [...this.shortcuts];
    };

    /**
     * 獲取所有分組
     */
    ShortcutManager.prototype.getAllGroups = function() {
        return [...this.groups];
    };

    /**
     * 根據ID獲取快捷指令
     */
    ShortcutManager.prototype.getShortcutById = function(id) {
        return this.shortcuts.find(s => s.id === id) || null;
    };

    /**
     * 根據分組名稱獲取快捷指令
     */
    ShortcutManager.prototype.getShortcutsByGroup = function(groupName) {
        const group = this.groups.find(g => g.name === groupName);
        return group ? [...group.shortcuts] : [];
    };

    /**
     * 獲取載入狀態
     */
    ShortcutManager.prototype.getLoadingState = function() {
        return {
            isLoading: this.isLoading,
            lastError: this.lastError,
            lastLoadTime: this.lastLoadTime,
            hasData: this.shortcuts.length > 0
        };
    };

    /**
     * 清除緩存並重新載入
     */
    ShortcutManager.prototype.refresh = function() {
        this.lastLoadTime = null;
        return this.loadShortcuts(true);
    };

    /**
     * 銷毀管理器，清理資源
     */
    ShortcutManager.prototype.destroy = function() {
        // 清空數據
        this.shortcuts = [];
        this.groups = [];
        this.isLoading = false;
        this.lastError = null;
        this.lastLoadTime = null;

        // 清空回調
        this.onLoadStartCallbacks = [];
        this.onLoadSuccessCallbacks = [];
        this.onLoadErrorCallbacks = [];
        this.onDataChangeCallbacks = [];

        console.log('🗑️ ShortcutManager 已銷毀');
    };

    /**
     * 獲取統計資訊
     */
    ShortcutManager.prototype.getStatistics = function() {
        return {
            totalShortcuts: this.shortcuts.length,
            totalGroups: this.groups.length,
            groupStats: this.groups.map(g => ({
                name: g.name,
                count: g.shortcuts.length
            })),
            lastLoadTime: this.lastLoadTime,
            cacheValid: this.isCacheValid()
        };
    };

    // 將 ShortcutManager 加入命名空間
    window.MCPFeedback.Shortcut.ShortcutManager = ShortcutManager;

    console.log('✅ ShortcutManager 模組載入完成');

})();
