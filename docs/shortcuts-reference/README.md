# 快捷指令功能参考指南

## 概述

本目录包含了 MCP Feedback Enhanced 项目中完整的快捷指令功能实现，包括所有相关的代码文件、样式、文档和配置。您可以使用这些文件作为参考，在其他项目中实现类似的快捷指令功能。

## 功能特性

### 核心功能
- **TABBAR分组显示**：根据API返回的group字段自动分组显示快捷指令
- **动态加载**：从远程API (https://mcp.lingmiaoai.com/api/shortcuts) 获取快捷指令数据
- **缓存机制**：5分钟本地缓存，提升性能
- **状态记忆**：记住用户选择的TABBAR位置和上次使用的指令
- **响应式设计**：支持桌面和移动设备
- **多语言支持**：支持中文简体、中文繁体、英文

### 交互特性
- **一键插入**：点击快捷指令按钮自动清空输入框并插入内容
- **光标定位**：插入后自动将光标移动到末尾新行
- **颜色主题**：不同分组使用不同颜色主题，便于区分
- **清空功能**：提供专门的清空输入按钮

## 文件结构

```
shortcuts-reference/
├── README.md                          # 本文件 - 迁移指南
├── complete-files/                    # 完整文件
│   ├── shortcut-manager.js           # 快捷指令管理器
│   ├── shortcut-ui.js                # 快捷指令UI组件
│   ├── shortcuts.css                 # 快捷指令样式
│   └── documentation/                # 相关文档
│       ├── implementation-plan.md    # 实现计划
│       └── optimization-details.md   # 优化细节
├── code-snippets/                    # 代码片段
│   ├── html-structure.html           # HTML结构片段
│   ├── app-integration.js            # 主应用集成代码
│   └── translations/                 # 国际化翻译
│       ├── zh-CN.json               # 中文简体
│       ├── zh-TW.json               # 中文繁体
│       └── en.json                  # 英文
└── migration-guide.md               # 详细迁移指南
```

## 技术架构

### 数据流
1. **ShortcutManager** 负责从API获取数据、缓存管理、错误处理
2. **ShortcutUI** 负责UI渲染、事件处理、状态管理
3. **主应用** 负责初始化和集成

### API数据格式
```json
{
  "id": "agree",
  "name": "同意", 
  "prompt": "- 我同意你的计划。",
  "group": "快捷回复",
  "order": 1
}
```

### 核心类和方法

#### ShortcutManager
- `loadShortcuts(forceReload)` - 加载快捷指令数据
- `generateGroups()` - 生成分组数据
- `getAllShortcuts()` - 获取所有快捷指令
- `getShortcutsByGroup(groupName)` - 按分组获取快捷指令

#### ShortcutUI
- `init(containerSelector)` - 初始化UI
- `render(groups)` - 渲染快捷指令界面
- `insertShortcut(prompt)` - 插入快捷指令到输入框
- `switchToGroup(groupIndex)` - 切换分组
- `saveTabState()` / `restoreTabState()` - 状态记忆

## 依赖要求

### JavaScript依赖
- ES6+ 支持
- Promise API
- Fetch API
- localStorage API

### CSS依赖
- CSS变量支持
- Flexbox布局
- CSS Grid（可选）

### HTML要求
- 现代浏览器支持
- 事件委托机制

## 快速开始

1. 复制 `complete-files/` 目录下的所有文件到你的项目
2. 参考 `code-snippets/html-structure.html` 添加HTML结构
3. 参考 `code-snippets/app-integration.js` 集成到主应用
4. 根据需要修改API地址和样式主题
5. 添加国际化翻译（可选）

详细的迁移步骤请参考 `migration-guide.md`。

## 注意事项

- API地址需要支持CORS
- 确保目标输入框的选择器正确
- 样式变量需要在主CSS中定义
- 建议在生产环境中添加错误监控

## 版本信息

- 创建时间：2025-06-19
- 最后更新：2025-06-19
- 兼容性：现代浏览器 (Chrome 60+, Firefox 55+, Safari 12+)
- 依赖版本：无外部依赖，纯原生JavaScript实现
