#!/usr/bin/env python3
"""
Git Proxy Configuration Script
Automatically configures git proxy settings for corporate/institutional networks
"""

import subprocess
import sys
import os
from typing import Optional

class GitProxyConfig:
    def __init__(self, proxy_ip: str, proxy_port: int = 7071):
        self.proxy_ip = proxy_ip
        self.proxy_port = proxy_port
        self.proxy_url = f"http://{proxy_ip}:{proxy_port}"
        
    def run_command(self, command: list, description: str) -> bool:
        """Execute a command and handle errors"""
        try:
            print(f"🔧 {description}...")
            result = subprocess.run(command, capture_output=True, text=True, check=True)
            print(f"✅ {description} - SUCCESS")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ {description} - FAILED")
            print(f"   Error: {e.stderr.strip()}")
            return False
        except Exception as e:
            print(f"❌ {description} - ERROR: {str(e)}")
            return False

    def configure_git_proxy(self) -> bool:
        """Configure git proxy settings"""
        print(f"\n🌐 Configuring Git Proxy: {self.proxy_url}")
        print("=" * 50)
        
        success_count = 0
        total_commands = 0
        
        # Git proxy configurations
        proxy_configs = [
            (["git", "config", "--global", "http.proxy", self.proxy_url], 
             f"Setting HTTP proxy to {self.proxy_url}"),
            (["git", "config", "--global", "https.proxy", self.proxy_url], 
             f"Setting HTTPS proxy to {self.proxy_url}"),
            (["git", "config", "--global", "http.sslVerify", "false"], 
             "Disabling SSL verification for proxy compatibility"),
            (["git", "config", "--global", "http.timeout", "300"], 
             "Setting HTTP timeout to 5 minutes"),
            (["git", "config", "--global", "http.postBuffer", "524288000"], 
             "Setting large post buffer for big repositories"),
        ]
        
        for command, description in proxy_configs:
            total_commands += 1
            if self.run_command(command, description):
                success_count += 1
        
        return success_count == total_commands

    def set_environment_variables(self) -> bool:
        """Set proxy environment variables for current session"""
        print(f"\n🌍 Setting Environment Variables...")
        print("=" * 40)
        
        try:
            # Set environment variables
            env_vars = {
                'http_proxy': self.proxy_url,
                'https_proxy': self.proxy_url,
                'HTTP_PROXY': self.proxy_url,
                'HTTPS_PROXY': self.proxy_url,
            }
            
            for var_name, var_value in env_vars.items():
                os.environ[var_name] = var_value
                print(f"✅ Set {var_name} = {var_value}")
            
            return True
        except Exception as e:
            print(f"❌ Failed to set environment variables: {str(e)}")
            return False

    def test_connectivity(self) -> bool:
        """Test git connectivity with the proxy"""
        print(f"\n🔍 Testing Git Connectivity...")
        print("=" * 35)
        
        test_commands = [
            (["git", "config", "--global", "--list"], "Checking git configuration"),
            (["curl", "-I", "--proxy", self.proxy_url, "https://github.com"], "Testing GitHub connectivity"),
        ]
        
        success_count = 0
        for command, description in test_commands:
            if self.run_command(command, description):
                success_count += 1
        
        return success_count > 0

    def display_configuration(self) -> None:
        """Display current git proxy configuration"""
        print(f"\n📋 Current Git Proxy Configuration:")
        print("=" * 40)
        
        try:
            result = subprocess.run(["git", "config", "--global", "--list"], 
                                  capture_output=True, text=True, check=True)
            
            proxy_configs = [line for line in result.stdout.split('\n') 
                           if any(keyword in line.lower() 
                                for keyword in ['proxy', 'ssl', 'timeout', 'buffer'])]
            
            if proxy_configs:
                for config in proxy_configs:
                    if config.strip():
                        print(f"  📌 {config}")
            else:
                print("  ⚠️  No proxy configurations found")
                
        except Exception as e:
            print(f"  ❌ Failed to get configuration: {str(e)}")

    def generate_bash_script(self) -> None:
        """Generate bash script for future use"""
        script_content = f"""#!/bin/bash
# Git Proxy Configuration Script
# Generated on {subprocess.run(['date'], capture_output=True, text=True).stdout.strip()}

echo "🌐 Configuring Git Proxy: {self.proxy_url}"

# Set git proxy configurations
git config --global http.proxy {self.proxy_url}
git config --global https.proxy {self.proxy_url}
git config --global http.sslVerify false
git config --global http.timeout 300
git config --global http.postBuffer 524288000

# Set environment variables
export http_proxy={self.proxy_url}
export https_proxy={self.proxy_url}
export HTTP_PROXY={self.proxy_url}
export HTTPS_PROXY={self.proxy_url}

echo "✅ Git proxy configured successfully!"
echo "📋 Configuration:"
git config --global --list | grep -E "(proxy|ssl|timeout|buffer)"
"""
        
        script_path = "configure_git_proxy.sh"
        try:
            with open(script_path, 'w') as f:
                f.write(script_content)
            os.chmod(script_path, 0o755)  # Make executable
            print(f"\n📄 Bash script saved as: {script_path}")
            print(f"   Usage: ./{script_path}")
        except Exception as e:
            print(f"❌ Failed to create bash script: {str(e)}")

def main():
    """Main function"""
    print("🚀 Git Proxy Configuration Tool")
    print("=" * 50)
    
    # Default proxy configuration
    proxy_ip = "10.57.71.7"
    proxy_port = 7071
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        proxy_ip = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            proxy_port = int(sys.argv[2])
        except ValueError:
            print(f"❌ Invalid port number: {sys.argv[2]}")
            sys.exit(1)
    
    print(f"🎯 Target Proxy: {proxy_ip}:{proxy_port}")
    
    # Create proxy configurator
    proxy_config = GitProxyConfig(proxy_ip, proxy_port)
    
    # Execute configuration steps
    steps = [
        ("Git Proxy Configuration", proxy_config.configure_git_proxy),
        ("Environment Variables", proxy_config.set_environment_variables),
        ("Connectivity Test", proxy_config.test_connectivity),
    ]
    
    success_count = 0
    for step_name, step_function in steps:
        if step_function():
            success_count += 1
        print()  # Add spacing
    
    # Display results
    proxy_config.display_configuration()
    proxy_config.generate_bash_script()
    
    # Final status
    print(f"\n🎉 Configuration Summary:")
    print("=" * 30)
    print(f"✅ Completed steps: {success_count}/{len(steps)}")
    
    if success_count == len(steps):
        print("🎊 All configurations applied successfully!")
        print("🔄 You can now use git commands with proxy support")
    else:
        print("⚠️  Some configurations failed. Check the output above.")
    
    print(f"\n💡 Usage Examples:")
    print(f"   git clone https://github.com/user/repo.git")
    print(f"   git push origin main")
    print(f"   git pull")

if __name__ == "__main__":
    main()