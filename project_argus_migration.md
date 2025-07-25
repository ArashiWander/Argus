# Project Argus Migration Guide

## Overview

This guide provides comprehensive migration strategies for the Argus monitoring platform, covering database schema upgrades, data migrations, infrastructure changes, and version compatibility procedures. Argus uses multiple database systems that require coordinated migration strategies.

## Database Architecture

Argus employs a multi-database architecture:

- **PostgreSQL**: Metadata, configuration, users, alerts, security events, and audit trails
- **InfluxDB**: Time-series metrics data
- **Elasticsearch**: Log storage and full-text search
- **Redis**: Caching, session management, and temporary data

## Migration Types

### 1. Schema Migrations (PostgreSQL)

#### Current Schema Versions
- **Phase 1-2**: Basic tables (users, alert_rules, alerts, notification_channels, dashboards)
- **Phase 3**: Enhanced alerting and analytics features
- **Phase 4**: AI analytics, security monitoring, and compliance features

#### Migration Strategy

```sql
-- Check current schema version
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('anomalies', 'security_events', 'threat_detection_rules');
```

#### Phase 4 Migration Checklist
- [ ] Backup existing PostgreSQL database
- [ ] Apply Phase 4 schema: `backend/src/config/phase4_schema.sql`
- [ ] Verify new tables: anomalies, security_events, threat_detection_rules, etc.
- [ ] Test new features: anomaly detection, security monitoring
- [ ] Update application configuration
- [ ] Validate data integrity

#### Safe Migration Process

```bash
# 1. Create backup
pg_dump -U postgres -h localhost argus > argus_backup_$(date +%Y%m%d).sql

# 2. Apply migration in transaction
psql -U postgres -h localhost argus -c "BEGIN; \i backend/src/config/phase4_schema.sql; COMMIT;"

# 3. Verify migration
psql -U postgres -h localhost argus -c "SELECT COUNT(*) FROM anomalies, security_events;"
```

### 2. Data Migrations

#### Metrics Data (InfluxDB)

**Migration Between InfluxDB Versions:**

```bash
# Export data from v1.x to v2.x
influx v1 dbrp create \
  --db argus_v1 \
  --rp autogen \
  --bucket-id 0000000000000000 \
  --default

# Import data to new bucket
influx write \
  --bucket metrics \
  --org argus \
  --file exported_metrics.lp
```

**Data Retention Policies:**
```javascript
// Configure retention policies
const retentionPolicy = {
  high_precision: '7d',    // 7 days of high-precision data
  medium_precision: '30d', // 30 days of 1-minute aggregates
  low_precision: '1y'      // 1 year of hourly aggregates
};
```

#### Log Data (Elasticsearch)

**Index Migration:**

```bash
# Create new index with updated mapping
curl -X PUT "localhost:9200/argus_logs_v2" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "service": { "type": "keyword" },
      "trace_id": { "type": "keyword" },
      "span_id": { "type": "keyword" },
      "tags": { "type": "object" }
    }
  }
}'

# Reindex data
curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": { "index": "argus_logs" },
  "dest": { "index": "argus_logs_v2" }
}'

# Create alias for zero-downtime migration
curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d'
{
  "actions": [
    { "remove": { "index": "argus_logs", "alias": "logs" } },
    { "add": { "index": "argus_logs_v2", "alias": "logs" } }
  ]
}'
```

### 3. Infrastructure Migrations

#### Container Migration

**From Development to Production:**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  argus-app:
    image: argus:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - INFLUXDB_URL=${INFLUXDB_URL}
      - ELASTICSEARCH_URL=${ELASTICSEARCH_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./config:/app/config:ro
    networks:
      - argus-network
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=argus
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - argus-network

volumes:
  postgres_data:
networks:
  argus-network:
```

#### Kubernetes Migration

**Deployment Configuration:**

```yaml
# k8s/argus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argus-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: argus
  template:
    metadata:
      labels:
        app: argus
    spec:
      containers:
      - name: argus
        image: argus:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: argus-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 4. Configuration Migrations

#### Environment Variables Migration

**Legacy to Current Format:**

```bash
# Old format (v1.x)
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_DB=argus

# New format (v2.x)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics
```

**Migration Script:**

```bash
#!/bin/bash
# migrate_config.sh

# Convert old environment variables to new format
if [ ! -z "$INFLUX_HOST" ]; then
    export INFLUXDB_URL="http://${INFLUX_HOST}:${INFLUX_PORT:-8086}"
    echo "Migrated INFLUXDB_URL: $INFLUXDB_URL"
fi

if [ ! -z "$ELASTIC_HOST" ]; then
    export ELASTICSEARCH_URL="http://${ELASTIC_HOST}:${ELASTIC_PORT:-9200}"
    echo "Migrated ELASTICSEARCH_URL: $ELASTICSEARCH_URL"
fi

# Save new configuration
cat > .env.new << EOF
INFLUXDB_URL=$INFLUXDB_URL
INFLUXDB_TOKEN=$INFLUXDB_TOKEN
INFLUXDB_ORG=$INFLUXDB_ORG
INFLUXDB_BUCKET=$INFLUXDB_BUCKET

ELASTICSEARCH_URL=$ELASTICSEARCH_URL

DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
EOF
```

### 5. Version Compatibility

#### Supported Migration Paths

```
v1.0.x → v1.1.x (Minor update, no migration required)
v1.x.x → v2.0.x (Major update, requires full migration)
v2.0.x → v2.1.x (Feature update, database migration required)
```

#### Compatibility Matrix

| From Version | To Version | Migration Required | Downtime | Rollback Support |
|--------------|------------|-------------------|----------|------------------|
| 1.0.x | 1.1.x | No | No | Yes |
| 1.x | 2.0.x | Yes | Yes | Limited |
| 2.0.x | 2.1.x | Schema only | Minimal | Yes |
| 2.1.x | 3.0.x | Full migration | Yes | No |

### 6. Rollback Procedures

#### Database Rollback

```bash
# 1. Stop application
docker-compose down

# 2. Restore database backup
pg_restore -U postgres -h localhost -d argus argus_backup_20231201.sql

# 3. Rollback InfluxDB
influx bucket delete --name metrics_new
influx bucket create --name metrics --org argus

# 4. Restore previous configuration
cp .env.backup .env

# 5. Start previous version
git checkout v2.0.1
docker-compose up -d
```

#### Data Integrity Verification

```bash
#!/bin/bash
# verify_migration.sh

echo "Verifying PostgreSQL tables..."
psql -U postgres -h localhost argus -c "
SELECT 
    schemaname,
    tablename,
    attname,
    typename
FROM pg_tables t
JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
JOIN pg_type ty ON ty.oid = a.atttypid
WHERE schemaname = 'public' 
    AND NOT attisdropped 
    AND attnum > 0
ORDER BY tablename, attnum;
"

echo "Verifying InfluxDB buckets..."
influx bucket list --org argus

echo "Verifying Elasticsearch indices..."
curl -X GET "localhost:9200/_cat/indices?v"

echo "Checking Redis keys..."
redis-cli KEYS "*" | wc -l
```

### 7. Security Considerations

#### Sensitive Data Migration

```bash
# Encrypt sensitive data during migration
gpg --symmetric --cipher-algo AES256 argus_backup.sql

# Secure file transfer
scp -P 22 argus_backup.sql.gpg user@production-server:/tmp/

# Decrypt on target system
gpg --decrypt argus_backup.sql.gpg > argus_backup.sql
```

#### Access Control Migration

```sql
-- Migrate user permissions
INSERT INTO users (username, email, password_hash, role, created_at)
SELECT username, email, password_hash, 
    CASE 
        WHEN role = 'superuser' THEN 'admin'
        ELSE role
    END,
    created_at
FROM legacy_users;

-- Update role-based permissions
UPDATE users SET role = 'viewer' WHERE role = 'readonly';
UPDATE users SET role = 'operator' WHERE role = 'monitor';
```

### 8. Performance Optimization During Migration

#### Minimize Downtime

```bash
# 1. Pre-warm new systems
docker-compose -f docker-compose.new.yml up -d postgres influxdb elasticsearch redis

# 2. Sync data in background
rsync -av --progress /data/old/ /data/new/

# 3. Quick switchover
docker-compose down && docker-compose -f docker-compose.new.yml up -d

# 4. Verify and cleanup
./verify_migration.sh && rm -rf /data/old/
```

#### Parallel Migration

```javascript
// Parallel data migration
const migrationTasks = [
    migrateUsers(),
    migrateAlertRules(),
    migrateDashboards(),
    migrateNotificationChannels()
];

await Promise.all(migrationTasks);
```

### 9. Monitoring Migration Progress

#### Progress Tracking

```bash
#!/bin/bash
# migration_progress.sh

echo "=== Migration Progress Report ==="
echo "Date: $(date)"
echo

echo "PostgreSQL Migration:"
TOTAL_TABLES=$(psql -U postgres -h localhost argus -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
MIGRATED_TABLES=$(psql -U postgres -h localhost argus -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('anomalies', 'security_events', 'threat_detection_rules');")
echo "Tables migrated: $MIGRATED_TABLES / $TOTAL_TABLES"

echo "InfluxDB Migration:"
BUCKET_COUNT=$(influx bucket list --org argus --hide-headers | wc -l)
echo "Buckets available: $BUCKET_COUNT"

echo "Elasticsearch Migration:"
INDEX_COUNT=$(curl -s "localhost:9200/_cat/indices?h=index" | wc -l)
echo "Indices available: $INDEX_COUNT"
```

### 10. Testing Migration

#### Pre-Migration Testing

```bash
# 1. Test with sample data
./scripts/generate_test_data.sh

# 2. Run migration on test environment
docker-compose -f docker-compose.test.yml up -d
./migrate.sh --dry-run

# 3. Validate results
./validate_migration.sh
```

#### Post-Migration Validation

```javascript
// automated validation tests
const tests = [
    validateDatabaseConnections(),
    validateDataIntegrity(),
    validateAPIEndpoints(),
    validateUserAuthentication(),
    validateAlertRules(),
    validateMetricsIngestion(),
    validateLogSearch()
];

const results = await Promise.allSettled(tests);
console.log('Migration validation:', results);
```

## Best Practices

### 1. Planning
- Always perform migrations during maintenance windows
- Test migrations thoroughly in staging environment
- Prepare rollback procedures before starting
- Communicate migration timeline to stakeholders

### 2. Safety
- Create complete backups before migration
- Use database transactions where possible
- Implement checkpoints for long-running migrations
- Monitor system resources during migration

### 3. Documentation
- Document all migration steps
- Keep migration logs for audit purposes
- Update system documentation post-migration
- Share lessons learned with team

### 4. Automation
- Use scripts for repeatable migration tasks
- Implement validation checks
- Set up monitoring and alerts
- Create automated rollback triggers

## Troubleshooting

### Common Issues

#### 1. Database Connection Timeouts
```bash
# Increase connection timeout
export DATABASE_TIMEOUT=60000
# Add connection pooling
export DATABASE_POOL_SIZE=20
```

#### 2. Memory Issues During Migration
```bash
# Increase available memory
docker-compose up -d --memory=2g
# Process data in smaller batches
export BATCH_SIZE=1000
```

#### 3. Disk Space Issues
```bash
# Monitor disk usage during migration
df -h
# Clean up temporary files
rm -rf /tmp/migration_*
```

### Recovery Procedures

#### Partial Migration Failure
```bash
# 1. Stop migration process
pkill -f migration_script

# 2. Assess current state
./check_migration_state.sh

# 3. Resume from checkpoint
./migrate.sh --resume --checkpoint=users_complete

# 4. Or rollback if necessary
./rollback.sh --to-checkpoint=pre_migration
```

## Conclusion

This migration guide provides a comprehensive framework for upgrading Argus installations while maintaining data integrity and minimizing downtime. Always test migration procedures in a development environment before applying to production systems.

For additional support, refer to:
- [Database Setup Guide](docs/DATABASE_SETUP.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Project Blueprint](project_argus_blueprint.md)

---

*Last updated: $(date)*
*Version: 1.0.0*