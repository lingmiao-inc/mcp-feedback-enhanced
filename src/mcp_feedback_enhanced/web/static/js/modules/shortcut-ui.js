/**
 * MCP Feedback Enhanced - 快捷指令UI模組
 * ======================================
 * 
 * 處理快捷指令的UI渲染和交互邏輯
 */

(function() {
    'use strict';

    // 確保命名空間存在
    window.MCPFeedback = window.MCPFeedback || {};
    window.MCPFeedback.Shortcut = window.MCPFeedback.Shortcut || {};
    const Utils = window.MCPFeedback.Utils;

    /**
     * 快捷指令UI管理器建構函數
     */
    function ShortcutUI(options) {
        options = options || {};
        
        // 容器元素
        this.container = null;
        this.tabsContainer = null;
        this.panelsContainer = null;
        
        // 狀態
        this.currentGroupIndex = 0;
        this.groups = [];
        this.isRendered = false;
        
        // 設定
        this.feedbackInputSelector = options.feedbackInputSelector || '#combinedFeedbackText';
        
        console.log('✅ ShortcutUI 初始化完成');
    }

    /**
     * 初始化UI管理器
     */
    ShortcutUI.prototype.init = function(containerSelector) {
        console.log('🎨 ShortcutUI 初始化開始，容器選擇器:', containerSelector);

        this.container = Utils.safeQuerySelector(containerSelector || '#shortcutsContainer');

        if (!this.container) {
            console.error('❌ 找不到快捷指令容器:', containerSelector);
            console.log('🔍 頁面中所有ID包含shortcuts的元素:');
            document.querySelectorAll('[id*="shortcut"]').forEach(el => {
                console.log('  -', el.id, el.tagName, el.className);
            });
            return false;
        }

        console.log('✅ 找到主容器:', this.container);
        console.log('主容器內容:', this.container.innerHTML.substring(0, 300));

        this.tabsContainer = this.container.querySelector('#shortcutTabsContainer');
        this.panelsContainer = this.container.querySelector('#shortcutPanelsContainer');

        console.log('🔍 子容器檢查:');
        console.log('  - tabsContainer:', this.tabsContainer ? '找到' : '未找到');
        console.log('  - panelsContainer:', this.panelsContainer ? '找到' : '未找到');

        if (!this.tabsContainer || !this.panelsContainer) {
            console.error('❌ 找不到快捷指令子容器');
            console.log('容器內所有子元素:');
            Array.from(this.container.children).forEach((child, index) => {
                console.log(`  ${index}: ${child.tagName} id="${child.id}" class="${child.className}"`);
            });
            return false;
        }

        // 綁定事件
        this.bindEvents();

        console.log('📋 ShortcutUI 初始化完成');
        return true;
    };

    /**
     * 綁定事件處理器
     */
    ShortcutUI.prototype.bindEvents = function() {
        const self = this;
        
        // 標籤頁點擊事件（事件委託）
        this.tabsContainer.addEventListener('click', function(e) {
            const tab = e.target.closest('.shortcuts-tab');
            if (tab) {
                const groupIndex = parseInt(tab.dataset.groupIndex, 10);
                if (!isNaN(groupIndex)) {
                    self.switchToGroup(groupIndex);
                }
            }
        });
        
        // 快捷指令按鈕點擊事件（事件委託）
        this.panelsContainer.addEventListener('click', function(e) {
            const button = e.target.closest('.shortcut-button');
            if (button) {
                const shortcutId = button.dataset.shortcutId;
                const prompt = button.dataset.prompt;
                if (shortcutId && prompt) {
                    self.insertShortcut(prompt);
                }
            }
        });
    };

    /**
     * 顯示載入狀態
     */
    ShortcutUI.prototype.showLoading = function() {
        const loadingText = window.i18nManager ? window.i18nManager.t('shortcuts.loading') : '載入快捷指令中...';
        this.tabsContainer.innerHTML = '';
        this.panelsContainer.innerHTML = `
            <div class="shortcuts-loading">
                <div class="loading-spinner"></div>
                <span>${loadingText}</span>
            </div>
        `;
    };

    /**
     * 顯示錯誤狀態
     */
    ShortcutUI.prototype.showError = function(error) {
        const errorText = window.i18nManager ? window.i18nManager.t('shortcuts.loadError') : '快捷指令載入失敗';
        
        this.tabsContainer.innerHTML = '';
        
        // 检查是否是配置错误
        if (error && error.missingConfig && Array.isArray(error.missingConfig)) {
            // 环境变量配置缺失错误
            const missingVars = error.missingConfig;
            const configErrorText = window.i18nManager ? window.i18nManager.t('shortcuts.configError') : '配置错误';
            const missingConfigText = window.i18nManager ? window.i18nManager.t('shortcuts.missingConfig') : '缺少环境变量配置';
            const instructionText = window.i18nManager ? window.i18nManager.t('shortcuts.configInstruction') : '请设置以下环境变量';
            
            this.panelsContainer.innerHTML = `
                <div class="shortcuts-error config-error">
                    <div class="error-header">
                        <span class="error-icon">⚙️</span>
                        <span class="error-title">${configErrorText}</span>
                    </div>
                    <div class="error-message">
                        <p>${missingConfigText}</p>
                        <p><strong>${instructionText}:</strong></p>
                        <ul class="missing-config-list">
                            ${missingVars.map(varName => `<li><code>${varName}</code></li>`).join('')}
                        </ul>
                        <div class="config-help">
                            <p><strong>FEEDBACK_API_SERVER</strong>: 快捷指令API服务器地址</p>
                            <p><strong>FEEDBACK_API_KEY</strong>: 快捷指令API访问密钥</p>
                            <p class="help-note">⚠️ 请联系管理员获取正确的配置值</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 一般错误
            this.panelsContainer.innerHTML = `
                <div class="shortcuts-error">
                    <span>❌</span>
                    <span>${errorText}: ${error}</span>
                </div>
            `;
        }
    };

    /**
     * 顯示空狀態
     */
    ShortcutUI.prototype.showEmpty = function() {
        const emptyText = window.i18nManager ? window.i18nManager.t('shortcuts.empty') : '暫無快捷指令';
        this.tabsContainer.innerHTML = '';
        this.panelsContainer.innerHTML = `
            <div class="shortcuts-empty">
                <span>${emptyText}</span>
            </div>
        `;
    };

    /**
     * 渲染快捷指令UI
     */
    ShortcutUI.prototype.render = function(groups) {
        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            this.showEmpty();
            return;
        }
        
        this.groups = groups;
        this.currentGroupIndex = 0;
        
        // 渲染標籤頁
        this.renderTabs();
        
        // 渲染面板
        this.renderPanels();

        // 嘗試恢復上次選中的標籤頁，如果失敗則激活第一個標籤頁
        if (!this.restoreTabState()) {
            this.switchToGroup(0);
        }

        this.isRendered = true;
        console.log('✅ 快捷指令UI渲染完成，共', groups.length, '個分組');
    };

    /**
     * 渲染標籤頁
     */
    ShortcutUI.prototype.renderTabs = function() {
        const tabsHTML = this.groups.map((group, index) => {
            return `
                <button class="shortcuts-tab" 
                        data-group-index="${index}"
                        role="tab"
                        aria-selected="${index === 0 ? 'true' : 'false'}"
                        aria-controls="shortcut-panel-${index}">
                    ${Utils.escapeHtml(group.name)}
                </button>
            `;
        }).join('');
        
        this.tabsContainer.innerHTML = tabsHTML;
    };

    /**
     * 渲染面板
     */
    ShortcutUI.prototype.renderPanels = function() {
        // 定義顏色主題循環
        const themes = ['blue', 'green', 'orange', 'purple', 'red', 'indigo'];

        const panelsHTML = this.groups.map((group, groupIndex) => {
            const buttonsHTML = group.shortcuts.map(shortcut => {
                return `
                    <button class="shortcut-button"
                            data-shortcut-id="${Utils.escapeHtml(shortcut.id)}"
                            data-prompt="${Utils.escapeHtml(shortcut.prompt)}"
                            title="${Utils.escapeHtml(shortcut.prompt)}"
                            type="button">
                        ${Utils.escapeHtml(shortcut.name)}
                    </button>
                `;
            }).join('');

            // 為每個分組分配不同的顏色主題
            const theme = themes[groupIndex % themes.length];

            return `
                <div class="shortcuts-panel"
                     id="shortcut-panel-${groupIndex}"
                     data-theme="${theme}"
                     role="tabpanel"
                     aria-labelledby="shortcut-tab-${groupIndex}">
                    ${buttonsHTML}
                </div>
            `;
        }).join('');

        this.panelsContainer.innerHTML = panelsHTML;
    };

    /**
     * 切換到指定分組
     */
    ShortcutUI.prototype.switchToGroup = function(groupIndex) {
        if (groupIndex < 0 || groupIndex >= this.groups.length) {
            console.warn('⚠️ 無效的分組索引:', groupIndex);
            return;
        }
        
        // 更新標籤頁狀態
        const tabs = this.tabsContainer.querySelectorAll('.shortcuts-tab');
        tabs.forEach((tab, index) => {
            if (index === groupIndex) {
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
            } else {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            }
        });
        
        // 更新面板狀態
        const panels = this.panelsContainer.querySelectorAll('.shortcuts-panel');
        panels.forEach((panel, index) => {
            if (index === groupIndex) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        this.currentGroupIndex = groupIndex;

        // 保存選中狀態到localStorage（不包含指令內容，只保存分組選擇）
        this.saveTabState(groupIndex);

        console.log('📂 切換到分組:', this.groups[groupIndex].name);
    };

    /**
     * 插入快捷指令到輸入框
     */
    ShortcutUI.prototype.insertShortcut = function(prompt) {
        const feedbackInput = Utils.safeQuerySelector(this.feedbackInputSelector);

        if (!feedbackInput) {
            console.error('❌ 找不到反饋輸入框:', this.feedbackInputSelector);
            return;
        }

        // 先清空輸入框內容
        feedbackInput.value = '';

        // 插入快捷指令內容
        feedbackInput.value = prompt;

        // 將光標移動到末尾並添加新行
        const finalValue = prompt + '\n';
        feedbackInput.value = finalValue;

        // 設置光標位置到末尾新行
        const cursorPosition = finalValue.length;
        feedbackInput.setSelectionRange(cursorPosition, cursorPosition);

        // 重新聚焦輸入框
        feedbackInput.focus();

        // 保存當前狀態，包括使用的指令內容
        this.saveTabState(this.currentGroupIndex, prompt);

        console.log('✅ 已清空並插入快捷指令:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
    };

    /**
     * 插入快捷指令到輸入框（不保存狀態，用於恢復時避免循環）
     */
    ShortcutUI.prototype.insertShortcutWithoutSaving = function(prompt) {
        const feedbackInput = Utils.safeQuerySelector(this.feedbackInputSelector);

        if (!feedbackInput) {
            console.error('❌ 找不到反饋輸入框:', this.feedbackInputSelector);
            return;
        }

        // 先清空輸入框內容
        feedbackInput.value = '';

        // 插入快捷指令內容
        feedbackInput.value = prompt;

        // 將光標移動到末尾並添加新行
        const finalValue = prompt + '\n';
        feedbackInput.value = finalValue;

        // 設置光標位置到末尾新行
        const cursorPosition = finalValue.length;
        feedbackInput.setSelectionRange(cursorPosition, cursorPosition);

        // 重新聚焦輸入框
        feedbackInput.focus();

        console.log('🔄 已恢復快捷指令內容:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
    };

    /**
     * 保存TABBAR選中狀態和最後使用的指令
     */
    ShortcutUI.prototype.saveTabState = function(groupIndex, lastUsedPrompt) {
        try {
            // 獲取現有狀態，保持之前的lastUsedPrompt（如果沒有提供新的）
            let existingState = null;
            if (window.feedbackApp && window.feedbackApp.settingsManager) {
                existingState = window.feedbackApp.settingsManager.get('shortcutTabState');
            } else {
                const saved = localStorage.getItem('shortcutTabState');
                existingState = saved ? JSON.parse(saved) : null;
            }

            const stateData = {
                selectedIndex: groupIndex,
                lastUsedPrompt: lastUsedPrompt !== undefined ? lastUsedPrompt : (existingState ? existingState.lastUsedPrompt : null),
                timestamp: Date.now()
            };

            if (window.feedbackApp && window.feedbackApp.settingsManager) {
                window.feedbackApp.settingsManager.set('shortcutTabState', stateData);
                console.log('💾 已保存TABBAR狀態:', stateData);
            } else {
                // 回退到直接使用localStorage
                localStorage.setItem('shortcutTabState', JSON.stringify(stateData));
                console.log('💾 已保存TABBAR狀態到localStorage:', stateData);
            }
        } catch (error) {
            console.warn('⚠️ 保存TABBAR狀態失敗:', error);
        }
    };

    /**
     * 恢復TABBAR選中狀態和最後使用的指令
     */
    ShortcutUI.prototype.restoreTabState = function() {
        try {
            let stateData = null;

            if (window.feedbackApp && window.feedbackApp.settingsManager) {
                stateData = window.feedbackApp.settingsManager.get('shortcutTabState');
            } else {
                // 回退到直接使用localStorage
                const saved = localStorage.getItem('shortcutTabState');
                stateData = saved ? JSON.parse(saved) : null;
            }

            if (stateData && typeof stateData === 'object') {
                const savedIndex = stateData.selectedIndex;
                const lastUsedPrompt = stateData.lastUsedPrompt;

                if (savedIndex !== null && savedIndex >= 0 && savedIndex < this.groups.length) {
                    this.switchToGroup(savedIndex);

                    // 如果有上次使用的指令內容，自動填入輸入框（但不保存狀態，避免循環）
                    if (lastUsedPrompt) {
                        setTimeout(() => {
                            this.insertShortcutWithoutSaving(lastUsedPrompt);
                        }, 100); // 延遲一點確保UI已渲染完成
                    }

                    console.log('🔄 已恢復TABBAR狀態和指令內容:', stateData);
                    return true;
                }
            }

            console.log('🔄 無有效的TABBAR狀態可恢復，使用默認第一個分組');
            return false;
        } catch (error) {
            console.warn('⚠️ 恢復TABBAR狀態失敗:', error);
            return false;
        }
    };

    /**
     * 獲取當前狀態
     */
    ShortcutUI.prototype.getState = function() {
        return {
            isRendered: this.isRendered,
            currentGroupIndex: this.currentGroupIndex,
            groupsCount: this.groups.length,
            currentGroup: this.groups[this.currentGroupIndex] || null
        };
    };

    /**
     * 銷毀UI管理器
     */
    ShortcutUI.prototype.destroy = function() {
        if (this.tabsContainer) {
            this.tabsContainer.innerHTML = '';
        }
        if (this.panelsContainer) {
            this.panelsContainer.innerHTML = '';
        }

        this.container = null;
        this.tabsContainer = null;
        this.panelsContainer = null;
        this.groups = [];
        this.isRendered = false;

        console.log('🗑️ ShortcutUI 已銷毀');
    };

    // 將 ShortcutUI 加入命名空間
    window.MCPFeedback.Shortcut.ShortcutUI = ShortcutUI;

    console.log('✅ ShortcutUI 模組載入完成');

})();
