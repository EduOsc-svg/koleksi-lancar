#!/bin/bash
# Git Proxy Configuration Script
# Updated on Mon Feb 10 2026 with new proxy IP

echo "🌐 Configuring Git Proxy: "

# Set git proxy configurations
git config --global http.proxy 
git config --global https.proxy 
git config --global http.sslVerify false
git config --global http.timeout 300
git config --global http.postBuffer 524288000

# Set environment variables
export http_proxy=
export https_proxy=
export HTTP_PROXY=
export HTTPS_PROXY=

echo "✅ Git proxy configured successfully!"
echo "📋 Configuration:"
git config --global --list | grep -E "(proxy|ssl|timeout|buffer)"
