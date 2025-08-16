-- Database initialization script for AutoSched development
-- This script runs when the PostgreSQL container is first created

-- Enable UUID extension for Prisma
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone for consistent development
SET timezone = 'UTC';

-- Verify database is ready
SELECT 'AutoSched development database initialized successfully' AS status;
