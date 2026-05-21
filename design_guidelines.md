# Hobby 设计指南

## 品牌定位
- 应用名称：Hobby
- 定位：轻量、垂直、可沉淀的兴趣社交平台
- 风格：活泼亲和、简洁现代、温暖社交感
- 目标用户：18-35岁兴趣爱好者

## 配色方案

### 主色板
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Primary | #F97316 | `bg-orange-500` / `text-orange-500` | 主按钮、Tab选中、强调 |
| Primary Hover | #EA580C | `bg-orange-600` | 按钮hover |
| Primary Light | #FFF7ED | `bg-orange-50` | 背景浅色块、选中态背景 |

### 中性色
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Foreground | #171717 | `text-neutral-900` | 主文本 |
| Muted | #737373 | `text-neutral-500` | 次要文本 |
| Border | #E5E5E5 | `border-neutral-200` | 分割线 |
| Background | #FFFFFF | `bg-white` | 页面背景 |
| Surface | #FAFAFA | `bg-neutral-50` | 卡片背景 |

### 语义色
| 角色 | 色值 | Tailwind 类名 | 用途 |
|------|------|--------------|------|
| Success | #22C55E | `bg-green-500` | 加入成功、已完成 |
| Warning | #EAB308 | `bg-yellow-500` | 审核中、招募中 |
| Danger | #EF4444 | `bg-red-500` | 退出、删除、举报 |
| Info | #3B82F6 | `bg-blue-500` | 提示、链接 |

## 字体规范
- H1: `text-2xl font-bold` — 页面标题
- H2: `text-xl font-semibold` — 区块标题
- H3: `text-lg font-semibold` — 卡片标题
- Body: `text-sm` — 正文内容
- Caption: `text-xs text-neutral-500` — 辅助说明

## 间距系统
- 页面边距: `px-4`
- 卡片内边距: `p-4`
- 组件间距: `gap-3`
- 区块间距: `mb-4` / `space-y-4`

## 容器样式
- 圆角: `rounded-xl`（卡片）/ `rounded-full`（头像、标签）
- 阴影: `shadow-sm`（卡片）
- 边框: `border border-neutral-200`

## 组件使用原则
- 通用UI组件（Button/Input/Card/Badge/Tabs/Dialog/Toast/Skeleton等）优先使用 `@/components/ui/*`
- 页面开发前先拆分UI单元，映射到组件库
- 禁止用 View/Text 手搓通用组件

## 导航结构
### TabBar 页面（4个）
1. 圈子广场 `pages/square/index` — 图标: Compass
2. 消息 `pages/messages/index` — 图标: Bell
3. 发布 `pages/publish/index` — 图标: PlusCircle（中间突出）
4. 我的 `pages/profile/index` — 图标: User

### 非 TabBar 页面
- `pages/login/index` — 登录页
- `pages/circle-detail/index` — 圈子详情（3个Tab：资料库/动态/找搭子）
- `pages/post-detail/index` — 帖子详情（含评论楼中楼）
- `pages/activity-detail/index` — 活动详情
- `pages/edit-profile/index` — 编辑个人资料
- `pages/resource-detail/index` — 资料详情页
- `pages/search/index` — 搜索页

## 状态展示
- 空状态: 居中图标 + 说明文字 + 操作按钮
- 加载态: 使用 Skeleton 骨架屏
- 错误态: 轻提示 Toast

## 小程序约束
- 图片资源走 TOS 对象存储，仅 TabBar 图标使用本地 PNG
- TabBar 图标尺寸 81px
- 避免大图片资源打入包内
