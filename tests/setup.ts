// Jest setup file for Phase 1 CI testing
// Mocks database dependencies to avoid requiring DATABASE_URL

jest.mock('../lib/prisma', () => ({
  prisma: {
    session: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({
        id: 'mock-session-id-123',
        token: 'mock-jwt-token-abc123',
        userId: 'mock-user-id-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({
        id: 'mock-session-id-123',
        token: 'mock-refreshed-token-xyz789',
        userId: 'mock-user-id-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      delete: jest.fn().mockResolvedValue({
        id: 'mock-session-id-123',
        token: 'mock-jwt-token-abc123',
        userId: 'mock-user-id-456'
      })
    },
    user: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({
        id: 'mock-user-id-456',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({
        id: 'mock-user-id-456',
        email: 'test@example.com',
        name: 'Test User Updated',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $connect: jest.fn().mockResolvedValue(undefined)
  }
}));

// Note: OAuth test failures are expected in Phase 1 
// as they require OAuth provider mocking which is Phase 3 scope
