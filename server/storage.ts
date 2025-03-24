import { 
  User, InsertUser, 
  Course, InsertCourse, 
  Module, InsertModule, 
  Material, InsertMaterial, 
  UserProfile, InsertUserProfile, 
  ApiConfig, InsertApiConfig, 
  UserCourseProgress, InsertUserCourseProgress,
  QuizQuestion, InsertQuizQuestion,
  QuizResult, InsertQuizResult,
  ModuleTranscription, InsertModuleTranscription,
  ChatInteraction, InsertChatInteraction,
  ModuleCompletion
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

export interface IStorage {
  sessionStore: any; // Using any for session store to avoid type issues

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<boolean>;

  // User profile
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile>;

  // API configuration
  getUserApiConfig(userId: number): Promise<ApiConfig | undefined>;
  createApiConfig(config: InsertApiConfig): Promise<ApiConfig>;
  updateUserApiConfig(userId: number, config: Partial<ApiConfig>): Promise<ApiConfig>;

  // Course management
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Module management
  getCourseModules(courseId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<Module>): Promise<Module>;
  deleteModule(id: string): Promise<void>;

  // Material management
  getCourseMaterials(courseId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, material: Partial<Material>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;

  // User course progress
  getUserCourses(userId: number): Promise<(Course & { progress: number; completed: boolean })[]>;
  getUserCourseProgress(userId: number, courseId: string): Promise<UserCourseProgress | undefined>;
  createUserCourseProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress>;
  updateUserCourseProgress(id: number, progress: Partial<UserCourseProgress>): Promise<UserCourseProgress>;

  // Module completion
  getModuleCompletion(userId: number, moduleId: string): Promise<ModuleCompletion | undefined>;
  getCompletedModules(userId: number, courseId: string): Promise<ModuleCompletion[]>;
  updateModuleCompletion(userId: number, moduleId: string, completed: boolean): Promise<ModuleCompletion>;

  // Quiz management
  getQuizQuestions(moduleId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  getQuizResults(userId: number, moduleId: string): Promise<QuizResult[]>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;

  // Transcriptions
  getModuleTranscription(moduleId: string): Promise<ModuleTranscription | undefined>;
  createModuleTranscription(transcription: InsertModuleTranscription): Promise<ModuleTranscription>;
  updateModuleTranscription(id: number, transcription: Partial<ModuleTranscription>): Promise<ModuleTranscription>;

  // Chat interactions
  getChatInteractions(userId: number, courseId: string): Promise<ChatInteraction[]>;
  createChatInteraction(interaction: InsertChatInteraction): Promise<ChatInteraction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>;
  private apiConfigs: Map<number, ApiConfig>;
  private courses: Map<string, Course>;
  private modules: Map<string, Module>;
  private materials: Map<string, Material>;
  private userCourseProgress: Map<number, UserCourseProgress>;
  private moduleCompletions: Map<string, ModuleCompletion>; // key is userId-moduleId
  private quizQuestions: Map<string, QuizQuestion>;
  private quizResults: Map<number, QuizResult>;
  private moduleTranscriptions: Map<string, ModuleTranscription>;
  private chatInteractions: Map<number, ChatInteraction>;
  
  sessionStore: any;
  
  private userIdCounter: number;
  private userProfileIdCounter: number;
  private apiConfigIdCounter: number;
  private userCourseProgressIdCounter: number;
  private quizResultIdCounter: number;
  private moduleTranscriptionIdCounter: number;
  private chatInteractionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.apiConfigs = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.materials = new Map();
    this.userCourseProgress = new Map();
    this.moduleCompletions = new Map();
    this.quizQuestions = new Map();
    this.quizResults = new Map();
    this.moduleTranscriptions = new Map();
    this.chatInteractions = new Map();

    this.userIdCounter = 1;
    this.userProfileIdCounter = 1;
    this.apiConfigIdCounter = 1;
    this.userCourseProgressIdCounter = 1;
    this.quizResultIdCounter = 1;
    this.moduleTranscriptionIdCounter = 1;
    this.chatInteractionIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Verify current password (simplified for demo)
    // In a real app, use proper password comparison as in auth.ts
    if (user.password !== currentPassword) {
      return false;
    }

    // Update with new password
    // In a real app, hash the new password
    user.password = newPassword;
    this.users.set(userId, user);
    return true;
  }
  
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    // Update admin status
    user.isAdmin = isAdmin;
    this.users.set(userId, user);
    return true;
  }

  // User profile
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.userProfileIdCounter++;
    const userProfile: UserProfile = { ...profile, id };
    this.userProfiles.set(id, userProfile);
    return userProfile;
  }

  async updateUserProfile(userId: number, profileUpdate: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const updatedProfile = { ...profile, ...profileUpdate };
    this.userProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // API configuration
  async getUserApiConfig(userId: number): Promise<ApiConfig | undefined> {
    return Array.from(this.apiConfigs.values()).find(
      (config) => config.userId === userId
    );
  }

  async createApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    const id = this.apiConfigIdCounter++;
    const apiConfig: ApiConfig = { ...config, id };
    this.apiConfigs.set(id, apiConfig);
    return apiConfig;
  }

  async updateUserApiConfig(userId: number, configUpdate: Partial<ApiConfig>): Promise<ApiConfig> {
    const config = await this.getUserApiConfig(userId);
    if (!config) {
      throw new Error("API configuration not found");
    }

    const updatedConfig = { ...config, ...configUpdate };
    this.apiConfigs.set(config.id, updatedConfig);
    return updatedConfig;
  }

  // Course management
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = Math.random().toString(36).substring(2, 11);
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: string, courseUpdate: Partial<Course>): Promise<Course> {
    const course = await this.getCourse(id);
    if (!course) {
      throw new Error("Course not found");
    }

    const updatedCourse = { ...course, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    this.courses.delete(id);
    
    // Cascade delete related entities
    const modulesToDelete = Array.from(this.modules.values())
      .filter(module => module.courseId === id);
      
    for (const module of modulesToDelete) {
      await this.deleteModule(module.id);
    }
    
    // Delete materials
    const materialsToDelete = Array.from(this.materials.values())
      .filter(material => material.courseId === id);
      
    for (const material of materialsToDelete) {
      this.materials.delete(material.id);
    }
    
    // Delete progress records
    const progressToDelete = Array.from(this.userCourseProgress.values())
      .filter(progress => progress.courseId === id);
      
    for (const progress of progressToDelete) {
      this.userCourseProgress.delete(progress.id);
    }
  }

  // Module management
  async getCourseModules(courseId: string): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getModule(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const id = Math.random().toString(36).substring(2, 11);
    const newModule: Module = { ...module, id };
    this.modules.set(id, newModule);
    return newModule;
  }

  async updateModule(id: string, moduleUpdate: Partial<Module>): Promise<Module> {
    const module = await this.getModule(id);
    if (!module) {
      throw new Error("Module not found");
    }

    const updatedModule = { ...module, ...moduleUpdate };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: string): Promise<void> {
    this.modules.delete(id);
    
    // Delete related quiz questions
    const questionsToDelete = Array.from(this.quizQuestions.values())
      .filter(question => question.moduleId === id);
      
    for (const question of questionsToDelete) {
      this.quizQuestions.delete(question.id);
    }
    
    // Delete related transcriptions
    const transcriptionToDelete = Array.from(this.moduleTranscriptions.values())
      .find(transcription => transcription.moduleId === id);
      
    if (transcriptionToDelete) {
      this.moduleTranscriptions.delete(transcriptionToDelete.moduleId);
    }
    
    // Delete module completions
    for (const [key, completion] of this.moduleCompletions.entries()) {
      if (completion.moduleId === id) {
        this.moduleCompletions.delete(key);
      }
    }
  }

  // Material management
  async getCourseMaterials(courseId: string): Promise<Material[]> {
    return Array.from(this.materials.values())
      .filter(material => material.courseId === courseId);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = Math.random().toString(36).substring(2, 11);
    const newMaterial: Material = { ...material, id };
    this.materials.set(id, newMaterial);
    return newMaterial;
  }

  async updateMaterial(id: string, materialUpdate: Partial<Material>): Promise<Material> {
    const material = this.materials.get(id);
    if (!material) {
      throw new Error("Material not found");
    }

    const updatedMaterial = { ...material, ...materialUpdate };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: string): Promise<void> {
    this.materials.delete(id);
  }

  // User course progress
  async getUserCourses(userId: number): Promise<(Course & { progress: number; completed: boolean })[]> {
    const progressRecords = Array.from(this.userCourseProgress.values())
      .filter(progress => progress.userId === userId);
      
    return Promise.all(progressRecords.map(async (progress) => {
      const course = await this.getCourse(progress.courseId);
      if (!course) {
        throw new Error("Course not found");
      }
      
      return {
        ...course,
        progress: progress.progress,
        completed: progress.completed
      };
    }));
  }

  async getUserCourseProgress(userId: number, courseId: string): Promise<UserCourseProgress | undefined> {
    return Array.from(this.userCourseProgress.values()).find(
      progress => progress.userId === userId && progress.courseId === courseId
    );
  }

  async createUserCourseProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress> {
    const id = this.userCourseProgressIdCounter++;
    const newProgress: UserCourseProgress = { ...progress, id };
    this.userCourseProgress.set(id, newProgress);
    return newProgress;
  }

  async updateUserCourseProgress(id: number, progressUpdate: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    const progress = this.userCourseProgress.get(id);
    if (!progress) {
      throw new Error("Progress record not found");
    }

    const updatedProgress = { ...progress, ...progressUpdate };
    this.userCourseProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  // Module completion
  async getModuleCompletion(userId: number, moduleId: string): Promise<ModuleCompletion | undefined> {
    const key = `${userId}-${moduleId}`;
    return this.moduleCompletions.get(key);
  }

  async getCompletedModules(userId: number, courseId: string): Promise<ModuleCompletion[]> {
    const modules = await this.getCourseModules(courseId);
    const completions: ModuleCompletion[] = [];
    
    for (const module of modules) {
      const completion = await this.getModuleCompletion(userId, module.id);
      if (completion && completion.completed) {
        completions.push(completion);
      }
    }
    
    return completions;
  }

  async updateModuleCompletion(userId: number, moduleId: string, completed: boolean): Promise<ModuleCompletion> {
    const key = `${userId}-${moduleId}`;
    let completion = this.moduleCompletions.get(key);
    
    if (completion) {
      completion = { ...completion, completed };
    } else {
      completion = {
        userId,
        moduleId,
        completed,
        completedAt: completed ? new Date() : undefined
      };
    }
    
    this.moduleCompletions.set(key, completion);
    return completion;
  }

  // Quiz management
  async getQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .filter(question => question.moduleId === moduleId);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = Math.random().toString(36).substring(2, 11);
    const newQuestion: QuizQuestion = { ...question, id };
    this.quizQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async getQuizResults(userId: number, moduleId: string): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values())
      .filter(result => result.userId === userId && result.moduleId === moduleId)
      .sort((a, b) => {
        // Sort by completedAt in descending order (newest first)
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });
  }

  async createQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const id = this.quizResultIdCounter++;
    const newResult: QuizResult = { ...result, id };
    this.quizResults.set(id, newResult);
    return newResult;
  }

  // Transcriptions
  async getModuleTranscription(moduleId: string): Promise<ModuleTranscription | undefined> {
    return Array.from(this.moduleTranscriptions.values())
      .find(transcription => transcription.moduleId === moduleId);
  }

  async createModuleTranscription(transcription: InsertModuleTranscription): Promise<ModuleTranscription> {
    const id = this.moduleTranscriptionIdCounter++;
    const newTranscription: ModuleTranscription = { ...transcription, id };
    this.moduleTranscriptions.set(transcription.moduleId, newTranscription);
    return newTranscription;
  }

  async updateModuleTranscription(id: number, transcriptionUpdate: Partial<ModuleTranscription>): Promise<ModuleTranscription> {
    const transcription = Array.from(this.moduleTranscriptions.values())
      .find(t => t.id === id);
      
    if (!transcription) {
      throw new Error("Transcription not found");
    }

    const updatedTranscription = { ...transcription, ...transcriptionUpdate };
    this.moduleTranscriptions.set(transcription.moduleId, updatedTranscription);
    return updatedTranscription;
  }

  // Chat interactions
  async getChatInteractions(userId: number, courseId: string): Promise<ChatInteraction[]> {
    return Array.from(this.chatInteractions.values())
      .filter(interaction => interaction.userId === userId && interaction.courseId === courseId)
      .sort((a, b) => {
        // Sort by timestamp in ascending order (oldest first)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }

  async createChatInteraction(interaction: InsertChatInteraction): Promise<ChatInteraction> {
    const id = this.chatInteractionIdCounter++;
    const newInteraction: ChatInteraction = { ...interaction, id };
    this.chatInteractions.set(id, newInteraction);
    return newInteraction;
  }
}

import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import {
  users,
  userProfiles,
  apiConfigs,
  courses,
  modules,
  materials,
  userCourseProgress,
  moduleCompletions,
  quizQuestions,
  quizResults,
  moduleTranscriptions,
  chatInteractions
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  private pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      createTableIfMissing: true,
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Note: In a real app, password verification should be done here or in auth.ts
    // This is simplified for the demo
    
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
    
    return true;
  }
  
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    await db.update(users)
      .set({ isAdmin: isAdmin })
      .where(eq(users.id, userId));
    
    return true;
  }

  // User profile
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [userProfile] = await db.insert(userProfiles).values(profile).returning();
    return userProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile> {
    const [existingProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    const [updatedProfile] = await db.update(userProfiles)
      .set(profile)
      .where(eq(userProfiles.userId, userId))
      .returning();
    
    return updatedProfile;
  }

  // API configuration
  async getUserApiConfig(userId: number): Promise<ApiConfig | undefined> {
    const [config] = await db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
    return config;
  }

  async createApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    const [apiConfig] = await db.insert(apiConfigs).values(config).returning();
    return apiConfig;
  }

  async updateUserApiConfig(userId: number, configUpdate: Partial<ApiConfig>): Promise<ApiConfig> {
    const [existingConfig] = await db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
    if (!existingConfig) {
      throw new Error("API configuration not found");
    }

    const [updatedConfig] = await db.update(apiConfigs)
      .set(configUpdate)
      .where(eq(apiConfigs.userId, userId))
      .returning();
    
    return updatedConfig;
  }

  // Course management
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = Math.random().toString(36).substring(2, 11);
    const [newCourse] = await db.insert(courses).values({...course, id}).returning();
    return newCourse;
  }

  async updateCourse(id: string, courseUpdate: Partial<Course>): Promise<Course> {
    const [existingCourse] = await db.select().from(courses).where(eq(courses.id, id));
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    const [updatedCourse] = await db.update(courses)
      .set(courseUpdate)
      .where(eq(courses.id, id))
      .returning();
    
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    // We should ideally perform this in a transaction and cascade delete related entities
    await db.delete(userCourseProgress).where(eq(userCourseProgress.courseId, id));
    await db.delete(materials).where(eq(materials.courseId, id));
    
    // Get modules to delete
    const modulesToDelete = await db.select().from(modules).where(eq(modules.courseId, id));
    
    for (const module of modulesToDelete) {
      await db.delete(quizQuestions).where(eq(quizQuestions.moduleId, module.id));
      await db.delete(moduleTranscriptions).where(eq(moduleTranscriptions.moduleId, module.id));
      await db.delete(moduleCompletions).where(eq(moduleCompletions.moduleId, module.id));
      await db.delete(quizResults).where(eq(quizResults.moduleId, module.id));
    }
    
    await db.delete(modules).where(eq(modules.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Module management
  async getCourseModules(courseId: string): Promise<Module[]> {
    return await db.select().from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const id = Math.random().toString(36).substring(2, 11);
    const [newModule] = await db.insert(modules).values({...module, id}).returning();
    return newModule;
  }

  async updateModule(id: string, moduleUpdate: Partial<Module>): Promise<Module> {
    const [existingModule] = await db.select().from(modules).where(eq(modules.id, id));
    if (!existingModule) {
      throw new Error("Module not found");
    }

    const [updatedModule] = await db.update(modules)
      .set(moduleUpdate)
      .where(eq(modules.id, id))
      .returning();
    
    return updatedModule;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.moduleId, id));
    await db.delete(moduleTranscriptions).where(eq(moduleTranscriptions.moduleId, id));
    await db.delete(moduleCompletions).where(eq(moduleCompletions.moduleId, id));
    await db.delete(quizResults).where(eq(quizResults.moduleId, id));
    await db.delete(modules).where(eq(modules.id, id));
  }

  // Material management
  async getCourseMaterials(courseId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = Math.random().toString(36).substring(2, 11);
    const [newMaterial] = await db.insert(materials).values({...material, id}).returning();
    return newMaterial;
  }

  async updateMaterial(id: string, materialUpdate: Partial<Material>): Promise<Material> {
    const [existingMaterial] = await db.select().from(materials).where(eq(materials.id, id));
    if (!existingMaterial) {
      throw new Error("Material not found");
    }

    const [updatedMaterial] = await db.update(materials)
      .set(materialUpdate)
      .where(eq(materials.id, id))
      .returning();
    
    return updatedMaterial;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // User course progress
  async getUserCourses(userId: number): Promise<(Course & { progress: number; completed: boolean })[]> {
    const userCourses = await db.select({
      ...courses,
      progress: userCourseProgress.progress,
      completed: userCourseProgress.completed,
    })
    .from(userCourseProgress)
    .innerJoin(courses, eq(userCourseProgress.courseId, courses.id))
    .where(eq(userCourseProgress.userId, userId));

    return userCourses as (Course & { progress: number; completed: boolean })[];
  }

  async getUserCourseProgress(userId: number, courseId: string): Promise<UserCourseProgress | undefined> {
    const [progress] = await db.select().from(userCourseProgress)
      .where(and(
        eq(userCourseProgress.userId, userId),
        eq(userCourseProgress.courseId, courseId)
      ));
    
    return progress;
  }

  async createUserCourseProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress> {
    const [newProgress] = await db.insert(userCourseProgress)
      .values(progress)
      .returning();
    
    return newProgress;
  }

  async updateUserCourseProgress(id: number, progressUpdate: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    const [existingProgress] = await db.select().from(userCourseProgress).where(eq(userCourseProgress.id, id));
    if (!existingProgress) {
      throw new Error("Progress record not found");
    }

    const [updatedProgress] = await db.update(userCourseProgress)
      .set(progressUpdate)
      .where(eq(userCourseProgress.id, id))
      .returning();
    
    return updatedProgress;
  }

  // Module completion
  async getModuleCompletion(userId: number, moduleId: string): Promise<ModuleCompletion | undefined> {
    const [completion] = await db.select().from(moduleCompletions)
      .where(and(
        eq(moduleCompletions.userId, userId),
        eq(moduleCompletions.moduleId, moduleId)
      ));
    
    return completion;
  }

  async getCompletedModules(userId: number, courseId: string): Promise<ModuleCompletion[]> {
    const courseModules = await this.getCourseModules(courseId);
    const moduleIds = courseModules.map(module => module.id);
    
    const completions = await db.select().from(moduleCompletions)
      .where(and(
        eq(moduleCompletions.userId, userId),
        eq(moduleCompletions.completed, true)
      ));
    
    return completions.filter(completion => moduleIds.includes(completion.moduleId));
  }

  async updateModuleCompletion(userId: number, moduleId: string, completed: boolean): Promise<ModuleCompletion> {
    const existingCompletion = await this.getModuleCompletion(userId, moduleId);
    
    if (existingCompletion) {
      // Update existing completion
      const [updatedCompletion] = await db.update(moduleCompletions)
        .set({
          completed,
          completedAt: completed ? new Date() : null,
        })
        .where(and(
          eq(moduleCompletions.userId, userId),
          eq(moduleCompletions.moduleId, moduleId)
        ))
        .returning();
      
      return updatedCompletion;
    } else {
      // Create new completion
      const [newCompletion] = await db.insert(moduleCompletions)
        .values({
          userId,
          moduleId,
          completed,
          completedAt: completed ? new Date() : null,
        })
        .returning();
      
      return newCompletion;
    }
  }

  // Quiz management
  async getQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.moduleId, moduleId));
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = Math.random().toString(36).substring(2, 11);
    const [newQuestion] = await db.insert(quizQuestions)
      .values({...question, id})
      .returning();
    
    return newQuestion;
  }

  async getQuizResults(userId: number, moduleId: string): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .where(and(
        eq(quizResults.userId, userId),
        eq(quizResults.moduleId, moduleId)
      ));
  }

  async createQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [newResult] = await db.insert(quizResults)
      .values(result)
      .returning();
    
    return newResult;
  }

  // Transcriptions
  async getModuleTranscription(moduleId: string): Promise<ModuleTranscription | undefined> {
    const [transcription] = await db.select().from(moduleTranscriptions)
      .where(eq(moduleTranscriptions.moduleId, moduleId));
    
    return transcription;
  }

  async createModuleTranscription(transcription: InsertModuleTranscription): Promise<ModuleTranscription> {
    const [newTranscription] = await db.insert(moduleTranscriptions)
      .values(transcription)
      .returning();
    
    return newTranscription;
  }

  async updateModuleTranscription(id: number, transcriptionUpdate: Partial<ModuleTranscription>): Promise<ModuleTranscription> {
    const [existingTranscription] = await db.select().from(moduleTranscriptions).where(eq(moduleTranscriptions.id, id));
    if (!existingTranscription) {
      throw new Error("Transcription not found");
    }

    const [updatedTranscription] = await db.update(moduleTranscriptions)
      .set(transcriptionUpdate)
      .where(eq(moduleTranscriptions.id, id))
      .returning();
    
    return updatedTranscription;
  }

  // Chat interactions
  async getChatInteractions(userId: number, courseId: string): Promise<ChatInteraction[]> {
    return await db.select().from(chatInteractions)
      .where(and(
        eq(chatInteractions.userId, userId),
        eq(chatInteractions.courseId, courseId)
      ))
      .orderBy(desc(chatInteractions.timestamp));
  }

  async createChatInteraction(interaction: InsertChatInteraction): Promise<ChatInteraction> {
    const [newInteraction] = await db.insert(chatInteractions)
      .values(interaction)
      .returning();
    
    return newInteraction;
  }
}

// Use the Database Storage implementation
export const storage = new DatabaseStorage();
