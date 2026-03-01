# API Reference — Zakupomat

Wszystkie endpointy (poza `/auth/login`, `/auth/register` i `/health`) wymagają nagłówka:
```
X-Access-Key: <klucz_dostępu>
```

Base URL dev: `http://localhost:8000/api`
Interaktywna dokumentacja (Swagger): http://localhost:8000/docs

---

## Auth

### POST /auth/login

Weryfikuje klucz dostępu. Nie wymaga nagłówka `X-Access-Key`.

**Request body:**
```json
{ "access_key": "twoj-klucz-dostepu" }
```

**Response (sukces):**
```json
{ "success": true, "household_name": "Kowalsccy" }
```

**Response (błędny klucz):**
```json
{ "success": false, "household_name": null }
```

---

### POST /auth/register

Tworzy nową rodzinę (household) z domyślną bazą produktów. Nie wymaga nagłówka `X-Access-Key`.

**Request body:**
```json
{ "name": "Kowalsccy" }
```

**Response:**
```json
{ "access_key": "abc123def456", "household_name": "Kowalsccy" }
```

`access_key` jest zwracany w plaintext — frontend buduje z niego link udostępniający: `{origin}/?key={access_key}`.

**Błędy:**
- `400` — nazwa rodziny jest pusta

**Uwagi:**
- Automatycznie dodaje ~89 domyślnych produktów z `default_products.py` (z `is_new=False`)
- Klucz jest 12-znakowy, losowy (lowercase + cyfry), na serwerze przechowywany jako SHA256

---

## Products

### GET /products

Zwraca wszystkie produkty rodziny, posortowane rosnąco po `sort_order`.

**Response:**
```json
[
  { "id": 1, "name": "Mleko", "sort_order": 1, "created_at": "2024-01-01T10:00:00" },
  { "id": 2, "name": "Chleb", "sort_order": 2, "created_at": "2024-01-01T10:00:00" }
]
```

---

### POST /products

Tworzy nowy produkt. Automatycznie dodawany na końcu listy (`sort_order = max + 1`).

**Request body:**
```json
{ "name": "Masło" }
```

**Response:** nowy produkt (jak w GET)

**Błędy:**
- `400` — produkt o tej nazwie już istnieje

**SSE:** wyzwala `products_updated`

---

### PUT /products/reorder

Zmienia kolejność wyświetlania produktów.

**Request body:**
```json
{ "product_ids": [3, 1, 5, 2, 4] }
```

Kolejność ID w tablicy = nowa kolejność `sort_order`. Tablica musi zawierać wszystkie ID produktów rodziny.

**Response:** pełna lista produktów po zmianie kolejności

**SSE:** wyzwala `products_updated`

---

### PUT /products/{id}

Aktualizuje nazwę produktu.

**Request body:**
```json
{ "name": "Nowa nazwa" }
```

**Response:** zaktualizowany produkt

**Błędy:**
- `404` — produkt nie znaleziony (lub należy do innej rodziny)
- `400` — produkt o tej nazwie już istnieje

**SSE:** wyzwala `products_updated`

---

### DELETE /products/{id}

Usuwa produkt z bazy produktów.

**Response:**
```json
{ "success": true }
```

**Błędy:**
- `400` — produkt jest na liście zakupów (najpierw usuń z listy przez `DELETE /shopping/{id}`)

**SSE:** wyzwala `products_updated`

---

## Shopping

### GET /shopping

Zwraca listę zakupów rodziny (niesortowana — sortowanie po stronie klienta według `product_sort_order`).

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 3,
    "custom_name": null,
    "quantity": "2 kg",
    "note": "ekologiczne",
    "is_checked": false,
    "sort_order": null,
    "created_at": "2024-01-01T10:00:00",
    "product_name": "Jabłka",
    "product_sort_order": 5
  }
]
```

Pola `product_name` i `product_sort_order` są denormalizowane z tabeli produktów dla wygody klienta.

---

### POST /shopping

Dodaje pozycję do listy zakupów.

**Request body (produkt z bazy):**
```json
{ "product_id": 3, "quantity": "1 l", "note": null }
```

**Request body (własna nazwa):**
```json
{ "custom_name": "Specjalny ser", "quantity": "200 g" }
```

> Uwaga: jeśli `custom_name` nie istnieje jeszcze jako produkt w bazie, zostaje automatycznie utworzony (wyzwala dodatkowo `products_updated`). Jeśli już istnieje — produkt jest wiązany po nazwie.

**Response:** nowa pozycja na liście (jak w GET /shopping)

**Błędy:**
- `400` — produkt już jest na liście zakupów
- `400` — nie podano ani `product_id` ani `custom_name`
- `404` — `product_id` nie znaleziony (lub należy do innej rodziny)

**SSE:** wyzwala `shopping_updated` (i opcjonalnie `products_updated`)

---

### PUT /shopping/{id}

Aktualizuje ilość lub notatkę pozycji na liście.

**Request body** (oba pola opcjonalne):
```json
{ "quantity": "3 szt", "note": "duże i dojrzałe" }
```

**Response:** zaktualizowana pozycja

**Błędy:**
- `404` — pozycja nie znaleziona

**SSE:** wyzwala `shopping_updated`

---

### PUT /shopping/{id}/check

Ustawia status zaznaczenia (odznaczenia) pozycji podczas zakupów.

**Request body:**
```json
{ "is_checked": true }
```

**Response:** zaktualizowana pozycja

**Błędy:**
- `404` — pozycja nie znaleziona

**SSE:** wyzwala `shopping_updated`

---

### DELETE /shopping/{id}

Usuwa pozycję z listy zakupów. Nie usuwa produktu z bazy.

**Response:**
```json
{ "success": true }
```

**Błędy:**
- `404` — pozycja nie znaleziona

**SSE:** wyzwala `shopping_updated`

---

### POST /shopping/clear

Czyści listę zakupów.

**Request body:**
```json
{ "keep_unchecked": false }
```

- `keep_unchecked: false` — usuwa wszystkie pozycje z listy
- `keep_unchecked: true` — usuwa tylko zaznaczone (odhaczyć można na ekranie zakupów)

**Response:**
```json
{ "success": true }
```

**SSE:** wyzwala `shopping_updated`

---

## SSE (Real-time)

### GET /sse

Otwiera strumień Server-Sent Events dla real-time synchronizacji między urządzeniami rodziny.

**Wymagane nagłówki:**
```
X-Access-Key: <klucz>
Accept: text/event-stream
```

> Implementacja klienta używa `fetch()` zamiast natywnego `EventSource` (który nie obsługuje custom headers). Patrz `frontend/src/hooks/useSSE.js`.

**Zdarzenia:**

| Event | Data | Opis |
|-------|------|------|
| `connected` | `{"status": "connected"}` | Potwierdzenie połączenia |
| `update` | `{"type": "products_updated", "data": {}}` | Zmiana bazy produktów |
| `update` | `{"type": "shopping_updated", "data": {}}` | Zmiana listy zakupów |
| `ping` | `""` | Keep-alive co 30s (ignoruj) |

Po otrzymaniu `products_updated` lub `shopping_updated` klient powinien odświeżyć dane przez `GET /products` i `GET /shopping`.

---

## Health

### GET /health

Sprawdza stan serwera. Nie wymaga autentykacji.

**Response:**
```json
{ "status": "ok" }
```
