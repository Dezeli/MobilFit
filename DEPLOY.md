# MobilFit Deployment

## Current Request Flow

`cloudflared` routes `mobilfit.kr` and `www.mobilfit.kr` to `127.0.0.1:8001`. The host port is bound by `mobilfit_nginx`, which serves `/static/` directly from `/app/mobilfit_backend/staticfiles/` and proxies `/` to `mobilfit_web:8000`. Django runs behind gunicorn and uses the `mobilfit_db` PostgreSQL container.

Current production compose intentionally keeps `127.0.0.1:8001:80` until a central nginx migration is completed.

## Nginx Notes

`nginx/default.prod.conf` currently:

- serves `mobilfit.kr` and `www.mobilfit.kr`
- serves `/static/` from `/app/mobilfit_backend/staticfiles/`
- serves `/media/` from `/app/mobilfit_backend/media/`
- handles `/.well-known/assetlinks.json` separately
- proxies `/` to `http://web:8000`
- sends `X-Forwarded-Proto https` to Django
- adds permissive CORS headers in nginx
- does not define websocket upgrade headers

## Environment

Create the real `.env` from `.env.example` and keep it out of git. Required production keys include Django settings, secret key, PostgreSQL credentials, allowed hosts, CSRF trusted origins, email settings, and `ORS_API_KEY`.

## Deploy

From the parent directory:

```bash
docker-compose -f MobilFit/docker-compose.prod.yml config
docker-compose -f MobilFit/docker-compose.prod.yml up -d --build
docker-compose -f MobilFit/docker-compose.prod.yml ps
```

From this repository root:

```bash
docker-compose -f docker-compose.prod.yml config
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml ps
```

## Logs

```bash
docker-compose -f MobilFit/docker-compose.prod.yml logs -f nginx
docker-compose -f MobilFit/docker-compose.prod.yml logs -f web
docker-compose -f MobilFit/docker-compose.prod.yml logs -f db
```

## Manual Restart

```bash
docker-compose -f MobilFit/docker-compose.prod.yml restart
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
```

## Backup

Backups should be written outside git, for example:

```bash
cd /home/dezeli/MobilFit
scripts/backup.sh
```

The backup template writes to `/home/dezeli/backups/mobilfit/YYYYMMDD-HHMMSS/` and includes:

- PostgreSQL dump from `mobilfit_db`
- `.env`
- `nginx/default.prod.conf`
- media volume or media directory archive

Do not commit real `.env` files, dumps, media archives, or backup directories.

## Restore

1. Restore `.env`.
2. Restore the PostgreSQL dump into the `db` service.
3. Restore media into the `media_data` volume or `mobilfit_backend/media`.
4. Rebuild and start services:

```bash
docker-compose -f MobilFit/docker-compose.prod.yml up -d --build
docker-compose -f MobilFit/docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < /path/to/mobilfit_db.dump
```

## Verification

Before committing locally:

```bash
docker-compose -f MobilFit/docker-compose.prod.yml config
```

After pulling on the server:

```bash
docker-compose -f MobilFit/docker-compose.prod.yml up -d --build
docker-compose -f MobilFit/docker-compose.prod.yml ps
curl -I https://mobilfit.kr
curl -I https://www.mobilfit.kr
curl -I https://mobilfit.kr/static/
```

Recommended commit message:

```text
chore(mobilfit): add deployment safety baseline
```
