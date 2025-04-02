
// Script to reset materials to use SOPs instead of placeholder downloads
const { storage } = require('./storage');
const { seedDefaultSOPs } = require('./seedDefaultSOPs');

async function resetMaterials() {
  try {
    console.log('Starting to reset materials...');
    
    // Get all existing courses
    const courses = await storage.getAllCourses();
    console.log(`Found ${courses.length} courses`);
    
    // Delete all existing materials
    for (const course of courses) {
      const materials = await storage.getCourseMaterials(course.id);
      console.log(`Deleting ${materials.length} materials for course: ${course.title}`);
      
      for (const material of materials) {
        await storage.deleteMaterial(material.id);
      }
    }
    
    console.log('All materials deleted successfully');
    
    // Re-seed the default courses which will create new materials with SOP references
    const { seedDefaultCourses } = require('./seedDefaultCourses');
    await seedDefaultCourses();
    
    console.log('Materials reset complete');
  } catch (error) {
    console.error('Error resetting materials:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  resetMaterials()
    .then(() => console.log('Reset completed'))
    .catch(err => console.error('Reset failed:', err));
}

module.exports = { resetMaterials };
