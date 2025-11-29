# SSH Key Setup for GitHub Actions

This guide walks you through setting up SSH key authentication for automated deployment from GitHub Actions to your VPS.

## Overview

GitHub Actions needs to authenticate to your VPS via SSH to deploy files. This requires:

1. **SSH key pair** - Public key on VPS, private key in GitHub Secrets
2. **Deploy user** - Dedicated user on VPS with deployment permissions
3. **GitHub Secrets** - Store VPS credentials securely in repository settings

## Step 1: Generate SSH Key Pair

### On Your Local Machine

```bash
# Generate Ed25519 key pair (recommended - more secure and smaller)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gameoflife_deploy

# You'll be prompted for passphrase - leave empty for automation
# Press Enter twice (no passphrase)

# Verify keys were created
ls -la ~/.ssh/gameoflife_deploy*
# Should see:
# gameoflife_deploy (private key)
# gameoflife_deploy.pub (public key)
```

**Alternative: RSA Key (if Ed25519 not supported)**

```bash
# Generate 4096-bit RSA key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/gameoflife_deploy

# Press Enter twice (no passphrase)
```

### Key Files Explained

- **Private key** (`gameoflife_deploy`): Keep secret! Store in GitHub Secrets only
- **Public key** (`gameoflife_deploy.pub`): Safe to share, add to VPS

**⚠️ Security Warning:**
- Never commit private key to repository
- Never share private key via email/chat
- Only store in GitHub Secrets (encrypted)

## Step 2: Add Public Key to VPS

### Copy Public Key

```bash
# Display public key
cat ~/.ssh/gameoflife_deploy.pub

# Example output:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAbCdEfGhIjKlMnOpQrStUvWxYz github-actions-deploy

# Copy the entire line (starts with ssh-ed25519 or ssh-rsa)
```

### Add to VPS Authorized Keys

**Option A: Using ssh-copy-id (Easiest)**

```bash
# Copy public key to VPS
ssh-copy-id -i ~/.ssh/gameoflife_deploy.pub deploy@YOUR_VPS_IP

# You'll be prompted for deploy user password
# Enter password and key will be added automatically

# Test connection
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP
# Should connect without password
```

**Option B: Manual Copy (If ssh-copy-id not available)**

```bash
# SSH into VPS with password
ssh deploy@YOUR_VPS_IP

# Create .ssh directory (if doesn't exist)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Edit authorized_keys file
nano ~/.ssh/authorized_keys

# Paste your public key (entire line from gameoflife_deploy.pub)
# Save and exit (Ctrl+X, Y, Enter)

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Exit VPS
exit

# Test connection from local machine
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP
# Should connect without password
```

### Verify Permissions

**On VPS:**

```bash
# Check SSH directory permissions
ls -la ~/.ssh/

# Should be:
# drwx------ (700) for .ssh/ directory
# -rw------- (600) for authorized_keys file

# If permissions are wrong, fix them:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## Step 3: Test SSH Key Authentication

### From Local Machine

```bash
# Test SSH connection with key
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP

# Should connect without password prompt
# If successful, you'll see VPS command prompt

# Test SCP file transfer
echo "test" > /tmp/test.txt
scp -i ~/.ssh/gameoflife_deploy /tmp/test.txt deploy@YOUR_VPS_IP:/tmp/

# Should transfer without password
# If successful, SSH key authentication is working!

# Clean up test file
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP "rm /tmp/test.txt"
rm /tmp/test.txt
```

### Troubleshooting Connection Issues

**If SSH connection fails:**

```bash
# Use verbose mode to diagnose
ssh -v -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP

# Common issues:
# - Wrong private key file
# - Public key not in authorized_keys
# - Wrong file permissions (should be 600 for private key)
# - VPS sshd_config doesn't allow key authentication

# Check private key permissions on local machine
ls -la ~/.ssh/gameoflife_deploy
# Should be: -rw------- (600)

# Fix if needed
chmod 600 ~/.ssh/gameoflife_deploy
```

**If prompted for password:**

```bash
# Check VPS SSH configuration
ssh deploy@YOUR_VPS_IP
sudo nano /etc/ssh/sshd_config

# Ensure these lines are set:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Restart SSH service
sudo systemctl restart ssh
exit

# Try again
ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP
```

## Step 4: Add Secrets to GitHub Repository

### Gather Required Values

Collect these four values:

1. **VPS_HOST**: Your VPS IP address or domain
   ```bash
   # Example: 123.45.67.89 or gameoflife.example.com
   ```

2. **VPS_USER**: SSH username (should be `deploy`)
   ```bash
   # Value: deploy
   ```

3. **VPS_SSH_KEY**: Private key content
   ```bash
   # Display private key
   cat ~/.ssh/gameoflife_deploy

   # Copy entire output including BEGIN/END lines
   # Example:
   # -----BEGIN OPENSSH PRIVATE KEY-----
   # b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   # ...
   # -----END OPENSSH PRIVATE KEY-----
   ```

4. **VPS_DEPLOY_PATH**: Deployment directory
   ```bash
   # Value: /var/www/gameoflife
   ```

### Add Secrets in GitHub

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** (top menu)
   - Click **Secrets and variables** → **Actions** (left sidebar)

2. **Add VPS_HOST Secret**
   - Click **New repository secret**
   - Name: `VPS_HOST`
   - Value: `123.45.67.89` (or your domain)
   - Click **Add secret**

3. **Add VPS_USER Secret**
   - Click **New repository secret**
   - Name: `VPS_USER`
   - Value: `deploy`
   - Click **Add secret**

4. **Add VPS_SSH_KEY Secret**
   - Click **New repository secret**
   - Name: `VPS_SSH_KEY`
   - Value: (paste entire private key including BEGIN/END lines)
   - Click **Add secret**

   **⚠️ Important:**
   - Copy entire private key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`
   - No extra spaces or newlines before/after
   - Preserve all line breaks within the key

5. **Add VPS_DEPLOY_PATH Secret**
   - Click **New repository secret**
   - Name: `VPS_DEPLOY_PATH`
   - Value: `/var/www/gameoflife`
   - Click **Add secret**

### Verify Secrets

After adding all secrets:

- You should see 4 secrets listed:
  - `VPS_HOST`
  - `VPS_USER`
  - `VPS_SSH_KEY`
  - `VPS_DEPLOY_PATH`
- Values are hidden (shows "Updated X minutes ago")
- Only repository owners/admins can view/edit secrets

## Step 5: Test GitHub Actions Deployment

### Trigger Deployment

```bash
# Make a trivial change to trigger workflow
echo "# Test deployment" >> README.md

# Commit and push to main branch
git add README.md
git commit -m "test: trigger GitHub Actions deployment"
git push origin main
```

### Monitor Workflow

1. **Go to GitHub Actions Tab**
   - Navigate to your repository on GitHub
   - Click **Actions** (top menu)
   - You should see workflow "Deploy to VPS" running

2. **Watch Workflow Steps**
   - Click on the running workflow
   - Click on "build-and-deploy" job
   - Watch each step execute:
     - ✅ Checkout code
     - ✅ Setup Node.js
     - ✅ Install dependencies
     - ✅ Run linter
     - ✅ Build production assets
     - ✅ Deploy to VPS via SCP
     - ✅ Health check

3. **Check for Errors**
   - If any step fails, click on it to see error details
   - Common issues:
     - **SSH connection failed**: Check VPS_SSH_KEY secret (must include BEGIN/END lines)
     - **Permission denied**: Check VPS_USER and file permissions on VPS
     - **SCP failed**: Check VPS_DEPLOY_PATH is correct and writable
     - **Health check failed**: Site may not be configured in nginx yet

### Verify Deployment

```bash
# From local machine, check deployed site
curl -I http://YOUR_VPS_IP

# Should return:
# HTTP/1.1 200 OK
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# (and other security headers)

# Or visit in browser:
# http://YOUR_VPS_IP
# Should see Game of Life configuration panel
```

## Common Issues and Solutions

### Issue: "Permission denied (publickey)"

**Cause**: Private key not configured correctly in GitHub Secrets

**Solution**:
```bash
# Re-copy private key
cat ~/.ssh/gameoflife_deploy

# Ensure you copy:
# 1. Complete BEGIN line: -----BEGIN OPENSSH PRIVATE KEY-----
# 2. All key content (multiple lines)
# 3. Complete END line: -----END OPENSSH PRIVATE KEY-----

# Re-add VPS_SSH_KEY secret in GitHub with complete key
```

### Issue: "Host key verification failed"

**Cause**: VPS host key not in GitHub Actions known_hosts

**Solution**: Add StrictHostKeyChecking=no to workflow (not recommended) or add host key scanning step:

```yaml
- name: Add VPS to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts
```

### Issue: "scp: /var/www/gameoflife: Permission denied"

**Cause**: Deploy user doesn't have write permissions to deployment directory

**Solution**:
```bash
# On VPS, fix permissions
sudo chown -R deploy:www-data /var/www/gameoflife
sudo chmod -R 755 /var/www/gameoflife

# Test write permissions
su - deploy
touch /var/www/gameoflife/test.txt
rm /var/www/gameoflife/test.txt
exit
```

### Issue: "Connection timed out"

**Cause**: Firewall blocking SSH port 22

**Solution**:
```bash
# On VPS, allow SSH
sudo ufw allow OpenSSH
sudo ufw status

# Should show: 22/tcp ALLOW
```

### Issue: GitHub Actions shows "Secret not found"

**Cause**: Secret name mismatch or not created

**Solution**:
- Check secret names are exactly: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_DEPLOY_PATH`
- Check secrets are created in repository (not organization)
- Check workflow file uses correct secret names: `${{ secrets.VPS_HOST }}`

## Security Best Practices

### Protect Private Key

- ✅ Never commit private key to repository
- ✅ Never share private key via email/chat
- ✅ Store only in GitHub Secrets (encrypted)
- ✅ Use separate key for deployment (not your personal SSH key)
- ✅ Rotate key periodically (every 6-12 months)

### Limit Key Permissions

**On VPS, restrict key to specific commands (optional):**

```bash
# Edit authorized_keys
nano ~/.ssh/authorized_keys

# Prepend restrictions to public key:
command="/usr/bin/rsync" ssh-ed25519 AAAAC3Nza...

# This limits the key to only run rsync command
# Prevents arbitrary command execution if key is compromised
```

### Monitor Access

```bash
# On VPS, monitor SSH logins
sudo tail -f /var/log/auth.log | grep sshd

# Look for:
# Accepted publickey for deploy from [GitHub Actions IP]
```

### Revoke Key if Compromised

```bash
# On VPS, remove public key from authorized_keys
ssh deploy@YOUR_VPS_IP
nano ~/.ssh/authorized_keys

# Delete the line with compromised public key
# Save and exit

# Generate new key pair and repeat setup process
```

## Key Rotation Procedure

Periodically rotate SSH keys for security:

### Step 1: Generate New Key Pair

```bash
# Generate new key
ssh-keygen -t ed25519 -C "github-actions-deploy-2024" -f ~/.ssh/gameoflife_deploy_new

# Test new key
ssh-copy-id -i ~/.ssh/gameoflife_deploy_new.pub deploy@YOUR_VPS_IP
ssh -i ~/.ssh/gameoflife_deploy_new deploy@YOUR_VPS_IP
```

### Step 2: Update GitHub Secret

```bash
# Display new private key
cat ~/.ssh/gameoflife_deploy_new

# Update VPS_SSH_KEY secret in GitHub with new key
```

### Step 3: Test Deployment

```bash
# Push to trigger deployment with new key
git commit --allow-empty -m "test: new SSH key"
git push origin main

# Monitor GitHub Actions to ensure deployment succeeds
```

### Step 4: Remove Old Key

```bash
# On VPS, remove old public key from authorized_keys
ssh deploy@YOUR_VPS_IP
nano ~/.ssh/authorized_keys

# Delete old key line, keep only new key
# Save and exit

# On local machine, remove old key files
rm ~/.ssh/gameoflife_deploy
rm ~/.ssh/gameoflife_deploy.pub
mv ~/.ssh/gameoflife_deploy_new ~/.ssh/gameoflife_deploy
mv ~/.ssh/gameoflife_deploy_new.pub ~/.ssh/gameoflife_deploy.pub
```

## Next Steps

After SSH setup is complete:

1. ✅ Test manual SSH connection: `ssh -i ~/.ssh/gameoflife_deploy deploy@VPS_IP`
2. ✅ Verify all 4 GitHub Secrets are configured
3. ✅ Push to main branch to trigger automated deployment
4. ✅ Monitor GitHub Actions workflow execution
5. ✅ Verify deployed site is accessible
6. ✅ Add deployment status badge to README
7. ✅ Document SSH key location for future reference

**Congratulations!** SSH authentication is configured for automated deployment.
