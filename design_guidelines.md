# Hobby 设计指南

## 品牌定位
- 应用名称：Hobby
- 定位：轻量、垂直、可沉淀的兴趣社交平台
- 风格：温暖工坊感 + 户外清冽感，拒绝冰冷的工具风格
- 目标用户：18-35岁兴趣爱好者

## 配色方案

### 主色板
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Primary | #F97316 | `bg-orange-500` / `text-orange-500` | 主按钮、Tab选中、强调 |
| Primary Deep | #C2410C | `bg-orange-700` | 深色强调、标题装饰 |
| Primary Light | #FFFBEB | `bg-amber-50` | 温暖背景块、选中态 |

### 中性色（Stone 色系，偏暖）
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Foreground | #1C1917 | `text-stone-900` | 主文本 |
| Muted | #78716C | `text-stone-500` | 次要文本 |
| Border | #F5F5F4 | `border-stone-100` | 分割线、微边框 |
| Background | #FAFAF9 | `bg-stone-50` | 页面背景 |
| Surface | #FFFFFF | `bg-white` | 卡片背景 |
| Surface Warm | #FFFBEB | `bg-amber-50` | 温暖色块背景 |

### 语义色
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Success | #16A34A | `bg-green-600` | 加入成功、已完成 |
| Warning | #CA8A04 | `bg-yellow-600` | 审核中、招募中 |
| Danger | #DC2626 | `bg-red-600` | 退出、删除 |
| Info | #2563EB | `bg-blue-600` | 提示、链接 |

## 字体规范
- H1: `text-2xl font-bold text-stone-900` — 页面标题
- H2: `text-lg font-semibold text-stone-900` — 区块标题
- H3: `text-base font-semibold text-stone-800` — 卡片标题
- Body: `text-sm text-stone-700 leading-relaxed` — 正文（宽松行高）
- Caption: `text-xs text-stone-500` — 辅助说明

## 间距系统
- 页面边距: `px-5`（比之前稍宽，呼吸感）
- 卡片内边距: `p-4` 到 `p-5`
- 组件间距: `gap-3`
- 区块间距: `space-y-4`，用留白代替边框分隔

## 容器样式
- 圆角: `rounded-2xl`（卡片）/ `rounded-full`（头像、标签、小按钮）
- 阴影: `shadow-sm`（卡片轻浮）/ `shadow-md`（悬浮按钮、弹窗）
- 边框: `border border-stone-100`（极轻边框，或无边框靠阴影分层）

## 组件使用原则
- 通用UI组件优先使用 `@/components/ui/*`
- 页面开发前先拆分UI单元，映射到组件库
- 禁止用 View/Text 手搓通用组件

## 导航结构
### TabBar 页面（4个）
1. 圈子广场 `pages/square/index` — 图标: Compass
2. 动态广场 `pages/messages/index` — 图标: Newspaper
3. 发布 `pages/publish/index` — 图标: PlusCircle（中间突出）
4. 我的 `pages/profile/index` — 图标: User

## 视觉亮点规范
- 页面顶部用渐变色块做视觉锚点：`bg-gradient-to-br from-orange-50 to-amber-50`
- 圈子卡片使用左侧色条装饰：`border-l-4 border-orange-400`
- 数字统计用大字+小标签组合，加 `tabular-nums`
- 列表项之间用 gap 而非 border 分隔
- 按钮有明确主次：主按钮 `bg-orange-500 text-white rounded-full`，次按钮 `bg-stone-100 text-stone-700 rounded-full`
- 悬浮操作按钮用 `rounded-full shadow-lg` + 微动画

## 状态展示
- 空状态: 居中暖色图标 + 说明文字 + 主色操作按钮
- 加载态: 使用 Skeleton 骨架屏
- 错误态: 轻提示 Toast

## 小程序约束
- 图片资源走 TOS 对象存储，仅 TabBar 图标使用本地 PNG
