# Deployment Troubleshooting Guide

Common issues and solutions for deploying Game of Life to VPS.

## Table of Contents

- [GitHub Actions Issues](#github-actions-issues)
- [SSH Connection Issues](#ssh-connection-issues)
- [Nginx Issues](#nginx-issues)
- [File Permission Issues](#file-permission-issues)
- [SSL/TLS Issues](#ssltls-issues)
- [Performance Issues](#performance-issues)
- [Debugging Commands](#debugging-commands)

---

## GitHub Actions Issues

### Workflow Not Triggering

**Symptom**: Push to main branch doesn't trigger deployment workflow

**Diagnosis**:
```bash
# Check if workflow file exists
ls -la .github/workflows/deploy.yml

# Check workflow syntax
cat .github/workflows/deploy.yml
```

**Solutions**:
1. Ensure workflow file is in `.github/workflows/deploy.yml`
2. Check YAML syntax is valid (use online YAML validator)
3. Verify trigger is set to `push` on `main` branch
4. Check repository has GitHub Actions enabled (Settings → Actions)
5. Ensure you pushed to `main` branch (not another branch)

---

### "Permission denied (publickey)" Error

**Symptom**: GitHub Actions fails at "Deploy to VPS via SCP" step with permission denied

**Diagnosis**:
```bash
# Check GitHub Actions log for exact error
# Look for: "Permission denied (publickey)"
```

**Solutions**:

1. **Verify SSH key secret is complete**
   ```bash
   # Re-copy private key including BEGIN/END lines
   cat ~/.ssh/gameoflife_deploy

   # Must include:
   -----BEGIN OPENSSH PRIVATE KEY-----
   [key content]
   -----END OPENSSH PRIVATE KEY-----
   ```

2. **Update VPS_SSH_KEY secret**
   - Go to GitHub repository Settings → Secrets → Actions
   - Edit VPS_SSH_KEY
   - Paste complete private key (no extra spaces)

3. **Test SSH manually**
   ```bash
   # From local machine
   ssh -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP

   # Should connect without password
   # If fails, fix VPS SSH setup first
   ```

4. **Check public key is on VPS**
   ```bash
   # On VPS
   cat ~/.ssh/authorized_keys

   # Should contain public key matching your private key
   ```

---

### "Host key verification failed" Error

**Symptom**: GitHub Actions fails with "Host key verification failed"

**Solution**: Add host key scanning step to workflow:

```yaml
- name: Add VPS to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

- name: Deploy to VPS via SCP
  # ... (existing SCP step)
```

Or add `StrictHostKeyChecking=no` to SCP command (less secure):

```yaml
- name: Deploy to VPS via SCP
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    source: "dist/*"
    target: ${{ secrets.VPS_DEPLOY_PATH }}
    strip_components: 1
    overwrite: true
    rm: false
    # Add SSH options
    ssh_args: "-o StrictHostKeyChecking=no"
```

---

### "Secret not found" Error

**Symptom**: GitHub Actions fails with "secret not found" or empty value

**Diagnosis**:
```yaml
# Check workflow uses correct secret names
${{ secrets.VPS_HOST }}      # Correct
${{ secrets.VPS_HOST_NAME }} # Wrong - secret doesn't exist
```

**Solutions**:

1. **Verify all 4 secrets exist**
   - Go to GitHub repository Settings → Secrets → Actions
   - Should see: VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_DEPLOY_PATH

2. **Check secret names match exactly**
   - Secret names are case-sensitive
   - Must match workflow file exactly

3. **Ensure secrets are in repository (not organization)**
   - Secrets must be in repository settings
   - Not organization settings (unless workflow configured for org secrets)

---

### Build Fails (Linter Errors)

**Symptom**: GitHub Actions fails at "Run linter" step

**Diagnosis**:
```bash
# Run linter locally
npm run lint

# Should show same errors as GitHub Actions
```

**Solutions**:

1. **Fix linting errors locally**
   ```bash
   npm run lint:fix
   git add .
   git commit -m "fix: linting errors"
   git push origin main
   ```

2. **Disable linter temporarily** (not recommended):
   ```yaml
   # Comment out linter step in .github/workflows/deploy.yml
   # - name: Run linter
   #   run: npm run lint
   ```

---

### Health Check Fails

**Symptom**: Deployment succeeds but health check step fails

**Diagnosis**:
```bash
# Manually test health check
curl -I http://YOUR_VPS_IP

# Check HTTP status code
# 200 = OK
# 404 = Not Found (nginx config issue)
# 502 = Bad Gateway (nginx not running)
# Connection refused = Firewall or nginx not running
```

**Solutions**:

1. **Check nginx is running**
   ```bash
   ssh deploy@YOUR_VPS_IP "sudo systemctl status nginx"
   ```

2. **Check nginx config is valid**
   ```bash
   ssh deploy@YOUR_VPS_IP "sudo nginx -t"
   ```

3. **Check files were deployed**
   ```bash
   ssh deploy@YOUR_VPS_IP "ls -la /var/www/gameoflife"
   # Should see index.html and assets/
   ```

4. **Increase health check delay**
   ```yaml
   - name: Health check
     run: |
       sleep 10  # Increase from 5 to 10 seconds
       # ... (rest of health check)
   ```

---

## SSH Connection Issues

### Cannot Connect to VPS

**Symptom**: `ssh deploy@VPS_IP` times out or connection refused

**Diagnosis**:
```bash
# Test SSH connection with verbose output
ssh -v deploy@YOUR_VPS_IP

# Check if SSH port is open
nc -zv YOUR_VPS_IP 22
```

**Solutions**:

1. **Check VPS is running**
   - Log in via VPS provider web console
   - Ensure VPS is powered on

2. **Check firewall allows SSH**
   ```bash
   # On VPS (via web console)
   sudo ufw status

   # Should show: 22/tcp ALLOW
   # If not, allow SSH:
   sudo ufw allow OpenSSH
   ```

3. **Check SSH service is running**
   ```bash
   # On VPS
   sudo systemctl status ssh

   # If not running:
   sudo systemctl start ssh
   sudo systemctl enable ssh
   ```

---

### SSH Key Not Working

**Symptom**: SSH prompts for password instead of using key

**Diagnosis**:
```bash
# Test with verbose output
ssh -v -i ~/.ssh/gameoflife_deploy deploy@YOUR_VPS_IP

# Look for:
# "Offering public key: ..." - Key is being tried
# "Authentications that can continue: publickey,password" - Key rejected
```

**Solutions**:

1. **Check private key file permissions**
   ```bash
   ls -la ~/.ssh/gameoflife_deploy

   # Should be: -rw------- (600)
   # If not, fix:
   chmod 600 ~/.ssh/gameoflife_deploy
   ```

2. **Check public key is on VPS**
   ```bash
   # On VPS
   cat ~/.ssh/authorized_keys

   # Should contain line starting with:
   # ssh-ed25519 AAAAC3... or ssh-rsa AAAAB3...
   ```

3. **Check authorized_keys permissions**
   ```bash
   # On VPS
   ls -la ~/.ssh/

   # Should be:
   # drwx------ (700) for .ssh/
   # -rw------- (600) for authorized_keys

   # If not, fix:
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

4. **Check VPS SSH configuration**
   ```bash
   # On VPS
   sudo grep -E "PubkeyAuthentication|AuthorizedKeysFile" /etc/ssh/sshd_config

   # Should show:
   # PubkeyAuthentication yes
   # AuthorizedKeysFile .ssh/authorized_keys

   # If not, edit and restart SSH:
   sudo nano /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

---

## Nginx Issues

### 404 Not Found

**Symptom**: Visiting `http://VPS_IP` shows 404 Not Found

**Diagnosis**:
```bash
# Check nginx error log
ssh deploy@YOUR_VPS_IP "sudo tail -20 /var/log/nginx/error.log"

# Check if files exist
ssh deploy@YOUR_VPS_IP "ls -la /var/www/gameoflife"
```

**Solutions**:

1. **Check files were deployed**
   ```bash
   ssh deploy@YOUR_VPS_IP "ls -la /var/www/gameoflife"

   # Should show:
   # index.html
   # assets/ (directory with .js and .css files)

   # If missing, deploy manually:
   npm run build
   scp -r dist/* deploy@YOUR_VPS_IP:/var/www/gameoflife/
   ```

2. **Check nginx root path**
   ```bash
   # On VPS
   sudo grep -E "root|server_name" /etc/nginx/sites-available/gameoflife

   # Should show:
   # root /var/www/gameoflife;
   # server_name YOUR_DOMAIN_OR_IP;
   ```

3. **Check nginx site is enabled**
   ```bash
   # On VPS
   ls -la /etc/nginx/sites-enabled/

   # Should show symlink to gameoflife
   # If not:
   sudo ln -s /etc/nginx/sites-available/gameoflife /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```

---

### Nginx Won't Start

**Symptom**: `sudo systemctl status nginx` shows "failed" or "inactive"

**Diagnosis**:
```bash
# Test nginx configuration
sudo nginx -t

# Check error log
sudo tail -20 /var/log/nginx/error.log

# Check if port 80 is already in use
sudo netstat -tlnp | grep :80
```

**Solutions**:

1. **Fix nginx configuration syntax**
   ```bash
   # Test config
   sudo nginx -t

   # If errors, edit config:
   sudo nano /etc/nginx/sites-available/gameoflife

   # Common issues:
   # - Missing semicolon ;
   # - Mismatched braces { }
   # - Invalid directive
   ```

2. **Check port 80 not in use**
   ```bash
   # Check what's using port 80
   sudo netstat -tlnp | grep :80

   # If another process, stop it:
   sudo systemctl stop apache2  # If Apache is running
   ```

3. **Restart nginx**
   ```bash
   sudo systemctl restart nginx
   sudo systemctl status nginx
   ```

---

### Static Assets Not Loading (404)

**Symptom**: HTML loads but CSS/JS files return 404

**Diagnosis**:
```bash
# Check browser DevTools console
# Look for: "Failed to load resource: 404 Not Found" for /assets/*.js

# Check if assets directory exists
ssh deploy@YOUR_VPS_IP "ls -la /var/www/gameoflife/assets/"
```

**Solutions**:

1. **Verify assets were deployed**
   ```bash
   # On VPS
   ls -la /var/www/gameoflife/assets/

   # Should show .js and .css files
   # If missing, check deployment copied dist/ contents correctly
   ```

2. **Check asset paths in index.html**
   ```bash
   # On VPS
   grep -E "src=|href=" /var/www/gameoflife/index.html

   # Should show paths like:
   # /assets/index-abc123.js
   # /assets/index-abc123.css
   ```

3. **Check nginx serves static files**
   ```bash
   # Test directly
   curl -I http://YOUR_VPS_IP/assets/index-abc123.js

   # Should return: HTTP/1.1 200 OK
   # If 404, check nginx location blocks
   ```

---

## File Permission Issues

### "Permission denied" During Deployment

**Symptom**: SCP fails with "Permission denied" when copying files

**Diagnosis**:
```bash
# Check deployment directory permissions
ssh deploy@YOUR_VPS_IP "ls -la /var/www/"

# Check if deploy user can write
ssh deploy@YOUR_VPS_IP "touch /var/www/gameoflife/test.txt"
```

**Solutions**:

1. **Fix directory ownership**
   ```bash
   # On VPS
   sudo chown -R deploy:www-data /var/www/gameoflife
   ```

2. **Fix directory permissions**
   ```bash
   # On VPS
   sudo chmod -R 755 /var/www/gameoflife
   ```

3. **Verify deploy user is in www-data group**
   ```bash
   # On VPS
   id deploy

   # Should show: groups=...,33(www-data)
   # If not:
   sudo usermod -aG www-data deploy
   ```

---

### Nginx Shows "Permission denied" in Error Log

**Symptom**: Nginx error log shows "Permission denied" for files

**Diagnosis**:
```bash
# Check nginx error log
sudo tail -20 /var/log/nginx/error.log

# Look for:
# "open() failed (13: Permission denied)"
```

**Solutions**:

1. **Check file permissions allow nginx to read**
   ```bash
   # On VPS
   ls -la /var/www/gameoflife/

   # Files should be readable by others (755 for directories, 644 for files)
   # If not:
   sudo chmod -R 755 /var/www/gameoflife
   sudo find /var/www/gameoflife -type f -exec chmod 644 {} \;
   ```

2. **Check nginx user has access**
   ```bash
   # Check nginx runs as www-data
   ps aux | grep nginx

   # Should show:
   # www-data nginx: worker process
   ```

---

## SSL/TLS Issues

### Certbot Fails to Obtain Certificate

**Symptom**: `sudo certbot --nginx` fails with error

**Diagnosis**:
```bash
# Check certbot error message
# Common errors:
# - Domain doesn't point to VPS IP
# - Port 80 not accessible
# - Nginx config invalid
```

**Solutions**:

1. **Verify domain points to VPS**
   ```bash
   # Check DNS resolution
   nslookup gameoflife.example.com

   # Should return your VPS IP
   # If not, update DNS A record
   ```

2. **Ensure port 80 is accessible**
   ```bash
   # On VPS
   sudo ufw allow 80/tcp

   # Test externally
   curl -I http://gameoflife.example.com
   ```

3. **Check nginx config is valid**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### SSL Certificate Expired

**Symptom**: Browser shows "Certificate expired" warning

**Diagnosis**:
```bash
# Check certificate expiry
sudo certbot certificates

# Look for: Expiry Date: (date in past)
```

**Solutions**:

1. **Renew certificate manually**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Check auto-renewal is working**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run

   # Check renewal timer
   sudo systemctl status certbot.timer

   # Should show: Active: active (waiting)
   # If not:
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

---

## Performance Issues

### Site Loads Slowly

**Symptom**: Page takes >5 seconds to load

**Diagnosis**:
```bash
# Check file sizes
ssh deploy@YOUR_VPS_IP "du -sh /var/www/gameoflife/assets/*"

# Test with curl timing
curl -o /dev/null -s -w "Time: %{time_total}s\n" http://YOUR_VPS_IP
```

**Solutions**:

1. **Verify gzip compression is enabled**
   ```bash
   # Check response headers
   curl -I -H "Accept-Encoding: gzip" http://YOUR_VPS_IP

   # Should show:
   # Content-Encoding: gzip

   # If not, check nginx config:
   sudo grep -A5 "gzip" /etc/nginx/sites-available/gameoflife
   ```

2. **Check asset caching headers**
   ```bash
   # Check cache headers for assets
   curl -I http://YOUR_VPS_IP/assets/index-abc123.js

   # Should show:
   # Cache-Control: public, immutable
   # Expires: (1 year in future)
   ```

3. **Optimize build**
   ```bash
   # Ensure production build is used
   npm run build

   # Check bundle size
   ls -lh dist/assets/

   # JS bundle should be ~50-70 KB gzipped
   ```

---

### Game Runs Slowly (Low FPS)

**Symptom**: Simulation runs at <10 FPS with few entities

**Diagnosis**:
```bash
# Check browser console for errors
# Check browser DevTools Performance tab

# This is likely a client-side issue, not deployment issue
```

**Solutions**:

1. **Clear browser cache**
   - Hard reload: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Ensure latest JS bundle is loaded

2. **Check for JavaScript errors**
   - Open browser DevTools console
   - Look for errors preventing game loop from running

3. **Test on different browser**
   - Test on Chrome (primary target)
   - Compare performance with local dev build

---

## Debugging Commands

### Quick Health Check

```bash
# Run all these commands to diagnose deployment
ssh deploy@YOUR_VPS_IP << 'EOF'
  echo "=== Nginx Status ==="
  sudo systemctl status nginx --no-pager

  echo -e "\n=== Nginx Config Test ==="
  sudo nginx -t

  echo -e "\n=== Deployment Files ==="
  ls -lah /var/www/gameoflife/ | head -20

  echo -e "\n=== Disk Usage ==="
  df -h /var/www/gameoflife

  echo -e "\n=== Recent Nginx Errors ==="
  sudo tail -10 /var/log/nginx/error.log

  echo -e "\n=== Firewall Status ==="
  sudo ufw status
EOF
```

### Test Full Deployment Manually

```bash
# Build
npm run build

# Deploy
scp -r dist/* deploy@YOUR_VPS_IP:/var/www/gameoflife/

# Verify
curl -I http://YOUR_VPS_IP

# Check in browser
# http://YOUR_VPS_IP
```

### View GitHub Actions Logs

1. Go to repository on GitHub
2. Click **Actions** tab
3. Click on failed workflow
4. Click on "build-and-deploy" job
5. Expand failed step to see error details

### Enable Nginx Debug Logging

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/gameoflife

# Add to server block:
error_log /var/log/nginx/gameoflife-error.log debug;

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# View debug log
sudo tail -f /var/log/nginx/gameoflife-error.log
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Check GitHub Actions logs** for exact error message
2. **Check nginx error logs** on VPS: `sudo tail -20 /var/log/nginx/error.log`
3. **Test SSH manually** from local machine
4. **Verify all 4 GitHub Secrets** are configured correctly
5. **Review deployment checklist** in `VPS_SETUP.md`

**Common mistakes:**
- Missing BEGIN/END lines in VPS_SSH_KEY secret
- Wrong VPS_DEPLOY_PATH (should be `/var/www/gameoflife`)
- File permissions not set correctly (should be 755 for dirs, 644 for files)
- Nginx config not enabled (no symlink in sites-enabled/)
- Firewall blocking HTTP (port 80)

**Still need help?**
- Open GitHub issue with error logs
- Include: GitHub Actions log, nginx error log, steps to reproduce
