# Deployment Guide

This directory contains deployment configuration and documentation for deploying the Game of Life simulator to a VPS.

## Quick Start

### Automated Deployment (Recommended)

1. Configure GitHub Secrets (see `SSH_KEY_SETUP.md`)
2. Push to `main` branch
3. GitHub Actions automatically deploys to VPS

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Transfer files to VPS:
   ```bash
   scp -r dist/* deploy@YOUR_VPS_IP:/var/www/gameoflife/
   ```

3. Verify deployment:
   ```bash
   curl http://YOUR_VPS_IP
   ```

## Files in This Directory

- **nginx.conf** - Production nginx configuration template
- **VPS_SETUP.md** - Complete VPS setup instructions
- **SSH_KEY_SETUP.md** - SSH key configuration for GitHub Actions
- **TROUBLESHOOTING.md** - Common issues and solutions
- **README.md** - This file

## Deployment Architecture

```
GitHub Repository (main branch)
        ↓
GitHub Actions Workflow
        ↓
    Build Assets (npm run build → dist/)
        ↓
    SCP Transfer (dist/* → VPS)
        ↓
VPS Nginx Server (/var/www/gameoflife/)
        ↓
    Public Access (http://your-vps-ip)
```

## Prerequisites

Before deploying, ensure:

- ✅ VPS with Ubuntu 20.04+ or Debian 11+
- ✅ Nginx installed and running on VPS
- ✅ SSH access to VPS with deploy user
- ✅ GitHub repository with Actions enabled
- ✅ Domain name or public IP (optional but recommended)

## Initial Setup Steps

### 1. VPS Setup (First Time Only)

Follow the complete guide in `VPS_SETUP.md`:

```bash
# On your VPS
sudo apt update && sudo apt upgrade -y
sudo apt install nginx -y
sudo mkdir -p /var/www/gameoflife
sudo chown -R deploy:www-data /var/www/gameoflife
```

### 2. Nginx Configuration (First Time Only)

```bash
# Copy nginx config to VPS
scp deploy/nginx.conf deploy@YOUR_VPS_IP:/tmp/gameoflife.conf

# SSH into VPS and configure
ssh deploy@YOUR_VPS_IP
sudo mv /tmp/gameoflife.conf /etc/nginx/sites-available/gameoflife
sudo ln -s /etc/nginx/sites-available/gameoflife /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 3. GitHub Actions Setup (First Time Only)

Follow the complete guide in `SSH_KEY_SETUP.md`:

1. Generate SSH key pair
2. Add public key to VPS
3. Add secrets to GitHub repository:
   - `VPS_HOST` - Your VPS IP or domain
   - `VPS_USER` - SSH username (e.g., `deploy`)
   - `VPS_SSH_KEY` - Private SSH key content
   - `VPS_DEPLOY_PATH` - `/var/www/gameoflife`

### 4. Deploy

Push to `main` branch or run manual deployment:

```bash
git push origin main
```

GitHub Actions will automatically:
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run linter
4. ✅ Build production assets
5. ✅ Deploy to VPS via SCP
6. ✅ Verify deployment with health check

## Nginx Configuration Details

The `nginx.conf` template includes:

### Gzip Compression
- Reduces bundle size by 60-70%
- Applied to HTML, CSS, JS, JSON

### Asset Caching
- **Hashed assets** (`/assets/*`): 1 year cache (immutable)
- **index.html**: No cache (always fetch latest)

### Security Headers
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enable XSS filter
- `Referrer-Policy: no-referrer-when-downgrade` - Control referrer

### SPA Fallback
- All routes fallback to `index.html` for client-side routing

## SSL/TLS Configuration (Optional but Recommended)

To enable HTTPS with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d gameoflife.example.com

# Certbot automatically:
# - Obtains SSL certificate
# - Updates nginx config
# - Sets up auto-renewal
```

After obtaining certificate, the HTTPS server block in `nginx.conf` will be automatically configured by certbot.

## Rollback Procedure

If deployment fails or introduces bugs:

### Manual Rollback

```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

# Restore previous version (if backed up)
sudo rm -rf /var/www/gameoflife
sudo mv /var/www/gameoflife.backup /var/www/gameoflife

# Or deploy specific commit
git checkout <previous-commit-hash>
npm run build
scp -r dist/* deploy@YOUR_VPS_IP:/var/www/gameoflife/
```

### Automated Backup (Recommended)

Create pre-deployment backup in GitHub Actions:

```yaml
- name: Backup current deployment
  run: |
    ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
      "cp -r /var/www/gameoflife /var/www/gameoflife.backup"
```

## Monitoring and Maintenance

### Check Deployment Status

```bash
# GitHub Actions badge
https://github.com/USERNAME/REPO/workflows/Deploy%20to%20VPS/badge.svg

# Check if site is accessible
curl -I http://YOUR_VPS_IP
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Disk Space

```bash
# Check disk usage
df -h /var/www/gameoflife

# Expected: ~1-2 MB for production build
```

### Update Nginx Configuration

```bash
# Edit configuration
sudo nano /etc/nginx/sites-available/gameoflife

# Test configuration
sudo nginx -t

# Reload if valid
sudo systemctl reload nginx
```

## Troubleshooting

For common issues and solutions, see `TROUBLESHOOTING.md`.

Quick checks:

```bash
# Is nginx running?
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Check file permissions
ls -la /var/www/gameoflife

# Test SSH connection
ssh deploy@YOUR_VPS_IP
```

## Performance Optimization

The deployment includes:

- ✅ Gzip compression (60-70% size reduction)
- ✅ Asset caching (1 year for hashed assets)
- ✅ HTTP/2 support (if HTTPS enabled)

Expected performance:
- **Page load**: <2s on broadband
- **Bundle size**: 50-70 KB (gzipped)
- **Lighthouse score**: 90+ performance

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured in nginx
- [ ] SSH key authentication (no password login)
- [ ] Firewall configured (UFW or iptables)
- [ ] Fail2ban installed for SSH protection (optional)
- [ ] Automatic security updates enabled (optional)

## Next Steps

After initial deployment:

1. ✅ Test all game features on deployed site
2. ✅ Run Lighthouse audit for performance/security
3. ✅ Set up monitoring (UptimeRobot, etc.)
4. ✅ Configure custom domain (if not using IP)
5. ✅ Enable HTTPS with Let's Encrypt
6. ✅ Share live demo URL with users

## Support

- **GitHub Issues**: Report deployment issues
- **Documentation**: See `.ai/tech-stack.md` for architecture
- **Logs**: Check GitHub Actions logs for deployment errors
