# Endfield Planner Quasar Plugin

## 使用方式

```bash
pnpm install
pnpm run sync:plugin-data
pnpm --dir tools/quasar-plugin dev
```

## 架构说明

- 默认渲染引擎为 Modern（Vue 3 + Quasar 重构实现）。
- 支持通过页面开关切换到 Legacy 引擎，平时建议使用 Modern。
- 数据仅来源于 `data/*.js`，同步为 `src/data/*.json` 后由 TypeScript 模块消费。
- 视图模块包含：基质规划、角色攻略、词条对照、装备精锻、复刻排行。

## Legacy 资源同步

- `pnpm --dir tools/quasar-plugin run copy:legacy`
- `pnpm --dir tools/quasar-plugin build` 会在构建前自动执行拷贝。

## URL 参数

- `view=planner|strategy|match|gear-refining|rerun-ranking`
- `weapons=武器A,武器B`
- `lang=zh-CN|zh-TW|en|ja`
- `theme=light|dark|auto`
- `embed=1`
- `api=1`
- `readonly=1`
- `renderer=legacy`（不传即 Modern）

## 类 API 调用

开启 `api=1` 后支持：

```js
window.EndfieldPlannerPlugin.call('getState')
window.EndfieldPlannerPlugin.call('setState', { selectedWeapons: ['莫奈何'] })
window.EndfieldPlannerPlugin.call('getRecommendations')
```
