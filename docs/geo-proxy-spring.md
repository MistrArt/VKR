# Прокси гео-API Яндекса (черновик для Spring / ВКР)

Фронтенд при `VITE_YANDEX_GEO_PROXY=true` обращается к `/api/geo/{service}?…` (см. `src/maps/api/client.ts`).  
Ключи `VITE_YANDEX_*` остаются **только на сервере** — в браузер не попадают.

## Endpoints (черновик)

| Метод | Путь | Проксирует |
|-------|------|------------|
| GET | `/api/geo/geocode` | `https://geocode-maps.yandex.ru/v1/` |
| GET | `/api/geo/suggest` | `https://suggest-maps.yandex.ru/v1/suggest` |
| GET | `/api/geo/route` | `https://api.routing.yandex.net/v2/route` |
| GET | `/api/geo/matrix` | `https://api.routing.yandex.net/v2/distancematrix` |

Query-параметры клиента пробрасываются как есть; сервер подставляет `apikey` из `application.yml` / переменных окружения.

## Интерфейс сервиса (Java)

```java
public interface YandexGeoProxyService {
  ResponseEntity<String> geocode(MultiValueMap<String, String> query);
  ResponseEntity<String> suggest(MultiValueMap<String, String> query);
  ResponseEntity<String> route(MultiValueMap<String, String> query);
  ResponseEntity<String> distanceMatrix(MultiValueMap<String, String> query);
}
```

## Контроллер (скелет)

```java
@RestController
@RequestMapping("/api/geo")
public class GeoProxyController {

  private final YandexGeoProxyService proxy;

  public GeoProxyController(YandexGeoProxyService proxy) {
    this.proxy = proxy;
  }

  @GetMapping("/geocode")
  public ResponseEntity<String> geocode(@RequestParam MultiValueMap<String, String> params) {
    return proxy.geocode(params);
  }

  @GetMapping("/suggest")
  public ResponseEntity<String> suggest(@RequestParam MultiValueMap<String, String> params) {
    return proxy.suggest(params);
  }

  @GetMapping("/route")
  public ResponseEntity<String> route(@RequestParam MultiValueMap<String, String> params) {
    return proxy.route(params);
  }

  @GetMapping("/matrix")
  public ResponseEntity<String> matrix(@RequestParam MultiValueMap<String, String> params) {
    return proxy.distanceMatrix(params);
  }
}
```

## Реализация (заметки)

- `RestClient` / `WebClient` → upstream URL + `apikey` из `yandex.geocoder-key`, `yandex.suggest-key`, `yandex.router-key`.
- Ответ — JSON как у Яндекса (`Content-Type: application/json`), статус пробрасывать (429 → лимит).
- CORS: разрешить origin фронтенда; для продакшена — только свой домен.
- Rate limiting / кэш саджеста — по желанию для ВКР.
- **Не** проксировать JavaScript API карт — он по-прежнему грузится в браузере с `VITE_YANDEX_MAPS_API_KEY` и Referer.

## application.yml (пример)

```yaml
yandex:
  geocoder-api-key: ${YANDEX_GEOCODER_API_KEY}
  suggest-api-key: ${YANDEX_SUGGEST_API_KEY}
  router-api-key: ${YANDEX_ROUTER_API_KEY}
```
