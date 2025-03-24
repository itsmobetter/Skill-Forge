import { storage } from "./storage";
import { nanoid } from "nanoid";

// Quality-related sample courses
const sampleCourses = [
  {
    id: nanoid(),
    title: "ISO 9001 Quality Management System",
    description: "Learn the fundamentals of ISO 9001 Quality Management System and how to implement it in your organization.",
    imageUrl: "https://img.freepik.com/free-vector/gradient-quality-control-illustration_23-2149844779.jpg",
    category: "iso",
    level: "beginner",
    duration: "4 weeks",
    price: 0,
    featured: true,
  },
  {
    id: nanoid(),
    title: "Statistical Process Control (SPC)",
    description: "Master the techniques of Statistical Process Control to monitor and control quality during manufacturing.",
    imageUrl: "https://img.freepik.com/free-vector/data-analytics-illustration_23-2150729478.jpg",
    category: "spc",
    level: "intermediate",
    duration: "6 weeks",
    price: 0,
    featured: true,
  },
  {
    id: nanoid(),
    title: "Capability Analysis (Cp/Cpk)",
    description: "Understand how to use process capability indices to evaluate if a process is capable of meeting specifications.",
    imageUrl: "https://img.freepik.com/free-vector/gradient-analytics-concept_23-2149341803.jpg",
    category: "quality",
    level: "intermediate",
    duration: "3 weeks",
    price: 0,
    featured: false,
  },
  {
    id: nanoid(),
    title: "Measurement System Analysis (MSA)",
    description: "Learn how to evaluate the quality of measurement systems and reduce measurement variation.",
    imageUrl: "https://img.freepik.com/free-vector/gradient-technology-background_23-2149731772.jpg",
    category: "msa",
    level: "advanced",
    duration: "4 weeks",
    price: 0,
    featured: false,
  },
  {
    id: nanoid(),
    title: "Root Cause Analysis",
    description: "Discover effective methods for identifying the root causes of problems in quality management systems.",
    imageUrl: "https://img.freepik.com/free-vector/flat-design-problem-solution-infographic_23-2149232208.jpg",
    category: "rca",
    level: "intermediate",
    duration: "3 weeks",
    price: 0,
    featured: true,
  },
  {
    id: nanoid(),
    title: "Design of Experiments (DOE)",
    description: "Master the principles of experimental design to optimize processes and product quality.",
    imageUrl: "https://img.freepik.com/free-vector/isometric-science-education-background_23-2149145885.jpg",
    category: "doe",
    level: "advanced",
    duration: "8 weeks",
    price: 0,
    featured: false,
  },
  {
    id: nanoid(),
    title: "Failure Mode and Effects Analysis (FMEA)",
    description: "Learn how to identify potential failures in a system and prioritize improvements to prevent them.",
    imageUrl: "https://img.freepik.com/free-vector/gradient-risk-management-concept_23-2149237515.jpg",
    category: "fmea",
    level: "intermediate",
    duration: "4 weeks",
    price: 0,
    featured: true,
  },
];

// Sample modules for the first course
const sampleModules = [
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "Introduction to Quality Management",
    description: "An overview of quality management principles and their importance in organizations.",
    order: 1,
    duration: "30 minutes",
    videoUrl: "https://www.youtube.com/embed/9vT8oY4j9xU",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "ISO 9001 Requirements",
    description: "Detailed explanation of ISO 9001:2015 requirements and documentation.",
    order: 2,
    duration: "45 minutes",
    videoUrl: "https://www.youtube.com/embed/Z9UJ_5dlLaA",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "Process Approach in QMS",
    description: "Understanding the process approach in Quality Management Systems.",
    order: 3,
    duration: "40 minutes",
    videoUrl: "https://www.youtube.com/embed/XsaR4g9WFcI",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "Implementing ISO 9001",
    description: "Step-by-step guide to implementing ISO 9001 in your organization.",
    order: 4,
    duration: "50 minutes",
    videoUrl: "https://www.youtube.com/embed/YKoFBWiChHw",
  },
];

// Sample modules for the second course
const spcModules = [
  {
    id: nanoid(),
    courseId: sampleCourses[1].id,
    title: "Fundamentals of Statistical Process Control",
    description: "Learn the basics of Statistical Process Control and its importance in manufacturing.",
    order: 1,
    duration: "35 minutes",
    videoUrl: "https://www.youtube.com/embed/GtLwXbxjbvA",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[1].id,
    title: "Control Charts for Variables",
    description: "Understanding X-bar, R, and S charts for monitoring process variables.",
    order: 2,
    duration: "45 minutes",
    videoUrl: "https://www.youtube.com/embed/oZlwqchbGzA",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[1].id,
    title: "Control Charts for Attributes",
    description: "Learning p, np, c, and u charts for monitoring process attributes.",
    order: 3,
    duration: "40 minutes",
    videoUrl: "https://www.youtube.com/embed/AAlBLsLeSCw",
  },
];

// Sample materials for the first course
const sampleMaterials = [
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "ISO 9001:2015 Standard (Overview)",
    type: "pdf",
    url: "https://www.iso.org/files/live/sites/isoorg/files/store/en/PUB100373.pdf",
    fileSize: "2.1 MB",
  },
  {
    id: nanoid(),
    courseId: sampleCourses[0].id,
    title: "Quality Management Principles",
    type: "pdf",
    url: "https://www.iso.org/files/live/sites/isoorg/files/store/en/PUB100080.pdf",
    fileSize: "1.8 MB",
  },
];

// Function to seed the database with sample data
export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Check if courses already exist
    const existingCourses = await storage.getAllCourses();
    if (existingCourses.length > 0) {
      console.log("Database already has courses. Skipping seeding.");
      return;
    }
    
    // Add courses
    console.log("Adding sample courses...");
    for (const course of sampleCourses) {
      await storage.createCourse(course);
    }
    console.log(`Added ${sampleCourses.length} courses.`);
    
    // Add modules for the first course
    console.log("Adding sample modules for ISO 9001 course...");
    for (const module of sampleModules) {
      await storage.createModule(module);
    }
    console.log(`Added ${sampleModules.length} modules for ISO 9001 course.`);
    
    // Add modules for the second course
    console.log("Adding sample modules for SPC course...");
    for (const module of spcModules) {
      await storage.createModule(module);
    }
    console.log(`Added ${spcModules.length} modules for SPC course.`);
    
    // Add materials
    console.log("Adding sample materials...");
    for (const material of sampleMaterials) {
      await storage.createMaterial(material);
    }
    console.log(`Added ${sampleMaterials.length} materials.`);
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}