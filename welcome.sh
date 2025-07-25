#!/bin/bash

# Argus Platform - Welcome & First Time Setup Helper

set -e

# Colors and styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Emojis
WAVE="👋"
ROCKET="🚀"
STAR="⭐"
HEART="❤️"
BOOK="📚"
COMPUTER="💻"
SPARKLE="✨"

show_welcome() {
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "╔════════════════════════════════════════════════════╗"
    echo "║                                                    ║"
    echo "║    ${WAVE} Welcome to Argus Monitoring Platform! ${WAVE}     ║"
    echo "║                                                    ║"
    echo "║         Your journey to better observability      ║"
    echo "║              starts here! ${ROCKET}                     ║"
    echo "║                                                    ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

show_features() {
    echo -e "${CYAN}${BOLD}What makes Argus special?${NC}\n"
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Multi-Protocol Support${NC}"
    echo -e "    Monitor via HTTP REST, gRPC, MQTT, and Kafka"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Real-time Dashboard${NC}"
    echo -e "    Beautiful React interface with live charts"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Production Ready${NC}"
    echo -e "    Full database integration and Docker support"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Developer Friendly${NC}"
    echo -e "    Interactive setup, CLI tools, and great documentation"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Enterprise Features${NC}"
    echo -e "    Authentication, alerts, analytics, and more"
    echo ""
}

show_quick_start() {
    echo -e "${YELLOW}${BOLD}${ROCKET} Let's get you started!${NC}\n"
    
    echo -e "${CYAN}This will only take a few minutes:${NC}"
    echo -e "  1. ${BLUE}Interactive setup wizard${NC} (asks a few questions)"
    echo -e "  2. ${BLUE}Automatic dependency installation${NC} (npm install)"
    echo -e "  3. ${BLUE}Environment configuration${NC} (creates .env files)"
    echo -e "  4. ${BLUE}Application build${NC} (compiles TypeScript)"
    echo -e "  5. ${BLUE}Validation & startup${NC} (makes sure it works)"
    echo ""
    
    echo -e "${PURPLE}${BOLD}Ready to begin?${NC}"
    echo -ne "${CYAN}Press Enter to start the setup wizard, or Ctrl+C to exit: ${NC}"
    read -r
}

show_success_tips() {
    echo -e "\n${GREEN}${BOLD}${SPARKLE} Great! Here are some tips to get the most out of Argus:${NC}\n"
    
    echo -e "${YELLOW}${BOLD}${COMPUTER} Essential Commands:${NC}"
    echo -e "  ${CYAN}./argus start${NC}      - Start the platform"
    echo -e "  ${CYAN}./argus status${NC}     - Check if everything is running"
    echo -e "  ${CYAN}./argus demo${NC}       - Generate sample data to explore"
    echo -e "  ${CYAN}./argus help${NC}       - See all available commands"
    echo ""
    
    echo -e "${YELLOW}${BOLD}${BOOK} Learning Resources:${NC}"
    echo -e "  ${CYAN}GETTING_STARTED.md${NC} - Step-by-step beginner guide"
    echo -e "  ${CYAN}docs/DEVELOPMENT.md${NC} - Detailed development info"
    echo -e "  ${CYAN}README.md${NC}          - Complete project overview"
    echo ""
    
    echo -e "${YELLOW}${BOLD}${HEART} Pro Tips:${NC}"
    echo -e "  • Run ${CYAN}./argus demo${NC} after starting to see sample data"
    echo -e "  • The dashboard auto-refreshes with real-time data"
    echo -e "  • Use ${CYAN}./argus logs error${NC} to quickly see error logs"
    echo -e "  • Check ${CYAN}./argus status${NC} if something isn't working"
    echo ""
}

# Main flow
show_welcome

echo -e "${CYAN}${BOLD}Thank you for choosing Argus Monitoring Platform!${NC}\n"

echo -e "Argus is a comprehensive monitoring solution that helps you:"
echo -e "• ${GREEN}Monitor${NC} your applications and infrastructure"
echo -e "• ${GREEN}Collect${NC} metrics and logs from multiple sources"  
echo -e "• ${GREEN}Visualize${NC} data with beautiful dashboards"
echo -e "• ${GREEN}Alert${NC} on issues before they become problems"
echo -e "• ${GREEN}Analyze${NC} trends and performance patterns"
echo ""

show_features
show_quick_start

# Run the setup wizard
echo -e "${BLUE}${BOLD}Starting setup wizard...${NC}\n"
./setup.sh

# Show success tips
show_success_tips

echo -e "${GREEN}${BOLD}${ROCKET} You're all set! Enjoy monitoring with Argus! ${ROCKET}${NC}"