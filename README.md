# Zakupomat 🛒

Aplikacja PWA do zarządzania listami zakupów dla rodziny z synchronizacją w czasie rzeczywistym.

## ✨ Funkcje

- 📱 **PWA** - instaluj jak natywną aplikację na telefonie
- 🔄 **Synchronizacja Real-time** - zmiany widoczne natychmiast u wszystkich członków rodziny
- 🔗 **Udostępnianie przez link** - łatwe dodawanie członków rodziny przez jeden klik
- 🎯 **Tryb zakupowy** - zaznaczaj produkty podczas zakupów
- 📦 **Baza produktów** - kolejność według układu w sklepie
- 🚀 **Szybkie dodawanie** - masowe uzupełnianie listy
- 🔒 **Bezpieczne** - każda rodzina ma swój własny kod dostępu

## 🚀 Szybka instalacja na VPS

Gotowa aplikacja w 5 minut! Zobacz [QUICKSTART.md](QUICKSTART.md)

Lub pełna instrukcja krok po kroku: [INSTALLATION.md](INSTALLATION.md)

## 📋 Wymagania

- Python 3.10+
- Node.js 18+
- MySQL/MariaDB
- Apache2 (dla produkcji)

## Instalacja lokalna (development)

### 1. Backend

```bash
cd backend

# Utwórz wirtualne środowisko
python -m venv venv
source venv/bin/activate  # Linux/Mac
# lub: venv\Scripts\activate  # Windows

# Zainstaluj zależności
pip install -r requirements.txt

# Skopiuj i skonfiguruj .env
cp .env.example .env
# Edytuj .env i ustaw DATABASE_URL

# Utwórz bazę danych
mysql -u root -p -e "CREATE DATABASE zakupomat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Uruchom serwer
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend

# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev
```

Aplikacja będzie dostępna pod adresem http://localhost:5173

### 3. Utwórz rodzinę (konto)

```bash
cd backend
source venv/bin/activate

# Z linkiem do udostępnienia:
python create_household.py --name "Rodzina Kowalskich" --url "http://localhost:5173"

# Zapisz wyświetlony kod dostępu i link!
```

## 🌐 Instalacja na produkcji (VPS)

**Szybka instalacja:** Przejdź do [QUICKSTART.md](QUICKSTART.md) - instalacja w 5 minut!

**Pełna instrukcja:** Zobacz [INSTALLATION.md](INSTALLATION.md) - szczegółowa instrukcja krok po kroku

### Gotowe pliki konfiguracyjne

Wszystkie potrzebne pliki są w katalogu `deploy/`:
- `zakupomat.service` - systemd service dla backendu
- `zakupomat.conf` - konfiguracja Apache2
- `deploy.sh` - skrypt do łatwych aktualizacji

## 📱 Użycie

### Logowanie
- Wpisz kod dostępu LUB
- Użyj linku udostępniającego (automatyczne logowanie)

### Zakładki
- **📋 Lista** - dodawaj produkty do listy zakupów
- **✅ Uzupełnij** - szybkie masowe dodawanie produktów
- **🛒 Zakupy** - tryb zakupowy z checkboxami
- **📦 Produkty** - zarządzaj bazą produktów, ustaw kolejność według sklepu

### Udostępnianie dostępu
W zakładce **Produkty** kliknij przycisk "Udostępnij dostęp" - link zostanie skopiowany do schowka. Wyślij go członkom rodziny!

## 📲 Instalacja PWA na telefonie

### iPhone
1. Otwórz aplikację w Safari
2. Kliknij ikonę "Udostępnij" (kwadrat ze strzałką)
3. Wybierz "Dodaj do ekranu początkowego"
4. Potwierdź i kliknij "Dodaj"

### Android
1. Otwórz aplikację w Chrome
2. Kliknij menu (⋮)
3. Wybierz "Dodaj do ekranu głównego"
4. Potwierdź

## 🔧 Zarządzanie

### Tworzenie nowych rodzin (kont)
```bash
cd /var/www/zakupomat/backend
source venv/bin/activate
python create_household.py --name "Nowa Rodzina" --url "https://twoja-domena.com"
```

### Aktualizacja aplikacji
```bash
cd /var/www/zakupomat
git pull  # lub scp nowe pliki
./deploy/deploy.sh
```

### Backup bazy danych
```bash
mysqldump -u zakupomat -p zakupomat > backup_$(date +%Y%m%d).sql
```

## 🛠️ Technologie

- **Backend:** FastAPI, SQLAlchemy, MySQL, SSE (Server-Sent Events)
- **Frontend:** React, Vite, React Router, DnD Kit
- **Deploy:** Apache2, systemd, Let's Encrypt

## 📄 Licencja

Projekt prywatny
