# Deployment

## Quick Deploy

```bash
# Local development
npm run deploy            # or: ./deploy.sh local

# Production
npm run deploy:prod       # or: ./deploy.sh production
```

## Local Development Setup

1. Ensure Caddy volume mounted:
   ```bash
   ls /Volumes/Container/caddy/www/
   ```

2. Add Caddyfile.local to local Caddy:
   ```bash
   # Copy contents to /Volumes/Container/caddy/etc/Caddyfile
   # Or add: import /www/pixi-glass.jurrejan.com/Caddyfile.local
   ```

3. Reload local Caddy:
   ```bash
   docker exec caddy caddy reload
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Visit: https://pixi-glass.jurrejan.com

## Production Setup (First Time Only)

1. Add to /Volumes/Container/caddy/etc/Caddyfile:
   ```
   import /var/www/pixi-glass.jurrejan.com/*.caddy
   ```

2. Validate and apply:
   ```bash
   ssh nas "docker exec caddy-porkbun caddy validate --config /etc/caddy/Caddyfile"
   cd /Volumes/Container/caddy/etc && ./apply_from_mac.sh
   ```

3. Deploy:
   ```bash
   npm run deploy:prod
   ```

## Path Mapping

### Local Development
| Location | Path |
|----------|------|
| Host machine (macOS) | `/Volumes/Container/caddy/www/pixi-glass.jurrejan.com/` |
| Inside container | `/www/pixi-glass.jurrejan.com/` |

### Production
| Location | Path |
|----------|------|
| NAS server | `/var/www/pixi-glass.jurrejan.com/` |
| Caddy config | `/var/www/pixi-glass.jurrejan.com/pixi-glass.jurrejan.com.caddy` |

## Troubleshooting

### Local Development

**Volume not mounted:**
```bash
docker ps
ls /Volumes/Container/caddy/www/
```

**Site not loading:**
- Verify Caddyfile added to Caddy config
- Reload: `docker exec caddy caddy reload`
- Check logs: `docker logs caddy`

### Production

**Validation fails:**
```bash
ssh nas "docker exec caddy-porkbun caddy validate --config /etc/caddy/Caddyfile"
```

**Site not loading:**
- Check main Caddyfile has import: `import /var/www/pixi-glass.jurrejan.com/*.caddy`
- Verify .caddy exists on NAS: `ssh nas "ls /var/www/pixi-glass.jurrejan.com/"`
- Check logs: `ssh nas "docker logs caddy-porkbun"`

**Deploy fails:**
- Verify SSH access: `ssh nas "echo OK"`
- Check apply script: `cd /Volumes/Container/caddy/etc && ls apply_from_mac.sh`
