#!/bin/bash

# Argus Migration Utility Script
# This script provides common migration operations for the Argus platform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/migration.log"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for required commands
    for cmd in docker docker-compose psql influx curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    success "All dependencies are available"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup PostgreSQL database
backup_postgres() {
    local backup_name="postgres_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating PostgreSQL backup..."
    
    # Get database connection details from environment or defaults
    local db_url="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}"
    
    if pg_dump "$db_url" > "$backup_path"; then
        success "PostgreSQL backup created: $backup_path"
        echo "$backup_path"
    else
        error "Failed to create PostgreSQL backup"
        exit 1
    fi
}

# Backup InfluxDB
backup_influxdb() {
    local backup_name="influxdb_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating InfluxDB backup..."
    
    # Get InfluxDB connection details
    local influx_url="${INFLUXDB_URL:-http://localhost:8086}"
    local influx_token="${INFLUXDB_TOKEN:-}"
    local influx_org="${INFLUXDB_ORG:-argus}"
    local influx_bucket="${INFLUXDB_BUCKET:-metrics}"
    
    if [ -z "$influx_token" ]; then
        warning "InfluxDB token not provided, backup may fail"
    fi
    
    mkdir -p "$backup_path"
    
    if influx backup --host "$influx_url" --token "$influx_token" --org "$influx_org" "$backup_path"; then
        success "InfluxDB backup created: $backup_path"
        echo "$backup_path"
    else
        error "Failed to create InfluxDB backup"
        exit 1
    fi
}

# Check database health
check_database_health() {
    log "Checking database health..."
    
    local health_url="http://localhost:3001/api/health"
    local health_response
    
    if health_response=$(curl -s "$health_url" 2>/dev/null); then
        if echo "$health_response" | jq -e '.services' &>/dev/null; then
            success "API health check passed"
            echo "$health_response" | jq '.services'
        else
            warning "API responded but health format unexpected"
        fi
    else
        warning "Could not reach API health endpoint"
    fi
    
    # Direct database checks
    log "Checking PostgreSQL connection..."
    if psql "${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}" -c "SELECT 1;" &>/dev/null; then
        success "PostgreSQL connection successful"
    else
        error "PostgreSQL connection failed"
    fi
    
    log "Checking InfluxDB connection..."
    if influx ping --host "${INFLUXDB_URL:-http://localhost:8086}" &>/dev/null; then
        success "InfluxDB connection successful"
    else
        warning "InfluxDB connection failed"
    fi
    
    log "Checking Elasticsearch connection..."
    if curl -s "${ELASTICSEARCH_URL:-http://localhost:9200}/_cluster/health" &>/dev/null; then
        success "Elasticsearch connection successful"
    else
        warning "Elasticsearch connection failed"
    fi
    
    log "Checking Redis connection..."
    if redis-cli -u "${REDIS_URL:-redis://localhost:6379}" ping &>/dev/null; then
        success "Redis connection successful"
    else
        warning "Redis connection failed"
    fi
}

# Apply PostgreSQL schema migration
apply_postgres_migration() {
    local schema_file="$1"
    
    if [ ! -f "$schema_file" ]; then
        error "Schema file not found: $schema_file"
        exit 1
    fi
    
    log "Applying PostgreSQL migration: $schema_file"
    
    local db_url="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}"
    
    if psql "$db_url" -f "$schema_file"; then
        success "PostgreSQL migration applied successfully"
    else
        error "Failed to apply PostgreSQL migration"
        exit 1
    fi
}

# Verify migration
verify_migration() {
    log "Verifying migration..."
    
    # Check if Phase 4 tables exist
    local db_url="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}"
    local phase4_tables=("anomalies" "security_events" "threat_detection_rules" "security_alerts" "audit_trails")
    
    for table in "${phase4_tables[@]}"; do
        if psql "$db_url" -t -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
            success "Table $table exists"
        else
            error "Table $table is missing"
        fi
    done
    
    # Check if triggers are working
    log "Testing trigger functionality..."
    if psql "$db_url" -c "INSERT INTO anomalies (id, metric_name, timestamp, expected_value, actual_value, anomaly_score, severity) VALUES ('test-$(date +%s)', 'test.metric', NOW(), 100, 150, 0.8, 'medium');" &>/dev/null; then
        success "Anomalies table insert test passed"
        # Clean up test data
        psql "$db_url" -c "DELETE FROM anomalies WHERE metric_name = 'test.metric';" &>/dev/null
    else
        warning "Anomalies table insert test failed"
    fi
}

# Main migration function
run_migration() {
    local phase="$1"
    
    log "Starting Argus migration to Phase $phase"
    
    # Create backups
    create_backup_dir
    local postgres_backup=$(backup_postgres)
    log "PostgreSQL backup: $postgres_backup"
    
    # Apply schema migration based on phase
    case "$phase" in
        "4")
            apply_postgres_migration "$PROJECT_ROOT/backend/src/config/phase4_schema.sql"
            ;;
        *)
            error "Unknown migration phase: $phase"
            exit 1
            ;;
    esac
    
    # Verify migration
    verify_migration
    
    success "Migration to Phase $phase completed successfully!"
}

# Rollback function
rollback() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Rolling back to backup: $backup_file"
    
    local db_url="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}"
    
    # Drop current database and restore
    if psql "$db_url" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" && \
       psql "$db_url" < "$backup_file"; then
        success "Rollback completed successfully"
    else
        error "Rollback failed"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Argus Migration Utility"
    echo
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  check-deps          Check if all required dependencies are installed"
    echo "  check-health        Check database health status"
    echo "  backup-postgres     Create PostgreSQL backup"
    echo "  backup-influxdb     Create InfluxDB backup"
    echo "  migrate [PHASE]     Run migration to specified phase"
    echo "  verify              Verify current migration status"
    echo "  rollback [BACKUP]   Rollback to specified backup file"
    echo
    echo "Examples:"
    echo "  $0 check-health"
    echo "  $0 migrate 4"
    echo "  $0 rollback backups/postgres_backup_20231201_120000.sql"
    echo
}

# Main script logic
case "${1:-}" in
    "check-deps")
        check_dependencies
        ;;
    "check-health")
        check_database_health
        ;;
    "backup-postgres")
        create_backup_dir
        backup_postgres
        ;;
    "backup-influxdb")
        create_backup_dir
        backup_influxdb
        ;;
    "migrate")
        if [ -z "${2:-}" ]; then
            error "Migration phase required"
            usage
            exit 1
        fi
        check_dependencies
        run_migration "$2"
        ;;
    "verify")
        verify_migration
        ;;
    "rollback")
        if [ -z "${2:-}" ]; then
            error "Backup file path required"
            usage
            exit 1
        fi
        rollback "$2"
        ;;
    *)
        usage
        ;;
esac