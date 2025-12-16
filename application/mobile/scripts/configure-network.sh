#!/bin/bash
# ==============================================================================
# Zero Waste Challenge - Network Configuration Script
# ==============================================================================
# This script automatically configures the API_URL in the .env file based on
# the target environment. It handles IP address resolution for different
# development scenarios.
#
# Usage:
#   ./scripts/configure-network.sh [environment]
#
# Environments:
#   production    - Use production server (https://zerowaste.ink)
#   android       - Configure for Android emulator (10.0.2.2)
#   ios           - Configure for iOS simulator (localhost)
#   device        - Auto-detect local IP for physical devices
#   docker        - Use Docker Compose service name
#   custom <url>  - Use a custom API URL
#
# Examples:
#   ./scripts/configure-network.sh production
#   ./scripts/configure-network.sh android
#   ./scripts/configure-network.sh device
#   ./scripts/configure-network.sh custom http://192.168.1.50:8000
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

# Print colored message
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get local IP address
get_local_ip() {
    local ip=""

    # Try different methods based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        ip=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "")
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows (Git Bash, Cygwin)
        ip=$(ipconfig 2>/dev/null | grep -i "IPv4" | head -1 | awk '{print $NF}' || echo "")
    fi

    echo "$ip"
}

# Create or update .env file
update_env() {
    local api_url="$1"

    if [ -f "$ENV_FILE" ]; then
        # Update existing API_URL or add if not present
        if grep -q "^API_URL=" "$ENV_FILE"; then
            # Use different sed syntax for macOS vs Linux
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^API_URL=.*|API_URL=$api_url|" "$ENV_FILE"
            else
                sed -i "s|^API_URL=.*|API_URL=$api_url|" "$ENV_FILE"
            fi
        else
            echo "API_URL=$api_url" >> "$ENV_FILE"
        fi
    else
        # Create new .env file
        echo "API_URL=$api_url" > "$ENV_FILE"
    fi

    print_success "Updated .env file with API_URL=$api_url"
}

# Show usage information
show_usage() {
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  production    Use production server (https://zerowaste.ink)"
    echo "  android       Configure for Android emulator (10.0.2.2)"
    echo "  ios           Configure for iOS simulator (localhost)"
    echo "  device        Auto-detect local IP for physical devices"
    echo "  docker        Use Docker Compose service name"
    echo "  custom <url>  Use a custom API URL"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 android"
    echo "  $0 device"
    echo "  $0 custom http://192.168.1.50:8000"
    echo ""
}

# Main script
main() {
    local environment="${1:-}"
    local custom_url="${2:-}"
    local backend_port="${BACKEND_PORT:-8000}"

    print_info "Zero Waste Challenge - Network Configuration"
    echo ""

    case "$environment" in
        production|prod)
            print_info "Configuring for production environment..."
            update_env "https://zerowaste.ink"
            ;;

        android)
            print_info "Configuring for Android emulator..."
            print_info "Using 10.0.2.2 (Android's alias for host localhost)"
            update_env "http://10.0.2.2:$backend_port"
            ;;

        ios)
            print_info "Configuring for iOS simulator..."
            print_info "Using localhost (iOS simulator shares host network)"
            update_env "http://localhost:$backend_port"
            ;;

        device|physical)
            print_info "Configuring for physical device..."
            local_ip=$(get_local_ip)

            if [ -z "$local_ip" ]; then
                print_error "Could not detect local IP address."
                print_info "Please find your IP manually and run:"
                print_info "  $0 custom http://<your-ip>:$backend_port"
                exit 1
            fi

            print_info "Detected local IP: $local_ip"
            update_env "http://$local_ip:$backend_port"
            print_warning "Make sure your device is on the same WiFi network!"
            ;;

        docker|compose)
            print_info "Configuring for Docker Compose..."
            print_info "Using 'backend' service name"
            update_env "http://backend:$backend_port"
            print_warning "This only works when mobile app runs inside Docker Compose network"
            ;;

        custom)
            if [ -z "$custom_url" ]; then
                print_error "Custom URL not provided."
                print_info "Usage: $0 custom <url>"
                print_info "Example: $0 custom http://192.168.1.50:8000"
                exit 1
            fi
            print_info "Configuring with custom URL..."
            update_env "$custom_url"
            ;;

        help|--help|-h)
            show_usage
            exit 0
            ;;

        "")
            print_warning "No environment specified. Showing current configuration..."
            echo ""
            if [ -f "$ENV_FILE" ]; then
                grep "^API_URL=" "$ENV_FILE" || echo "API_URL not set in .env"
            else
                print_warning ".env file not found"
            fi
            echo ""
            show_usage
            exit 0
            ;;

        *)
            print_error "Unknown environment: $environment"
            show_usage
            exit 1
            ;;
    esac

    echo ""
    print_success "Network configuration complete!"
    print_info "Current .env contents:"
    echo ""
    cat "$ENV_FILE"
    echo ""
}

# Run main function
main "$@"
