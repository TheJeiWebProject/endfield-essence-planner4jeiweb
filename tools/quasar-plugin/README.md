# Endfield Planner Quasar Plugin

这是《明日方舟：终末地》基质规划器的现代化重构版本（Vue 3 + Quasar），旨在提供更佳的用户体验和性能。它既可以作为独立应用运行，也可以作为插件嵌入到其他站点中。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

启动开发服务器（支持热重载）：

```bash
pnpm --dir tools/quasar-plugin dev
```

### 3. 构建生产版本

构建过程会自动同步数据、拷贝 Legacy 资源并生成 CORS 配置文件：

```bash
pnpm --dir tools/quasar-plugin build
```

构建产物将输出到 `tools/quasar-plugin/dist` 目录。

## 构建流程说明

执行 `build` 命令时，会自动触发 `prebuild` 钩子，按顺序执行以下任务：

1.  **数据同步 (`sync:data`)**：
    *   执行 `scripts/sync-quasar-plugin-data.mjs`。
    *   将根目录 `data/*.js` 中的数据提取并转换为 JSON 格式。
    *   输出到 `tools/quasar-plugin/src/data/*.json`。
    *   确保插件使用最新的游戏数据。

2.  **资源拷贝 (`copy:legacy`)**：
    *   执行 `tools/quasar-plugin/scripts/copy-legacy-assets.mjs`。
    *   将根目录的 `css`, `js`, `data`, `image` 等静态资源拷贝到 `tools/quasar-plugin/public/legacy`。
    *   这是为了支持 Legacy 模式的回退，以及 Modern 模式下对图片资源的引用。

3.  **CORS 配置生成 (`generate:cors`)**：
    *   执行 `tools/quasar-plugin/scripts/generate-cors-config.mjs`。
    *   在 `public` 目录生成 `_headers` (Cloudflare Pages) 和 `edgeone.json` (EdgeOne Pages)。
    *   配置 `Access-Control-Allow-Origin: *` 以允许跨域嵌入。

## 部署指南

### Cloudflare Pages 配置

如果您计划将此插件部署到 Cloudflare Pages，请按照以下设置进行配置：

1.  **连接仓库**：选择您的 Git 仓库。
2.  **构建设置 (Build settings)**：
    *   **Framework preset**: `None`
    *   **Build command**: `pnpm run build`
    *   **Build output directory**: `dist`
    *   **Root directory**: `tools/quasar-plugin`
3.  **环境变量 (Environment variables)**：
    *   推荐设置 `NODE_VERSION`: `20` (或更高版本，以支持 node:fs/promises 等特性)

> 注意：Cloudflare Pages 会自动识别构建产物中的 `_headers` 文件，无需额外配置 CORS。

### EdgeOne Pages 配置

如果您使用腾讯云 EdgeOne Pages：

1.  **构建配置**：
    *   **Build command**: `pnpm run build`
    *   **Output directory**: `dist`
    *   **Root directory**: `tools/quasar-plugin`
2.  **配置文件**：
    *   构建过程会自动生成 `edgeone.json`，其中包含了 CORS 配置。
    *   EdgeOne 会读取此文件并应用 HTTP 响应头。

## 集成指南

### 目录结构

构建后的 `dist` 目录结构如下：

```
dist/
├── assets/             # 编译后的 JS/CSS/Font 资源
├── legacy/             # 旧版资源（包含图片、数据等）
├── _headers            # Cloudflare Pages 配置文件
├── edgeone.json        # EdgeOne Pages 配置文件
└── index.html          # 入口 HTML
```

### 部署与跨域 (CORS)

本插件设计为可被第三方站点嵌入。为了支持跨域加载资源（如字体、脚本），构建产物中已包含主流静态托管服务的 CORS 配置文件：

*   **Cloudflare Pages**: `_headers` 文件已配置 `Access-Control-Allow-Origin: *`。
*   **EdgeOne Pages**: `edgeone.json` 文件已配置 `Access-Control-Allow-Origin: *`。
*   **其他服务器 (Nginx/Apache)**: 请确保为所有静态资源添加 `Access-Control-Allow-Origin: *` 响应头。

### 嵌入方式 (Iframe)

可以通过 iframe 将规划器嵌入到任何网页中：

```html
<iframe
  src="https://your-deployment-url.com/?view=planner&embed=1"
  style="width: 100%; height: 800px; border: none;"
  allow="clipboard-read; clipboard-write"
></iframe>
```

### URL 参数详解

本插件支持丰富的 URL 参数来控制初始状态和行为。以下是完整的参数列表：

#### 基础控制

| 参数名 | 说明 | 可选值 / 格式 | 默认值 |
| :--- | :--- | :--- | :--- |
| **view** | 初始视图模式 | `planner` (基质规划)<br>`strategy` (角色攻略)<br>`match` (词条对照)<br>`gear-refining` (装备精锻)<br>`rerun-ranking` (复刻排行) | `planner` |
| **lang** | 界面语言 | `zh-CN` (简体中文)<br>`zh-TW` (繁体中文)<br>`en` (English)<br>`ja` (日本語) | `zh-CN` |
| **theme** | 颜色主题 | `auto` (跟随系统)<br>`light` (浅色)<br>`dark` (深色) | `auto` |
| **embed** | 嵌入模式 | `1` (开启，隐藏顶部导航栏、页脚等非必要 UI)<br>`0` (关闭) | `0` |
| **renderer** | 渲染引擎 | `legacy` (强制回退到旧版引擎)<br>不传 (默认使用 Modern 引擎) | Modern |

#### 场景示例

| 场景 | 推荐 URL 示例 | 说明 |
| :--- | :--- | :--- |
| **基质规划 (默认)** | `/?view=planner` | 进入默认的基质规划界面 |
| **基质规划 (带预选)** | `/?view=planner&weapons=莫奈何,长路` | 预先选中“莫奈何”和“长路”两把武器 |
| **角色攻略** | `/?view=strategy` | 直接进入角色攻略界面 |
| **词条对照** | `/?view=match&matchSource=莫奈何` | 进入词条对照界面，并指定“莫奈何”为源武器 |
| **装备精锻** | `/?view=gear-refining&gearName=天灾防护重甲` | 进入装备精锻界面，并指定“天灾防护重甲”为目标装备 |
| **旧版引擎** | `/?renderer=legacy` | 强制使用旧版 (Legacy) 渲染引擎 |
| **只读嵌入** | `/?view=planner&embed=1&readonly=1` | 以只读模式嵌入，隐藏 UI 且禁止修改 |

#### 数据与状态

| 参数名 | 说明 | 可选值 / 格式 | 示例 |
| :--- | :--- | :--- | :--- |
| **weapons** | 预选武器列表 | 逗号分隔的武器名称字符串 | `weapons=莫奈何,长路` |
| **readonly** | 只读模式 | `1` (开启，禁止用户修改已选武器或配置)<br>`0` (关闭) | `readonly=1` |
| **matchSource** | 词条对照源武器 | 武器名称 (仅在 `view=match` 时有效) | `matchSource=莫奈何` |
| **gearName** | 装备精锻目标装备 | 装备名称 (仅在 `view=gear-refining` 时有效) | `gearName=天灾防护重甲` |

#### 高级功能

| 参数名 | 说明 | 可选值 / 格式 |
| :--- | :--- | :--- |
| **api** | 启用 API 通信 | `1` (开启，允许通过 `window` 对象或 `postMessage` 进行交互) |

### API 调用

开启 `api=1` 参数后，可以通过 `postMessage` 或挂载的全局对象进行交互：

```javascript
// 获取当前状态
const state = window.EndfieldPlannerPlugin.call('getState');

// 设置状态
window.EndfieldPlannerPlugin.call('setState', { selectedWeapons: ['莫奈何'] });

// 获取推荐结果
const recommendations = window.EndfieldPlannerPlugin.call('getRecommendations');
```
