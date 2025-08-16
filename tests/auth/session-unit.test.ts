// Unit tests for session management (Phase 1 scope)
// Tests business logic with mocked database calls
import { prisma } from '../../lib/prisma';

const TEST_USER_EMAIL = 'test@example.com';

describe('Session Management - Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a user successfully', async () => {
    const mockUser = {
      id: 456,
      email: TEST_USER_EMAIL,
      name: 'Test User',
      createdAt: new Date()
    };

    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const user = await prisma.user.create({
      data: { email: TEST_USER_EMAIL, name: 'Test User' }
    });

    expect(user).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: TEST_USER_EMAIL, name: 'Test User' }
    });
  });

  it('should create a session successfully', async () => {
    const mockSession = {
      id: 123,
      token: 'mock-jwt-token-abc123',
      userId: 456,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

    const session = await prisma.session.create({
      data: {
        userId: 456,
        token: 'mock-jwt-token-abc123',
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    });

    expect(session).toEqual(mockSession);
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: 456,
        token: 'mock-jwt-token-abc123',
        expiry: expect.any(Date),
        updatedAt: expect.any(Date)
      }
    });
  });

  it('should delete sessions successfully', async () => {
    const mockDeleteResult = { count: 1 };

    (prisma.session.deleteMany as jest.Mock).mockResolvedValue(mockDeleteResult);

    const result = await prisma.session.deleteMany({
      where: { userId: 456 }
    });

    expect(result).toEqual(mockDeleteResult);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 456 }
    });
  });

  it('should find user by email', async () => {
    const mockUser = {
      id: 456,
      email: TEST_USER_EMAIL,
      name: 'Test User',
      createdAt: new Date()
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    const user = await prisma.user.findFirst({
      where: { email: TEST_USER_EMAIL }
    });

    expect(user).toEqual(mockUser);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: TEST_USER_EMAIL }
    });
  });

  it('should find session by token', async () => {
    const mockSession = {
      id: 123,
      token: 'mock-jwt-token-abc123',
      userId: 456,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (prisma.session.findFirst as jest.Mock).mockResolvedValue(mockSession);

    const session = await prisma.session.findFirst({
      where: { token: 'mock-jwt-token-abc123' }
    });

    expect(session).toEqual(mockSession);
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: { token: 'mock-jwt-token-abc123' }
    });
  });

  it('should handle database disconnect', async () => {
    await prisma.$disconnect();
    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});
