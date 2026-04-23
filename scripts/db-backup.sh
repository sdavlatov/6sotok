#!/bin/bash
# Дамп БД и коммит в git
set -e

REPO="/home/sdavlatov/projects/6sotok"
DUMP_FILE="$REPO/scripts/db-dump.sql"

echo "Создаю дамп БД..."
docker exec postgres pg_dump -U postgres sixsotok > "$DUMP_FILE"

echo "Коммичу..."
cd "$REPO"
git add scripts/db-dump.sql
git commit -m "db: backup $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "Готово! Дамп сохранён в git."
