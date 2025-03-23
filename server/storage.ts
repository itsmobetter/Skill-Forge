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
  ModuleCompletion, InsertModuleCompletion
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

export interface IStorage {
  sessionStore: session.SessionStore;

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;

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
  
  sessionStore: session.SessionStore;
  
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
    this.moduleTranscriptions.set(moduleId, newTranscription);
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

export const storage = new MemStorage();
