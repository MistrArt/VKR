# UralTour — платформа для путешествий по Уралу

React-приложение для туризма в Екатеринбурге: каталог мест, экскурсий и ресторанов, конструктор маршрутов, бронирование и личные кабинеты туриста, партнёра и администратора.

## Запуск локально

**Требования:** Node.js 18+, бэкенд Travel Ecosystem на порту `8080` (Spring Boot + Postgres)

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Скопируйте `.env.example` → `.env.local` и настройте ключи Яндекса (см. раздел [Карты](#карты)).
3. Запустите API (если есть `docker-compose.yml` с бэкендом):
   ```bash
   docker compose up -d
   ```
4. Запустите dev-сервер (проксирует `/api` → `http://localhost:8080`):
   ```bash
   npm run dev
   ```
5. Откройте в браузере: http://localhost:3000

Без бэкенда каталог и часть функций работают на локальных мок-данных.

## Карты

Интерактивные карты — **Яндекс.Карты JavaScript API 2.1** через [`@pbe/react-yandex-maps`](https://www.npmjs.com/package/@pbe/react-yandex-maps). HTTP-запросы (геокодер, саджест, маршруты) — отдельные ключи в `src/maps/api/`.

### Переменные окружения (`.env.local`)

| Переменная | Назначение |
|------------|------------|
| `VITE_YANDEX_MAPS_API_KEY` | **Обязательно** — JavaScript API 2.1 (виджеты `Map`, кластеры) |
| `VITE_YANDEX_SUGGEST_API_KEY` | Геосаджест в полях адреса (`suggest_apikey` + HTTP suggest) |
| `VITE_YANDEX_GEOCODER_API_KEY` | HTTP Геокодер (`geocode-maps.yandex.ru`) |
| `VITE_YANDEX_ROUTER_API_KEY` | Router + Distance Matrix (опционально, можно = геокодер) |
| `VITE_YANDEX_GEO_PROXY` | `true` — гео-HTTP через `/api/geo/*` на бэкенде (см. `docs/geo-proxy-spring.md`) |

Шаблон — в [.env.example](.env.example).

### Какие API включить в [developer.tech.yandex.ru](https://developer.tech.yandex.ru)

Для полного функционала сайта:

1. **JavaScript API и HTTP Геокодер** — карты, геокодирование адресов.
2. **Геосаджест** — подсказки адресов в конструкторе маршрутов и кабинете партнёра.
3. **Маршрутизация (Router)** — построение маршрута на карте.
4. **Distance Matrix** — оптимизация порядка точек маршрута.

MapKit (мобильный SDK) для этого Vite-проекта **не нужен**.

### Ограничение Referer (важно)

Ключ **JavaScript API** привязывается к домену страницы. В кабинете Яндекса укажите:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- домен продакшена (например `https://your-domain.ru`)

Без совпадения Referer карта не инициализируется — в интерфейсе будет сообщение о неверном ключе (не пустой экран). HTTP-ключи геокодера/роутера ограничивают по IP или отдельным правилам кабинета — см. документацию пакета.

### Состояния карты в UI

`MapShell` показывает скелетон загрузки, понятную ошибку (нет ключа / неверный ключ / сеть / лимит) и кнопку **Повторить**. Полноэкранный режим — `ExpandableMap` (Escape, focus trap, `prefers-reduced-motion`).

### Прокси гео-запросов на бэкенд

Чтобы не светить HTTP-ключи в браузере и обойти CORS, включите `VITE_YANDEX_GEO_PROXY=true` и реализуйте Spring-прокси по черновику [docs/geo-proxy-spring.md](docs/geo-proxy-spring.md).

### TODO: ymaps3 / React 19

Сейчас используется API 2.1 + `@pbe/react-yandex-maps`. На React 19 явных блокирующих багов в проекте не зафиксировано. При появлении проблем с загрузкой модулей или Strict Mode — рассмотреть миграцию на [Yandex Maps API 3](https://yandex.ru/maps-api/docs/js-api/index.html) (`@yandex/ymaps3`). До этого миграцию не планируем.

## Сборка

```bash
npm run build
npm run preview
npm run lint
```

## Тестовые аккаунты

На странице `/auth` можно войти под ролями **турист**, **партнёр** или **администратор** — данные сохраняются в `localStorage`.
