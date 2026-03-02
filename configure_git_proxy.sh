#!/bin/bash
# Git Proxy Configuration Script
# Generated on Tue Feb 10 04:53:46 PM WITA 2026

echo "🌐 Configuring Git Proxy: http://10.191.233.245:7071"

# Set git proxy configurations
git config --global http.proxy http://10.191.233.245:7071
git config --global https.proxy http://10.191.233.245:7071
git config --global http.sslVerify false
git config --global http.timeout 300
git config --global http.postBuffer 524288000

# Set environment variables
export http_proxy=http://10.191.233.245:7071
export https_proxy=http://10.191.233.245:7071
export HTTP_PROXY=http://10.191.233.245:7071
export HTTPS_PROXY=http://10.191.233.245:7071

echo "✅ Git proxy configured successfully!"
echo "📋 Configuration:"
git config --global --list | grep -E "(proxy|ssl|timeout|buffer)"
