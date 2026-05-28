# Hobby 产品需求文档 (PRD)

> 版本：v1.0  
> 更新日期：2025-01-28  
> 产品定位：轻量、垂直、可沉淀的兴趣社交平台

---

## 一、产品概述

### 1.1 产品愿景

Hobby 是一款以兴趣圈子为核心的微信小程序，帮助用户发现同好、沉淀兴趣知识、组织线下活动。区别于泛社交平台，Hobby 聚焦于"兴趣内容沉淀 + 真实搭子社交"，让每个爱好都有归属地。

### 1.2 目标用户

| 用户群 | 特征 | 核心诉求 |
|--------|------|---------|
| 兴趣爱好者 | 有明确爱好（滑雪、骑行、读书等） | 找到圈子、获取知识、找人一起玩 |
| 圈子主理人 | 圈子创建者/核心组织者 | 管理圈子、沉淀资料、组织活动 |
| 平台管理员 | 运营团队 | 审批圈子、管理内容、维护秩序 |

### 1.3 核心价值

- **知识沉淀**：每个圈子拥有结构化资料库（排行榜/图集/列表），避免知识碎片化
- **真实社交**：找搭子功能连接线上与线下，安全须知保障活动安全
- **轻量体验**：微信一键登录，即用即走，零门槛上手

---

## 二、信息架构

```
Hobby
├── 圈子广场（TabBar 首页）
│   ├── 全部圈子（分类筛选 + 搜索）
│   ├── 我的圈子（已加入）
│   └── 创建圈子（申请入口）
├── 发布（TabBar）
│   ├── 发布动态（选圈子 → 图文帖子）
│   ├── 找搭子（选圈子 → 发布活动）
│   └── 补充资料（选圈子 → 提交纠错）
├── 消息（TabBar）
│   ├── 系统通知
│   ├── 互动消息（评论/点赞）
│   └── 通知设置（免打扰）
├── 我的（TabBar）
│   ├── 个人信息（头像/昵称/兴趣标签）
│   ├── 已加入圈子
│   ├── 历史动态
│   ├── 我的圈子申请
│   ├── 管理员入口（管理员可见）
│   └── 联系客服
├── 圈子详情页
│   ├── 资料库Tab（排行榜/图集/列表模板）
│   ├── 动态Tab（帖子Feed + 互动）
│   └── 找搭子Tab（活动列表 + 报名）
├── 管理员后台
│   ├── 概览统计
│   ├── 圈子管理（CRUD）
│   ├── 资料库管理（模板编辑）
│   ├── 圈子审批（通过/驳回）
│   ├── 举报审核
│   ├── 关键词管理
│   └── 用户管理
└── 子页面
    ├── 帖子详情（二级评论）
    ├── 活动详情（报名/状态流转）
    ├── 资料详情（参数表格/图文）
    ├── 搜索页
    └── 编辑资料页
```

---

## 三、功能需求详述

### 3.1 用户认证与个人信息

#### 3.1.1 微信一键授权登录

| 项目 | 说明 |
|------|------|
| 触发方式 | 首次进入小程序自动弹出 / 点击"微信登录"按钮 |
| 获取信息 | 昵称、头像、openid（静默获取） |
| 登录流程 | `wx.login()` 获取 code → 后端换取 openid → 创建/查询用户 → 返回用户信息 |
| 登录态 | 本地存储用户信息 + Zustand 状态管理 |
| H5兼容 | H5环境展示登录按钮，模拟登录流程 |

#### 3.1.2 个人主页

| 模块 | 说明 |
|------|------|
| 头像与昵称 | 展示微信头像和昵称，支持点击编辑 |
| 兴趣标签 | 可编辑的兴趣标签列表，用于推荐与匹配 |
| 已加入圈子 | 展示已加入的圈子列表（名称、成员数） |
| 历史动态 | 用户发布的帖子列表 |
| 我的圈子申请 | 展示创建圈子的申请记录及审批状态 |
| 管理员入口 | 仅 role=admin 的用户可见，跳转管理后台 |
| 联系客服 | 小程序环境唤起微信客服会话，H5展示提示 |

#### 3.1.3 编辑资料页

- 修改昵称（TextInput）
- 修改兴趣标签（可添加/删除，预设标签 + 自定义输入）
- 保存后即时更新个人主页

---

### 3.2 圈子广场

#### 3.2.1 双Tab布局

| Tab | 内容 | 数据源 |
|-----|------|--------|
| 全部 | 所有圈子列表，支持分类筛选 | `GET /api/circles?category=&keyword=&user_id=` |
| 我的 | 当前用户已加入的圈子 | `GET /api/users/circles?user_id=` |

#### 3.2.2 圈子卡片信息

每张圈子卡片展示：
- 圈子名称
- 圈子描述（截断展示）
- 分类标签（运动/户外/文化/生活等）
- 成员数量
- 活跃度标识
- 加入/已加入按钮（根据 `is_joined` 状态切换）

#### 3.2.3 分类筛选

- 顶部横向滚动分类标签：全部 / 运动 / 户外 / 文化 / 生活
- 选中分类后筛选对应圈子列表

#### 3.2.4 搜索

- 点击搜索栏跳转搜索页
- 支持按圈子名称和标签关键词搜索
- 搜索结果展示圈子卡片列表

#### 3.2.5 加入/退出圈子

| 操作 | 接口 | 行为 |
|------|------|------|
| 加入 | `POST /api/circles/join` | 写入 circle_members，圈子 member_count+1，提示"加入成功" |
| 退出 | `POST /api/circles/leave` | 删除 circle_members 记录，圈子 member_count-1，提示"已退出" |
| 重复加入 | 后端校验 | 返回友好提示"已加入该圈子" |

退出后停止接收该圈子的动态与通知。

#### 3.2.6 创建圈子

- 广场页右上角"+"按钮 → 创建圈子页面
- 填写：圈子名称、描述、分类、标签
- 提交后进入审核状态，提示"已提交审核"
- 管理员审批通过后：
  - 自动创建圈子
  - 申请人自动成为圈子主理人（owner）
  - 申请人自动加入圈子
- 管理员驳回需填写原因，用户可在"我的圈子申请"中查看

---

### 3.3 圈子详情页

#### 3.3.1 页面结构

顶部展示圈子基本信息（名称、描述、成员数、分类标签），下方三个Tab切换。

#### 3.3.2 资料库Tab

**模板类型**：

| 模板类型 | template_type | 展示形式 | 典型场景 |
|---------|---------------|---------|---------|
| 排行榜 | `ranking` | 编号 + 评分 + 排名卡片 | 最佳雪场排行、热门骑行路线 |
| 图集 | `gallery` | 图片 + 标题 + 副标题卡片网格 | 滑雪品牌图集、骑行用品图集 |
| 列表 | `list` | 标题 + 标签 + 副标题列表 | 滑雪必备装备清单、骑行装备清单 |

**数据结构**（template_data JSON）：

```jsonc
// ranking 排行榜
{ "items": [{ "rank": 1, "title": "北大壶滑雪场", "subtitle": "吉林", "score": 98, "detail": "亚洲顶级滑雪场" }] }

// gallery 图集
{ "items": [{ "title": "Burton", "subtitle": "单板之王", "image_url": "https://..." }] }

// list 列表
{ "items": [{ "title": "滑雪板", "subtitle": "双板/单板", "tags": ["必备"] }] }
```

**管理权限**：
- 管理员：通过后台创建/编辑/删除资料模板
- 普通用户：可提交补充/纠错（进入审核队列，管理员审批后生效）

**资料详情页**：
- 排行榜详情：完整排名、评分说明、详细介绍
- 图集详情：大图展示、品牌介绍、外部链接
- 列表详情：参数表格、购买建议、备注

#### 3.3.3 动态Feed Tab

**发帖功能**：

| 项目 | 说明 |
|------|------|
| 内容类型 | 纯文本 / 图文（最多9张图片） |
| 话题标签 | 可添加自定义话题标签 |
| 草稿保存 | 支持保存草稿，下次继续编辑 |
| 发布流程 | 选择圈子 → 编写内容 → 发布 |

**帖子展示**：
- 帖子卡片：作者头像/昵称、内容、图片网格、话题标签、时间
- 互动数据：点赞数、评论数

**排序方式**：
- 最新：按发布时间倒序
- 热门：综合互动量 + 时间衰减算法排序

**互动功能**：
- 点赞：`POST /api/posts/like`，取消点赞再点取消
- 评论：支持二级楼中楼评论
- 分享：小程序原生分享

#### 3.3.4 找搭子Tab

**活动发布**：

| 字段 | 说明 | 必填 |
|------|------|------|
| 活动标题 | 简短描述活动 | 是 |
| 活动描述 | 详细说明 | 是 |
| 活动时间 | 日期+时间 | 是 |
| 活动地点 | 地点名称 | 是 |
| 水平要求 | 入门/进阶/不限 | 否 |
| 人数上限 | 最大参与人数 | 是 |
| 费用说明 | 费用明细 | 否 |
| 自动通过 | 报名是否需审核 | 是（默认否） |
| 紧急联系人 | 电话号码 | 是 |
| 安全须知 | 发布前强制阅读并勾选同意 | 是（强制） |

**活动状态流转**：

```
招募中 → 已满员（人数达上限）
招募中 → 已取消（发起人取消）
已满员 → 已完成（活动时间已过）
```

**报名流程**：
1. 用户点击"我要报名"
2. 如需审核：提交报名申请，等待发起人审批
3. 如自动通过：直接报名成功
4. 报名成功后可查看活动详情和参与人列表

**安全须知**：
- 每次发布活动前必须阅读安全须知
- 必须勾选"我已阅读并同意安全须知"才能发布
- 安全须知内容：活动风险提示、免责声明、紧急联系方式

---

### 3.4 发布中心

#### 3.4.1 入口

TabBar"发布"按钮 → 发布中心页面，展示三个功能卡片。

#### 3.4.2 发布动态

- 点击卡片 → 进入发布动态页面
- 选择已加入的圈子
- 编写帖子内容（文字 + 最多9张图片 + 话题标签）
- 发布成功后跳转到该圈子动态Tab

#### 3.4.3 找搭子

- 点击卡片 → 进入发布活动页面
- 选择已加入的圈子
- 填写活动信息（见3.3.4）
- 发布成功后跳转到该圈子找搭子Tab

#### 3.4.4 补充资料

- 点击卡片 → 进入提交纠错页面
- 选择已加入的圈子
- 选择资料模板
- 填写补充/纠错内容
- 提交后进入审核队列

---

### 3.5 消息通知

#### 3.5.1 消息中心

统一展示所有通知，按时间倒序排列：

| 消息类型 | 触发场景 | 图标 |
|---------|---------|------|
| 评论通知 | 有人评论你的帖子 | 💬 |
| 点赞通知 | 有人点赞你的帖子 | ❤️ |
| 报名通知 | 有人报名你的活动 | 🙋 |
| 审批通知 | 圈子申请通过/驳回 | ✅/❌ |
| 系统公告 | 平台公告 | 📢 |

#### 3.5.2 通知设置

- 按圈子设置免打扰
- 按通知类型设置免打扰
- 存储在 `notification_settings` 表中

#### 3.5.3 微信订阅消息（规划中）

- 评论通知推送
- 活动报名推送
- 圈子公告推送
- 需微信后台申请订阅消息模板

---

### 3.6 客服功能

| 项目 | 说明 |
|------|------|
| 入口 | 个人主页"联系客服"按钮 |
| 小程序端 | 使用 `<Button openType="contact">` 唤起微信客服对话 |
| H5端 | 展示"请在小程序中联系客服"提示 |
| 后端 | 接收微信消息回调，支持自动回复和人工回复 |
| 消息记录 | 存储在数据库中，管理员可查看 |

**微信后台配置**：
- URL：`https://<域名>/api/customer-service/callback`
- Token：环境变量 `WX_CS_TOKEN`
- 消息加解密方式：明文模式

---

### 3.7 管理员后台

#### 3.7.1 登录

- 独立管理员登录页面（用户名 + 密码）
- 账号密码从环境变量读取，不硬编码在前端
- 登录后跳转管理后台

#### 3.7.2 概览面板

| 统计项 | 数据源 |
|--------|--------|
| 圈子总数 | circles 表 count |
| 用户总数 | users 表 count |
| 帖子总数 | posts 表 count |
| 待处理举报 | reports 表 status=pending count |
| 资料模板数 | resources 表 count |

#### 3.7.3 圈子管理

| 操作 | 接口 | 说明 |
|------|------|------|
| 创建圈子 | `POST /api/admin/circles` | 直接创建（不经过审批） |
| 编辑圈子 | `PUT /api/admin/circles/:id` | 修改名称/描述/标签 |
| 删除圈子 | `DELETE /api/admin/circles/:id` | 软删除 |

#### 3.7.4 资料库管理

| 操作 | 接口 | 说明 |
|------|------|------|
| 创建模板 | `POST /api/admin/resources` | 选择模板类型 + 填写内容 |
| 编辑模板 | `PUT /api/admin/resources/:id` | 修改模板数据 |
| 删除模板 | `DELETE /api/admin/resources/:id` | 删除模板 |
| 排序 | `sort_order` 字段 | 控制资料库展示顺序 |

**模板编辑页面**：
- 排行榜：可添加/删除/排序排名项（名称、副标题、评分、详情）
- 图集：可添加/删除图集项（名称、副标题、图片URL）
- 列表：可添加/删除列表项（名称、副标题、标签）

#### 3.7.5 圈子审批

| 操作 | 接口 | 说明 |
|------|------|------|
| 待审批列表 | `GET /api/admin/circle-applications` | 按状态筛选 |
| 通过 | `PUT /api/admin/applications/:id/approve` | 自动创建圈子+主理人 |
| 驳回 | `PUT /api/admin/applications/:id/reject` | 需填写驳回原因 |

审批通过后的自动化操作：
1. 在 circles 表创建新圈子
2. 设置 owner_id 为申请人
3. 在 circle_members 表添加申请人（role=owner）
4. 更新申请状态为 approved
5. 发送通知给申请人

#### 3.7.6 举报审核

- 查看举报列表（举报人、被举报内容、原因、时间）
- 处理举报：通过（删除违规内容）/ 驳回
- 举报类型：帖子/评论/用户

#### 3.7.7 关键词管理

- 添加/删除过滤关键词
- 发帖和评论时自动过滤含关键词的内容

#### 3.7.8 用户管理

- 查看用户列表
- 修改用户角色（user/admin）

---

### 3.8 内容治理

#### 3.8.1 关键词过滤

- 后端维护 `blocked_keywords` 表
- 发帖/评论时检测内容是否包含过滤词
- 包含则拦截并提示"内容包含违规信息"

#### 3.8.2 用户举报

- 帖子详情页/评论处提供"举报"按钮
- 选择举报原因（不当内容/广告/骚扰/其他）
- 提交后进入管理员审核队列

#### 3.8.3 主理人管理权限

- 主理人可删除圈子内的帖子
- 主理人可管理圈子活动

#### 3.8.4 微信内容安全API（规划中）

- 接入微信内容安全检测接口
- 自动拦截违规内容
- 辅以人工复审

#### 3.8.5 免责声明

- 各UGC页面底部固定展示免责声明、隐私政策与用户协议链接
- 发活动前强制阅读安全须知

---

## 四、数据库设计

### 4.1 核心表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| users | 用户表 | openid, nickname, avatar_url, role(user/admin), interest_tags |
| circles | 圈子表 | name, description, category, tags, member_count, owner_id |
| circle_members | 圈子成员表 | circle_id, user_id, role(member/owner) |
| circle_applications | 圈子申请表 | applicant_id, name, description, category, tags, status, reject_reason |
| posts | 帖子表 | circle_id, user_id, content, images, tags, like_count, comment_count |
| post_likes | 点赞表 | post_id, user_id |
| comments | 评论表 | post_id, user_id, content, parent_id（二级评论） |
| activities | 活动表 | circle_id, user_id, title, activity_time, location, max_participants, status, safety_agreed, emergency_contact |
| activity_registrations | 活动报名表 | activity_id, user_id, status, auto_approved |
| resources | 资料模板表 | circle_id, title, template_type(ranking/gallery/list), template_data(JSON), description, sort_order |
| resource_submissions | 资料提交表 | resource_id, user_id, content, status |
| messages | 消息表 | user_id, type, title, content, is_read |
| notification_settings | 通知设置表 | user_id, circle_id, type, muted |
| reports | 举报表 | reporter_id, target_type, target_id, reason, status |
| blocked_keywords | 过滤关键词表 | keyword |
| drafts | 草稿表 | user_id, type, content |

### 4.2 关键关系

```
users 1──N circle_members N──1 circles
users 1──N posts N──1 circles
users 1──N activities N──1 circles
circles 1──N resources
circles 1──N circle_applications
posts 1──N comments (parent_id 支持二级)
posts 1──N post_likes
activities 1──N activity_registrations
```

---

## 五、API设计

### 5.1 认证模块 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 微信登录（code → openid） |

### 5.2 用户模块 `/api/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /profile?user_id= | 获取用户信息 |
| PUT | /profile | 更新用户信息 |
| GET | /circles?user_id= | 获取用户已加入圈子 |
| GET | /posts?user_id= | 获取用户历史帖子 |

### 5.3 圈子模块 `/api/circles`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /?category=&keyword=&user_id= | 圈子列表（含is_joined） |
| GET | /:id?user_id= | 圈子详情 |
| POST | /join | 加入圈子 |
| POST | /leave | 退出圈子 |
| POST | /apply | 申请创建圈子 |
| GET | /my-applications?user_id= | 我的圈子申请 |

### 5.4 帖子模块 `/api/posts`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /?circle_id=&sort= | 帖子列表（latest/hot） |
| POST | / | 发布帖子 |
| GET | /:id | 帖子详情 |
| POST | /like | 点赞/取消点赞 |
| POST | /:id/comments | 发表评论 |
| GET | /:id/comments | 评论列表 |

### 5.5 活动模块 `/api/activities`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /?circle_id= | 活动列表 |
| POST | / | 发布活动 |
| GET | /:id | 活动详情 |
| POST | /:id/register | 报名活动 |
| PUT | /:id/status | 更新活动状态 |

### 5.6 资料库模块 `/api/resources`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /circle/:circleId | 获取圈子资料模板列表 |
| GET | /:id | 资料详情 |
| POST | /submissions | 提交补充/纠错 |

### 5.7 消息模块 `/api/messages`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /?user_id= | 消息列表 |
| PUT | /:id/read | 标记已读 |
| GET | /unread-count?user_id= | 未读数 |

### 5.8 管理员模块 `/api/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 管理员登录 |
| GET | /check?user_id= | 检查管理员身份 |
| GET | /stats | 概览统计 |
| POST | /circles | 创建圈子 |
| PUT | /circles/:id | 编辑圈子 |
| DELETE | /circles/:id | 删除圈子 |
| POST | /resources | 创建资料模板 |
| PUT | /resources/:id | 编辑资料模板 |
| DELETE | /resources/:id | 删除资料模板 |
| GET | /circle-applications | 圈子申请列表 |
| PUT | /applications/:id/approve | 通过申请 |
| PUT | /applications/:id/reject | 驳回申请 |
| GET | /reports | 举报列表 |
| PUT | /reports/:id | 处理举报 |
| GET | /keywords | 关键词列表 |
| POST | /keywords | 添加关键词 |
| DELETE | /keywords/:id | 删除关键词 |
| POST | /content-check | 内容安全检测 |

### 5.9 客服模块 `/api/customer-service`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /callback | 微信签名验证 |
| POST | /callback | 接收用户消息 |
| GET | /messages?openid= | 用户消息记录 |
| POST | /send | 管理员发送消息 |
| GET | /admin/messages | 所有客服消息 |

---

## 六、页面清单

### 6.1 TabBar页面

| 页面 | 路径 | TabBar图标 |
|------|------|-----------|
| 圈子广场 | pages/square/index | Compass |
| 发布 | pages/publish/index | PlusCircle |
| 消息 | pages/messages/index | Bell |
| 我的 | pages/profile/index | User |

### 6.2 子页面

| 页面 | 路径 | 入口 |
|------|------|------|
| 登录 | pages/login/index | 未登录时 |
| 圈子详情 | pages/circle-detail/index | 圈子卡片 |
| 帖子详情 | pages/post-detail/index | 帖子卡片 |
| 活动详情 | pages/activity-detail/index | 活动卡片 |
| 资料详情 | pages/resource-detail/index | 资料卡片 |
| 编辑资料 | pages/edit-profile/index | 个人主页 |
| 搜索 | pages/search/index | 广场搜索栏 |
| 创建圈子 | pages/create-circle/index | 广场"+"按钮 |
| 发布动态 | pages/publish-post/index | 发布中心 |
| 找搭子 | pages/publish-activity/index | 发布中心 |
| 补充资料 | pages/submit-resource/index | 发布中心 |

### 6.3 管理员页面

| 页面 | 路径 | 入口 |
|------|------|------|
| 管理员登录 | pages/admin-login/index | 个人主页 |
| 管理后台 | pages/admin/index | 管理员登录后 |
| 资料模板编辑 | pages/admin-resource-edit/index | 管理后台 |

---

## 七、设计规范

### 7.1 配色方案

| 用途 | 色值 | Tailwind类 |
|------|------|-----------|
| 主色/强调 | #F97316 | orange-500 |
| 主色浅 | #FFF7ED | orange-50 |
| 辅助色 | #14B8A6 | teal-500 |
| 文字主色 | #171717 | neutral-900 |
| 文字次色 | #737373 | neutral-500 |
| 背景色 | #FAFAFA | neutral-50 |
| 卡片色 | #FFFFFF | white |
| 边框色 | #E5E5E5 | neutral-200 |

### 7.2 组件选型原则

- 通用UI组件优先使用 `@/components/ui/*`（Button/Input/Card/Tabs/Badge/Dialog/Toast等）
- 禁止用 View/Text 手搓按钮、输入框、弹窗等通用组件
- 图标使用 `lucide-react-taro`，通过 `color/size` 属性控制样式

### 7.3 跨端兼容

- 垂直排列的 Text 必须添加 `block` 类
- Input/Textarea 必须 View 包裹，样式放外层
- Fixed+Flex 布局使用 inline style
- 底部固定元素 `bottom: 50+` 避开 TabBar
- 原生组件需平台检测降级

---

## 八、非功能需求

### 8.1 性能

- 首屏加载时间 ≤ 2秒
- 列表滚动流畅（使用虚拟列表优化长列表）
- 图片懒加载

### 8.2 安全

- 管理员账号密码存储在环境变量，不硬编码
- 所有数据库表启用 RLS（Row Level Security）
- 内容安全检测（关键词过滤 + 微信内容安全API）
- 用户数据加密存储

### 8.3 隐私

- 各UGC页面底部展示免责声明、隐私政策、用户协议链接
- 发布活动前强制阅读安全须知
- 不开放用户间私信功能
- 通知支持免打扰设置

---

## 九、待规划功能

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 微信订阅消息推送 | P1 | 评论/报名/公告实时推送 |
| 微信内容安全API | P1 | 自动拦截违规内容 |
| 主理人专属功能 | P2 | 圈子管理、资料库编辑、成员管理 |
| 草稿箱 | P2 | 帖子/活动草稿保存与恢复 |
| 兴趣推荐算法 | P3 | 基于标签匹配推荐圈子 |
| 热门排序优化 | P3 | 互动量+时间衰减算法 |
| 资料库地图定位 | P3 | 雪场/路线地图标注 |
| 外部链接跳转 | P3 | 资料详情中的商品/官网链接 |
