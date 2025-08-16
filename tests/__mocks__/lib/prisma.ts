// Mock implementation of Prisma client for Phase 1 CI testing
// This allows tests to run without database dependencies

export const prisma = {
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
};

// Export default for ES module compatibility
export default { prisma };
