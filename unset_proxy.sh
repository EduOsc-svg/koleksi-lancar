#!/bin/bash

# =====================================
# UNSET PROXY CONFIGURATION SCRIPT
# =====================================
# Purpose: Remove all proxy configurations from git and environment
# Date: $(date)
# =====================================

echo "🔧 Starting proxy unset process..."

# Function to display status
display_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ Failed: $1"
    fi
}

# 1. Unset Git Global Proxy Configuration
echo ""
echo "📋 Step 1: Removing Git Global Proxy Configuration"
echo "----------------------------------------"

echo "Removing git global http.proxy..."
git config --global --unset http.proxy 2>/dev/null
display_status "Git HTTP proxy removed"

echo "Removing git global https.proxy..."
git config --global --unset https.proxy 2>/dev/null
display_status "Git HTTPS proxy removed"

echo "Removing git global core.gitproxy..."
git config --global --unset core.gitproxy 2>/dev/null
display_status "Git core proxy removed"

# 2. Unset Local Git Proxy Configuration (if any)
echo ""
echo "📋 Step 2: Removing Local Git Proxy Configuration"
echo "----------------------------------------"

echo "Removing local git http.proxy..."
git config --unset http.proxy 2>/dev/null
display_status "Local Git HTTP proxy removed"

echo "Removing local git https.proxy..."
git config --unset https.proxy 2>/dev/null
display_status "Local Git HTTPS proxy removed"

# 3. Unset Environment Variables
echo ""
echo "📋 Step 3: Clearing Environment Variables"
echo "----------------------------------------"

echo "Clearing HTTP_PROXY..."
unset HTTP_PROXY
export HTTP_PROXY=""
display_status "HTTP_PROXY cleared"

echo "Clearing HTTPS_PROXY..."
unset HTTPS_PROXY
export HTTPS_PROXY=""
display_status "HTTPS_PROXY cleared"

echo "Clearing http_proxy..."
unset http_proxy
export http_proxy=""
display_status "http_proxy cleared"

echo "Clearing https_proxy..."
unset https_proxy
export https_proxy=""
display_status "https_proxy cleared"

echo "Clearing ftp_proxy..."
unset ftp_proxy
export ftp_proxy=""
display_status "ftp_proxy cleared"

echo "Clearing no_proxy..."
unset no_proxy
export no_proxy=""
display_status "no_proxy cleared"

# 4. Verification
echo ""
echo "📋 Step 4: Verification"
echo "----------------------------------------"

echo "Checking git proxy configuration..."
PROXY_CHECK=$(git config --global --list | grep -i proxy 2>/dev/null)
if [ -z "$PROXY_CHECK" ]; then
    echo "✅ No git proxy configuration found"
else
    echo "⚠️  Remaining git proxy configuration:"
    echo "$PROXY_CHECK"
fi

echo "Checking environment variables..."
ENV_PROXY_CHECK=$(env | grep -i proxy 2>/dev/null)
if [ -z "$ENV_PROXY_CHECK" ]; then
    echo "✅ No proxy environment variables found"
else
    echo "ℹ️  Current proxy environment variables:"
    echo "$ENV_PROXY_CHECK"
fi

# 5. Test connectivity
echo ""
echo "📋 Step 5: Testing Connectivity"
echo "----------------------------------------"

echo "Testing direct connection to github.com..."
if ping -c 1 github.com >/dev/null 2>&1; then
    echo "✅ Direct connection to github.com successful"
else
    echo "⚠️  Cannot reach github.com directly"
fi

echo "Testing git connection..."
if git ls-remote --heads origin >/dev/null 2>&1; then
    echo "✅ Git connection successful"
else
    echo "⚠️  Git connection failed"
fi

echo ""
echo "🎉 Proxy unset process completed!"
echo "=========================================="
echo "📝 Summary:"
echo "   - Git proxy configurations removed"
echo "   - Environment proxy variables cleared" 
echo "   - Direct connection mode active"
echo ""
echo "💡 Note: You may need to restart your terminal"
echo "   or run 'source ~/.bashrc' to fully apply changes"
echo "=========================================="