/**
 * 快捷指令主应用集成代码片段
 * ================================
 * 
 * 这个文件包含了将快捷指令功能集成到主应用中的完整代码
 * 可以直接复制到你的主应用文件中使用
 */

/**
 * 初始化快捷指令管理器
 * 在主应用的初始化流程中调用此方法
 */
function initializeShortcutManagers() {
    console.log('⚡ 初始化快捷指令管理器...');

    try {
        // 详细检查模块加载状态
        console.log('🔍 检查快捷指令模块加载状态...');
        console.log('window.MCPFeedback:', window.MCPFeedback);
        console.log('window.MCPFeedback.Shortcut:', window.MCPFeedback ? window.MCPFeedback.Shortcut : 'undefined');

        if (window.MCPFeedback && window.MCPFeedback.Shortcut) {
            console.log('ShortcutManager:', window.MCPFeedback.Shortcut.ShortcutManager);
            console.log('ShortcutUI:', window.MCPFeedback.Shortcut.ShortcutUI);
        }

        // 检查快捷指令模块是否已加载
        if (!window.MCPFeedback || !window.MCPFeedback.Shortcut) {
            console.warn('⚠️ 快捷指令模块未加载，跳过初始化');
            console.log('可用的 MCPFeedback 模块:', Object.keys(window.MCPFeedback || {}));
            return;
        }

        if (!window.MCPFeedback.Shortcut.ShortcutManager || !window.MCPFeedback.Shortcut.ShortcutUI) {
            console.error('❌ 快捷指令子模块未完全加载');
            console.log('Shortcut 命名空间内容:', Object.keys(window.MCPFeedback.Shortcut));
            return;
        }

        const self = this; // 假设在类方法中调用

        // 1. 初始化快捷指令管理器
        console.log('📋 创建 ShortcutManager...');
        this.shortcutManager = new window.MCPFeedback.Shortcut.ShortcutManager({
            enableCache: true,
            cacheTimeout: 300000 // 5分钟缓存
        });
        this.shortcutManager.init();
        console.log('✅ ShortcutManager 创建成功');

        // 2. 初始化快捷指令UI
        console.log('🎨 创建 ShortcutUI...');
        this.shortcutUI = new window.MCPFeedback.Shortcut.ShortcutUI({
            feedbackInputSelector: '#combinedFeedbackText' // 根据你的输入框ID调整
        });

        // 检查容器是否存在
        const container = document.querySelector('#shortcutsContainer');
        console.log('🔍 快捷指令容器检查:', container ? '找到' : '未找到');
        if (container) {
            console.log('容器内容:', container.innerHTML.substring(0, 200));
        }

        if (!this.shortcutUI.init('#shortcutsContainer')) {
            console.error('❌ 快捷指令UI初始化失败');
            return;
        }
        console.log('✅ ShortcutUI 创建成功');

        // 3. 设置回调函数
        this.shortcutManager.addLoadStartCallback(function() {
            console.log('⚡ 快捷指令载入开始');
            self.shortcutUI.showLoading();
        });

        this.shortcutManager.addLoadSuccessCallback(function(data) {
            console.log('⚡ 快捷指令载入成功:', data.groups.length, '个分组');
            console.log('分组详情:', data.groups.map(g => g.name + '(' + g.shortcuts.length + ')'));
            self.shortcutUI.render(data.groups);
        });

        this.shortcutManager.addLoadErrorCallback(function(error) {
            console.error('⚡ 快捷指令载入失败:', error);
            self.shortcutUI.showError(error.message || '载入失败');
        });

        // 4. 开始加载快捷指令数据
        console.log('🔄 开始载入快捷指令数据...');
        this.shortcutManager.loadShortcuts()
            .then(function(data) {
                console.log('✅ 快捷指令初始化完成，数据:', data);
            })
            .catch(function(error) {
                console.warn('⚠️ 快捷指令载入失败，但不影响其他功能:', error);
            });

        console.log('✅ 快捷指令管理器初始化完成');

    } catch (error) {
        console.error('❌ 快捷指令管理器初始化失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

/**
 * 独立的快捷指令初始化函数
 * 如果你不使用类结构，可以使用这个独立函数
 */
function initializeShortcuts() {
    // 全局变量存储管理器实例
    window.shortcutManager = null;
    window.shortcutUI = null;

    console.log('⚡ 初始化快捷指令功能...');

    try {
        // 检查依赖
        if (!window.MCPFeedback || !window.MCPFeedback.Shortcut) {
            console.warn('⚠️ 快捷指令模块未加载');
            return false;
        }

        if (!window.MCPFeedback.Shortcut.ShortcutManager || !window.MCPFeedback.Shortcut.ShortcutUI) {
            console.error('❌ 快捷指令子模块未完全加载');
            return false;
        }

        // 1. 创建管理器
        window.shortcutManager = new window.MCPFeedback.Shortcut.ShortcutManager({
            enableCache: true,
            cacheTimeout: 300000
        });
        window.shortcutManager.init();

        // 2. 创建UI
        window.shortcutUI = new window.MCPFeedback.Shortcut.ShortcutUI({
            feedbackInputSelector: '#combinedFeedbackText'
        });

        if (!window.shortcutUI.init('#shortcutsContainer')) {
            console.error('❌ 快捷指令UI初始化失败');
            return false;
        }

        // 3. 设置回调
        window.shortcutManager.addLoadStartCallback(function() {
            window.shortcutUI.showLoading();
        });

        window.shortcutManager.addLoadSuccessCallback(function(data) {
            window.shortcutUI.render(data.groups);
        });

        window.shortcutManager.addLoadErrorCallback(function(error) {
            window.shortcutUI.showError(error.message || '载入失败');
        });

        // 4. 加载数据
        window.shortcutManager.loadShortcuts()
            .then(function(data) {
                console.log('✅ 快捷指令初始化完成');
            })
            .catch(function(error) {
                console.warn('⚠️ 快捷指令载入失败:', error);
            });

        return true;

    } catch (error) {
        console.error('❌ 快捷指令初始化失败:', error);
        return false;
    }
}

/**
 * 清空输入框功能
 * 如果你需要添加清空按钮功能
 */
function setupClearInputButton() {
    const clearBtn = document.getElementById('clearInputBtn');
    const inputElement = document.getElementById('combinedFeedbackText');
    
    if (clearBtn && inputElement) {
        clearBtn.addEventListener('click', function() {
            inputElement.value = '';
            inputElement.focus();
            console.log('🧹 已清空输入框');
        });
    }
}

/**
 * 模块检查函数
 * 在加载快捷指令之前检查所有必需的模块
 */
function checkShortcutModules() {
    const requiredModules = [
        'MCPFeedback',
        'MCPFeedback.Shortcut',
        'MCPFeedback.Shortcut.ShortcutManager',
        'MCPFeedback.Shortcut.ShortcutUI',
        'MCPFeedback.Utils'
    ];

    const missingModules = requiredModules.filter(modulePath => {
        const parts = modulePath.split('.');
        let current = window;
        for (const part of parts) {
            if (!current[part]) return true;
            current = current[part];
        }
        return false;
    });

    if (missingModules.length > 0) {
        console.warn('缺少模块:', missingModules.join(', '));
        return false;
    }

    return true;
}

/**
 * 延迟初始化快捷指令
 * 如果模块还未加载完成，可以使用这个函数延迟初始化
 */
function delayedShortcutInit(maxRetries = 10, retryInterval = 100) {
    let retryCount = 0;

    function tryInit() {
        if (checkShortcutModules()) {
            initializeShortcuts();
            return;
        }

        retryCount++;
        if (retryCount < maxRetries) {
            console.log(`⏳ 快捷指令模块未就绪，${retryInterval}ms后重试 (${retryCount}/${maxRetries})`);
            setTimeout(tryInit, retryInterval);
        } else {
            console.warn('⚠️ 快捷指令模块加载超时，跳过初始化');
        }
    }

    tryInit();
}

/**
 * 使用示例：
 * 
 * // 在主应用初始化时调用
 * document.addEventListener('DOMContentLoaded', function() {
 *     // 方法1：直接初始化（如果确定模块已加载）
 *     initializeShortcuts();
 * 
 *     // 方法2：延迟初始化（推荐）
 *     delayedShortcutInit();
 * 
 *     // 方法3：在类中使用
 *     // this.initializeShortcutManagers();
 * 
 *     // 设置清空按钮
 *     setupClearInputButton();
 * });
 * 
 * // 手动刷新快捷指令数据
 * function refreshShortcuts() {
 *     if (window.shortcutManager) {
 *         window.shortcutManager.refresh();
 *     }
 * }
 * 
 * // 获取快捷指令统计信息
 * function getShortcutStats() {
 *     if (window.shortcutManager) {
 *         return window.shortcutManager.getStatistics();
 *     }
 *     return null;
 * }
 */
