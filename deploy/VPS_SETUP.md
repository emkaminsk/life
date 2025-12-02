# VPS Setup Guide

Complete guide for setting up a Linux VPS to host the Game of Life simulator.

## Prerequisites

### VPS Requirements

- **Operating System**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **RAM**: Minimum 512 MB (1 GB recommended)
- **Disk Space**: Minimum 10 GB
- **Network**: Public IP address
- **Access**: SSH access with sudo privileges

### Domain (Optional)

- Custom domain name pointing to VPS IP
- DNS A record configured: `gameoflife.example.com → VPS_IP`
- Not required - can use IP address directly

## Step 1: Initial Server Setup

### 1.1 Update System

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update package lists and upgrade installed packages
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim ufw
```

### 1.2 Create Deploy User

Create a dedicated user for deployment (don't use root):

```bash
# Create deploy user
sudo adduser deploy

# You'll be prompted for password - set a strong password
# Fill in user information (optional, can skip with Enter)

# Add deploy user to sudo group (if needed)
sudo usermod -aG sudo deploy

# Add deploy user to www-data group (for nginx permissions)
sudo usermod -aG www-data deploy

# Verify user creation
id deploy
# Output: uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),33(www-data)
```

### 1.3 Configure Firewall (UFW)

```bash
# Enable UFW firewall
sudo ufw status

# Allow SSH (IMPORTANT: do this before enabling firewall!)
sudo ufw allow OpenSSH

# Allow HTTP
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
# Output should show: 22/tcp (OpenSSH), 80/tcp and 443/tcp (Nginx Full)
```

## Step 2: Install and Configure Nginx

### 2.1 Install Nginx

```bash
# Install nginx
sudo apt install nginx -y

# Start nginx service
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Verify nginx is running
sudo systemctl status nginx
# Output should show: Active: active (running)
```

### 2.2 Test Nginx Installation

```bash
# Check if nginx is serving default page
curl http://localhost
# Should return HTML with "Welcome to nginx!"

# Or visit in browser:
# http://YOUR_VPS_IP
# Should see nginx default welcome page
```

## Step 3: Setup Deployment Directory

### 3.1 Create Web Root Directory

```bash
# Create directory for game files
sudo mkdir -p /var/www/gameoflife

# Set ownership to deploy user and www-data group
sudo chown -R deploy:www-data /var/www/gameoflife

# Set permissions (755 = rwxr-xr-x)
sudo chmod -R 755 /var/www/gameoflife

# Verify permissions
ls -la /var/www/
# Output should show: drwxr-xr-x deploy www-data gameoflife
```

### 3.2 Test Directory Permissions

```bash
# Switch to deploy user
su - deploy

# Test write permissions (should succeed)
touch /var/www/gameoflife/test.txt
ls /var/www/gameoflife/
# Should see test.txt

# Remove test file
rm /var/www/gameoflife/test.txt

# Exit deploy user
exit
```

## Step 4: Configure SSH Key Authentication

### 4.1 Setup SSH for Deploy User

```bash
# Switch to deploy user
su - deploy

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create authorized_keys file
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Exit deploy user
exit
```

### 4.2 Add Your Public Key

**On your local machine:**

```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gameoflife_deploy

# Copy public key
cat ~/.ssh/gameoflife_deploy.pub
# Copy the output (starts with ssh-ed25519...)
```

**On VPS:**

```bash
# Edit authorized_keys for deploy user
sudo nano /home/deploy/.ssh/authorized_keys

# Paste your public key (entire line)
# Save and exit (Ctrl+X, Y, Enter)

# Verify permissions
ls -la /home/deploy/.ssh/
# authorized_keys should be -rw------- (600)
```

### 4.3 Test SSH Key Authentication

**On your local machine:**

```bash
# Test SSH connection with key
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP

# Should connect without password
# If successful, you're ready for automated deployment!

# Exit
exit
```

### 4.4 Disable Password Authentication (Optional but Recommended)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and modify these lines:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no

# Save and exit (Ctrl+X, Y, Enter)

# Restart SSH service
sudo systemctl restart ssh

# IMPORTANT: Test SSH key login in another terminal before closing this session!
# If it fails, you'll be locked out!
```

## Step 5: Configure Nginx for Game of Life

### 5.1 Copy Nginx Configuration

**On your local machine:**

```bash
# Copy nginx.conf from repository to VPS
scp -i ~/.ssh/gameoflife_deploy \
    deploy/nginx.conf \
    deploy@YOUR_VPS_IP:/tmp/gameoflife.conf
```

**On VPS:**

```bash
# Move config to nginx sites-available
sudo mv /tmp/gameoflife.conf /etc/nginx/sites-available/gameoflife

# Note: The configuration uses 'server_name _;' which is a catch-all
# that accepts requests to any domain or IP address.
# This means the site will work immediately with your VPS IP address.
# If you want to restrict access to a specific domain, edit the config:
# sudo nano /etc/nginx/sites-available/gameoflife
# And replace 'server_name _;' with 'server_name yourdomain.com;'
```

### 5.2 Enable Site Configuration

```bash
# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/gameoflife /etc/nginx/sites-enabled/

# Optional: Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
# Output should be: syntax is ok, test is successful

# Reload nginx to apply changes
sudo systemctl reload nginx

# Verify nginx is running
sudo systemctl status nginx
```

### 5.3 Test Nginx Configuration

```bash
# Check nginx error log for issues
sudo tail -f /var/log/nginx/error.log

# In another terminal, test with curl
curl -I http://YOUR_VPS_IP
# Should return: HTTP/1.1 404 Not Found (normal - no files deployed yet)
# Should see security headers: X-Frame-Options, X-Content-Type-Options, etc.
```

## Step 6: Initial Deployment Test

### 6.1 Create Test HTML File

**On VPS:**

```bash
# Switch to deploy user
su - deploy

# Create simple test file
cat > /var/www/gameoflife/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Game of Life - Deployment Test</h1></body>
</html>
EOF

# Exit deploy user
exit
```

### 6.2 Verify Test Deployment

```bash
# Check file exists
ls -la /var/www/gameoflife/
# Should show index.html owned by deploy:www-data

# Test with curl
curl http://YOUR_VPS_IP
# Should return HTML with "Deployment Test"

# Or visit in browser:
# http://YOUR_VPS_IP
# Should see "Game of Life - Deployment Test"
```

**Success!** If you see the test page, nginx is correctly configured.

## Step 7: SSL/TLS Setup with Let's Encrypt (Optional but Recommended)

### 7.1 Install Certbot

```bash
# Install certbot for nginx
sudo apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

### 7.2 Obtain SSL Certificate

**Requirements:**
- Domain name (not IP address)
- DNS A record pointing to VPS IP

```bash
# Obtain certificate (replace with your domain)
sudo certbot --nginx -d gameoflife.example.com

# Certbot will prompt you:
# - Email address (for renewal notifications)
# - Agree to terms of service
# - Redirect HTTP to HTTPS (choose Yes/2)

# Certbot will:
# 1. Verify domain ownership
# 2. Obtain SSL certificate
# 3. Update nginx config automatically
# 4. Set up auto-renewal cron job
```

### 7.3 Verify SSL Configuration

```bash
# Test HTTPS
curl -I https://gameoflife.example.com
# Should return: HTTP/2 200 OK

# Check certificate auto-renewal
sudo certbot renew --dry-run
# Should succeed with no errors

# View renewal timer
sudo systemctl status certbot.timer
# Should show: Active: active (waiting)
```

### 7.4 Update Firewall for HTTPS

```bash
# Allow HTTPS (if not already allowed with 'Nginx Full')
sudo ufw allow 443/tcp

# Verify firewall rules
sudo ufw status
# Should show: 80/tcp, 443/tcp allowed
```

## Step 8: Configure GitHub Secrets

### 8.1 Gather Required Information

You'll need these values for GitHub Secrets:

- **VPS_HOST**: Your VPS IP address or domain (e.g., `123.45.67.89` or `gameoflife.example.com`)
- **VPS_USER**: `deploy`
- **VPS_SSH_KEY**: Contents of `~/.ssh/gameoflife_deploy` (private key) on your local machine
- **VPS_DEPLOY_PATH**: `/var/www/gameoflife`

### 8.2 Add Secrets to GitHub

**On your local machine:**

```bash
# Display private key (copy entire output)
cat ~/.ssh/gameoflife_deploy
# Copy from -----BEGIN OPENSSH PRIVATE KEY----- to -----END OPENSSH PRIVATE KEY-----
```

**In GitHub:**

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add four secrets:

| Name | Value |
|------|-------|
| `VPS_HOST` | `123.45.67.89` or `gameoflife.example.com` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | (paste entire private key including BEGIN/END lines) |
| `VPS_DEPLOY_PATH` | `/var/www/gameoflife` |

### 8.3 Verify Secrets

- Ensure all four secrets are listed in repository settings
- Secret values are hidden (only "VPS_HOST" value might be visible)
- Ready for automated deployment via GitHub Actions!

## Step 9: Verify Complete Setup

### 9.1 Checklist

Run through this checklist to ensure everything is ready:

- [ ] VPS is updated: `sudo apt update && sudo apt upgrade`
- [ ] Deploy user created: `id deploy`
- [ ] Nginx is installed and running: `sudo systemctl status nginx`
- [ ] Deployment directory exists: `ls -la /var/www/gameoflife`
- [ ] Directory permissions correct: `drwxr-xr-x deploy www-data`
- [ ] SSH key authentication works: `ssh -i ~/.ssh/gameoflife_deploy deploy@VPS_IP`
- [ ] Nginx config is valid: `sudo nginx -t`
- [ ] Nginx is serving test page: `curl http://VPS_IP`
- [ ] Firewall allows HTTP/HTTPS: `sudo ufw status`
- [ ] GitHub Secrets configured (all 4 secrets)
- [ ] (Optional) SSL certificate obtained: `curl -I https://DOMAIN`

### 9.2 Test Deployment

**On your local machine:**

```bash
# Build production assets
npm run build

# Deploy manually to test
scp -i ~/.ssh/gameoflife_deploy -r dist/* deploy@YOUR_VPS_IP:/var/www/gameoflife/

# Verify deployment
curl http://YOUR_VPS_IP
# Should return Game of Life HTML (not test page)
```

**In browser:**

Visit `http://YOUR_VPS_IP` (or `https://YOUR_DOMAIN` if SSL configured)

- Should see Game of Life configuration panel
- All game features should work
- Check browser console for errors (should be none)

### 9.3 Test GitHub Actions (Final Test)

```bash
# Make a trivial change to trigger deployment
echo "# Deployment test" >> README.md

# Commit and push to main branch
git add README.md
git commit -m "test: trigger deployment"
git push origin main

# Monitor GitHub Actions:
# https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# Wait for workflow to complete (should take 2-5 minutes)

# Verify deployment
curl http://YOUR_VPS_IP
# Should return updated Game of Life HTML
```

**Success!** If GitHub Actions completes and site is updated, deployment is fully automated.

## Troubleshooting

### Nginx Not Starting

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check nginx config syntax
sudo nginx -t

# Check if port 80 is already in use
sudo netstat -tlnp | grep :80
```

### Permission Denied Errors

```bash
# Check directory ownership
ls -la /var/www/gameoflife

# Fix ownership
sudo chown -R deploy:www-data /var/www/gameoflife

# Fix permissions
sudo chmod -R 755 /var/www/gameoflife
```

### SSH Connection Fails

```bash
# Test SSH connection with verbose output
ssh -v -i ~/.ssh/gameoflife_deploy deploy@VPS_IP

# Check authorized_keys permissions on VPS
ls -la /home/deploy/.ssh/

# Fix permissions if needed
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### GitHub Actions Deployment Fails

```bash
# Check GitHub Actions logs in repository
# Common issues:
# - Incorrect VPS_HOST (check IP/domain)
# - Incorrect VPS_USER (should be "deploy")
# - Invalid VPS_SSH_KEY (check private key is complete)
# - Incorrect VPS_DEPLOY_PATH (should be /var/www/gameoflife)

# Test SSH from local machine
ssh -i ~/.ssh/gameoflife_deploy deploy@VPS_IP

# Test SCP transfer
scp -i ~/.ssh/gameoflife_deploy README.md deploy@VPS_IP:/var/www/gameoflife/test.txt
```

## Maintenance

### Update Nginx Configuration

```bash
# Edit config
sudo nano /etc/nginx/sites-available/gameoflife

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Monitor Logs

```bash
# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -f -u nginx
```

### Update System

```bash
# Update packages monthly
sudo apt update
sudo apt upgrade -y

# Check for required restarts
sudo needrestart
```

### Renew SSL Certificate

```bash
# Certificates auto-renew via certbot.timer
# Test renewal process
sudo certbot renew --dry-run

# Force renewal (if within 30 days of expiry)
sudo certbot renew --force-renewal
```

## Security Hardening (Optional)

### Install Fail2ban

Protect against SSH brute-force attacks:

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Copy default config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
sudo nano /etc/fail2ban/jail.local

# Find [sshd] section and ensure:
# enabled = true
# maxretry = 5
# bantime = 3600

# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status sshd
```

### Enable Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure for security updates only
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Verify configuration
cat /etc/apt/apt.conf.d/20auto-upgrades
# Should show: APT::Periodic::Unattended-Upgrade "1";
```

## Next Steps

After completing VPS setup:

1. ✅ Test manual deployment: `scp dist/* ...`
2. ✅ Configure GitHub Secrets
3. ✅ Test automated deployment: `git push origin main`
4. ✅ Monitor first deployment in GitHub Actions
5. ✅ Verify site is accessible and functional
6. ✅ Share live URL with users
7. ✅ Set up monitoring (UptimeRobot, etc.)
8. ✅ Configure custom domain (if using IP)
9. ✅ Enable HTTPS with Let's Encrypt
10. ✅ Add deployment status badge to README

**Congratulations!** Your VPS is ready for automated deployments.
