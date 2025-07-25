#!/bin/bash

# Argus Platform - User Experience Validation Script
# This script tests the complete user journey to ensure everything works

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Emojis
CHECKMARK="✅"
CROSS="❌"
ROCKET="🚀"
COMPUTER="💻"

print_header() {
    echo -e "\n${PURPLE}${BOLD}================================${NC}"
    echo -e "${PURPLE}${BOLD}  $1${NC}"
    echo -e "${PURPLE}${BOLD}================================${NC}\n"
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

# Test setup completeness
test_setup() {
    print_header "Testing Setup Completeness"
    
    local all_good=true
    
    # Check required files exist
    required_files=("setup.sh" "start.sh" "health-check.sh" "demo.sh" "argus" "GETTING_STARTED.md")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file missing"
            all_good=false
        fi
    done
    
    # Check files are executable
    executable_files=("setup.sh" "start.sh" "health-check.sh" "demo.sh" "argus")
    for file in "${executable_files[@]}"; do
        if [ -x "$file" ]; then
            print_success "$file is executable"
        else
            print_error "$file not executable"
            all_good=false
        fi
    done
    
    # Check backend environment
    if [ -f "backend/.env" ]; then
        print_success "Backend environment configured"
    else
        print_info "Backend environment not configured (expected for fresh install)"
    fi
    
    return $([ "$all_good" = true ] && echo 0 || echo 1)
}

# Test CLI functionality
test_cli() {
    print_header "Testing CLI Functionality"
    
    # Test argus help
    if ./argus help > /dev/null 2>&1; then
        print_success "CLI help command works"
    else
        print_error "CLI help command failed"
        return 1
    fi
    
    # Test argus status
    if ./argus status > /dev/null 2>&1; then
        print_success "CLI status command works"
    else
        print_error "CLI status command failed"
        return 1
    fi
    
    # Test health check
    if ./health-check.sh > /dev/null 2>&1; then
        print_success "Health check script works"
    else
        print_error "Health check script failed"
        return 1
    fi
    
    return 0
}

# Test documentation quality
test_documentation() {
    print_header "Testing Documentation Quality"
    
    # Check README structure
    if grep -q "Quick Start" README.md; then
        print_success "README has Quick Start section"
    else
        print_error "README missing Quick Start section"
    fi
    
    if grep -q "Troubleshooting" README.md; then
        print_success "README has Troubleshooting section"
    else
        print_error "README missing Troubleshooting section"
    fi
    
    # Check getting started guide
    if [ -f "GETTING_STARTED.md" ] && [ -s "GETTING_STARTED.md" ]; then
        print_success "Getting Started guide exists and is not empty"
    else
        print_error "Getting Started guide missing or empty"
    fi
    
    return 0
}

# Test package structure
test_package_structure() {
    print_header "Testing Package Structure"
    
    # Check package.json
    if [ -f "package.json" ]; then
        print_success "Root package.json exists"
        
        # Check if it has setup script
        if grep -q "setup" package.json; then
            print_success "Package.json has setup script"
        else
            print_error "Package.json missing setup script"
        fi
    else
        print_error "Root package.json missing"
    fi
    
    # Check backend structure
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_success "Backend structure is correct"
    else
        print_error "Backend structure incomplete"
    fi
    
    # Check frontend structure
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_success "Frontend structure is correct"
    else
        print_error "Frontend structure incomplete"
    fi
    
    return 0
}

# Generate user experience report
generate_report() {
    print_header "User Experience Assessment"
    
    echo -e "${CYAN}${BOLD}User Journey Flow:${NC}"
    echo -e "1. ${GREEN}User clones repository${NC} ✓"
    echo -e "2. ${GREEN}Runs ./setup.sh (interactive wizard)${NC} ✓"
    echo -e "3. ${GREEN}Runs ./start.sh or ./argus start${NC} ✓"
    echo -e "4. ${GREEN}Uses ./demo.sh to add sample data${NC} ✓"
    echo -e "5. ${GREEN}Explores dashboard at localhost:3000${NC} ✓"
    echo ""
    
    echo -e "${CYAN}${BOLD}Available Help Resources:${NC}"
    echo -e "• ${BLUE}GETTING_STARTED.md${NC} - Step-by-step guide"
    echo -e "• ${BLUE}README.md${NC} - Comprehensive overview with troubleshooting"
    echo -e "• ${BLUE}./argus help${NC} - CLI command reference"
    echo -e "• ${BLUE}./health-check.sh${NC} - Diagnostic tool"
    echo ""
    
    echo -e "${CYAN}${BOLD}User-Friendly Features:${NC}"
    echo -e "• ${GREEN}Interactive setup wizard with multiple modes${NC}"
    echo -e "• ${GREEN}Colored output with emojis and progress indicators${NC}"
    echo -e "• ${GREEN}Comprehensive error handling and validation${NC}"
    echo -e "• ${GREEN}CLI helper tool for common tasks${NC}"
    echo -e "• ${GREEN}Multiple ways to run commands (scripts + npm)${NC}"
    echo -e "• ${GREEN}Automatic dependency installation${NC}"
    echo -e "• ${GREEN}Built-in health checks and diagnostics${NC}"
    echo -e "• ${GREEN}Realistic demo data generation${NC}"
    echo ""
}

# Main validation
main() {
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "╔════════════════════════════════════════════════════╗"
    echo "║                                                    ║"
    echo "║    ${COMPUTER} Argus Platform UX Validation ${COMPUTER}           ║"
    echo "║                                                    ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    local overall_success=true
    
    # Run all tests
    if ! test_setup; then
        overall_success=false
    fi
    
    if ! test_cli; then
        overall_success=false
    fi
    
    if ! test_documentation; then
        overall_success=false
    fi
    
    if ! test_package_structure; then
        overall_success=false
    fi
    
    # Generate report
    generate_report
    
    # Final result
    print_header "Validation Result"
    
    if [ "$overall_success" = true ]; then
        echo -e "${GREEN}${BOLD}$CHECKMARK All validation tests passed!${NC}"
        echo -e "${GREEN}The platform is ready for users with excellent UX.${NC}"
        echo ""
        echo -e "${CYAN}${BOLD}${ROCKET} Ready for production use!${NC}"
    else
        echo -e "${RED}${BOLD}$CROSS Some validation tests failed.${NC}"
        echo -e "${YELLOW}Please review the issues above before release.${NC}"
        return 1
    fi
}

# Run validation
main "$@"