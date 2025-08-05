# 快捷指令TABBAR功能实现计划

## 项目背景
在MCP Feedback Enhanced的GUI反馈界面中实现快捷指令TABBAR功能，将现有的"提供反馈"区域改造为快捷指令区域，通过TABBAR形式展示不同分组的快捷指令按钮。

## 技术方案
- **技术栈**: HTML5 + CSS3 + JavaScript (ES6+)
- **架构**: 基于现有的模块化架构
- **API地址**: https://mcp.lingmiaoai.com/api/shortcuts (固定地址)
- **数据结构**: 
  ```json
  {
    "id": "agree",
    "name": "同意", 
    "prompt": "- 我同意你的计划。",
    "group": "快捷回复",
    "order": 1
  }
  ```

## 核心功能需求
1. 将"提供反馈"标题改为"快捷指令"
2. 将等待反馈状态指示器区域改造为快捷指令显示区域
3. 实现TABBAR分组显示，根据API返回的group字段分组
4. 点击快捷指令按钮时，将内容替换到反馈输入区并移动光标到末尾新行
5. 支持响应式设计和错误处理

## 实施计划

### 阶段1: 核心模块开发
1. **创建ShortcutManager核心模块**
   - 文件: `src/mcp_feedback_enhanced/web/static/js/modules/shortcut-manager.js`
   - 功能: API调用、数据缓存、错误处理
   - 方法: `loadShortcuts()`, `groupShortcuts()`, `getShortcuts()`

2. **修改HTML模板结构**
   - 文件: `src/mcp_feedback_enhanced/web/templates/feedback.html`
   - 修改: 第570行标题，第576-582行状态指示器区域
   - 新增: 快捷指令容器结构

### 阶段2: 样式和交互
3. **实现CSS样式设计**
   - 文件: `src/mcp_feedback_enhanced/web/static/css/shortcuts.css`
   - 内容: TABBAR样式、按钮样式、响应式布局

4. **实现UI渲染和交互逻辑**
   - 功能: 动态TABBAR渲染、分组显示、按钮点击事件
   - 集成: 内容插入到 `#combinedFeedbackText` 输入框

### 阶段3: 集成和优化
5. **集成到主应用**
   - 文件: `src/mcp_feedback_enhanced/web/static/js/app.js`
   - 集成: 在应用初始化流程中添加快捷指令功能

6. **添加国际化和测试优化**
   - 文件: `src/mcp_feedback_enhanced/web/locales/*/translation.json`
   - 内容: 添加快捷指令相关翻译
   - 测试: 功能测试、响应式测试、兼容性测试

## 关键技术点
- 使用 fetch API 调用远程接口
- 使用 Promise 处理异步操作  
- 使用事件委托处理动态生成的按钮
- 使用 CSS Grid/Flexbox 实现响应式布局
- 光标位置处理和文本插入逻辑

## 文件清单
- `src/mcp_feedback_enhanced/web/static/js/modules/shortcut-manager.js` (新建)
- `src/mcp_feedback_enhanced/web/static/css/shortcuts.css` (新建)  
- `src/mcp_feedback_enhanced/web/templates/feedback.html` (修改)
- `src/mcp_feedback_enhanced/web/static/js/app.js` (修改)
- `src/mcp_feedback_enhanced/web/locales/*/translation.json` (修改)

## 测试策略
1. **单元测试**: API调用、数据解析、分组逻辑
2. **集成测试**: 模块集成、事件处理、UI交互  
3. **手动测试**: TABBAR切换、按钮点击、内容插入、响应式布局

## 风险控制
- API不可用时的降级处理
- 与现有提示词功能的兼容性
- 性能优化和内存泄漏防护
- 浏览器兼容性保证

---
*创建时间: 2025-06-19 02:19*
*状态: 计划阶段完成，准备开始执行*
