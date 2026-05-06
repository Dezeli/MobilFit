#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/dezeli/MobilFit}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/dezeli/backups/mobilfit}"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/docker-compose.prod.yml}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${BACKUP_ROOT}/${STAMP}"

mkdir -p "${DEST}"

docker-compose -f "${COMPOSE_FILE}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "${DEST}/mobilfit_db.dump"

if [ -f "${PROJECT_DIR}/.env" ]; then
    cp "${PROJECT_DIR}/.env" "${DEST}/.env"
fi

if [ -f "${PROJECT_DIR}/nginx/default.prod.conf" ]; then
    mkdir -p "${DEST}/nginx"
    cp "${PROJECT_DIR}/nginx/default.prod.conf" "${DEST}/nginx/default.prod.conf"
fi

if docker volume inspect mobilfit_media_data >/dev/null 2>&1; then
    docker run --rm \
        -v mobilfit_media_data:/media:ro \
        -v "${DEST}:/backup" \
        alpine tar -czf /backup/media.tar.gz -C /media .
elif [ -d "${PROJECT_DIR}/mobilfit_backend/media" ]; then
    tar -czf "${DEST}/media.tar.gz" -C "${PROJECT_DIR}/mobilfit_backend/media" .
fi

printf 'Backup written to %s\n' "${DEST}"
