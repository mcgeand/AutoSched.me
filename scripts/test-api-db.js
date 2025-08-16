// Test script to validate API database connectivity
const { PrismaClient } = require('@prisma/client');

async function testDatabaseOperations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connectivity...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test User table operations
    console.log('\n🧪 Testing User operations...');
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test Session table operations  
    console.log('\n🧪 Testing Session operations...');
    const sessionCount = await prisma.session.count();
    console.log(`📊 Current session count: ${sessionCount}`);
    
    // Test creating a test user (will be cleaned up)
    console.log('\n🧪 Testing User creation...');
    const uniqueEmail = `test-${Date.now()}@autosched.dev`;
    const testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Test User'
      }
    });
    console.log(`✅ Created test user: ${testUser.id}`);
    
    // Test session creation for the user
    console.log('\n🧪 Testing Session creation...');
    const testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        token: 'test-session-token-123',
        expiry: new Date(Date.now() + 86400000), // 24 hours
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created test session: ${testSession.id}`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.session.delete({ where: { id: testSession.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database operations successful!');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseOperations();
