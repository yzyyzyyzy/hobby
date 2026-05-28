import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// System table - DO NOT DELETE
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ===== Users =====
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  openid: varchar("openid", { length: 128 }).notNull().unique(),
  nickname: varchar("nickname", { length: 64 }).notNull().default("Hobby用户"),
  avatar_url: text("avatar_url"),
  interest_tags: jsonb("interest_tags").default([]),
  role: varchar("role", { length: 20 }).notNull().default("user"), // user / admin
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("users_openid_idx").on(table.openid),
  index("users_role_idx").on(table.role),
]);

// ===== Circles =====
export const circles = pgTable("circles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 64 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(), // 运动/户外/文化/生活
  description: text("description"),
  cover_url: text("cover_url"),
  tags: jsonb("tags").default([]),
  member_count: integer("member_count").notNull().default(0),
  activity_score: integer("activity_score").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("circles_category_idx").on(table.category),
  index("circles_activity_score_idx").on(table.activity_score),
]);

// ===== Circle Members =====
export const circleMembers = pgTable("circle_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  circle_id: varchar("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("circle_members_circle_id_idx").on(table.circle_id),
  index("circle_members_user_id_idx").on(table.circle_id, table.user_id),
]);

// ===== Posts =====
export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  circle_id: varchar("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  images: jsonb("images").default([]),
  tags: jsonb("tags").default([]),
  is_draft: boolean("is_draft").default(false),
  likes_count: integer("likes_count").notNull().default(0),
  comments_count: integer("comments_count").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("posts_circle_id_idx").on(table.circle_id),
  index("posts_user_id_idx").on(table.user_id),
  index("posts_created_at_idx").on(table.created_at),
  index("posts_circle_created_idx").on(table.circle_id, table.created_at),
]);

// ===== Post Likes =====
export const postLikes = pgTable("post_likes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  post_id: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("post_likes_post_id_idx").on(table.post_id),
  index("post_likes_user_id_idx").on(table.user_id),
]);

// ===== Comments (supports nested replies) =====
export const comments = pgTable("comments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  post_id: varchar("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  parent_id: varchar("parent_id", { length: 36 }),
  reply_to_id: varchar("reply_to_id", { length: 36 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("comments_post_id_idx").on(table.post_id),
  index("comments_user_id_idx").on(table.user_id),
  index("comments_parent_id_idx").on(table.parent_id),
]);

// ===== Activities (找搭子) =====
export const activities = pgTable("activities", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  circle_id: varchar("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  activity_time: timestamp("activity_time", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 256 }),
  location_lat: varchar("location_lat", { length: 32 }),
  location_lng: varchar("location_lng", { length: 32 }),
  level_requirement: varchar("level_requirement", { length: 64 }),
  max_participants: integer("max_participants"),
  fee_description: text("fee_description"),
  status: varchar("status", { length: 20 }).notNull().default("recruiting"),
  auto_approve: boolean("auto_approve").default(false),
  safety_agreed: boolean("safety_agreed").notNull().default(false),
  emergency_contact: varchar("emergency_contact", { length: 128 }),
  current_participants: integer("current_participants").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activities_circle_id_idx").on(table.circle_id),
  index("activities_user_id_idx").on(table.user_id),
  index("activities_status_idx").on(table.status),
  index("activities_activity_time_idx").on(table.activity_time),
]);

// ===== Activity Registrations =====
export const activityRegistrations = pgTable("activity_registrations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  activity_id: varchar("activity_id", { length: 36 }).notNull().references(() => activities.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activity_registrations_activity_id_idx").on(table.activity_id),
  index("activity_registrations_user_id_idx").on(table.user_id),
]);

// ===== Resources (资料库 - 多模板) =====
// template_type: ranking(排行榜) / gallery(图集) / list(列表)
// template_data 结构:
//   ranking: { items: [{ rank, title, subtitle, score, cover_url, detail }], description }
//   gallery: { items: [{ title, image_url, subtitle, link }], description }
//   list:    { items: [{ title, subtitle, icon_url, tags: [] }], description }
export const resources = pgTable("resources", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  circle_id: varchar("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  template_type: varchar("template_type", { length: 32 }).notNull(), // ranking/gallery/list
  description: text("description"),
  cover_url: text("cover_url"),
  template_data: jsonb("template_data").default({}),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("resources_circle_id_idx").on(table.circle_id),
  index("resources_template_type_idx").on(table.template_type),
  index("resources_sort_order_idx").on(table.circle_id, table.sort_order),
]);

// ===== Resource Submissions (补充/纠错审核) =====
export const resourceSubmissions = pgTable("resource_submissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  resource_id: varchar("resource_id", { length: 36 }).notNull().references(() => resources.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  submission_type: varchar("submission_type", { length: 20 }).notNull(), // supplement/correction
  content: jsonb("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  review_note: text("review_note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("resource_submissions_resource_id_idx").on(table.resource_id),
  index("resource_submissions_user_id_idx").on(table.user_id),
  index("resource_submissions_status_idx").on(table.status),
]);

// ===== Resource Items (资料条目) =====
export const resourceItems = pgTable("resource_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  resource_id: varchar("resource_id", { length: 36 }).notNull().references(() => resources.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  image_url: text("image_url"),
  rich_content: jsonb("rich_content").default({}),
  city: varchar("city", { length: 64 }),
  tags: jsonb("tags").default(sql`'[]'`),
  sort_order: integer("sort_order").notNull().default(0),
  like_count: integer("like_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("approved"), // approved/pending
  submitted_by: varchar("submitted_by", { length: 36 }).references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("resource_items_resource_id_idx").on(table.resource_id),
  index("resource_items_city_idx").on(table.city),
  index("resource_items_status_idx").on(table.status),
  index("resource_items_sort_idx").on(table.resource_id, table.sort_order),
]);

// ===== Resource Item Likes (条目点赞) =====
export const resourceItemLikes = pgTable("resource_item_likes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  item_id: varchar("item_id", { length: 36 }).notNull().references(() => resourceItems.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("resource_item_likes_item_id_idx").on(table.item_id),
  index("resource_item_likes_user_id_idx").on(table.user_id),
]);

// ===== Resource Item Submissions (条目提交审核) =====
export const resourceItemSubmissions = pgTable("resource_item_submissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  item_id: varchar("item_id", { length: 36 }).references(() => resourceItems.id, { onDelete: "cascade" }),
  resource_id: varchar("resource_id", { length: 36 }).notNull().references(() => resources.id, { onDelete: "cascade" }),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  submission_type: varchar("submission_type", { length: 20 }).notNull(), // correction/new/supplement
  content: jsonb("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  review_note: text("review_note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("resource_item_submissions_item_id_idx").on(table.item_id),
  index("resource_item_submissions_resource_id_idx").on(table.resource_id),
  index("resource_item_submissions_user_id_idx").on(table.user_id),
  index("resource_item_submissions_status_idx").on(table.status),
]);

// ===== Messages (通知) =====
export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  type: varchar("type", { length: 32 }).notNull(),
  title: varchar("title", { length: 128 }),
  content: text("content"),
  related_id: varchar("related_id", { length: 36 }),
  circle_id: varchar("circle_id", { length: 36 }),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("messages_user_id_idx").on(table.user_id),
  index("messages_user_read_idx").on(table.user_id, table.is_read),
  index("messages_type_idx").on(table.type),
]);

// ===== Notification Settings =====
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  circle_id: varchar("circle_id", { length: 36 }).references(() => circles.id),
  type: varchar("type", { length: 32 }).notNull(),
  muted: boolean("muted").default(false),
}, (table) => [
  index("notification_settings_user_id_idx").on(table.user_id),
  index("notification_settings_user_circle_idx").on(table.user_id, table.circle_id),
]);

// ===== Reports =====
export const reports = pgTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporter_id: varchar("reporter_id", { length: 36 }).notNull().references(() => users.id),
  target_type: varchar("target_type", { length: 20 }).notNull(),
  target_id: varchar("target_id", { length: 36 }).notNull(),
  reason: varchar("reason", { length: 32 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("reports_reporter_id_idx").on(table.reporter_id),
  index("reports_target_idx").on(table.target_type, table.target_id),
  index("reports_status_idx").on(table.status),
]);

// ===== Blocked Keywords =====
export const blockedKeywords = pgTable("blocked_keywords", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  keyword: varchar("keyword", { length: 64 }).notNull().unique(),
  category: varchar("category", { length: 32 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("blocked_keywords_keyword_idx").on(table.keyword),
]);

// ===== Drafts =====
export const drafts = pgTable("drafts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  circle_id: varchar("circle_id", { length: 36 }).references(() => circles.id),
  type: varchar("type", { length: 20 }).notNull(),
  content: jsonb("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("drafts_user_id_idx").on(table.user_id),
]);

// ===== Circle Applications (圈子创建申请) =====
export const circleApplications = pgTable("circle_applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  applicant_id: varchar("applicant_id", { length: 36 }).notNull().references(() => users.id),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull(),
  tags: jsonb("tags").default(sql`'[]'`),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reject_reason: text("reject_reason"),
  reviewed_by: varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("circle_applications_status_idx").on(table.status),
]);
