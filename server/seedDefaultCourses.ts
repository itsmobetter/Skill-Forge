import { nanoid } from 'nanoid';
import { storage } from './storage';
import { InsertCourse, InsertModule, InsertMaterial } from '@shared/schema';

// Default courses focusing on quality assurance topics
export const defaultCourses: Omit<InsertCourse, 'id'>[] = [
  {
    title: 'ISO 9001:2015 Fundamentals',
    description: 'Learn the fundamentals of ISO 9001:2015 Quality Management System and how to implement it in your organization.',
    imageUrl: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '8 hours',
    tag: 'Quality Management',
    tagColor: '#4CAF50',
    rating: 5,  // Converted from 4.8 to integer
    reviewCount: 128,
    deleted: false,
    deletedAt: null
  },
  {
    title: 'Statistical Process Control (SPC)',
    description: 'Master the techniques of Statistical Process Control to monitor and control quality in manufacturing processes.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '10 hours',
    tag: 'Statistical Methods',
    tagColor: '#2196F3',
    rating: 5,  // Converted from 4.7 to integer
    reviewCount: 96,
    deleted: false,
    deletedAt: null
  },
  {
    title: 'Process Capability (Cp & Cpk)',
    description: 'Understand process capability indices and learn how to measure, analyze, and improve process performance.',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '6 hours',
    tag: 'Quality Control',
    tagColor: '#FF9800',
    rating: 5,  // Converted from 4.9 to integer
    reviewCount: 74,
    deleted: false,
    deletedAt: null
  },
  {
    title: 'Quality Control Fundamentals',
    description: 'Learn the essential principles and techniques of quality control for manufacturing and service industries.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '5 hours',
    tag: 'Quality Basics',
    tagColor: '#9C27B0',
    rating: 5,  // Converted from 4.6 to integer
    reviewCount: 112,
    deleted: false,
    deletedAt: null
  },
  {
    title: 'Advanced Statistical Methods for Engineers',
    description: 'Master advanced statistical techniques used in quality engineering including DOE and reliability analysis.',
    imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    duration: '12 hours',
    tag: 'Advanced Statistics',
    tagColor: '#E91E63',
    rating: 5,  // Converted from 4.8 to integer
    reviewCount: 86,
    deleted: false,
    deletedAt: null
  }
];

// Modules for the ISO 9001:2015 course
export const getISOModules = (courseId: string): Omit<InsertModule, 'id'>[] => [
  {
    courseId,
    title: 'Introduction to ISO 9001:2015',
    description: 'Overview of the ISO 9001:2015 standard and its importance in quality management.',
    duration: '45 mins',
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/Nhlv_3-dQSk',
    completed: false,
    hasQuiz: true,
    tags: ['introduction', 'overview', 'quality management'],
    objectives: ['Understand the ISO 9001:2015 framework', 'Learn the history of ISO standards', 'Identify benefits of ISO 9001 certification']
  },
  {
    courseId,
    title: 'Quality Management Principles',
    description: 'Exploring the seven quality management principles that form the foundation of ISO 9001:2015.',
    duration: '60 mins',
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/adaOKKkamT8',
    completed: false,
    hasQuiz: true,
    tags: ['principles', 'management', 'foundation'],
    objectives: ['Describe the seven quality management principles', 'Apply principles to real-world scenarios', 'Assess organizational alignment with principles']
  },
  {
    courseId,
    title: 'Process Approach & PDCA',
    description: 'Understanding the process approach and Plan-Do-Check-Act cycle in quality management systems.',
    duration: '90 mins',
    order: 3,
    videoUrl: 'https://www.youtube.com/embed/otnEiom_BJM',
    completed: false,
    hasQuiz: true,
    tags: ['process approach', 'PDCA', 'continuous improvement'],
    objectives: ['Implement the process approach', 'Apply PDCA methodology', 'Design process maps for organization']
  },
  {
    courseId,
    title: 'Risk-Based Thinking',
    description: 'Implementing risk-based thinking in your quality management system to prevent issues.',
    duration: '60 mins',
    order: 4,
    videoUrl: 'https://www.youtube.com/embed/lJqqM-bdDMI',
    completed: false,
    hasQuiz: true,
    tags: ['risk management', 'prevention', 'thinking'],
    objectives: ['Identify organizational risks and opportunities', 'Develop risk mitigation strategies', 'Integrate risk-based thinking into processes']
  },
  {
    courseId,
    title: 'Documentation Requirements',
    description: 'Understanding the documentation requirements for ISO 9001:2015 compliance.',
    duration: '75 mins',
    order: 5,
    videoUrl: 'https://www.youtube.com/embed/qSVqDNOkOTo',
    completed: false,
    hasQuiz: true,
    tags: ['documentation', 'compliance', 'requirements'],
    objectives: ['Create required documentation', 'Manage document control processes', 'Maintain records effectively']
  }
];

// Modules for the SPC course
export const getSPCModules = (courseId: string): Omit<InsertModule, 'id'>[] => [
  {
    courseId,
    title: 'Fundamentals of Statistics in Quality Control',
    description: 'Introduction to statistical concepts used in quality control and process monitoring.',
    duration: '60 mins',
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/e5g2NmIUdck',
    completed: false,
    hasQuiz: true,
    tags: ['statistics', 'quality control', 'basics'],
    objectives: ['Understand basic statistical principles', 'Learn data collection methods', 'Apply statistical thinking to processes']
  },
  {
    courseId,
    title: 'Variable Control Charts',
    description: 'Creating and interpreting variable control charts for continuous data.',
    duration: '90 mins',
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/Kw_ZMiMNi04',
    completed: false,
    hasQuiz: true,
    tags: ['control charts', 'variables', 'monitoring'],
    objectives: ['Create X-bar and R charts', 'Interpret patterns and trends', 'Apply control limits properly']
  },
  {
    courseId,
    title: 'Attribute Control Charts',
    description: 'Understanding and using attribute control charts for discrete data.',
    duration: '75 mins',
    order: 3,
    videoUrl: 'https://www.youtube.com/embed/B5uIVEY3LRQ',
    completed: false,
    hasQuiz: true,
    tags: ['attributes', 'p-chart', 'c-chart'],
    objectives: ['Create p-charts and c-charts', 'Analyze attribute data properly', 'Choose appropriate chart types']
  },
  {
    courseId,
    title: 'Process Capability Analysis',
    description: 'Measuring and analyzing process capability using statistical methods.',
    duration: '90 mins',
    order: 4,
    videoUrl: 'https://www.youtube.com/embed/Sljmwulmrdw',
    completed: false,
    hasQuiz: true,
    tags: ['capability', 'Cp', 'Cpk'],
    objectives: ['Calculate process capability indices', 'Interpret capability results', 'Improve process capability']
  },
  {
    courseId,
    title: 'Implementing SPC in Your Organization',
    description: 'Practical guide to implementing Statistical Process Control in manufacturing environments.',
    duration: '120 mins',
    order: 5,
    videoUrl: 'https://info.minitab.com/en/real-time-statistical-process-control-training-video-ty',
    completed: false,
    hasQuiz: true,
    tags: ['implementation', 'practical', 'organization'],
    objectives: ['Develop SPC implementation plan', 'Train operators in SPC methods', 'Sustain SPC program long-term']
  }
];

// Modules for the Cp & Cpk course
export const getCpCpkModules = (courseId: string): Omit<InsertModule, 'id'>[] => [
  {
    courseId,
    title: 'Introduction to Process Capability',
    description: 'Understanding what process capability is and why it matters in quality assurance.',
    duration: '45 mins',
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/r6xa7ZpfGn8',
    completed: false,
    hasQuiz: true,
    tags: ['capability', 'introduction', 'quality assurance'],
    objectives: ['Define process capability', 'Understand the business impact of capability', 'Identify when to use capability studies']
  },
  {
    courseId,
    title: 'Process Variation and Distribution',
    description: 'Analyzing process variation and understanding normal distribution in capability studies.',
    duration: '60 mins',
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/TfVcP_drj50',
    completed: false,
    hasQuiz: true,
    tags: ['variation', 'distribution', 'statistics'],
    objectives: ['Identify sources of variation', 'Apply normal distribution concepts', 'Calculate standard deviation']
  },
  {
    courseId,
    title: 'Cp & Cpk: Calculation and Interpretation',
    description: 'Learning to calculate and interpret the Cp and Cpk indices.',
    duration: '90 mins',
    order: 3,
    videoUrl: 'https://www.youtube.com/embed/B5uIVEY3LRQ',
    completed: false,
    hasQuiz: true,
    tags: ['Cp', 'Cpk', 'indices', 'calculation'],
    objectives: ['Calculate Cp and Cpk correctly', 'Interpret Cp and Cpk values', 'Understand the relationship between Cp and Cpk']
  },
  {
    courseId,
    title: 'Improving Process Capability',
    description: 'Techniques for improving process capability in manufacturing settings.',
    duration: '75 mins',
    order: 4,
    videoUrl: 'https://www.youtube.com/embed/Sljmwulmrdw',
    completed: false,
    hasQuiz: true,
    tags: ['improvement', 'techniques', 'implementation'],
    objectives: ['Diagnose capability issues', 'Apply targeted improvement strategies', 'Monitor capability improvements']
  },
  {
    courseId,
    title: 'Case Studies and Applications',
    description: 'Real-world case studies showing successful application of capability concepts.',
    duration: '60 mins',
    order: 5,
    videoUrl: 'https://www.youtube.com/embed/B5uIVEY3LRQ',
    completed: false,
    hasQuiz: true,
    tags: ['case studies', 'applications', 'real-world'],
    objectives: ['Apply capability principles to diverse situations', 'Learn from industry examples', 'Avoid common implementation pitfalls']
  }
];

// Materials for the ISO 9001 course 
export const getISOMaterials = (courseId: string, sopIds: Record<string, string>): Omit<InsertMaterial, 'id'>[] => [
  {
    courseId,
    type: 'sop',
    title: 'ISO 9001:2015 Document Control Procedure',
    description: 'Standard procedure for controlling documents required by the quality management system.',
    url: '#',
    fileSize: 'SOP Document',
    sopId: sopIds['ISO 9001:2015 Document Control Procedure']
  },
  {
    courseId,
    type: 'pdf',
    title: 'Quality Management Principles Guide',
    description: 'Detailed explanation of the seven quality management principles with examples and case studies.',
    url: '#',
    fileSize: '3.8 MB'
  },
  {
    courseId,
    type: 'pdf',
    title: 'Process Mapping Templates',
    description: 'Templates and guidelines for creating effective process maps for your organization.',
    url: '#',
    fileSize: '1.5 MB'
  },
  {
    courseId,
    type: 'pdf',
    title: 'Risk Assessment Worksheets',
    description: 'Practical worksheets for identifying and assessing risks in your quality management system.',
    url: '#',
    fileSize: '2.1 MB'
  }
];

// Materials for the SPC course
export const getSPCMaterials = (courseId: string, sopIds: Record<string, string>): Omit<InsertMaterial, 'id'>[] => [
  {
    courseId,
    type: 'sop',
    title: 'Statistical Process Control Implementation',
    description: 'Standardized approach for implementing Statistical Process Control (SPC) in manufacturing processes.',
    url: '#',
    fileSize: 'SOP Document',
    sopId: sopIds['Statistical Process Control Implementation']
  },
  {
    courseId,
    type: 'pdf',
    title: 'Control Chart Templates',
    description: 'Ready-to-use templates for creating various types of control charts in Excel.',
    url: '#',
    fileSize: '1.8 MB'
  },
  {
    courseId,
    type: 'pdf',
    title: 'Case Studies in SPC Implementation',
    description: 'Real-world case studies of successful SPC implementation in various industries.',
    url: '#',
    fileSize: '3.5 MB'
  }
];

// Materials for the Cp & Cpk course
export const getCpCpkMaterials = (courseId: string, sopIds: Record<string, string>): Omit<InsertMaterial, 'id'>[] => [
  {
    courseId,
    type: 'sop',
    title: 'Process Capability Analysis Procedure',
    description: 'Standard method for conducting process capability studies to determine if processes meet quality requirements.',
    url: '#',
    fileSize: 'SOP Document',
    sopId: sopIds['Process Capability Analysis Procedure']
  },
  {
    courseId,
    type: 'spreadsheet',
    title: 'Cp/Cpk Calculator',
    description: 'Excel-based calculator for computing process capability indices from sample data.',
    url: '#',
    fileSize: '750 KB'
  },
  {
    courseId,
    type: 'pdf',
    title: 'Process Capability Case Studies',
    description: 'Real-world examples of how process capability analysis improved manufacturing quality.',
    url: '#',
    fileSize: '2.8 MB'
  },
  {
    courseId,
    type: 'pdf',
    title: 'Statistical Distributions Reference',
    description: 'Reference guide for understanding statistical distributions in process capability analysis.',
    url: '#',
    fileSize: '4.1 MB'
  }
];

// Function to seed all the default courses, modules, and materials
// Import the SOP seeding function
import { seedDefaultSOPs, defaultSOPs } from './seedDefaultSOPs';

export async function seedDefaultCourses() {
  try {
    console.log('Starting to seed default courses and SOPs...');
    
    // Seed SOPs first to get their IDs
    await seedDefaultSOPs();
    
    // Get all SOPs to reference in materials
    const allSOPs = await storage.getAllSOPs();
    const sopIds: Record<string, string> = {};
    
    // Create a map of SOP titles to IDs for easy reference
    allSOPs.forEach(sop => {
      sopIds[sop.title] = sop.id;
    });
    
    console.log('SOP IDs retrieved:', Object.keys(sopIds).length);
    
    // Check if courses already exist
    const existingCourses = await storage.getAllCourses();
    
    // We'll check which courses already exist and which ones we need to create
    if (existingCourses.length > 0) {
      console.log('Some courses exist, adding modules to existing courses and creating missing ones');
      
      // First, add modules to existing courses if needed
      for (const course of existingCourses) {
        console.log(`Checking modules for course: ${course.title}`);
        
        // Check if this course already has modules
        const existingModules = await storage.getCourseModules(course.id);
        if (existingModules.length > 0) {
          console.log(`Course ${course.title} already has ${existingModules.length} modules, skipping`);
          continue;
        }
        
        // Add modules based on course title
        if (course.title.toLowerCase().includes('iso 9001')) {
          console.log(`Adding modules to ISO course: ${course.title}`);
          const modules = getISOModules(course.id);
          for (const moduleData of modules) {
            console.log(`Creating module: ${moduleData.title}`);
            await storage.createModule(moduleData);
          }
          
          // Create materials for ISO course with SOP references
          const materials = getISOMaterials(course.id, sopIds);
          for (const materialData of materials) {
            console.log(`Creating material: ${materialData.title}`);
            await storage.createMaterial(materialData);
          }
        }
        
        if (course.title.toLowerCase().includes('statistical process control') || course.title.toLowerCase().includes('spc')) {
          console.log(`Adding modules to SPC course: ${course.title}`);
          const modules = getSPCModules(course.id);
          for (const moduleData of modules) {
            console.log(`Creating module: ${moduleData.title}`);
            await storage.createModule(moduleData);
          }
          
          // Create materials for SPC course with SOP references
          const materials = getSPCMaterials(course.id, sopIds);
          for (const materialData of materials) {
            console.log(`Creating material: ${materialData.title}`);
            await storage.createMaterial(materialData);
          }
        }
        
        if (course.title.toLowerCase().includes('process capability') || course.title.toLowerCase().includes('cp & cpk')) {
          console.log(`Adding modules to Cp & Cpk course: ${course.title}`);
          const modules = getCpCpkModules(course.id);
          for (const moduleData of modules) {
            console.log(`Creating module: ${moduleData.title}`);
            await storage.createModule(moduleData);
          }
          
          // Create materials for Cp & Cpk course with SOP references
          const materials = getCpCpkMaterials(course.id, sopIds);
          for (const materialData of materials) {
            console.log(`Creating material: ${materialData.title}`);
            await storage.createMaterial(materialData);
          }
        }
      }
      
      // Now check for missing courses and create them
      const existingCourseTitles = existingCourses.map(course => course.title.toLowerCase());
      
      for (const courseData of defaultCourses) {
        if (!existingCourseTitles.includes(courseData.title.toLowerCase())) {
          console.log(`Creating missing course: ${courseData.title}`);
          const course = await storage.createCourse(courseData);
          
          // Create modules for this course
          if (course.title.toLowerCase().includes('iso 9001')) {
            const modules = getISOModules(course.id);
            for (const moduleData of modules) {
              console.log(`Creating module: ${moduleData.title}`);
              await storage.createModule(moduleData);
            }
            
            // Create materials with SOP references
            const materials = getISOMaterials(course.id, sopIds);
            for (const materialData of materials) {
              console.log(`Creating material: ${materialData.title}`);
              await storage.createMaterial(materialData);
            }
          }
          
          if (course.title.toLowerCase().includes('statistical process control') || course.title.toLowerCase().includes('spc')) {
            const modules = getSPCModules(course.id);
            for (const moduleData of modules) {
              console.log(`Creating module: ${moduleData.title}`);
              await storage.createModule(moduleData);
            }
            
            // Create materials with SOP references
            const materials = getSPCMaterials(course.id, sopIds);
            for (const materialData of materials) {
              console.log(`Creating material: ${materialData.title}`);
              await storage.createMaterial(materialData);
            }
          }
          
          if (course.title.toLowerCase().includes('process capability') || course.title.toLowerCase().includes('cp & cpk')) {
            const modules = getCpCpkModules(course.id);
            for (const moduleData of modules) {
              console.log(`Creating module: ${moduleData.title}`);
              await storage.createModule(moduleData);
            }
            
            // Create materials with SOP references
            const materials = getCpCpkMaterials(course.id, sopIds);
            for (const materialData of materials) {
              console.log(`Creating material: ${materialData.title}`);
              await storage.createMaterial(materialData);
            }
          }
        }
      }
      
      return;
    }
    
    // Create all default courses
    for (const courseData of defaultCourses) {
      console.log(`Creating course: ${courseData.title}`);
      const course = await storage.createCourse(courseData);
      
      // Create modules for ISO course
      if (course.title.toLowerCase().includes('iso 9001')) {
        const modules = getISOModules(course.id);
        for (const moduleData of modules) {
          console.log(`Creating module: ${moduleData.title}`);
          await storage.createModule(moduleData);
        }
        
        // Create materials for ISO course with SOP references
        const materials = getISOMaterials(course.id, sopIds);
        for (const materialData of materials) {
          console.log(`Creating material: ${materialData.title}`);
          await storage.createMaterial(materialData);
        }
      }
      
      // Create modules for SPC course
      if (course.title.toLowerCase().includes('statistical process control') || course.title.toLowerCase().includes('spc')) {
        const modules = getSPCModules(course.id);
        for (const moduleData of modules) {
          console.log(`Creating module: ${moduleData.title}`);
          await storage.createModule(moduleData);
        }
        
        // Create materials for SPC course with SOP references
        const materials = getSPCMaterials(course.id, sopIds);
        for (const materialData of materials) {
          console.log(`Creating material: ${materialData.title}`);
          await storage.createMaterial(materialData);
        }
      }
      
      // Create modules for Process Capability (Cp & Cpk) course
      if (course.title.toLowerCase().includes('process capability') || course.title.toLowerCase().includes('cp & cpk')) {
        const modules = getCpCpkModules(course.id);
        for (const moduleData of modules) {
          console.log(`Creating module: ${moduleData.title}`);
          await storage.createModule(moduleData);
        }
        
        // Create materials for Cp & Cpk course with SOP references
        const materials = getCpCpkMaterials(course.id, sopIds);
        for (const materialData of materials) {
          console.log(`Creating material: ${materialData.title}`);
          await storage.createMaterial(materialData);
        }
      }
    }
    
    console.log('Default courses and SOPs seeded successfully');
  } catch (error) {
    console.error('Error seeding default courses and SOPs:', error);
  }
}