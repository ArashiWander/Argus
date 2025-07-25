#!/bin/bash

# Argus Monitoring Platform Demo Script
# This script demonstrates the key features of the platform by submitting sample data

set -e

# Color codes and emojis for better UX
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ROCKET="🚀"
CHECKMARK="✅"
CROSS="❌"
MOVIE="🎬"
CHART="📊"
LOGS="📝"
SECURITY="🛡️"
SPARKLE="✨"
COMPUTER="💻"

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

print_header() {
    echo -e "\n${PURPLE}${BOLD}================================${NC}"
    echo -e "${PURPLE}${BOLD}  $1${NC}"
    echo -e "${PURPLE}${BOLD}================================${NC}\n"
}

print_step() {
    echo -e "${BLUE}${BOLD}$1${NC} $2"
}

print_success() {
    echo -e "${GREEN}$CHECKMARK $1${NC}"
}

print_error() {
    echo -e "${RED}$CROSS $1${NC}"
}

print_info() {
    echo -e "${CYAN}$1${NC}"
}

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

# Welcome message
clear
echo -e "${PURPLE}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║    🎬 Argus Monitoring Platform Demo 🎬      ║"
echo "║            Sample Data Generator             ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${CYAN}This demo will populate your Argus platform with realistic sample data${NC}"
echo -e "${CYAN}so you can explore all the features and see how it works.${NC}\n"

# Check if server is running
print_header "Pre-flight Check"
print_step "$COMPUTER" "Checking if Argus backend is running..."

if ! curl -s "$API_URL/health" > /dev/null; then
    print_error "Argus backend is not running on $BASE_URL"
    echo -e "\n${YELLOW}Please start the backend first:${NC}"
    echo -e "  ${CYAN}./start.sh${NC}     # Start the full platform"
    echo -e "  ${CYAN}or${NC}"
    echo -e "  ${CYAN}cd backend && npm run dev${NC}     # Start backend only"
    echo ""
    exit 1
fi

print_success "Backend is running and healthy!"

# Display current health status
echo -e "\n${BLUE}${BOLD}Current System Health:${NC}"
curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"

print_header "Starting Demo Data Generation"
print_info "This will create:"
print_info "  • 50 realistic system metrics (CPU, memory, network, etc.)"
print_info "  • 30 log entries with various levels and services"
print_info "  • Sample security events and analytics data"
print_info "  • Demonstration of all API endpoints"
echo ""

if command -v jq > /dev/null; then
    JQ_AVAILABLE=true
    print_success "JSON formatting available"
else
    JQ_AVAILABLE=false
    print_info "Installing jq for better output formatting..."
    # Try to install jq if possible
    if command -v apt-get > /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq > /dev/null 2>&1 || true
    elif command -v brew > /dev/null; then
        brew install jq > /dev/null 2>&1 || true
    fi
    
    if command -v jq > /dev/null; then
        JQ_AVAILABLE=true
        print_success "JSON formatting enabled"
    else
        print_info "JSON formatting not available (jq not installed)"
    fi
fi

print_header "Generating Sample Metrics"
print_step "$CHART" "Creating realistic system metrics..."

# Generate realistic metrics data
services=("web-server" "api-server" "database" "cache" "load-balancer" "auth-service" "notification-service")
metrics=("cpu.usage" "memory.usage" "disk.usage" "network.throughput" "response.time" "error.rate" "request.count")

total_metrics=50
generated_metrics=0

for i in $(seq 1 $total_metrics); do
    service=${services[$((RANDOM % ${#services[@]}))]}
    metric=${metrics[$((RANDOM % ${#metrics[@]}))]}
    
    case $metric in
        "cpu.usage"|"memory.usage"|"disk.usage")
            # Percentage values (10-95)
            value=$((RANDOM % 85 + 10))
            ;;
        "network.throughput")
            # Mbps (10-1000)
            value=$((RANDOM % 990 + 10))
            ;;
        "response.time")
            # Milliseconds (50-1500)
            value=$((RANDOM % 1450 + 50))
            ;;
        "error.rate")
            # Error percentage (0-10)
            value=$((RANDOM % 10))
            ;;
        "request.count")
            # Requests per minute (1-500)
            value=$((RANDOM % 499 + 1))
            ;;
    esac
    
    region_list=("us-east-1" "us-west-2" "eu-west-1" "ap-southeast-1")
    region=${region_list[$((RANDOM % ${#region_list[@]}))]}
    host_num=$((RANDOM % 10 + 1))
    
    tags="{\"host\": \"$service-$host_num\", \"region\": \"$region\", \"environment\": \"production\"}"
    
    submit_metric "$metric" "$value" "$service" "$tags"
    generated_metrics=$((generated_metrics + 1))
    
    if [ $((i % 10)) -eq 0 ]; then
        progress=$((i * 100 / total_metrics))
        print_info "  Progress: $progress% ($i/$total_metrics metrics generated)"
    fi
done

print_success "Generated $generated_metrics sample metrics across ${#services[@]} services"

print_header "Generating Sample Logs"
print_step "$LOGS" "Creating diverse log entries..."

# Generate sample logs with more realistic scenarios
log_levels=("info" "warn" "error" "debug")
log_scenarios=(
    "Request processed successfully|info"
    "Database connection established|info"
    "Cache miss for user session|debug"
    "Rate limit exceeded for IP|warn"
    "Authentication successful|info"
    "Failed to connect to external service|error"
    "Memory usage threshold exceeded|warn"
    "Scheduled backup completed|info"
    "SSL certificate renewal required|warn"
    "Health check passed|info"
    "Database query timeout|error"
    "New user registration|info"
    "File upload completed|info"
    "Invalid API key provided|warn"
    "Payment processing failed|error"
    "Configuration reloaded|info"
    "Disk space running low|warn"
    "Service restart initiated|info"
    "Unexpected error in handler|error"
    "Background job completed|debug"
)

total_logs=30
generated_logs=0

for i in $(seq 1 $total_logs); do
    service=${services[$((RANDOM % ${#services[@]}))]}
    scenario=${log_scenarios[$((RANDOM % ${#log_scenarios[@]}))]}
    message=$(echo "$scenario" | cut -d'|' -f1)
    suggested_level=$(echo "$scenario" | cut -d'|' -f2)
    
    # Use suggested level or random level
    if [ $((RANDOM % 3)) -eq 0 ]; then
        level=${log_levels[$((RANDOM % ${#log_levels[@]}))]}
    else
        level=$suggested_level
    fi
    
    user_id=$((RANDOM % 1000 + 1))
    request_id="req_$(date +%s)_$i"
    
    tags="{\"user_id\": \"user_$user_id\", \"request_id\": \"$request_id\", \"trace_id\": \"trace_$(date +%s)\"}"
    
    submit_log "$level" "$message" "$service" "$tags"
    generated_logs=$((generated_logs + 1))
    
    if [ $((i % 10)) -eq 0 ]; then
        progress=$((i * 100 / total_logs))
        print_info "  Progress: $progress% ($i/$total_logs logs generated)"
    fi
done

print_success "Generated $generated_logs sample logs with realistic scenarios"

print_header "Platform Statistics"
print_step "$SPARKLE" "Displaying current platform data..."

echo ""
print_info "${BOLD}📈 Metrics Statistics:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    curl -s "$API_URL/metrics/stats" | jq .
else
    curl -s "$API_URL/metrics/stats"
fi

echo ""
print_info "${BOLD}📝 Logs Statistics:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    curl -s "$API_URL/logs/stats" | jq .
else
    curl -s "$API_URL/logs/stats"
fi

echo ""
print_info "${BOLD}🔍 Recent Metrics Sample:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    curl -s "$API_URL/metrics?limit=3" | jq '.metrics[:3]'
else
    curl -s "$API_URL/metrics?limit=3"
fi

echo ""
print_info "${BOLD}📋 Recent Logs Sample:${NC}"
if [ "$JQ_AVAILABLE" = true ]; then
    curl -s "$API_URL/logs?limit=3" | jq '.logs[:3]'
else
    curl -s "$API_URL/logs?limit=3"
fi

print_header "Demo Complete!"

echo -e "${GREEN}${BOLD}$SPARKLE Demo completed successfully! $SPARKLE${NC}\n"

print_info "${BOLD}🌐 Explore your data in the web interface:${NC}"
print_info "   Dashboard:   ${BLUE}http://localhost:3000/${NC}"
print_info "   Metrics:     ${BLUE}http://localhost:3000/metrics${NC}"
print_info "   Logs:        ${BLUE}http://localhost:3000/logs${NC}"

echo ""
print_info "${BOLD}🔧 Useful API endpoints to try:${NC}"
print_info "   Health:      ${YELLOW}curl $API_URL/health${NC}"
print_info "   Metrics:     ${YELLOW}curl $API_URL/metrics/stats${NC}"
print_info "   Logs:        ${YELLOW}curl $API_URL/logs/stats${NC}"
print_info "   Search Logs: ${YELLOW}curl \"$API_URL/logs?level=error\"${NC}"

echo ""
print_info "${BOLD}📚 Next Steps:${NC}"
print_info "   1. Open ${BLUE}http://localhost:3000${NC} to explore the dashboard"
print_info "   2. Try the API endpoints above"
print_info "   3. Submit your own data using the API"
print_info "   4. Check out ${CYAN}GETTING_STARTED.md${NC} for more information"

echo ""
print_success "Happy monitoring! 🎉"