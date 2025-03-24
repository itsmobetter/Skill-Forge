import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).extend({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  confirmPassword: z.string().optional(), // For validation only
}).pick({
  username: true,
  password: true,
  isAdmin: true,
  firstName: true,
  lastName: true,
  email: true,
  department: true,
  position: true,
  confirmPassword: true,
});

// User profiles
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  position: text("position"),
  department: text("department"),
  about: text("about"),
  avatarUrl: text("avatar_url"),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

// API configurations
export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // Now "Google" instead of "OpenAI"
  model: text("model").notNull(), // Now "gemini-1.5-flash" instead of "gpt-4o"
  apiKey: text("api_key").notNull(),
  endpoint: text("endpoint"),
  temperature: real("temperature").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  useTranscriptions: boolean("use_transcriptions").default(true).notNull(),
  usePdf: boolean("use_pdf").default(true).notNull(),
  streaming: boolean("streaming").default(true).notNull(),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs)
  .omit({
    id: true,
  })
  .transform((data) => ({
    ...data,
    temperature: Number(data.temperature), // Ensure temperature is a number
  }));

// Courses
export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  tag: text("tag"),
  tagColor: text("tag_color"),
  rating: integer("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  duration: text("duration").notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

// Modules
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  videoUrl: text("video_url"),
  duration: text("duration").notNull(),
  completed: boolean("completed").default(false).notNull(),
  hasQuiz: boolean("has_quiz").default(false).notNull(),
  tags: jsonb("tags").default([]),
  objectives: jsonb("objectives").default([]),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
});

// Materials
export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  url: text("url").notNull(),
  fileSize: text("file_size").notNull(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
});

// User course progress
export const userCourseProgress = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  currentModuleId: text("current_module_id").references(() => modules.id),
  currentModuleOrder: integer("current_module_order").notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const insertCourseProgressSchema = createInsertSchema(userCourseProgress).omit({
  id: true,
});

// Module completion
export const moduleCompletions = pgTable("module_completions", {
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: text("module_id").notNull().references(() => modules.id),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export type ModuleCompletion = {
  userId: number;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
};

// Quiz questions
export const quizQuestions = pgTable("quiz_questions", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id),
  text: text("text").notNull(),
  options: jsonb("options").notNull(),
  correctOptionId: text("correct_option_id").notNull(),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

// Quiz results
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: text("module_id").notNull().references(() => modules.id),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").notNull(),
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
});

// Module transcriptions
export const moduleTranscriptions = pgTable("module_transcriptions", {
  id: serial("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id).unique(),
  videoId: text("video_id").notNull(),
  text: text("text").notNull(),
});

export const insertModuleTranscriptionSchema = createInsertSchema(moduleTranscriptions).omit({
  id: true,
});

// Chat interactions
export const chatInteractions = pgTable("chat_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  moduleId: text("module_id").references(() => modules.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertChatInteractionSchema = createInsertSchema(chatInteractions).omit({
  id: true,
});

// User certificates
export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  courseName: text("course_name").notNull(),
  issuedDate: timestamp("issued_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  credentialId: text("credential_id").notNull().unique(),
  thumbnailUrl: text("thumbnail_url").notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type InsertUserCourseProgress = z.infer<typeof insertCourseProgressSchema>;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;

export type ModuleTranscription = typeof moduleTranscriptions.$inferSelect;
export type InsertModuleTranscription = z.infer<typeof insertModuleTranscriptionSchema>;

export type ChatInteraction = typeof chatInteractions.$inferSelect;
export type InsertChatInteraction = z.infer<typeof insertChatInteractionSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
