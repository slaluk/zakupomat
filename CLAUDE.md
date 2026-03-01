# CLAUDE.md — Zakupomat

## O projekcie

Zakupomat to PWA (Progressive Web App) do zarządzania listą zakupów dla rodzin. Backend w **FastAPI + MySQL**, frontend w **React + Vite**. Komunikacja real-time przez **SSE (Server-Sent Events)**. Każda rodzina (household) ma swój klucz dostępu — pełna izolacja danych między rodzinami.

---

## Szybki start

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev    # dev server na http://localhost:5173
```

### Komendy pomocnicze
```bash
# Frontend
npm run build  # build produkcyjny → dist/
npm run lint   # ESLint

# Tworzenie nowej rodziny (konta)
cd backend && source venv/bin/activate
python create_household.py --name "Kowalsccy" --url "https://domena.com"
```

> Dev: Vite proxy przekierowuje `/api` → `http://localhost:8000`, więc frontend i backend działają osobno.

---

## Struktura projektu

```
zakupomat/
├── backend/
│   ├── main.py              # FastAPI app + CORS + rejestracja routerów
│   ├── config.py            # Settings: DATABASE_URL z .env
│   ├── database.py          # SQLAlchemy engine, SessionLocal, Base
│   ├── models.py            # ORM: Household, Product, ShoppingItem
│   ├── schemas.py           # Pydantic schemas (walidacja request/response)
│   ├── create_household.py  # CLI do zakładania rodzin (alternatywa do /register)
│   ├── default_products.py  # Lista domyślnych produktów (wspólna dla CLI i API)
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── auth.py          # POST /auth/login, POST /auth/register + get_current_household()
│       ├── products.py      # CRUD produktów + reorder
│       ├── shopping.py      # CRUD listy zakupów
│       └── sse.py           # SSE endpoint + notify_change()
└── frontend/src/
    ├── App.jsx              # Router + state (products, shoppingItems) + SSE
    ├── api/
    │   └── client.js        # Fetch wrapper z X-Access-Key; wszystkie wywołania API
    ├── components/
    │   ├── Login.jsx              # logowanie kluczem dostępu
    │   ├── Register.jsx           # /register — tworzenie nowej rodziny + link do udostępnienia
    │   ├── ShoppingList.jsx     # / — dodawanie do listy zakupów + filtrowanie listy przez wyszukiwarkę
    │   ├── BulkAdd.jsx          # /bulk — masowe zaznaczanie produktów
    │   ├── ShoppingMode.jsx     # /shopping — tryb zakupowy z checkboxami
    │   ├── ProductManager.jsx   # /products — zarządzanie bazą produktów (drag-drop)
    │   ├── ProductSearch.jsx    # wyszukiwarka produktów / custom item + callback filtrowania listy
    │   └── BottomNav.jsx        # dolna nawigacja
    └── hooks/
        └── useSSE.js        # Custom hook SSE przez fetch() (obsługa X-Access-Key)
```

---

## Autentykacja

Każda rodzina ma losowy klucz dostępu. Na serwerze trzymany jest tylko SHA256 hash.

**Flow:**
1. Klucz trzymany w `localStorage.getItem('accessKey')`
2. Każde żądanie dodaje nagłówek `X-Access-Key: <klucz>`
3. Backend: `get_current_household()` (`routes/auth.py:16`) sprawdza hash → zwraca `Household`
4. Każdy chroniony endpoint deklaruje: `household: Household = Depends(get_current_household)`
5. Przy odpowiedzi 401: `client.js` automatycznie czyści localStorage i przeładowuje stronę

**Rejestracja nowej rodziny:**
- `POST /api/auth/register` — tworzy household + domyślne produkty, zwraca `access_key` w plaintext
- Frontend: `/register` → formularz z nazwą rodziny → wyświetla link do skopiowania/udostępnienia
- `Register.jsx` buduje link z `window.location.origin` (nie hardcoded domena)
- Przycisk "Udostępnij" używa Web Share API (widoczny na mobile)

**Kluczowe miejsca:**
- `backend/routes/auth.py` — dependency `get_current_household()`, endpointy login i register
- `backend/default_products.py` — lista domyślnych produktów (wspólna dla CLI i API)
- `frontend/src/api/client.js` — fetch wrapper z nagłówkiem + `register()`
- `frontend/src/App.jsx` — `hasAccessKey()` steruje widokiem; `/register` dostępny bez logowania

---

## Real-time (SSE)

Backend utrzymuje w pamięci słownik kolejek `asyncio.Queue` per rodzina (`routes/sse.py:15`). Klienci subskrybują `/api/sse`. Po każdej mutacji bazy należy powiadomić klientów.

### Wywołanie po mutacji (backend)
```python
from routes.sse import notify_change

await notify_change(household.id, "products_updated")   # zmiana produktów
await notify_change(household.id, "shopping_updated")   # zmiana listy zakupów
```

Zawsze `async def` przy endpointach wywołujących `notify_change`.

### Obsługa na frontendzie
SSE działa globalnie w `App.jsx:40-44`. Przy `products_updated` lub `shopping_updated` wywołuje `fetchData()`, który odświeża `products` i `shoppingItems`. Nowe typy zdarzeń wystarczy obsłużyć w `handleSSEUpdate` w `App.jsx`.

> `useSSE.js` używa `fetch()` zamiast natywnego `EventSource`, bo `EventSource` nie obsługuje custom headers. Automatyczny reconnect po 3s.

---

## Baza danych

### Modele (`backend/models.py`)

| Model | Tabela | Kluczowe pola |
|-------|--------|---------------|
| `Household` | `households` | `id`, `access_key_hash` (SHA256), `name` |
| `Product` | `products` | `id`, `household_id` (FK), `name`, `sort_order`, `is_new` (bool, default true) |
| `ShoppingItem` | `shopping_items` | `id`, `household_id` (FK), `product_id` (FK, nullable), `custom_name`, `quantity`, `note`, `is_checked`, `sort_order` |

- `Product.sort_order` — odzwierciedla układ produktów w sklepie; użytkownik sortuje drag-dropem
- `ShoppingItem.product_id` jest nullable — ale w praktyce zawsze ustawiony (custom_name jest auto-tworzony jako produkt przy dodawaniu do listy)

### Brak systemu migracji

Tabele tworzone przez `Base.metadata.create_all()` w `main.py:8` przy starcie. Nowe kolumny wymagają ręcznego `ALTER TABLE` w MySQL, a następnie restartu backendu.

### Multi-tenancy

Każde zapytanie musi być filtrowane po `household_id`. Wzorzec z `routes/products.py:19`:
```python
db.query(Product).filter(Product.household_id == household.id).all()
```

---

## Jak dodać nową funkcję

### Nowy endpoint (przykład: `PATCH /shopping/{id}/priority`)

**1. Model** — jeśli potrzebne nowe pole w tabeli (`models.py`):
```python
priority = Column(Integer, default=0)
```
Potem ręczny `ALTER TABLE shopping_items ADD COLUMN priority INT DEFAULT 0;` w MySQL.

**2. Schema** — request i/lub response (`schemas.py`):
```python
class ShoppingItemPriorityRequest(BaseModel):
    priority: int
```

**3. Endpoint** — w odpowiednim pliku `routes/`:
```python
@router.patch("/{item_id}/priority", response_model=ShoppingItemResponse)
async def set_item_priority(
    item_id: int,
    request: ShoppingItemPriorityRequest,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db)
):
    db_item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.household_id == household.id  # zawsze filtruj po household!
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db_item.priority = request.priority
    db.commit()
    db.refresh(db_item)

    await notify_change(household.id, "shopping_updated")
    return item_to_response(db_item)
```

**4. Rejestracja routera** — tylko gdy dodajesz NOWY plik routes (`main.py`):
```python
app.include_router(new_feature.router, prefix="/api")
```

**5. API client** (`frontend/src/api/client.js`):
```javascript
export async function setItemPriority(id, priority) {
  return request(`/shopping/${id}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
}
```

**6. Komponent** — zaimportuj z `client.js`, wywołaj, potem `onRefresh()`:
```javascript
import { setItemPriority } from '../api/client';
// ...
await setItemPriority(item.id, 1);
onRefresh();  // odświeża dane z API przez App.jsx
```

### Nowy widok (zakładka)

1. Utwórz komponent w `frontend/src/components/NazwaWidoku.jsx`
2. Dodaj `<Route path="/sciezka" element={<NazwaWidoku ... />} />` w `App.jsx`
3. Przekaż potrzebne props: `products`, `shoppingItems`, `onRefresh`
4. Dodaj pozycję do `BottomNav.jsx`

---

## Filtrowanie listy zakupów przez wyszukiwarkę

Wyszukiwarka produktów (`ProductSearch`) pełni podwójną rolę:
1. **Podpowiedzi produktów** — dropdown z produktami z bazy pasującymi do zapytania (bez tych już na liście)
2. **Filtrowanie listy zakupów** — jednoczesne filtrowanie wyświetlanej listy zakupów poniżej

### Mechanizm
- `ProductSearch` przyjmuje prop `onSearchChange` — callback wywoływany przy każdej zmianie tekstu w polu
- `ShoppingList` trzyma stan `searchQuery` i filtruje `sortedItems` wzorcem `%query%` (case-insensitive)
- Dopasowane nazwy produktów są podświetlane komponentem `HighlightMatch` (tag `<mark>`)
- Wskaźnik "Pokazano X z Y produktów" wyświetla się gdy filtr jest aktywny

### Reset filtra
- Automatycznie: po wybraniu produktu z dropdown, po dodaniu custom produktu (query się czyści)
- Ręcznie: przycisk "×" w polu wyszukiwania (`search-clear-btn`)

### Klasy CSS
- `.search-clear-btn` — przycisk czyszczenia w polu wyszukiwania
- `.filter-indicator` — pasek informujący o aktywnym filtrze
- `.search-highlight` — podświetlenie dopasowanego tekstu (`<mark>`)

---

## Konwencje kodu

### Backend (Python)
- `snake_case` — funkcje, zmienne, pola modeli, nazwy plików
- Dependency injection dla db i auth — zawsze `Depends(get_db)` i `Depends(get_current_household)`
- `async def` dla endpointów wywołujących `notify_change`, `def` dla read-only
- Pydantic schemas dla każdego request/response — nie parsuj JSON ręcznie
- Filtry po `household_id` we wszystkich zapytaniach

### Frontend (JavaScript/React)
- `camelCase` — funkcje, zmienne, props
- `PascalCase` — komponenty React (nazwa pliku i funkcji)
- Stan globalny (`products`, `shoppingItems`) żyje w `App.jsx`, przekazywany props-drilling
- Odświeżanie danych przez `onRefresh()` callback — nie trzymaj lokalnych kopii danych
- Wszystkie wywołania API przez `api/client.js` — nigdy `fetch()` bezpośrednio w komponentach

---

## Zmienne środowiskowe

Tylko jedna: `DATABASE_URL` w `backend/.env`.

Domyślna (hardcoded w `backend/config.py`):
```
DATABASE_URL=mysql+pymysql://zakupomat:123frytki@localhost/zakupomat
```

Produkcja: skopiuj `backend/.env.example` → `backend/.env` i ustaw właściwe dane.

---

## Komendy produkcyjne (VPS)

```bash
# Restart backendu
sudo systemctl restart zakupomat

# Logi backendu (live)
sudo journalctl -u zakupomat -f

# Build frontendu
cd /var/www/zakupomat/frontend && npm run build

# Pełny deploy (git pull + build + restart)
cd /var/www/zakupomat && ./deploy/deploy.sh

# Backup bazy danych
mysqldump -u zakupomat -p zakupomat > backup_$(date +%Y%m%d).sql
```

---

## Dokumentacja API

Pełna lista endpointów z przykładami: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

Interaktywna dokumentacja (tylko dev): http://localhost:8000/docs (Swagger UI generowany przez FastAPI)
