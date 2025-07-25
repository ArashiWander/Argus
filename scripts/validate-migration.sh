#!/bin/bash

# Data Validation Script for Argus Migration
# Validates data integrity across all database systems after migration

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Load environment variables
load_environment() {
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        set -a
        source "$PROJECT_ROOT/backend/.env"
        set +a
        log "Loaded environment variables from backend/.env"
    else
        warning "No .env file found, using defaults"
    fi
}

# Validate PostgreSQL schema and data
validate_postgresql() {
    log "Validating PostgreSQL database..."
    
    local db_url="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/argus}"
    local validation_errors=0
    
    # Check database connectivity
    if ! psql "$db_url" -c "SELECT 1;" &>/dev/null; then
        error "Cannot connect to PostgreSQL database"
        return 1
    fi
    
    success "PostgreSQL connection established"
    
    # Check required tables exist
    local required_tables=(
        "users"
        "alert_rules"
        "alerts"
        "notification_channels"
        "dashboards"
        "anomalies"
        "security_events"
        "threat_detection_rules"
        "security_alerts"
        "audit_trails"
    )
    
    log "Checking required tables..."
    for table in "${required_tables[@]}"; do
        if psql "$db_url" -t -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
            success "✓ Table $table exists"
        else
            error "✗ Table $table is missing"
            ((validation_errors++))
        fi
    done
    
    # Check table constraints and indexes
    log "Checking table constraints..."
    
    # Check primary keys
    local tables_with_pk=$(psql "$db_url" -t -c "
        SELECT count(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'PRIMARY KEY' AND table_schema = 'public'
        AND table_name IN ('users', 'alert_rules', 'alerts', 'notification_channels', 'dashboards');
    " | xargs)
    
    if [ "$tables_with_pk" -ge 5 ]; then
        success "✓ Primary key constraints exist"
    else
        error "✗ Missing primary key constraints"
        ((validation_errors++))
    fi
    
    # Check foreign key constraints
    local fk_count=$(psql "$db_url" -t -c "
        SELECT count(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    " | xargs)
    
    if [ "$fk_count" -gt 0 ]; then
        success "✓ Foreign key constraints exist ($fk_count found)"
    else
        warning "No foreign key constraints found"
    fi
    
    # Check indexes
    local index_count=$(psql "$db_url" -t -c "
        SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
    " | xargs)
    
    if [ "$index_count" -gt 10 ]; then
        success "✓ Database indexes exist ($index_count found)"
    else
        warning "Limited indexes found ($index_count), performance may be affected"
    fi
    
    # Validate data integrity
    log "Checking data integrity..."
    
    # Check for orphaned records
    local orphaned_alerts=$(psql "$db_url" -t -c "
        SELECT count(*) FROM alerts a 
        LEFT JOIN alert_rules ar ON a.rule_id = ar.id 
        WHERE ar.id IS NULL;
    " | xargs)
    
    if [ "$orphaned_alerts" -eq 0 ]; then
        success "✓ No orphaned alert records"
    else
        error "✗ Found $orphaned_alerts orphaned alert records"
        ((validation_errors++))
    fi
    
    # Check user data integrity
    local users_count=$(psql "$db_url" -t -c "SELECT count(*) FROM users;" | xargs)
    if [ "$users_count" -gt 0 ]; then
        success "✓ User data exists ($users_count users)"
    else
        warning "No user data found"
    fi
    
    # Check for default data
    local default_admin=$(psql "$db_url" -t -c "
        SELECT count(*) FROM users WHERE username = 'admin';
    " | xargs)
    
    if [ "$default_admin" -gt 0 ]; then
        success "✓ Default admin user exists"
    else
        warning "Default admin user not found"
    fi
    
    return $validation_errors
}

# Validate InfluxDB connection and data
validate_influxdb() {
    log "Validating InfluxDB..."
    
    local influx_url="${INFLUXDB_URL:-http://localhost:8086}"
    local influx_token="${INFLUXDB_TOKEN:-}"
    local influx_org="${INFLUXDB_ORG:-argus}"
    local influx_bucket="${INFLUXDB_BUCKET:-metrics}"
    
    # Check connectivity
    if ! influx ping --host "$influx_url" &>/dev/null; then
        error "Cannot connect to InfluxDB at $influx_url"
        return 1
    fi
    
    success "InfluxDB connection established"
    
    # Check organization and bucket exist (if token is provided)
    if [ -n "$influx_token" ]; then
        if influx org list --host "$influx_url" --token "$influx_token" | grep -q "$influx_org"; then
            success "✓ Organization '$influx_org' exists"
        else
            error "✗ Organization '$influx_org' not found"
            return 1
        fi
        
        if influx bucket list --host "$influx_url" --token "$influx_token" --org "$influx_org" | grep -q "$influx_bucket"; then
            success "✓ Bucket '$influx_bucket' exists"
        else
            error "✗ Bucket '$influx_bucket' not found"
            return 1
        fi
        
        # Check recent data
        local data_count=$(influx query \
            --host "$influx_url" \
            --token "$influx_token" \
            --org "$influx_org" \
            "from(bucket: \"$influx_bucket\") |> range(start: -24h) |> count()" 2>/dev/null | grep -c "_value" || echo "0")
        
        if [ "$data_count" -gt 0 ]; then
            success "✓ Recent metrics data found"
        else
            warning "No recent metrics data found (last 24h)"
        fi
    else
        warning "InfluxDB token not provided, skipping detailed validation"
    fi
    
    return 0
}

# Validate Elasticsearch connection and indices
validate_elasticsearch() {
    log "Validating Elasticsearch..."
    
    local elastic_url="${ELASTICSEARCH_URL:-http://localhost:9200}"
    
    # Check connectivity
    if ! curl -s "$elastic_url/_cluster/health" &>/dev/null; then
        error "Cannot connect to Elasticsearch at $elastic_url"
        return 1
    fi
    
    success "Elasticsearch connection established"
    
    # Check cluster health
    local cluster_status=$(curl -s "$elastic_url/_cluster/health" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    case "$cluster_status" in
        "green")
            success "✓ Cluster status: GREEN"
            ;;
        "yellow")
            warning "⚠ Cluster status: YELLOW (some replicas missing)"
            ;;
        "red")
            error "✗ Cluster status: RED (some shards unavailable)"
            ;;
        *)
            warning "Cluster status unknown"
            ;;
    esac
    
    # Check indices
    local indices_response=$(curl -s "$elastic_url/_cat/indices?format=json" 2>/dev/null)
    
    if [ -n "$indices_response" ] && [ "$indices_response" != "[]" ]; then
        local indices_count=$(echo "$indices_response" | jq length 2>/dev/null || echo "0")
        success "✓ Found $indices_count Elasticsearch indices"
        
        # Check for Argus-specific indices
        if echo "$indices_response" | jq -e '.[] | select(.index | contains("argus") or contains("logs"))' &>/dev/null; then
            success "✓ Argus-related indices found"
        else
            warning "No Argus-specific indices found"
        fi
    else
        warning "No Elasticsearch indices found"
    fi
    
    return 0
}

# Validate Redis connection and data
validate_redis() {
    log "Validating Redis..."
    
    local redis_url="${REDIS_URL:-redis://localhost:6379}"
    
    # Check connectivity
    if ! redis-cli -u "$redis_url" ping &>/dev/null; then
        error "Cannot connect to Redis at $redis_url"
        return 1
    fi
    
    success "Redis connection established"
    
    # Check Redis info
    local redis_info=$(redis-cli -u "$redis_url" info server 2>/dev/null || echo "")
    
    if [ -n "$redis_info" ]; then
        local redis_version=$(echo "$redis_info" | grep "redis_version:" | cut -d: -f2 | tr -d '\r')
        success "✓ Redis version: $redis_version"
    fi
    
    # Check key count
    local key_count=$(redis-cli -u "$redis_url" dbsize 2>/dev/null || echo "0")
    
    if [ "$key_count" -gt 0 ]; then
        success "✓ Redis contains $key_count keys"
    else
        log "Redis database is empty (normal for fresh installation)"
    fi
    
    # Check memory usage
    local memory_info=$(redis-cli -u "$redis_url" info memory 2>/dev/null || echo "")
    
    if [ -n "$memory_info" ]; then
        local used_memory=$(echo "$memory_info" | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
        log "Redis memory usage: $used_memory"
    fi
    
    return 0
}

# Validate API endpoints
validate_api() {
    log "Validating API endpoints..."
    
    local api_url="http://localhost:3001"
    local validation_errors=0
    
    # Wait for API to be available
    local retries=5
    while [ $retries -gt 0 ]; do
        if curl -s "$api_url/api/health" &>/dev/null; then
            break
        fi
        warning "API not yet available, retrying in 5 seconds... ($retries retries left)"
        sleep 5
        ((retries--))
    done
    
    if [ $retries -eq 0 ]; then
        error "API is not available at $api_url"
        return 1
    fi
    
    success "API is responding"
    
    # Test health endpoint
    local health_response=$(curl -s "$api_url/api/health" 2>/dev/null)
    
    if echo "$health_response" | jq -e '.services' &>/dev/null; then
        success "✓ Health endpoint working"
        
        # Check individual service health
        local services=$(echo "$health_response" | jq -r '.services | keys[]' 2>/dev/null)
        for service in $services; do
            local status=$(echo "$health_response" | jq -r ".services.$service" 2>/dev/null)
            if [ "$status" = "healthy" ]; then
                success "  ✓ $service: healthy"
            else
                warning "  ⚠ $service: $status"
            fi
        done
    else
        error "✗ Health endpoint not responding correctly"
        ((validation_errors++))
    fi
    
    # Test other endpoints
    local endpoints=(
        "/api/metrics"
        "/api/logs"
        "/api/alerts"
        "/api/anomalies"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_url$endpoint" 2>/dev/null)
        
        if [ "$response_code" -eq 200 ] || [ "$response_code" -eq 401 ]; then
            success "✓ $endpoint endpoint available (HTTP $response_code)"
        else
            error "✗ $endpoint endpoint failed (HTTP $response_code)"
            ((validation_errors++))
        fi
    done
    
    return $validation_errors
}

# Generate validation report
generate_report() {
    local output_file="$PROJECT_ROOT/validation_report_$(date +%Y%m%d_%H%M%S).txt"
    
    log "Generating validation report..."
    
    {
        echo "Argus Migration Validation Report"
        echo "Generated on: $(date)"
        echo "======================================"
        echo
        
        echo "System Information:"
        echo "- OS: $(uname -s) $(uname -r)"
        echo "- Architecture: $(uname -m)"
        echo "- User: $(whoami)"
        echo "- Working Directory: $(pwd)"
        echo
        
        echo "Environment Variables:"
        echo "- NODE_ENV: ${NODE_ENV:-not set}"
        echo "- DATABASE_URL: ${DATABASE_URL:-not set}"
        echo "- INFLUXDB_URL: ${INFLUXDB_URL:-not set}"
        echo "- ELASTICSEARCH_URL: ${ELASTICSEARCH_URL:-not set}"
        echo "- REDIS_URL: ${REDIS_URL:-not set}"
        echo
        
        echo "Docker Services:"
        if command -v docker &>/dev/null; then
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No Docker containers running"
        else
            echo "Docker not available"
        fi
        echo
        
        echo "Database Validation Results:"
        echo "See above output for detailed validation results"
        
    } > "$output_file"
    
    success "Validation report saved to: $output_file"
}

# Run comprehensive validation
run_full_validation() {
    log "Starting comprehensive validation..."
    
    local total_errors=0
    
    # Load environment
    load_environment
    
    echo "================================"
    echo "1. PostgreSQL Validation"
    echo "================================"
    validate_postgresql || ((total_errors+=$?))
    
    echo
    echo "================================"
    echo "2. InfluxDB Validation"
    echo "================================"
    validate_influxdb || ((total_errors+=$?))
    
    echo
    echo "================================"
    echo "3. Elasticsearch Validation"
    echo "================================"
    validate_elasticsearch || ((total_errors+=$?))
    
    echo
    echo "================================"
    echo "4. Redis Validation"
    echo "================================"
    validate_redis || ((total_errors+=$?))
    
    echo
    echo "================================"
    echo "5. API Validation"
    echo "================================"
    validate_api || ((total_errors+=$?))
    
    echo
    echo "================================"
    echo "Validation Summary"
    echo "================================"
    
    if [ $total_errors -eq 0 ]; then
        success "All validations passed successfully!"
        success "Argus migration appears to be successful"
    else
        error "Validation completed with $total_errors errors"
        error "Please review and fix the issues before proceeding"
    fi
    
    # Generate report
    generate_report
    
    return $total_errors
}

# Show usage
usage() {
    echo "Argus Data Validation Utility"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  postgresql         Validate PostgreSQL database only"
    echo "  influxdb          Validate InfluxDB only"
    echo "  elasticsearch     Validate Elasticsearch only"
    echo "  redis             Validate Redis only"
    echo "  api               Validate API endpoints only"
    echo "  full              Run complete validation (default)"
    echo "  report            Generate validation report only"
    echo
    echo "Examples:"
    echo "  $0 full"
    echo "  $0 postgresql"
    echo "  $0 api"
    echo
}

# Main script logic
case "${1:-full}" in
    "postgresql")
        load_environment
        validate_postgresql
        ;;
    "influxdb")
        load_environment
        validate_influxdb
        ;;
    "elasticsearch")
        load_environment
        validate_elasticsearch
        ;;
    "redis")
        load_environment
        validate_redis
        ;;
    "api")
        load_environment
        validate_api
        ;;
    "report")
        load_environment
        generate_report
        ;;
    "full")
        run_full_validation
        ;;
    *)
        usage
        ;;
esac