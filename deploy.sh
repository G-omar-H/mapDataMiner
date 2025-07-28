#!/bin/bash

# 🚀 MapDataMiner - Professional Deployment Script
# This script will guide you through deploying your application to Vercel

echo "🚀 MapDataMiner - Professional Deployment Script"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🎯 $1${NC}"
    echo "----------------------------------------"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check if git is configured
if ! git config --global user.name >/dev/null 2>&1; then
    print_warning "Git user name not configured"
    echo -n "Enter your Git username: "
    read git_username
    git config --global user.name "$git_username"
    print_status "Git username configured"
fi

if ! git config --global user.email >/dev/null 2>&1; then
    print_warning "Git email not configured"
    echo -n "Enter your Git email: "
    read git_email
    git config --global user.email "$git_email"
    print_status "Git email configured"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    print_status "Vercel CLI installed"
else
    print_status "Vercel CLI found"
fi

echo ""

# Step 1: Git Remote Setup
print_header "Step 1: Git Repository Setup"

echo "You need to create a repository on GitHub/GitLab/Bitbucket first."
echo "Then come back and enter the repository URL."
echo ""
echo -n "Enter your remote repository URL (e.g., https://github.com/username/mapDataMiner.git): "
read repo_url

if [ ! -z "$repo_url" ]; then
    # Check if remote already exists
    if git remote get-url origin >/dev/null 2>&1; then
        print_info "Remote origin already exists. Updating..."
        git remote set-url origin "$repo_url"
    else
        git remote add origin "$repo_url"
    fi
    
    print_status "Remote repository configured"
    
    # Push to remote
    print_info "Pushing to remote repository..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        print_status "Code pushed to remote repository successfully!"
    else
        print_error "Failed to push to remote repository. Please check your credentials and try again."
        exit 1
    fi
else
    print_warning "Skipping remote repository setup"
fi

echo ""

# Step 2: Vercel Deployment
print_header "Step 2: Vercel Deployment"

print_info "Logging into Vercel..."
vercel login

print_info "Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    print_status "Successfully deployed to Vercel!"
else
    print_error "Deployment failed. Please check the error messages above."
    exit 1
fi

echo ""

# Step 3: Environment Variables Setup
print_header "Step 3: Environment Variables Setup"

print_warning "IMPORTANT: You need to set up environment variables in Vercel Dashboard"
echo ""
echo "Required Environment Variables:"
echo "• GOOGLE_MAPS_API_KEY (required for scraping)"
echo "• NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (required for maps)"
echo ""
echo "Optional Variables:"
echo "• GOOGLE_SHEETS_API_KEY"
echo "• GOOGLE_CLIENT_EMAIL"
echo "• GOOGLE_PRIVATE_KEY"
echo "• GOOGLE_PROJECT_ID"
echo ""
echo "Application Settings:"
echo "• DEFAULT_SEARCH_RADIUS=5000"
echo "• MAX_BUSINESSES_PER_SEARCH=100"
echo "• ENABLE_REAL_SCRAPING=true"
echo "• ENABLE_GOOGLE_SHEETS_EXPORT=false"
echo "• DEBUG_MODE=false"
echo "• API_SECRET_KEY=your_random_secret_key_here"
echo ""

print_info "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
print_info "2. Add each variable for Production, Preview, and Development environments"
print_info "3. Redeploy after adding environment variables"

echo ""

# Step 4: Final Instructions
print_header "Step 4: Post-Deployment Steps"

echo "After setting up environment variables:"
echo ""
print_info "1. Test your deployed application"
print_info "2. Check the health endpoint: /health"
print_info "3. Verify map functionality with Mapbox token"
print_info "4. Test business scraping with Google Maps API"
echo ""

print_status "Deployment script completed!"
print_info "Check DEPLOYMENT_GUIDE.md for detailed instructions"

echo ""
echo "🎉 Your MapDataMiner is ready for production!"
echo "📖 For detailed setup instructions, see: DEPLOYMENT_GUIDE.md"
echo "🔧 For API setup guide, see: API_SETUP_GUIDE.md" 