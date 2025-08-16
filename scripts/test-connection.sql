SELECT version() AS postgres_version;
SELECT current_database() AS database_name;
SELECT count(*) AS migration_count FROM _prisma_migrations;
