#!/bin/bash
# Git Proxy Configuration Script
# Generated on Mon Apr  6 06:40:33 PM WITA 2026

echo "🌐 Configuring Git Proxy: http://10.57.71.7:7071"

# Set git proxy configurations
git config --global http.proxy http://10.57.71.7:7071
git config --global https.proxy http://10.57.71.7:7071
git config --global http.sslVerify false
git config --global http.timeout 300
git config --global http.postBuffer 524288000

# Set environment variables
export http_proxy=http://10.57.71.7:7071
export https_proxy=http://10.57.71.7:7071
export HTTP_PROXY=http://10.57.71.7:7071
export HTTPS_PROXY=http://10.57.71.7:7071

echo "✅ Git proxy configured successfully!"
echo "📋 Configuration:"
git config --global --list | grep -E "(proxy|ssl|timeout|buffer)"
