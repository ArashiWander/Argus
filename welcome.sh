#!/bin/bash

# Argus Platform - Enhanced Welcome & First Time Setup Helper

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
CHECKMARK="✅"
GEAR="⚙️"

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

show_enhanced_features() {
    echo -e "${CYAN}${BOLD}🚀 What's new in this user-friendly version?${NC}\n"
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Interactive Welcome Experience${NC}"
    echo -e "    First-time users get a guided tour through the platform"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Enhanced Help System${NC}"
    echo -e "    Built-in help center with interactive tutorials"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Smart Error Handling${NC}"
    echo -e "    Contextual error messages with solution suggestions"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Better Visual Feedback${NC}"
    echo -e "    Improved loading states and progress indicators"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Accessibility Improvements${NC}"
    echo -e "    Better keyboard navigation and screen reader support"
    echo ""
    
    echo -e "${GREEN}${STAR}${NC} ${BOLD}Mobile-Responsive Design${NC}"
    echo -e "    Optimized interface that works great on all devices"
    echo ""
}

show_user_experience_flow() {
    echo -e "${YELLOW}${BOLD}✨ Enhanced User Experience Flow${NC}\n"
    
    echo -e "${BLUE}1. ${BOLD}First-Time Welcome${NC}"
    echo -e "   • Interactive welcome dialog in the web interface"
    echo -e "   • Platform overview with key features highlighted"
    echo -e "   • Option to take guided tour or explore independently"
    echo ""
    
    echo -e "${BLUE}2. ${BOLD}Guided Tour (Optional)${NC}"
    echo -e "   • Step-by-step walkthrough of each major feature"
    echo -e "   • Interactive elements with helpful tips"
    echo -e "   • Can be accessed anytime via the help button"
    echo ""
    
    echo -e "${BLUE}3. ${BOLD}Smart Assistance${NC}"
    echo -e "   • Contextual help tooltips throughout the interface"
    echo -e "   • Error messages with specific troubleshooting steps"
    echo -e "   • Quick access to relevant documentation"
    echo ""
    
    echo -e "${BLUE}4. ${BOLD}Progressive Disclosure${NC}"
    echo -e "   • Advanced features are revealed as users gain experience"
    echo -e "   • Empty states provide guidance on next steps"
    echo -e "   • Notifications provide feedback on user actions"
    echo ""
}

show_accessibility_features() {
    echo -e "${CYAN}${BOLD}♿ Accessibility & Usability Features${NC}\n"
    
    echo -e "${CHECKMARK} ${BOLD}Keyboard Navigation${NC}"
    echo -e "   • Full keyboard support for all interface elements"
    echo -e "   • Focus indicators and logical tab order"
    echo ""
    
    echo -e "${CHECKMARK} ${BOLD}Screen Reader Support${NC}"
    echo -e "   • Proper ARIA labels and semantic HTML structure"
    echo -e "   • Descriptive text for interactive elements"
    echo ""
    
    echo -e "${CHECKMARK} ${BOLD}Mobile Responsiveness${NC}"
    echo -e "   • Optimized layout for tablets and smartphones"
    echo -e "   • Touch-friendly interface elements"
    echo ""
    
    echo -e "${CHECKMARK} ${BOLD}Visual Clarity${NC}"
    echo -e "   • High contrast colors and readable fonts"
    echo -e "   • Consistent iconography and visual hierarchy"
    echo ""
}

show_quick_start() {
    echo -e "${YELLOW}${BOLD}${ROCKET} Enhanced Quick Start Experience${NC}\n"
    
    echo -e "${CYAN}The setup process now includes:${NC}"
    echo -e "  1. ${BLUE}Pre-flight checks${NC} (dependency validation)"
    echo -e "  2. ${BLUE}Interactive configuration${NC} (user-friendly prompts)"
    echo -e "  3. ${BLUE}Progress indicators${NC} (visual feedback during setup)"
    echo -e "  4. ${BLUE}Success confirmation${NC} (clear next steps)"
    echo -e "  5. ${BLUE}First-run guidance${NC} (welcome experience in web UI)"
    echo ""
    
    echo -e "${PURPLE}${BOLD}Ready to experience the enhanced Argus platform?${NC}"
    echo -ne "${CYAN}Press Enter to start the enhanced setup wizard, or Ctrl+C to exit: ${NC}"
    read -r
}

show_success_tips() {
    echo -e "\n${GREEN}${BOLD}${SPARKLE} Welcome to the Enhanced Argus Experience!${NC}\n"
    
    echo -e "${YELLOW}${BOLD}${COMPUTER} New User-Friendly Features:${NC}"
    echo -e "  ${CYAN}Web Interface Help${NC} - Click the '?' button for instant help"
    echo -e "  ${CYAN}Interactive Tour${NC}    - Take a guided tour of all features"
    echo -e "  ${CYAN}Smart Errors${NC}        - Get specific solutions for any issues"
    echo -e "  ${CYAN}Progress Feedback${NC}   - Always know what's happening"
    echo ""
    
    echo -e "${YELLOW}${BOLD}${BOOK} Enhanced Documentation:${NC}"
    echo -e "  ${CYAN}GETTING_STARTED.md${NC} - Updated with new user experience info"
    echo -e "  ${CYAN}Built-in Help${NC}       - Access help directly from the web interface"
    echo -e "  ${CYAN}Contextual Tooltips${NC} - Hover over elements for helpful tips"
    echo ""
    
    echo -e "${YELLOW}${BOLD}${HEART} Pro Tips for New Users:${NC}"
    echo -e "  • First-time users will see a welcome dialog with platform overview"
    echo -e "  • Take the interactive tour to learn about each feature"
    echo -e "  • Use ${CYAN}./argus demo${NC} to generate sample data and explore"
    echo -e "  • The help button (?) is always available in the bottom-right corner"
    echo -e "  • Error messages now include specific troubleshooting steps"
    echo ""
    
    echo -e "${GREEN}${BOLD}${GEAR} What to expect after setup:${NC}"
    echo -e "  1. Open http://localhost:3000 in your browser"
    echo -e "  2. You'll see a welcome dialog explaining the platform"
    echo -e "  3. Choose to take the tour or explore on your own"
    echo -e "  4. Generate sample data to see the platform in action"
    echo -e "  5. Use the help system whenever you need guidance"
    echo ""
}

# Main flow
show_welcome

echo -e "${CYAN}${BOLD}Thank you for choosing Argus Monitoring Platform!${NC}\n"

echo -e "This enhanced version focuses on user-friendliness and accessibility:"
echo -e "• ${GREEN}Intuitive${NC} first-time user experience"
echo -e "• ${GREEN}Interactive${NC} help and guidance systems"  
echo -e "• ${GREEN}Contextual${NC} error handling with solutions"
echo -e "• ${GREEN}Accessible${NC} design for all users"
echo -e "• ${GREEN}Progressive${NC} feature discovery"
echo ""

show_enhanced_features
show_user_experience_flow
show_accessibility_features
show_quick_start

# Run the setup wizard
echo -e "${BLUE}${BOLD}Starting enhanced setup wizard...${NC}\n"
./setup.sh

# Show success tips
show_success_tips

echo -e "${GREEN}${BOLD}${ROCKET} Experience the enhanced Argus platform! ${ROCKET}${NC}"
echo -e "${CYAN}Remember: Click the help button (?) anytime you need assistance!${NC}"