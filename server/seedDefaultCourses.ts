import { nanoid } from 'nanoid';
import { storage } from './storage';
import { InsertCourse, InsertModule, InsertMaterial } from '@shared/schema';

// Default courses focusing on quality assurance topics
export const defaultCourses: InsertCourse[] = [
  {
    id: nanoid(),
    title: 'ISO 9001:2015 Fundamentals',
    description: 'Learn the fundamentals of ISO 9001:2015 Quality Management System and how to implement it in your organization.',
    imageUrl: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '8 hours',
    tag: 'Quality Management',
    tagColor: '#4CAF50',
    rating: 4.8,
    reviewCount: 128,
    deleted: false,
    deletedAt: null
  },
  {
    id: nanoid(),
    title: 'Statistical Process Control (SPC)',
    description: 'Master the techniques of Statistical Process Control to monitor and control quality in manufacturing processes.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '10 hours',
    tag: 'Statistical Methods',
    tagColor: '#2196F3',
    rating: 4.7,
    reviewCount: 96,
    deleted: false,
    deletedAt: null
  },
  {
    id: nanoid(),
    title: 'Process Capability (Cp & Cpk)',
    description: 'Understand process capability indices and learn how to measure, analyze, and improve process performance.',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '6 hours',
    tag: 'Quality Control',
    tagColor: '#FF9800',
    rating: 4.9,
    reviewCount: 74,
    deleted: false,
    deletedAt: null
  },
  {
    id: nanoid(),
    title: 'Quality Control Fundamentals',
    description: 'Learn the essential principles and techniques of quality control for manufacturing and service industries.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '5 hours',
    tag: 'Quality Basics',
    tagColor: '#9C27B0',
    rating: 4.6,
    reviewCount: 112,
    deleted: false,
    deletedAt: null
  },
  {
    id: nanoid(),
    title: 'Advanced Statistical Methods for Engineers',
    description: 'Master advanced statistical techniques used in quality engineering including DOE and reliability analysis.',
    imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '12 hours',
    tag: 'Advanced Statistics',
    tagColor: '#E91E63',
    rating: 4.8,
    reviewCount: 86,
    deleted: false,
    deletedAt: null
  }
];

// Modules for the ISO 9001:2015 course
export const getISOModules = (courseId: string): InsertModule[] => [
  {
    id: nanoid(),
    courseId,
    title: 'Introduction to ISO 9001:2015',
    description: 'Overview of the ISO 9001:2015 standard and its importance in quality management.',
    duration: '45 mins',
    order: 1,
    videoUrl: 'https://www.youtube.com/watch?v=sample-video-1',
    completed: false,
    hasQuiz: true,
    tags: ['introduction', 'overview', 'quality management'],
    objectives: ['Understand the ISO 9001:2015 framework', 'Learn the history of ISO standards', 'Identify benefits of ISO 9001 certification']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Quality Management Principles',
    description: 'Exploring the seven quality management principles that form the foundation of ISO 9001:2015.',
    duration: '60 mins',
    order: 2,
    videoUrl: 'https://www.youtube.com/watch?v=sample-video-2',
    completed: false,
    hasQuiz: true,
    tags: ['principles', 'management', 'foundation'],
    objectives: ['Describe the seven quality management principles', 'Apply principles to real-world scenarios', 'Assess organizational alignment with principles']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Process Approach & PDCA',
    description: 'Understanding the process approach and Plan-Do-Check-Act cycle in quality management systems.',
    duration: '90 mins',
    order: 3,
    videoUrl: 'https://www.youtube.com/watch?v=sample-video-3',
    completed: false,
    hasQuiz: true,
    tags: ['process approach', 'PDCA', 'continuous improvement'],
    objectives: ['Implement the process approach', 'Apply PDCA methodology', 'Design process maps for organization']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Risk-Based Thinking',
    description: 'Implementing risk-based thinking in your quality management system to prevent issues.',
    duration: '60 mins',
    order: 4,
    videoUrl: 'https://www.youtube.com/watch?v=sample-video-4',
    completed: false,
    hasQuiz: true,
    tags: ['risk management', 'prevention', 'thinking'],
    objectives: ['Identify organizational risks and opportunities', 'Develop risk mitigation strategies', 'Integrate risk-based thinking into processes']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Documentation Requirements',
    description: 'Understanding the documentation requirements for ISO 9001:2015 compliance.',
    duration: '75 mins',
    order: 5,
    videoUrl: 'https://www.youtube.com/watch?v=sample-video-5',
    completed: false,
    hasQuiz: true,
    tags: ['documentation', 'compliance', 'requirements'],
    objectives: ['Create required documentation', 'Manage document control processes', 'Maintain records effectively']
  }
];

// Modules for the SPC course
export const getSPCModules = (courseId: string): InsertModule[] => [
  {
    id: nanoid(),
    courseId,
    title: 'Fundamentals of Statistics in Quality Control',
    description: 'Introduction to statistical concepts used in quality control and process monitoring.',
    duration: '60 mins',
    order: 1,
    videoUrl: 'https://www.youtube.com/watch?v=sample-spc-1',
    completed: false,
    hasQuiz: true,
    tags: ['statistics', 'quality control', 'basics'],
    objectives: ['Understand basic statistical principles', 'Learn data collection methods', 'Apply statistical thinking to processes']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Variable Control Charts',
    description: 'Creating and interpreting variable control charts for continuous data.',
    duration: '90 mins',
    order: 2,
    videoUrl: 'https://www.youtube.com/watch?v=sample-spc-2',
    completed: false,
    hasQuiz: true,
    tags: ['control charts', 'variables', 'monitoring'],
    objectives: ['Create X-bar and R charts', 'Interpret patterns and trends', 'Apply control limits properly']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Attribute Control Charts',
    description: 'Understanding and using attribute control charts for discrete data.',
    duration: '75 mins',
    order: 3,
    videoUrl: 'https://www.youtube.com/watch?v=sample-spc-3',
    completed: false,
    hasQuiz: true,
    tags: ['attributes', 'p-chart', 'c-chart'],
    objectives: ['Create p-charts and c-charts', 'Analyze attribute data properly', 'Choose appropriate chart types']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Process Capability Analysis',
    description: 'Measuring and analyzing process capability using statistical methods.',
    duration: '90 mins',
    order: 4,
    videoUrl: 'https://www.youtube.com/watch?v=sample-spc-4',
    completed: false,
    hasQuiz: true,
    tags: ['capability', 'Cp', 'Cpk'],
    objectives: ['Calculate process capability indices', 'Interpret capability results', 'Improve process capability']
  },
  {
    id: nanoid(),
    courseId,
    title: 'Implementing SPC in Your Organization',
    description: 'Practical guide to implementing Statistical Process Control in manufacturing environments.',
    duration: '120 mins',
    order: 5,
    videoUrl: 'https://www.youtube.com/watch?v=sample-spc-5',
    completed: false,
    hasQuiz: true,
    tags: ['implementation', 'practical', 'organization'],
    objectives: ['Develop SPC implementation plan', 'Train operators in SPC methods', 'Sustain SPC program long-term']
  }
];

// Materials for the ISO 9001 course
export const getISOMaterials = (courseId: string): InsertMaterial[] => [
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'ISO 9001:2015 Standard Overview',
    description: 'Complete overview document of the ISO 9001:2015 standard with key points highlighted.',
    url: 'https://example.com/iso-9001-overview.pdf',
    fileSize: '2.4 MB'
  },
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Quality Management Principles Guide',
    description: 'Detailed explanation of the seven quality management principles with examples and case studies.',
    url: 'https://example.com/qm-principles.pdf',
    fileSize: '3.8 MB'
  },
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Process Mapping Templates',
    description: 'Templates and guidelines for creating effective process maps for your organization.',
    url: 'https://example.com/process-mapping.pdf',
    fileSize: '1.5 MB'
  },
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Risk Assessment Worksheets',
    description: 'Practical worksheets for identifying and assessing risks in your quality management system.',
    url: 'https://example.com/risk-assessment.pdf',
    fileSize: '2.1 MB'
  }
];

// Materials for the SPC course
export const getSPCMaterials = (courseId: string): InsertMaterial[] => [
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Statistical Process Control Handbook',
    description: 'Comprehensive handbook covering all aspects of Statistical Process Control with examples.',
    url: 'https://example.com/spc-handbook.pdf',
    fileSize: '4.2 MB'
  },
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Control Chart Templates',
    description: 'Ready-to-use templates for creating various types of control charts in Excel.',
    url: 'https://example.com/control-charts.pdf',
    fileSize: '1.8 MB'
  },
  {
    id: nanoid(),
    courseId,
    type: 'pdf',
    title: 'Case Studies in SPC Implementation',
    description: 'Real-world case studies of successful SPC implementation in various industries.',
    url: 'https://example.com/spc-cases.pdf',
    fileSize: '3.5 MB'
  }
];

// Function to seed all the default courses, modules, and materials
export async function seedDefaultCourses() {
  try {
    console.log('Starting to seed default courses...');
    
    // Check if courses already exist
    const existingCourses = await storage.getAllCourses();
    if (existingCourses.length > 0) {
      console.log('Courses already exist, skipping default course creation');
      return;
    }
    
    // Create all default courses
    for (const courseData of defaultCourses) {
      console.log(`Creating course: ${courseData.title}`);
      const course = await storage.createCourse(courseData);
      
      // Create modules for ISO course
      if (course.title.includes('ISO 9001')) {
        const modules = getISOModules(course.id);
        for (const moduleData of modules) {
          console.log(`Creating module: ${moduleData.title}`);
          await storage.createModule(moduleData);
        }
        
        // Create materials for ISO course
        const materials = getISOMaterials(course.id);
        for (const materialData of materials) {
          console.log(`Creating material: ${materialData.title}`);
          await storage.createMaterial(materialData);
        }
      }
      
      // Create modules for SPC course
      if (course.title.includes('Statistical Process Control')) {
        const modules = getSPCModules(course.id);
        for (const moduleData of modules) {
          console.log(`Creating module: ${moduleData.title}`);
          await storage.createModule(moduleData);
        }
        
        // Create materials for SPC course
        const materials = getSPCMaterials(course.id);
        for (const materialData of materials) {
          console.log(`Creating material: ${materialData.title}`);
          await storage.createMaterial(materialData);
        }
      }
    }
    
    console.log('Default courses seeded successfully');
  } catch (error) {
    console.error('Error seeding default courses:', error);
  }
}