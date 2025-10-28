# Generator Service - Stateless Architecture

## Важно!

Generator Service **НЕ ИМЕЕТ базы данных** - это stateless сервис.

### Почему нет БД?

1. **Stateless by design** - не хранит состояние между запросами
2. **Pure computation** - только вычисления (парсинг, маппинг, генерация)
3. **Easy scaling** - можно запустить N инстансов без проблем с синхронизацией
4. **No side effects** - один и тот же запрос всегда даёт один результат

### Что хранится в БД других сервисов?

- **Маппинги** → `projects-service` (таблица `field_mappings`)
- **VM шаблоны** → `files-service` (файлы + метаданные)
- **Исходные схемы** → `files-service` (JSON/XSD файлы)

### Flow работы

```
1. BFF загружает JSON/XSD из files-service
                ↓
2. BFF отправляет в generator-service (stateless!)
                ↓
3. Generator возвращает маппинги + VM шаблон
                ↓
4. BFF сохраняет маппинги в projects-service
                ↓
5. BFF сохраняет VM шаблон в files-service
```

### Преимущества

- ⚡ **Быстрое масштабирование** - просто добавь инстансов
- 🔄 **Нет проблем с миграциями БД**
- 💪 **Высокая надёжность** - нет single point of failure
- 🎯 **Простое тестирование** - pure functions
- 🚀 **Идемпотентность** - одинаковый input → одинаковый output

### API Endpoints

Все endpoints работают без состояния:

- `POST /api/complete/generate` - полный цикл генерации
- `POST /api/parse/json` - парсинг JSON схемы
- `POST /api/parse/xsd` - парсинг XSD схемы
- `POST /api/map/auto` - автоматический маппинг
- `POST /api/generate/template` - генерация VM шаблона
- `POST /api/validate/template` - валидация шаблона

Подробнее см. [api/complete.md](./api/complete.md)

