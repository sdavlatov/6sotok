#!/bin/bash
# Восстановить БД из дампа
set -e

DUMP_FILE="/home/sdavlatov/projects/6sotok/scripts/db-dump.sql"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Файл дампа не найден: $DUMP_FILE"
  exit 1
fi

echo "Восстанавливаю БД из дампа..."
docker exec -i postgres psql -U postgres sixsotok < "$DUMP_FILE"
echo "Готово!"
