#!/bin/bash

# Argus Monitoring Platform - Interactive Setup Wizard
# This script provides a user-friendly setup experience for the Argus platform

set -e

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
CHECKMARK="✅"
CROSS="❌"
WARNING="⚠️"
GEAR="⚙️"
PACKAGE="📦"
WRENCH="🔧"
SPARKLE="✨"
COMPUTER="💻"
GLOBE="🌐"

# Helper functions
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

print_warning() {
    echo -e "${YELLOW}$WARNING $1${NC}"
}

print_info() {
    echo -e "${CYAN}$1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        echo -ne "${CYAN}$prompt [${YELLOW}$default${CYAN}]: ${NC}"
    else
        echo -ne "${CYAN}$prompt: ${NC}"
    fi
    
    read -r input
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

# Function to ask yes/no question
ask_yes_no() {
    local prompt="$1"
    local default="$2"
    
    while true; do
        if [ "$default" = "y" ]; then
            echo -ne "${CYAN}$prompt [${YELLOW}Y/n${CYAN}]: ${NC}"
        elif [ "$default" = "n" ]; then
            echo -ne "${CYAN}$prompt [${YELLOW}y/N${CYAN}]: ${NC}"
        else
            echo -ne "${CYAN}$prompt [${YELLOW}y/n${CYAN}]: ${NC}"
        fi
        
        read -r answer
        
        if [ -z "$answer" ] && [ -n "$default" ]; then
            answer="$default"
        fi
        
        case "$answer" in
            [Yy]|[Yy][Ee][Ss]) return 0 ;;
            [Nn]|[Nn][Oo]) return 1 ;;
            *) echo -e "${RED}Please answer yes or no.${NC}" ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_good=true
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node --version) detected"
        else
            print_error "Node.js version 18+ required, found $(node --version)"
            all_good=false
        fi
    else
        print_error "Node.js is not installed"
        print_info "Please install Node.js 18+ from https://nodejs.org/"
        all_good=false
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm --version) detected"
    else
        print_error "npm is not installed"
        all_good=false
    fi
    
    # Check Git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) detected"
    else
        print_warning "Git not found - optional but recommended for version control"
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        print_success "Docker detected (optional)"
        DOCKER_AVAILABLE=true
    else
        print_info "Docker not found - optional for containerized deployment"
        DOCKER_AVAILABLE=false
    fi
    
    # Check curl
    if command_exists curl; then
        print_success "curl detected"
    else
        print_warning "curl not found - some testing features may not work"
    fi
    
    if [ "$all_good" = false ]; then
        echo -e "\n${RED}${BOLD}$CROSS Prerequisites check failed!${NC}"
        echo -e "${YELLOW}Please install the missing requirements and run this script again.${NC}\n"
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Setup mode selection
setup_mode_selection() {
    print_header "Setup Mode Selection"
    
    echo -e "${CYAN}Choose your setup mode:${NC}"
    echo -e "${YELLOW}1)${NC} ${BOLD}Quick Start${NC} - Fast setup with defaults (recommended for first-time users)"
    echo -e "${YELLOW}2)${NC} ${BOLD}Custom Setup${NC} - Configure all options manually"
    echo -e "${YELLOW}3)${NC} ${BOLD}Developer Mode${NC} - Full development environment with all protocols"
    echo -e "${YELLOW}4)${NC} ${BOLD}Production Mode${NC} - Production-ready configuration"
    echo ""
    
    while true; do
        get_input "Select mode (1-4)" "1" mode_choice
        case "$mode_choice" in
            1) SETUP_MODE="quick"; break ;;
            2) SETUP_MODE="custom"; break ;;
            3) SETUP_MODE="developer"; break ;;
            4) SETUP_MODE="production"; break ;;
            *) echo -e "${RED}Please select a valid option (1-4)${NC}" ;;
        esac
    done
    
    case "$SETUP_MODE" in
        "quick")
            print_info "Quick Start mode selected - using sensible defaults"
            ;;
        "custom")
            print_info "Custom Setup mode selected - you'll configure each option"
            ;;
        "developer")
            print_info "Developer mode selected - enabling all features for development"
            ;;
        "production")
            print_info "Production mode selected - optimized for production deployment"
            ;;
    esac
}

# Environment configuration
configure_environment() {
    print_header "Environment Configuration"
    
    # Set defaults based on mode
    case "$SETUP_MODE" in
        "quick")
            ENV_MODE="development"
            LOG_LEVEL="info"
            ENABLE_GRPC=false
            ENABLE_MQTT=false
            ENABLE_KAFKA=false
            SETUP_DATABASES=false
            ;;
        "developer")
            ENV_MODE="development"
            LOG_LEVEL="debug"
            ENABLE_GRPC=true
            ENABLE_MQTT=true
            ENABLE_KAFKA=true
            SETUP_DATABASES=true
            ;;
        "production")
            ENV_MODE="production"
            LOG_LEVEL="warn"
            ENABLE_GRPC=true
            ENABLE_MQTT=true
            ENABLE_KAFKA=true
            SETUP_DATABASES=true
            ;;
        "custom")
            # Ask user for each option
            echo -e "${CYAN}Environment Mode:${NC}"
            get_input "Environment (development/production)" "development" ENV_MODE
            get_input "Log level (debug/info/warn/error)" "info" LOG_LEVEL
            
            echo -e "\n${CYAN}Protocol Configuration:${NC}"
            ask_yes_no "Enable gRPC protocol?" "n" && ENABLE_GRPC=true || ENABLE_GRPC=false
            ask_yes_no "Enable MQTT protocol?" "n" && ENABLE_MQTT=true || ENABLE_MQTT=false
            ask_yes_no "Enable Kafka protocol?" "n" && ENABLE_KAFKA=true || ENABLE_KAFKA=false
            
            echo -e "\n${CYAN}Database Configuration:${NC}"
            ask_yes_no "Set up external databases (InfluxDB, Elasticsearch, PostgreSQL, Redis)?" "n" && SETUP_DATABASES=true || SETUP_DATABASES=false
            ;;
    esac
    
    print_info "Configuration:"
    print_info "  Environment: $ENV_MODE"
    print_info "  Log Level: $LOG_LEVEL"
    print_info "  gRPC: $([ "$ENABLE_GRPC" = true ] && echo "Enabled" || echo "Disabled")"
    print_info "  MQTT: $([ "$ENABLE_MQTT" = true ] && echo "Enabled" || echo "Disabled")"
    print_info "  Kafka: $([ "$ENABLE_KAFKA" = true ] && echo "Enabled" || echo "Disabled")"
    print_info "  External Databases: $([ "$SETUP_DATABASES" = true ] && echo "Yes" || echo "No (in-memory)")"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Backend dependencies
    print_step "$PACKAGE" "Installing backend dependencies..."
    cd backend
    if [ ! -d "node_modules" ] || ask_yes_no "Reinstall backend dependencies?" "n"; then
        npm install
        print_success "Backend dependencies installed"
    else
        print_success "Backend dependencies already installed"
    fi
    cd ..
    
    # Frontend dependencies
    print_step "$PACKAGE" "Installing frontend dependencies..."
    cd frontend
    if [ ! -d "node_modules" ] || ask_yes_no "Reinstall frontend dependencies?" "n"; then
        npm install
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
    cd ..
}

# Create environment files
create_environment_files() {
    print_header "Creating Environment Files"
    
    # Backend .env file
    print_step "$GEAR" "Creating backend environment file..."
    
    cat > backend/.env << EOF
# Argus Backend Configuration
# Generated by setup wizard on $(date)

# Application Settings
NODE_ENV=$ENV_MODE
PORT=3001
LOG_LEVEL=$LOG_LEVEL

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-super-secret-jwt-key-change-in-production")
JWT_EXPIRES_IN=24h

# Protocol Configuration
HTTP_ENABLED=true
HTTP_PORT=3001

GRPC_ENABLED=$ENABLE_GRPC
GRPC_PORT=50051

MQTT_ENABLED=$ENABLE_MQTT
MQTT_BROKER_URL=mqtt://localhost:1883

KAFKA_ENABLED=$ENABLE_KAFKA
KAFKA_BROKERS=localhost:9092

EOF

    if [ "$SETUP_DATABASES" = true ]; then
        cat >> backend/.env << EOF
# Database Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=argus-token
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics

ELASTICSEARCH_URL=http://localhost:9200

DATABASE_URL=postgresql://postgres:argus123@localhost:5432/argus

REDIS_URL=redis://localhost:6379
EOF
    else
        cat >> backend/.env << EOF
# Database Configuration (using in-memory storage)
# Uncomment and configure these for production use:
# INFLUXDB_URL=http://localhost:8086
# INFLUXDB_TOKEN=your-influxdb-token
# INFLUXDB_ORG=argus
# INFLUXDB_BUCKET=metrics
# ELASTICSEARCH_URL=http://localhost:9200
# DATABASE_URL=postgresql://postgres:password@localhost:5432/argus
# REDIS_URL=redis://localhost:6379
EOF
    fi
    
    print_success "Backend environment file created"
}

# Build the application
build_application() {
    print_header "Building Application"
    
    # Build backend
    print_step "$WRENCH" "Building backend..."
    cd backend
    npm run build
    print_success "Backend built successfully"
    cd ..
    
    # Build frontend (for production mode)
    if [ "$ENV_MODE" = "production" ]; then
        print_step "$WRENCH" "Building frontend for production..."
        cd frontend
        npm run build
        print_success "Frontend built successfully"
        cd ..
    fi
}

# Setup Docker (if requested and available)
setup_docker() {
    if [ "$SETUP_DATABASES" = true ] && [ "$DOCKER_AVAILABLE" = true ]; then
        print_header "Docker Database Setup"
        
        if ask_yes_no "Start database services with Docker?" "y"; then
            print_step "$COMPUTER" "Starting database services..."
            docker-compose -f docker-compose.dev.yml up -d
            print_success "Database services starting in background"
            print_info "Services: InfluxDB, Elasticsearch, PostgreSQL, Redis"
            
            # Wait for services to be ready
            print_step "$GEAR" "Waiting for services to be ready..."
            sleep 10
        fi
    fi
}

# Validate setup
validate_setup() {
    print_header "Validating Setup"
    
    local validation_failed=false
    
    # Check if backend can start
    print_step "$CHECKMARK" "Testing backend startup..."
    cd backend
    timeout 10 npm start > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 5
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        if curl -s http://localhost:3001/api/health > /dev/null; then
            print_success "Backend is running and healthy"
        else
            print_error "Backend started but health check failed"
            validation_failed=true
        fi
        kill $BACKEND_PID 2>/dev/null || true
    else
        print_error "Backend failed to start"
        validation_failed=true
    fi
    cd ..
    
    # Check frontend build
    if [ -d "frontend/build" ] || [ "$ENV_MODE" = "development" ]; then
        print_success "Frontend is ready"
    else
        print_error "Frontend build not found"
        validation_failed=true
    fi
    
    if [ "$validation_failed" = true ]; then
        print_error "Setup validation failed - some issues detected"
        return 1
    else
        print_success "All validation checks passed!"
        return 0
    fi
}

# Create startup scripts
create_startup_scripts() {
    print_header "Creating Startup Scripts"
    
    # Create enhanced start script
    cat > start.sh << 'EOF'
#!/bin/bash

# Argus Platform - Enhanced Startup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Argus Monitoring Platform...${NC}"

# Check if setup was completed
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Environment not configured. Please run ./setup.sh first${NC}"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend
echo -e "${GREEN}🌐 Starting backend service...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 3
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend health check failed, but continuing...${NC}"
fi

# Start frontend
echo -e "${GREEN}🎨 Starting frontend service...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Argus Platform is starting up!${NC}"
echo -e "\n${BLUE}📍 Access Points:${NC}"
echo -e "   Frontend:  http://localhost:3000"
echo -e "   Backend:   http://localhost:3001"
echo -e "   Health:    http://localhost:3001/api/health"
echo -e "\n${BLUE}📚 Quick Commands:${NC}"
echo -e "   Health Check: curl http://localhost:3001/api/health"
echo -e "   Run Demo:     ./demo.sh"
echo -e "   Stop:         Press Ctrl+C"
echo -e "\nPress Ctrl+C to stop all services"

wait
EOF

    chmod +x start.sh
    print_success "Enhanced startup script created (start.sh)"
    
    # Create quick health check script
    cat > health-check.sh << 'EOF'
#!/bin/bash

# Argus Platform - Health Check Script

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Argus Platform Health Check${NC}\n"

# Check backend
echo -ne "Backend Service: "
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
    echo -e "${BLUE}Health Details:${NC}"
    curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
    echo ""
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check frontend
echo -ne "Frontend Service: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${YELLOW}⚠️  Not accessible (may still be starting)${NC}"
fi

echo -e "\n${BLUE}📍 Access Points:${NC}"
echo -e "   Frontend:  http://localhost:3000"
echo -e "   Backend:   http://localhost:3001"
echo -e "   API Docs:  docs/api-documentation.yaml"
EOF

    chmod +x health-check.sh
    print_success "Health check script created (health-check.sh)"
}

# Show final instructions
show_final_instructions() {
    print_header "Setup Complete!"
    
    echo -e "${GREEN}${BOLD}$SPARKLE Congratulations! Argus Monitoring Platform is ready to use! $SPARKLE${NC}\n"
    
    echo -e "${CYAN}${BOLD}🚀 Quick Start Commands:${NC}"
    echo -e "   ${YELLOW}./start.sh${NC}          - Start the platform"
    echo -e "   ${YELLOW}./health-check.sh${NC}   - Check system health"
    echo -e "   ${YELLOW}./demo.sh${NC}           - Run demo with sample data"
    echo ""
    
    echo -e "${CYAN}${BOLD}🌐 Access Points:${NC}"
    echo -e "   Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "   Backend:   ${BLUE}http://localhost:3001${NC}"
    echo -e "   Health:    ${BLUE}http://localhost:3001/api/health${NC}"
    echo ""
    
    echo -e "${CYAN}${BOLD}📚 Documentation:${NC}"
    echo -e "   README:     ${BLUE}README.md${NC}"
    echo -e "   Dev Guide:  ${BLUE}docs/DEVELOPMENT.md${NC}"
    echo -e "   API Docs:   ${BLUE}docs/api-documentation.yaml${NC}"
    echo ""
    
    if [ "$SETUP_DATABASES" = true ]; then
        echo -e "${CYAN}${BOLD}🗄️  Database Services:${NC}"
        echo -e "   InfluxDB:      ${BLUE}http://localhost:8086${NC}"
        echo -e "   Elasticsearch: ${BLUE}http://localhost:9200${NC}"
        echo -e "   PostgreSQL:    ${BLUE}localhost:5432${NC}"
        echo -e "   Redis:         ${BLUE}localhost:6379${NC}"
        echo ""
    fi
    
    echo -e "${CYAN}${BOLD}💡 Next Steps:${NC}"
    echo -e "   1. Run ${YELLOW}./start.sh${NC} to start the platform"
    echo -e "   2. Open ${BLUE}http://localhost:3000${NC} in your browser"
    echo -e "   3. Run ${YELLOW}./demo.sh${NC} to see sample data"
    echo -e "   4. Check out ${BLUE}docs/DEVELOPMENT.md${NC} for development info"
    echo ""
    
    echo -e "${GREEN}${BOLD}Happy monitoring! 🎉${NC}"
}

# Main setup function
main() {
    # Welcome message
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║                                              ║"
    echo "║       🚀 Argus Monitoring Platform 🚀        ║"
    echo "║              Setup Wizard                    ║"
    echo "║                                              ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    echo -e "${CYAN}Welcome to the Argus setup wizard!${NC}"
    echo -e "${CYAN}This wizard will help you set up the monitoring platform quickly and easily.${NC}\n"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the Argus project root directory"
        exit 1
    fi
    
    # Run setup steps
    check_prerequisites
    setup_mode_selection
    configure_environment
    install_dependencies
    create_environment_files
    build_application
    setup_docker
    create_startup_scripts
    
    # Validate setup
    if validate_setup; then
        show_final_instructions
    else
        echo -e "\n${YELLOW}${BOLD}Setup completed with some issues.${NC}"
        echo -e "${YELLOW}You may need to manually fix the issues before running the platform.${NC}"
        echo -e "${CYAN}Check the logs above and try running ${YELLOW}./health-check.sh${CYAN} for diagnostics.${NC}"
    fi
}

# Run main function
main "$@"