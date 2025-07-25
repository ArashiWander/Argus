# Migration Scripts for Argus

This directory contains utility scripts to support migration operations for the Argus monitoring platform.

## Scripts Overview

### 1. `migrate.sh` - Main Migration Utility
Handles database schema migrations and data migrations.

**Usage:**
```bash
# Check dependencies
./scripts/migrate.sh check-deps

# Check database health
./scripts/migrate.sh check-health

# Create database backups
./scripts/migrate.sh backup-postgres
./scripts/migrate.sh backup-influxdb

# Run Phase 4 migration
./scripts/migrate.sh migrate 4

# Verify migration status
./scripts/migrate.sh verify

# Rollback to backup
./scripts/migrate.sh rollback backups/postgres_backup_20231201_120000.sql
```

### 2. `config-migrate.sh` - Configuration Migration
Handles environment variable and configuration file migrations.

**Usage:**
```bash
# Backup current configuration
./scripts/config-migrate.sh backup-config

# Migrate from v1.x to v2.x format
./scripts/config-migrate.sh migrate-v1-to-v2

# Create default configuration
./scripts/config-migrate.sh create-default

# Validate configuration
./scripts/config-migrate.sh validate backend/.env

# Generate from template
./scripts/config-migrate.sh from-template
```

### 3. `validate-migration.sh` - Migration Validation
Validates data integrity and system health after migration.

**Usage:**
```bash
# Full validation
./scripts/validate-migration.sh full

# Validate specific components
./scripts/validate-migration.sh postgresql
./scripts/validate-migration.sh influxdb
./scripts/validate-migration.sh elasticsearch
./scripts/validate-migration.sh redis
./scripts/validate-migration.sh api

# Generate validation report
./scripts/validate-migration.sh report
```

## Migration Workflow

### Standard Migration Process

1. **Pre-Migration**
   ```bash
   # Check system health
   ./scripts/migrate.sh check-health
   
   # Backup configuration
   ./scripts/config-migrate.sh backup-config
   
   # Create database backups
   ./scripts/migrate.sh backup-postgres
   ./scripts/migrate.sh backup-influxdb
   ```

2. **Migration**
   ```bash
   # Apply migration
   ./scripts/migrate.sh migrate 4
   
   # Update configuration if needed
   ./scripts/config-migrate.sh migrate-v1-to-v2
   ```

3. **Post-Migration**
   ```bash
   # Validate migration
   ./scripts/validate-migration.sh full
   
   # Verify specific components
   ./scripts/migrate.sh verify
   ```

### Rollback Process

If migration fails or issues are discovered:

```bash
# Stop application
docker-compose down

# Rollback database
./scripts/migrate.sh rollback backups/postgres_backup_YYYYMMDD_HHMMSS.sql

# Restore configuration
cp config_backups/.env_backend_YYYYMMDD_HHMMSS backend/.env

# Restart with previous version
git checkout previous-version
docker-compose up -d
```

## Dependencies

The migration scripts require the following tools:

- `bash` (version 4.0+)
- `docker` and `docker-compose`
- `psql` (PostgreSQL client)
- `influx` (InfluxDB CLI)
- `curl`
- `jq`
- `redis-cli`

Install missing dependencies:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-client-common postgresql-client curl jq redis-tools

# macOS (with Homebrew)
brew install postgresql influxdb-cli curl jq redis

# Docker-based tools (if local installation not preferred)
docker run --rm -v $(pwd):/workspace postgres:15 pg_dump --help
```

## Environment Variables

The scripts use the following environment variables (with defaults):

```bash
# Database connections
DATABASE_URL=postgresql://postgres:password@localhost:5432/argus
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379

# Application settings
NODE_ENV=development
PORT=3001
```

## File Locations

- **Backups**: `./backups/`
- **Configuration Backups**: `./config_backups/`
- **Migration Logs**: `./migration.log`
- **Validation Reports**: `./validation_report_YYYYMMDD_HHMMSS.txt`

## Error Handling

All scripts include comprehensive error handling:

- Exit on first error (`set -e`)
- Colored output for easy identification
- Detailed logging with timestamps
- Validation checks before destructive operations
- Rollback capabilities for failed migrations

## Security Considerations

1. **Backup Encryption**: For production environments, encrypt sensitive backups:
   ```bash
   gpg --symmetric --cipher-algo AES256 postgres_backup.sql
   ```

2. **Secure Transfer**: Use secure methods for backup transfer:
   ```bash
   scp -P 22 backup.sql.gpg user@backup-server:/secure/location/
   ```

3. **Environment Variables**: Never commit sensitive environment variables to version control.

4. **Access Control**: Ensure migration scripts have appropriate permissions and are run by authorized users only.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Database Connection Failed**
   - Verify database services are running
   - Check connection strings in environment variables
   - Ensure network connectivity

3. **Missing Dependencies**
   ```bash
   ./scripts/migrate.sh check-deps
   ```

4. **Insufficient Disk Space**
   - Check available space before backup operations
   - Clean up old backups and logs

### Debug Mode

Enable verbose output for troubleshooting:

```bash
bash -x ./scripts/migrate.sh migrate 4
```

## Best Practices

1. **Test First**: Always test migrations in a development/staging environment
2. **Backup Everything**: Create comprehensive backups before any migration
3. **Document Changes**: Keep detailed logs of migration operations
4. **Validate Results**: Run full validation after every migration
5. **Plan Rollback**: Have a tested rollback plan before starting
6. **Monitor Resources**: Watch disk space, memory, and CPU during migrations
7. **Communicate**: Inform stakeholders about migration timelines and potential downtime

## Support

For additional support:
- Review the main [Migration Guide](../project_argus_migration.md)
- Check the [Database Setup Guide](../docs/DATABASE_SETUP.md)
- Consult the [Development Guide](../docs/DEVELOPMENT.md)

---

*Last updated: $(date)*