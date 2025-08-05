# 快捷指令功能迁移指南

## 概述

本指南将帮助您将快捷指令功能完整地迁移到您的项目中。快捷指令功能包括动态加载、TABBAR分组显示、状态记忆、多主题支持等特性。

## 前置要求

### 技术要求
- **JavaScript**: ES6+ 支持
- **CSS**: CSS变量、Flexbox支持
- **HTML**: 现代浏览器支持
- **API**: 支持CORS的快捷指令数据接口

### 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 迁移步骤

### 第一步：复制核心文件

1. **复制JavaScript模块**
   ```bash
   # 复制到你的项目中
   cp shortcuts-reference/complete-files/shortcut-manager.js your-project/js/modules/
   cp shortcuts-reference/complete-files/shortcut-ui.js your-project/js/modules/
   ```

2. **复制CSS样式**
   ```bash
   cp shortcuts-reference/complete-files/shortcuts.css your-project/css/
   ```

### 第二步：添加HTML结构

1. **在你的HTML模板中添加快捷指令容器**
   ```html
   <!-- 参考 code-snippets/html-structure.html -->
   <div class="shortcuts-container" id="shortcutsContainer">
       <div class="shortcuts-tabs" id="shortcutTabsContainer" role="tablist">
           <!-- 标签页将动态生成 -->
       </div>
       <div class="shortcuts-panels" id="shortcutPanelsContainer">
           <!-- 内容面板将动态生成 -->
       </div>
   </div>
   ```

2. **确保有目标输入框**
   ```html
   <textarea id="combinedFeedbackText" class="text-input" 
             placeholder="请输入您的反馈..." rows="6">
   </textarea>
   ```

### 第三步：引入CSS和JavaScript文件

1. **在HTML头部添加CSS引用**
   ```html
   <link rel="stylesheet" href="/css/shortcuts.css">
   ```

2. **在HTML底部添加JavaScript引用**
   ```html
   <script src="/js/modules/shortcut-manager.js"></script>
   <script src="/js/modules/shortcut-ui.js"></script>
   ```

### 第四步：定义CSS变量

在你的主CSS文件中定义必要的CSS变量：

```css
:root {
    /* 基础颜色 */
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #e9ecef;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --border-color: #dee2e6;
    --accent-color: #007bff;
    --error-color: #dc3545;
    --surface-color: #ffffff;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --bg-tertiary: #404040;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-color: #555555;
        --accent-color: #0d6efd;
        --error-color: #dc3545;
        --surface-color: #2d2d2d;
    }
}
```

### 第五步：集成到主应用

1. **确保命名空间存在**
   ```javascript
   // 在主应用初始化前添加
   window.MCPFeedback = window.MCPFeedback || {};
   window.MCPFeedback.Shortcut = window.MCPFeedback.Shortcut || {};
   
   // 确保Utils工具类存在
   window.MCPFeedback.Utils = window.MCPFeedback.Utils || {
       safeQuerySelector: function(selector) {
           try {
               return document.querySelector(selector);
           } catch (e) {
               console.error('Invalid selector:', selector, e);
               return null;
           }
       },
       escapeHtml: function(text) {
           const div = document.createElement('div');
           div.textContent = text;
           return div.innerHTML;
       }
   };
   ```

2. **在主应用中初始化快捷指令**
   ```javascript
   // 参考 code-snippets/app-integration.js
   function initializeShortcuts() {
       // 检查依赖
       if (!window.MCPFeedback || !window.MCPFeedback.Shortcut) {
           console.warn('快捷指令模块未加载');
           return;
       }

       // 创建管理器
       const shortcutManager = new window.MCPFeedback.Shortcut.ShortcutManager({
           enableCache: true,
           cacheTimeout: 300000
       });

       // 创建UI
       const shortcutUI = new window.MCPFeedback.Shortcut.ShortcutUI({
           feedbackInputSelector: '#combinedFeedbackText'
       });

       // 初始化
       shortcutManager.init();
       shortcutUI.init('#shortcutsContainer');

       // 设置回调
       shortcutManager.addLoadStartCallback(() => shortcutUI.showLoading());
       shortcutManager.addLoadSuccessCallback(data => shortcutUI.render(data.groups));
       shortcutManager.addLoadErrorCallback(error => shortcutUI.showError(error.message));

       // 加载数据
       shortcutManager.loadShortcuts();
   }

   // 在DOM加载完成后初始化
   document.addEventListener('DOMContentLoaded', initializeShortcuts);
   ```

### 第六步：配置API接口

1. **修改API地址**
   在 `shortcut-manager.js` 中修改API地址：
   ```javascript
   // 找到这一行并修改为你的API地址
   this.apiUrl = 'https://your-api-domain.com/api/shortcuts';
   ```

2. **API数据格式要求**
   确保你的API返回以下格式的数据：
   ```json
   [
       {
           "id": "agree",
           "name": "同意",
           "prompt": "- 我同意你的计划。",
           "group": "快捷回复",
           "order": 1
       },
       {
           "id": "disagree", 
           "name": "不同意",
           "prompt": "- 我不同意这个方案。",
           "group": "快捷回复",
           "order": 2
       }
   ]
   ```

   或者包装格式：
   ```json
   {
       "success": true,
       "data": [
           // 快捷指令数组
       ]
   }
   ```

### 第七步：添加国际化支持（可选）

1. **添加翻译文件**
   ```javascript
   // 参考 code-snippets/translations/ 目录下的文件
   const translations = {
       'zh-CN': {
           'shortcuts.title': '💬 快捷指令',
           'shortcuts.loading': '载入快捷指令中...',
           'shortcuts.empty': '暂无快捷指令'
       }
   };
   ```

2. **集成国际化管理器**
   ```javascript
   window.i18nManager = {
       t: function(key, defaultValue) {
           // 你的翻译逻辑
           return translations[currentLanguage][key] || defaultValue || key;
       }
   };
   ```

## 自定义配置

### 修改主题颜色

在 `shortcuts.css` 中修改颜色主题：

```css
:root {
    --theme-blue-primary: #3b82f6;
    --theme-green-primary: #10b981;
    --theme-orange-primary: #f59e0b;
    /* 添加更多主题颜色 */
}
```

### 修改输入框选择器

在初始化时指定不同的输入框：

```javascript
const shortcutUI = new window.MCPFeedback.Shortcut.ShortcutUI({
    feedbackInputSelector: '#your-textarea-id'
});
```

### 修改缓存设置

```javascript
const shortcutManager = new window.MCPFeedback.Shortcut.ShortcutManager({
    enableCache: true,
    cacheTimeout: 600000, // 10分钟
    timeout: 15000 // 15秒请求超时
});
```

## 测试验证

### 功能测试清单

- [ ] 快捷指令容器正确显示
- [ ] API数据成功加载
- [ ] TABBAR切换正常工作
- [ ] 快捷指令按钮点击有效
- [ ] 内容正确插入到输入框
- [ ] 状态记忆功能正常
- [ ] 错误状态正确显示
- [ ] 响应式布局适配

### 调试技巧

1. **检查控制台日志**
   快捷指令模块会输出详细的调试信息

2. **验证API接口**
   ```javascript
   fetch('your-api-url')
       .then(response => response.json())
       .then(data => console.log('API数据:', data));
   ```

3. **检查DOM结构**
   确保容器ID和选择器正确

## 常见问题

### Q: 快捷指令不显示？
A: 检查API地址是否正确，是否支持CORS，数据格式是否符合要求。

### Q: 样式显示异常？
A: 确保CSS变量已定义，检查CSS文件是否正确加载。

### Q: 点击按钮没有反应？
A: 检查输入框选择器是否正确，事件绑定是否成功。

### Q: 状态记忆不工作？
A: 确保localStorage可用，检查settingsManager是否正确集成。

## 进阶功能

### 添加自定义快捷指令

```javascript
// 动态添加快捷指令
shortcutManager.addCustomShortcut({
    id: 'custom1',
    name: '自定义指令',
    prompt: '这是一个自定义快捷指令',
    group: '自定义分组',
    order: 100
});
```

### 监听快捷指令事件

```javascript
shortcutManager.addDataChangeCallback(function(data) {
    console.log('快捷指令数据变更:', data);
});
```

---

完成以上步骤后，快捷指令功能应该能够在您的项目中正常工作。如有问题，请参考示例代码或检查控制台错误信息。
