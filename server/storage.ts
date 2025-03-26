import * as schema from "@shared/schema";
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
  ModuleCompletion,
  Certificate, InsertCertificate
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { promisify } from "util";
import { scrypt } from "crypto";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

export interface IStorage {
  sessionStore: any; // Using any for session store to avoid type issues

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  getDeletedCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  hardDeleteCourse(id: string): Promise<void>;
  recoverCourse(id: string): Promise<Course | undefined>;

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
  
  // Certificate management
  getUserCertificates(userId: number): Promise<Certificate[]>;
  getCertificatesByCourse(courseId: string): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  deleteCertificate(id: string): Promise<void>;
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
    return Array.from(this.courses.values())
      .filter(course => !course.deleted);
  }

  async getDeletedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(course => course.deleted);
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
    const course = this.courses.get(id);
    if (!course) return;
    
    // Soft delete the course
    course.deleted = true;
    course.deletedAt = new Date();
    this.courses.set(id, course);
  }
  
  async hardDeleteCourse(id: string): Promise<void> {
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
  
  async recoverCourse(id: string): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course || !course.deleted) {
      return undefined;
    }
    
    // Recover the course
    course.deleted = false;
    course.deletedAt = null;
    this.courses.set(id, course);
    
    return course;
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
  async getUserCourses(userId: number): Promise<(Course & { 
    progress: number; 
    completed: boolean;
    currentModule?: number;
    totalModules?: number;
    quizPassed?: boolean;
    bestQuizScore?: number; 
  })[]> {
    const progressRecords = Array.from(this.userCourseProgress.values())
      .filter(progress => progress.userId === userId);
      
    return Promise.all(progressRecords.map(async (progress) => {
      const course = await this.getCourse(progress.courseId);
      if (!course) {
        throw new Error("Course not found");
      }
      
      // Get all modules for this course
      const modules = Array.from(this.modules.values())
        .filter(module => module.courseId === progress.courseId);
      
      // Get quiz results for all modules in this course
      const moduleIds = modules.filter(m => m.hasQuiz).map(m => m.id);
      let bestScore = 0;
      let anyPassed = false;
      
      if (moduleIds.length > 0) {
        const quizResults = Array.from(this.quizResults.values())
          .filter(result => 
            result.userId === userId && 
            moduleIds.includes(result.moduleId)
          );
          
        if (quizResults.length > 0) {
          bestScore = Math.max(...quizResults.map(result => result.score));
          anyPassed = quizResults.some(result => result.passed);
        }
      }
      
      return {
        ...course,
        progress: progress.progress,
        completed: progress.completed,
        currentModule: progress.currentModuleOrder,
        totalModules: modules.length,
        quizPassed: anyPassed,
        bestQuizScore: bestScore
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

  // Certificate management
  private certificates: Map<string, Certificate> = new Map();

  async getUserCertificates(userId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values())
      .filter(certificate => certificate.userId === userId)
      .sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
  }

  async getCertificatesByCourse(courseId: string): Promise<Certificate[]> {
    return Array.from(this.certificates.values())
      .filter(certificate => certificate.courseId === courseId);
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = Math.random().toString(36).substring(2, 11);
    const newCertificate: Certificate = { ...certificate, id };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }

  async deleteCertificate(id: string): Promise<void> {
    this.certificates.delete(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }
}

import connectPg from "connect-pg-simple";
import { db, executeQuery } from "./db";
import { eq, and, desc, sql, count, isNull, not } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import session from "express-session";
import * as schema from "@shared/schema";
import {
  User, InsertUser, UserProfile, InsertUserProfile,
  ApiConfig, InsertApiConfig, Course, InsertCourse,
  Module, InsertModule, Material, InsertMaterial,
  UserCourseProgress, InsertUserCourseProgress, ModuleCompletion,
  QuizQuestion, InsertQuizQuestion, QuizResult, InsertQuizResult,
  ModuleTranscription, InsertModuleTranscription,
  ChatInteraction, InsertChatInteraction,
  Certificate, InsertCertificate
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
    return executeQuery(
      async () => {
        // Simple and efficient query with limit for optimization
        const [user] = await db.select()
          .from(schema.users)
          .where(eq(schema.users.id, id))
          .limit(1);
          
        return user;
      },
      `Failed to get user with ID ${id}`
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Cache optimization: Create a cache key based on username
    const cacheKey = `user_by_username_${username.toLowerCase()}`;
    
    return executeQuery(
      async () => {
        // Simplified query - just do case-insensitive search
        const [user] = await db.select()
          .from(schema.users)
          .where(sql`LOWER(${schema.users.username}) = LOWER(${username})`)
          .limit(1);
          
        return user;
      },
      `Failed to get user with username ${username}`
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Note: In a real app, password verification should be done here or in auth.ts
    // This is simplified for the demo
    
    await db.update(schema.users)
      .set({ password: newPassword })
      .where(eq(schema.users.id, userId));
    
    return true;
  }
  
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    await db.update(schema.users)
      .set({ isAdmin: isAdmin })
      .where(eq(schema.users.id, userId));
    
    return true;
  }

  // User profile
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [userProfile] = await db.insert(schema.userProfiles).values(profile).returning();
    return userProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile> {
    const [existingProfile] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId));
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    const [updatedProfile] = await db.update(schema.userProfiles)
      .set(profile)
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    
    return updatedProfile;
  }

  // API configuration
  async getUserApiConfig(userId: number): Promise<ApiConfig | undefined> {
    return executeQuery(
      async () => {
        const [config] = await db.select().from(schema.apiConfigs).where(eq(schema.apiConfigs.userId, userId));
        return config;
      },
      `Failed to get API config for user ${userId}`
    );
  }

  async createApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    return executeQuery(
      async () => {
        // Ensure temperature is a number (float) type
        const configWithCorrectTypes = {
          ...config,
          temperature: Number(config.temperature) // Explicitly convert to number
        };
        
        const [apiConfig] = await db.insert(schema.apiConfigs).values(configWithCorrectTypes).returning();
        return apiConfig;
      },
      "Failed to create API configuration"
    );
  }

  async updateUserApiConfig(userId: number, configUpdate: Partial<ApiConfig>): Promise<ApiConfig> {
    return executeQuery(
      async () => {
        const [existingConfig] = await db.select().from(schema.apiConfigs).where(eq(schema.apiConfigs.userId, userId));
        if (!existingConfig) {
          throw new Error("API configuration not found");
        }

        // Ensure temperature is a number (float) if it exists in the update
        const updatedConfig = { ...configUpdate };
        if (updatedConfig.temperature !== undefined) {
          updatedConfig.temperature = Number(updatedConfig.temperature);
        }

        const [result] = await db.update(schema.apiConfigs)
          .set(updatedConfig)
          .where(eq(schema.apiConfigs.userId, userId))
          .returning();
        
        return result;
      },
      `Failed to update API configuration for user ${userId}`
    );
  }

  // Course management
  async getAllCourses(): Promise<Course[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.courses).where(eq(schema.courses.deleted, false));
      },
      "Failed to get all active courses"
    );
  }

  async getDeletedCourses(): Promise<Course[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.courses).where(eq(schema.courses.deleted, true));
      },
      "Failed to get deleted courses"
    );
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return executeQuery(
      async () => {
        const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, id));
        return course;
      },
      `Failed to get course with ID ${id}`
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    return executeQuery(
      async () => {
        const id = Math.random().toString(36).substring(2, 11);
        const [newCourse] = await db.insert(schema.courses).values({...course, id}).returning();
        return newCourse;
      },
      "Failed to create course"
    );
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
    // Soft delete - mark the course as deleted
    await db.update(courses)
      .set({ 
        deleted: true,
        deletedAt: new Date()
      })
      .where(eq(courses.id, id));
  }
  
  async hardDeleteCourse(id: string): Promise<void> {
    // Hard delete - permanently remove the course and all related data
    // We should ideally perform this in a transaction
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
  
  async recoverCourse(id: string): Promise<Course | undefined> {
    // Recover a soft-deleted course
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    
    if (!course || !course.deleted) {
      return undefined;
    }
    
    const [recoveredCourse] = await db.update(courses)
      .set({
        deleted: false,
        deletedAt: null
      })
      .where(eq(courses.id, id))
      .returning();
      
    return recoveredCourse;
  }

  // Module management
  async getCourseModules(courseId: string): Promise<Module[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.modules)
          .where(eq(schema.modules.courseId, courseId))
          .orderBy(schema.modules.order);
      },
      `Failed to fetch modules for course ${courseId}`
    );
  }

  async getModule(id: string): Promise<Module | undefined> {
    return executeQuery(
      async () => {
        const [module] = await db.select().from(schema.modules).where(eq(schema.modules.id, id));
        return module;
      },
      `Failed to fetch module ${id}`
    );
  }

  async createModule(module: InsertModule): Promise<Module> {
    return executeQuery(
      async () => {
        const id = Math.random().toString(36).substring(2, 11);
        const [newModule] = await db.insert(schema.modules).values({...module, id}).returning();
        return newModule;
      },
      "Failed to create module"
    );
  }

  async updateModule(id: string, moduleUpdate: Partial<Module>): Promise<Module> {
    return executeQuery(
      async () => {
        const [existingModule] = await db.select().from(schema.modules).where(eq(schema.modules.id, id));
        if (!existingModule) {
          throw new Error("Module not found");
        }

        const [updatedModule] = await db.update(schema.modules)
          .set(moduleUpdate)
          .where(eq(schema.modules.id, id))
          .returning();
        
        return updatedModule;
      },
      `Failed to update module ${id}`
    );
  }

  async deleteModule(id: string): Promise<void> {
    return executeQuery(
      async () => {
        // Delete related quiz questions
        await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.moduleId, id));
        // Delete related transcriptions
        await db.delete(schema.moduleTranscriptions).where(eq(schema.moduleTranscriptions.moduleId, id));
        // Delete related completions
        await db.delete(schema.moduleCompletions).where(eq(schema.moduleCompletions.moduleId, id));
        // Delete related quiz results
        await db.delete(schema.quizResults).where(eq(schema.quizResults.moduleId, id));
        // Delete the module itself
        await db.delete(schema.modules).where(eq(schema.modules.id, id));
      },
      `Failed to delete module ${id}`
    );
  }

  // Material management
  async getCourseMaterials(courseId: string): Promise<Material[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.materials)
          .where(eq(schema.materials.courseId, courseId));
      },
      `Failed to fetch materials for course ${courseId}`
    );
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    return executeQuery(
      async () => {
        const id = Math.random().toString(36).substring(2, 11);
        const [newMaterial] = await db.insert(schema.materials).values({...material, id}).returning();
        return newMaterial;
      },
      "Failed to create material"
    );
  }

  async updateMaterial(id: string, materialUpdate: Partial<Material>): Promise<Material> {
    return executeQuery(
      async () => {
        const [existingMaterial] = await db.select().from(schema.materials).where(eq(schema.materials.id, id));
        if (!existingMaterial) {
          throw new Error("Material not found");
        }

        const [updatedMaterial] = await db.update(schema.materials)
          .set(materialUpdate)
          .where(eq(schema.materials.id, id))
          .returning();
        
        return updatedMaterial;
      },
      `Failed to update material ${id}`
    );
  }

  async deleteMaterial(id: string): Promise<void> {
    return executeQuery(
      async () => {
        await db.delete(schema.materials).where(eq(schema.materials.id, id));
      },
      `Failed to delete material ${id}`
    );
  }

  // User course progress
  async getUserCourses(userId: number): Promise<(Course & { 
    progress: number; 
    completed: boolean; 
    currentModule?: number; 
    totalModules?: number;
    quizPassed?: boolean;
    bestQuizScore?: number;
  })[]> {
    return executeQuery(
      async () => {
        console.log(`[USER_COURSES] Fetching courses for user ID: ${userId}`);
        
        // First find all user course progress records
        const userProgressRecords = await db.select()
          .from(schema.userCourseProgress)
          .where(eq(schema.userCourseProgress.userId, userId));
        
        console.log(`[USER_COURSES] Found ${userProgressRecords.length} course enrollments`);
        
        if (userProgressRecords.length === 0) {
          return [];
        }
        
        // Get course details for each enrolled course
        const result = [];
        
        for (const progress of userProgressRecords) {
          try {
            // Get course details
            const [course] = await db.select()
              .from(schema.courses)
              .where(eq(schema.courses.id, progress.courseId));
              
            if (!course) {
              console.log(`[USER_COURSES] Course not found for progress record: ${progress.id}`);
              continue;
            }
            
            // Get module count and info
            const modules = await db.select()
              .from(schema.modules)
              .where(eq(schema.modules.courseId, progress.courseId));
              
            // Calculate quiz performance across all modules in the course
            let bestScore = 0;
            let anyPassed = false;
            
            // Get all modules with quizzes
            const moduleIds = modules.filter(m => m.hasQuiz).map(m => m.id);
            
            if (moduleIds.length > 0) {
              // Get all quiz results for this user across all modules in the course
              const quizResults = await db
                .select()
                .from(schema.quizResults)
                .where(
                  and(
                    eq(schema.quizResults.userId, userId),
                    sql`${schema.quizResults.moduleId} IN (${moduleIds.join(',')})`
                  )
                );
                
              // Calculate best score and passed status
              if (quizResults.length > 0) {
                bestScore = Math.max(...quizResults.map(result => result.score));
                anyPassed = quizResults.some(result => result.passed);
              }
            }
            
            // Add to result with additional fields
            result.push({
              ...course,
              progress: progress.progress,
              completed: progress.completed,
              currentModule: progress.currentModuleOrder,
              totalModules: modules.length,
              quizPassed: anyPassed,
              bestQuizScore: bestScore
            });
          } catch (err) {
            console.error(`[USER_COURSES] Error fetching details for course ${progress.courseId}:`, err);
          }
        }
        
        console.log(`[USER_COURSES] Returning ${result.length} courses`);
        return result;
      },
      `Failed to get courses for user ${userId}`
    );
  }

  async getUserCourseProgress(userId: number, courseId: string): Promise<UserCourseProgress | undefined> {
    return executeQuery(
      async () => {
        const [progress] = await db.select().from(schema.userCourseProgress)
          .where(and(
            eq(schema.userCourseProgress.userId, userId),
            eq(schema.userCourseProgress.courseId, courseId)
          ));
        
        return progress;
      },
      `Failed to get user course progress for user ${userId} and course ${courseId}`
    );
  }

  async createUserCourseProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress> {
    return executeQuery(
      async () => {
        const [newProgress] = await db.insert(schema.userCourseProgress)
          .values(progress)
          .returning();
        
        return newProgress;
      },
      `Failed to create user course progress for user ${progress.userId} and course ${progress.courseId}`
    );
  }

  async updateUserCourseProgress(id: number, progressUpdate: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    return executeQuery(
      async () => {
        const [existingProgress] = await db.select().from(schema.userCourseProgress)
          .where(eq(schema.userCourseProgress.id, id));
          
        if (!existingProgress) {
          throw new Error("Progress record not found");
        }

        const [updatedProgress] = await db.update(schema.userCourseProgress)
          .set(progressUpdate)
          .where(eq(schema.userCourseProgress.id, id))
          .returning();
        
        return updatedProgress;
      },
      `Failed to update user course progress for id ${id}`
    );
  }

  // Module completion
  async getModuleCompletion(userId: number, moduleId: string): Promise<ModuleCompletion | undefined> {
    return executeQuery(
      async () => {
        const [completion] = await db.select().from(schema.moduleCompletions)
          .where(and(
            eq(schema.moduleCompletions.userId, userId),
            eq(schema.moduleCompletions.moduleId, moduleId)
          ));
        
        return completion;
      },
      `Failed to get module completion for user ${userId} and module ${moduleId}`
    );
  }

  async getCompletedModules(userId: number, courseId: string): Promise<ModuleCompletion[]> {
    return executeQuery(
      async () => {
        const courseModules = await this.getCourseModules(courseId);
        const moduleIds = courseModules.map(module => module.id);
        
        const completions = await db.select().from(schema.moduleCompletions)
          .where(and(
            eq(schema.moduleCompletions.userId, userId),
            eq(schema.moduleCompletions.completed, true)
          ));
        
        return completions.filter(completion => moduleIds.includes(completion.moduleId));
      },
      `Failed to get completed modules for user ${userId} and course ${courseId}`
    );
  }

  async updateModuleCompletion(userId: number, moduleId: string, completed: boolean): Promise<ModuleCompletion> {
    return executeQuery(
      async () => {
        const existingCompletion = await this.getModuleCompletion(userId, moduleId);
        
        if (existingCompletion) {
          // Update existing completion
          const [updatedCompletion] = await db.update(schema.moduleCompletions)
            .set({
              completed,
              completedAt: completed ? new Date() : null,
            })
            .where(and(
              eq(schema.moduleCompletions.userId, userId),
              eq(schema.moduleCompletions.moduleId, moduleId)
            ))
            .returning();
          
          return updatedCompletion;
        } else {
          // Create new completion
          const [newCompletion] = await db.insert(schema.moduleCompletions)
            .values({
              userId,
              moduleId,
              completed,
              completedAt: completed ? new Date() : null,
            })
            .returning();
          
          return newCompletion;
        }
      },
      `Failed to update module completion for user ${userId} and module ${moduleId}`
    );
  }

  // Quiz management
  async getQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.quizQuestions)
          .where(eq(schema.quizQuestions.moduleId, moduleId));
      },
      `Failed to get quiz questions for module ${moduleId}`
    );
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    return executeQuery(
      async () => {
        const id = Math.random().toString(36).substring(2, 11);
        const [newQuestion] = await db.insert(schema.quizQuestions)
          .values({...question, id})
          .returning();
        
        return newQuestion;
      },
      `Failed to create quiz question for module ${question.moduleId}`
    );
  }

  async getQuizResults(userId: number, moduleId: string): Promise<QuizResult[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.quizResults)
          .where(and(
            eq(schema.quizResults.userId, userId),
            eq(schema.quizResults.moduleId, moduleId)
          ));
      },
      `Failed to get quiz results for user ${userId} and module ${moduleId}`
    );
  }

  async createQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    return executeQuery(
      async () => {
        const [newResult] = await db.insert(schema.quizResults)
          .values(result)
          .returning();
        
        return newResult;
      },
      `Failed to create quiz result for user ${result.userId} and module ${result.moduleId}`
    );
  }

  // Transcriptions
  async getModuleTranscription(moduleId: string): Promise<ModuleTranscription | undefined> {
    try {
      // First attempt - try selecting all fields (this might fail if schema doesn't match)
      return await executeQuery(
        async () => {
          const [transcription] = await db.select().from(schema.moduleTranscriptions)
            .where(eq(schema.moduleTranscriptions.moduleId, moduleId));
          
          return transcription;
        },
        `Failed to get module transcription for module ${moduleId}`
      );
    } catch (error) {
      console.log(`Error with full transcription query, trying with specific fields: ${error}`);
      
      try {
        // Second attempt - select only specific fields that are guaranteed to exist
        return await executeQuery(
          async () => {
            const [transcription] = await db.select({
              id: schema.moduleTranscriptions.id,
              moduleId: schema.moduleTranscriptions.moduleId,
              videoId: schema.moduleTranscriptions.videoId,
              text: schema.moduleTranscriptions.text,
              // Excluding potentially problematic fields:
              // - timestampedText
              // - vectorId
              lastUpdated: schema.moduleTranscriptions.lastUpdated
            }).from(schema.moduleTranscriptions)
              .where(eq(schema.moduleTranscriptions.moduleId, moduleId));
            
            return transcription;
          },
          `Failed to get module transcription with limited fields for module ${moduleId}`
        );
      } catch (secondError) {
        console.log(`Error with limited fields transcription query, trying with raw SQL: ${secondError}`);
        
        // Final attempt - use raw SQL with guaranteed minimum fields
        try {
          return await executeQuery(
            async () => {
              const result = await db.execute(
                sql`SELECT id, module_id as "moduleId", video_id as "videoId", text FROM module_transcriptions WHERE module_id = ${moduleId}`
              );
              
              if (result.length === 0) {
                return undefined;
              }
              
              // Create a safe transcription object with just the core fields
              const transcription = result[0] as any;
              
              // Add missing fields with null values to match the expected interface
              return {
                id: transcription.id,
                moduleId: transcription.moduleId,
                videoId: transcription.videoId,
                text: transcription.text || "",
                timestampedText: null,
                vectorId: null,
                lastUpdated: null
              } as ModuleTranscription;
            },
            `Failed to get module transcription with raw SQL for module ${moduleId}`
          );
        } catch (finalError) {
          console.error(`All attempts to get transcription failed: ${finalError}`);
          return undefined;
        }
      }
    }
  }

  async createModuleTranscription(transcription: InsertModuleTranscription): Promise<ModuleTranscription> {
    try {
      // First try the standard insert with all fields
      return await executeQuery(
        async () => {
          const [newTranscription] = await db.insert(schema.moduleTranscriptions)
            .values(transcription)
            .returning();
          
          return newTranscription;
        },
        `Failed to create module transcription for module ${transcription.moduleId}`
      );
    } catch (error) {
      console.log(`Error with full transcription insert, trying with limited fields: ${error}`);
      
      // If that fails, try inserting only the essential fields
      return await executeQuery(
        async () => {
          // Create a safe subset of fields that should exist in any schema version
          const safeData = {
            moduleId: transcription.moduleId,
            videoId: transcription.videoId,
            text: transcription.text
          };
          
          const [newTranscription] = await db.insert(schema.moduleTranscriptions)
            .values(safeData)
            .returning();
          
          return newTranscription;
        },
        `Failed to create module transcription with limited fields for module ${transcription.moduleId}`
      );
    }
  }

  async updateModuleTranscription(id: number, transcriptionUpdate: Partial<ModuleTranscription>): Promise<ModuleTranscription> {
    try {
      // First attempt - try to update all provided fields
      return await executeQuery(
        async () => {
          const [existingTranscription] = await db.select().from(schema.moduleTranscriptions)
            .where(eq(schema.moduleTranscriptions.id, id));
            
          if (!existingTranscription) {
            throw new Error("Transcription not found");
          }

          const [updatedTranscription] = await db.update(schema.moduleTranscriptions)
            .set(transcriptionUpdate)
            .where(eq(schema.moduleTranscriptions.id, id))
            .returning();
          
          return updatedTranscription;
        },
        `Failed to update module transcription with id ${id}`
      );
    } catch (error) {
      console.log(`Error with full transcription update, trying with limited fields: ${error}`);
      
      // If that fails, update only essential fields
      return await executeQuery(
        async () => {
          const [existingTranscription] = await db.select().from(schema.moduleTranscriptions)
            .where(eq(schema.moduleTranscriptions.id, id));
            
          if (!existingTranscription) {
            throw new Error("Transcription not found");
          }
          
          // Only include basic fields that are guaranteed to exist in any schema version
          const safeUpdate: any = {};
          
          if (transcriptionUpdate.text !== undefined) {
            safeUpdate.text = transcriptionUpdate.text;
          }
          
          if (transcriptionUpdate.videoId !== undefined) {
            safeUpdate.videoId = transcriptionUpdate.videoId;
          }
          
          const [updatedTranscription] = await db.update(schema.moduleTranscriptions)
            .set(safeUpdate)
            .where(eq(schema.moduleTranscriptions.id, id))
            .returning();
          
          return updatedTranscription;
        },
        `Failed to update module transcription with limited fields for id ${id}`
      );
    }
  }

  // Chat interactions
  async getChatInteractions(userId: number, courseId: string): Promise<ChatInteraction[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.chatInteractions)
          .where(and(
            eq(schema.chatInteractions.userId, userId),
            eq(schema.chatInteractions.courseId, courseId)
          ))
          .orderBy(desc(schema.chatInteractions.timestamp));
      },
      `Failed to get chat interactions for user ${userId} and course ${courseId}`
    );
  }

  async createChatInteraction(interaction: InsertChatInteraction): Promise<ChatInteraction> {
    return executeQuery(
      async () => {
        const [newInteraction] = await db.insert(schema.chatInteractions)
          .values(interaction)
          .returning();
        
        return newInteraction;
      },
      `Failed to create chat interaction for user ${interaction.userId} and course ${interaction.courseId}`
    );
  }

  // Certificate management
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.certificates)
          .where(eq(schema.certificates.userId, userId))
          .orderBy(desc(schema.certificates.issuedDate));
      },
      `Failed to get certificates for user ${userId}`
    );
  }

  async getCertificatesByCourse(courseId: string): Promise<Certificate[]> {
    return executeQuery(
      async () => {
        return await db.select().from(schema.certificates)
          .where(eq(schema.certificates.courseId, courseId));
      },
      `Failed to get certificates for course ${courseId}`
    );
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    return executeQuery(
      async () => {
        const [certificate] = await db.select().from(schema.certificates)
          .where(eq(schema.certificates.id, id));
        
        return certificate;
      },
      `Failed to get certificate with id ${id}`
    );
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    return executeQuery(
      async () => {
        const id = Math.random().toString(36).substring(2, 11);
        const [newCertificate] = await db.insert(schema.certificates)
          .values({...certificate, id})
          .returning();
        
        return newCertificate;
      },
      `Failed to create certificate for user ${certificate.userId} and course ${certificate.courseId}`
    );
  }

  async deleteCertificate(id: string): Promise<void> {
    return executeQuery(
      async () => {
        await db.delete(schema.certificates).where(eq(schema.certificates.id, id));
      },
      `Failed to delete certificate with id ${id}`
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return executeQuery(
      async () => {
        // Use case insensitive search for email
        const [user] = await db.select()
          .from(schema.users)
          .where(sql`LOWER(${schema.users.email}) = LOWER(${email})`)
          .limit(1);  // Optimize by limiting to 1 result
        
        return user;
      },
      `Failed to get user with email ${email}`
    );
  }
}

// Use the Database Storage implementation
export const storage = new DatabaseStorage();
