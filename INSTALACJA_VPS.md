# Instalacja Zakupomat na VPS

Instrukcja dla domeny: **zakupomat.anslan.pl**

---

## KROK 1: Przygotowanie serwera

Zaloguj się na VPS jako root i zainstaluj wymagane pakiety:

```bash
apt update
apt upgrade -y
apt install -y python3 python3-pip python3-venv apache2 mysql-server git curl
```

Zainstaluj Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Włącz moduły Apache:

```bash
a2enmod proxy proxy_http rewrite headers
systemctl restart apache2
```

---

## KROK 2: Konfiguracja MySQL

Zaloguj się do MySQL:

```bash
mysql
```

Wykonaj te komendy w MySQL (zmień hasło na własne):

```sql
CREATE DATABASE zakupomat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zakupomat'@'localhost' IDENTIFIED BY 'WPISZ_TUTAJ_SILNE_HASLO';
GRANT ALL PRIVILEGES ON zakupomat.* TO 'zakupomat'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Zapisz sobie hasło!**

---

## KROK 3: Przesłanie plików na serwer

Na swoim komputerze lokalnym wykonaj:

```bash
scp -r /Users/slawek/Code/Zakupomat/* root@ADRES_IP_VPS:/var/www/zakupomat/
```

Lub jeśli katalog nie istnieje, najpierw na VPS:

```bash
mkdir -p /var/www/zakupomat
```

---

## KROK 4: Konfiguracja backendu

Na VPS:

```bash
cd /var/www/zakupomat/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Utwórz plik `.env` (zamień hasło na to z kroku 2):

```bash
nano .env
```

Wpisz jedną linię:

```
DATABASE_URL=mysql+pymysql://zakupomat:WPISZ_TUTAJ_SILNE_HASLO@localhost/zakupomat
```

Zapisz: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## KROK 5: Utworzenie pierwszego konta (rodziny)

Będąc nadal w katalogu backend z aktywnym venv:

```bash
python create_household.py --name "Nazwa Twojej Rodziny" --url "https://zakupomat.anslan.pl"
```

**Zapisz wyświetlony kod dostępu i link!**

Wyjdź z venv:

```bash
deactivate
```

---

## KROK 6: Budowanie frontendu

```bash
cd /var/www/zakupomat/frontend
npm install
npm run build
```

---

## KROK 7: Ustawienie uprawnień

```bash
chown -R www-data:www-data /var/www/zakupomat
```

---

## KROK 8: Konfiguracja systemd (backend jako usługa)

Skopiuj plik service:

```bash
cp /var/www/zakupomat/deploy/zakupomat.service /etc/systemd/system/
```

Uruchom usługę:

```bash
systemctl daemon-reload
systemctl enable zakupomat
systemctl start zakupomat
```

Sprawdź czy działa:

```bash
systemctl status zakupomat
```

Powinieneś zobaczyć "active (running)".

---

## KROK 9: Konfiguracja Apache

Skopiuj konfigurację:

```bash
cp /var/www/zakupomat/deploy/zakupomat.conf /etc/apache2/sites-available/
```

Włącz stronę:

```bash
a2ensite zakupomat.conf
a2dissite 000-default.conf
```

Sprawdź konfigurację:

```bash
apachectl configtest
```

Powinno pokazać "Syntax OK".

Zrestartuj Apache:

```bash
systemctl restart apache2
```

---

## KROK 10: SSL z Certbot

Zainstaluj certbot:

```bash
apt install -y certbot python3-certbot-apache
```

Uzyskaj certyfikat:

```bash
certbot --apache -d zakupomat.anslan.pl
```

Postępuj zgodnie z instrukcjami (podaj email, zaakceptuj warunki).

---

## KROK 11: Test

Otwórz w przeglądarce:

```
https://zakupomat.anslan.pl
```

Zaloguj się kodem z kroku 5.

---

## Przydatne komendy

```bash
# Status backendu
systemctl status zakupomat

# Restart backendu
systemctl restart zakupomat

# Logi backendu
journalctl -u zakupomat -f

# Logi Apache
tail -f /var/log/apache2/zakupomat_error.log

# Restart Apache
systemctl restart apache2

# Tworzenie nowego konta
cd /var/www/zakupomat/backend
source venv/bin/activate
python create_household.py --name "Inna Rodzina" --url "https://zakupomat.anslan.pl"
deactivate
```

---

## Aktualizacja w przyszłości

1. Prześlij nowe pliki przez scp
2. Na VPS:

```bash
cd /var/www/zakupomat/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd /var/www/zakupomat/frontend
npm install
npm run build

chown -R www-data:www-data /var/www/zakupomat
systemctl restart zakupomat
systemctl restart apache2
```
