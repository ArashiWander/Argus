#!/bin/bash

# Argus Monitoring Platform Demo Script
# This script demonstrates the key features of the platform by submitting sample data

set -e

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

echo "🎬 Argus Monitoring Platform - Live Demo"
echo "======================================="

# Check if server is running
echo "🔍 Checking if Argus backend is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo "❌ Argus backend is not running on $BASE_URL"
    echo "Please start the backend first by running:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend is running!"

# Display health status
echo ""
echo "📊 System Health Status:"
curl -s "$API_URL/health" | jq .

echo ""
echo "🚀 Starting demo data generation..."

# Function to submit a metric
submit_metric() {
    local name=$1
    local value=$2
    local service=$3
    local tags=$4
    
    curl -s -X POST "$API_URL/metrics" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"value\": $value,
            \"service\": \"$service\",
            \"tags\": $tags
        }" > /dev/null
}

# Function to submit a log
submit_log() {
    local level=$1
    local message=$2
    local service=$3
    local tags=$4
    
    curl -s -X POST "$API_URL/logs" \
        -H "Content-Type: application/json" \
        -d "{
            \"level\": \"$level\",
            \"message\": \"$message\",
            \"service\": \"$service\",
            \"tags\": $tags
        }" > /dev/null
}

echo ""
echo "📈 Generating sample metrics..."

# Generate realistic metrics data
services=("web-server" "api-server" "database" "cache" "load-balancer")
metrics=("cpu.usage" "memory.usage" "disk.usage" "network.throughput" "response.time")

for i in {1..50}; do
    service=${services[$((RANDOM % ${#services[@]}))]}
    metric=${metrics[$((RANDOM % ${#metrics[@]}))]}
    
    case $metric in
        "cpu.usage"|"memory.usage"|"disk.usage")
            # Percentage values (0-100)
            value=$((RANDOM % 100))
            ;;
        "network.throughput")
            # Mbps (0-1000)
            value=$((RANDOM % 1000))
            ;;
        "response.time")
            # Milliseconds (10-2000)
            value=$((RANDOM % 1990 + 10))
            ;;
    esac
    
    tags="{\"host\": \"host-$((RANDOM % 5 + 1))\", \"region\": \"us-east-1\"}"
    
    submit_metric "$metric" "$value" "$service" "$tags"
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "  Generated $i metrics..."
    fi
done

echo "✅ Generated 50 sample metrics"

echo ""
echo "📝 Generating sample logs..."

# Generate sample logs
log_levels=("info" "warn" "error" "debug")
messages=(
    "Request processed successfully"
    "Database connection established"
    "Cache miss for key: user_session_123"
    "Rate limit exceeded for IP: 192.168.1.100"
    "Authentication successful for user: admin"
    "Failed to connect to external service"
    "Memory usage threshold exceeded"
    "Scheduled backup completed"
    "SSL certificate renewal required"
    "Health check passed"
)

for i in {1..30}; do
    service=${services[$((RANDOM % ${#services[@]}))]}
    level=${log_levels[$((RANDOM % ${#log_levels[@]}))]}
    message=${messages[$((RANDOM % ${#messages[@]}))]}
    
    tags="{\"user_id\": \"user_$((RANDOM % 100))\", \"request_id\": \"req_$i\"}"
    
    submit_log "$level" "$message" "$service" "$tags"
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "  Generated $i logs..."
    fi
done

echo "✅ Generated 30 sample logs"

echo ""
echo "🔍 Triggering anomaly detection..."

# Trigger anomaly detection
curl -s -X POST "$API_URL/analytics/anomalies/detect" \
    -H "Content-Type: application/json" \
    -d '{
        "metric_name": "cpu.usage",
        "service": "web-server",
        "lookback_hours": 1,
        "algorithm": "zscore"
    }' > /dev/null

echo "✅ Anomaly detection triggered"

echo ""
echo "🔮 Generating predictive analysis..."

# Generate predictive analysis
curl -s -X POST "$API_URL/analytics/predictions" \
    -H "Content-Type: application/json" \
    -d '{
        "metric_name": "memory.usage",
        "service": "api-server",
        "horizon_hours": 24
    }' > /dev/null

echo "✅ Predictive analysis generated"

echo ""
echo "🛡️ Submitting security events..."

# Submit sample security events
security_events=(
    '{"event_type": "authentication", "severity": "medium", "source_ip": "192.168.1.100", "action": "login", "outcome": "success", "details": {"username": "admin"}}'
    '{"event_type": "authentication", "severity": "high", "source_ip": "192.168.1.101", "action": "login", "outcome": "failure", "details": {"username": "admin", "reason": "invalid_password"}}'
    '{"event_type": "authorization", "severity": "low", "source_ip": "192.168.1.102", "action": "access_resource", "outcome": "success", "details": {"resource": "/api/metrics"}}'
    '{"event_type": "data_access", "severity": "medium", "source_ip": "192.168.1.103", "action": "query_database", "outcome": "success", "details": {"table": "users", "rows": 100}}'
)

for event in "${security_events[@]}"; do
    curl -s -X POST "$API_URL/security/events" \
        -H "Content-Type: application/json" \
        -d "$event" > /dev/null
done

echo "✅ Generated security events"

echo ""
echo "📊 Current Platform Statistics:"

# Get and display current stats
echo ""
echo "📈 Metrics Statistics:"
curl -s "$API_URL/metrics/stats" | jq .

echo ""
echo "📝 Logs Statistics:"
curl -s "$API_URL/logs/stats" | jq .

echo ""
echo "🔍 Recent Anomalies:"
curl -s "$API_URL/analytics/anomalies" | jq '.anomalies[:3]'

echo ""
echo "🛡️ Security Events Summary:"
curl -s "$API_URL/security/events" | jq '.events[:3]'

echo ""
echo "🎉 Demo completed successfully!"
echo ""
echo "🌐 You can now explore the data in the frontend:"
echo "   Dashboard:  http://localhost:3000/"
echo "   Metrics:    http://localhost:3000/metrics"
echo "   Logs:       http://localhost:3000/logs"
echo "   Analytics:  http://localhost:3000/analytics"
echo "   Security:   http://localhost:3000/security"
echo ""
echo "📖 API Documentation: docs/api-documentation.yaml"
echo "📋 Project Status:    final_project_phases.md"

echo ""
echo "💡 Try these API endpoints:"
echo "   curl $API_URL/health"
echo "   curl $API_URL/metrics/stats"
echo "   curl $API_URL/logs/stats"
echo "   curl $API_URL/analytics/insights"
echo "   curl $API_URL/security/dashboard"