// Prisma client singleton for use in app and tests
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export { prisma };
