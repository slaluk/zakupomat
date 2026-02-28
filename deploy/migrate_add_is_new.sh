#!/bin/bash
# Migracja: dodanie kolumny is_new do tabeli products
# Użycie: sudo bash deploy/migrate_add_is_new.sh
#
# Istniejące produkty dostaną is_new=FALSE (już uporządkowane).
# Nowe produkty tworzone przez aplikację dostaną is_new=TRUE (z ORM).

set -e

DB_NAME="zakupomat2"
DB_USER="zakupomat2"

echo "=== Migracja: products.is_new ==="
echo ""

# Sprawdź czy kolumna już istnieje
COLUMN_EXISTS=$(sudo mysql -u "$DB_USER" -p "$DB_NAME" -N -e \
  "SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='products' AND COLUMN_NAME='is_new';")

if [ "$COLUMN_EXISTS" -eq 1 ]; then
  echo "Kolumna 'is_new' już istnieje — pomijam."
else
  echo "Dodaję kolumnę 'is_new' do tabeli 'products'..."
  sudo mysql -u "$DB_USER" -p "$DB_NAME" -e \
    "ALTER TABLE products ADD COLUMN is_new BOOLEAN NOT NULL DEFAULT FALSE;"
  echo "Kolumna dodana."
fi

echo ""
echo "=== Restart backendu ==="
sudo systemctl restart zakupomat
echo "Backend zrestartowany."

echo ""
echo "Gotowe!"
