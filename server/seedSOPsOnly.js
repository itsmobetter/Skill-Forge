
// Script to seed SOPs without affecting other data
const { storage } = require('./storage');
const { seedDefaultSOPs } = require('./seedDefaultSOPs');

async function seedSOPsOnly() {
  try {
    console.log('Starting to seed SOPs only...');
    
    // Seed the default SOPs
    await seedDefaultSOPs();
    
    // Get all SOPs to confirm they were seeded
    const sops = await storage.getAllSOPs();
    console.log(`Successfully seeded ${sops.length} SOPs`);
    
    sops.forEach(sop => {
      console.log(`- ${sop.title} (ID: ${sop.id})`);
    });
    
    console.log('SOP seeding complete');
  } catch (error) {
    console.error('Error seeding SOPs:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  seedSOPsOnly()
    .then(() => console.log('SOP seeding completed'))
    .catch(err => console.error('SOP seeding failed:', err));
}

module.exports = { seedSOPsOnly };
