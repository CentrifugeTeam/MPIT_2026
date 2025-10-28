# 🧪 Тестовые файлы для Generator Service

Набор тестовых данных для проверки работы generator-service.

## 📁 Структура

```
files/
├── simple/              # Простой пример (6 полей)
│   ├── json_schema.json
│   ├── xsd_schema.xsd
│   ├── test_data.json
│   └── expected_output.vm
├── medium/              # Средний пример (18 полей, вложенная структура)
│   ├── json_schema.json
│   ├── xsd_schema.xsd
│   └── test_data.json
└── complex/             # Сложный пример (31 поле, глубокая вложенность)
    ├── json_schema.json
    ├── xsd_schema.xsd
    └── test_data.json
```

---

## 🎯 Примеры использования

### Simple - Регистрация персональных данных

**Описание:** Базовый пример с 6 полями (ФИО, дата рождения, email, телефон)

**Ожидаемые маппинги:**
- `lastName` → `FamilyName` (confidence: ~0.87)
- `firstName` → `GivenName` (confidence: ~0.82)
- `middleName` → `Patronymic` (confidence: ~0.75)
- `birthDate` → `DateOfBirth` (confidence: ~0.78)
- `email` → `EmailAddress` (confidence: ~0.91)
- `phone` → `PhoneNumber` (confidence: ~0.85)

**Тест через curl:**

```bash
# 1. Прочитать файлы
JSON_SCHEMA=$(cat doc/test/files/simple/json_schema.json | jq -c .)
XSD_SCHEMA=$(cat doc/test/files/simple/xsd_schema.xsd | sed 's/"/\\"/g' | tr -d '\n')
TEST_DATA=$(cat doc/test/files/simple/test_data.json | jq -c .)

# 2. Отправить запрос
curl -X POST "http://localhost:8005/api/complete/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"json_schema_content\": \"$JSON_SCHEMA\",
    \"xsd_schema_content\": \"$XSD_SCHEMA\",
    \"test_data\": $TEST_DATA,
    \"include_preview\": true
  }" | jq .
```

---

### Medium - Заявление на услугу с адресом

**Описание:** Средний пример с 18 полями, включая вложенную структуру (ApplicantInfo, PassportData, Address, ContactInfo)

**Особенности:**
- Вложенные элементы в XSD (complexType внутри complexType)
- Разные типы данных (string, date)
- Опциональные поля (middleName, apartment)

**Ожидаемые маппинги:**
- `applicantLastName` → `Surname` (confidence: ~0.85)
- `passportSeries` → `Series` (confidence: ~0.90)
- `region` → `Region` (confidence: 1.0)
- `city` → `City` (confidence: 1.0)
- `contactEmail` → `Email` (confidence: ~0.95)

**Тест:**

```bash
# Python скрипт для удобного тестирования
python3 doc/test/test_generator.py medium
```

---

### Complex - Регистрация ИП

**Описание:** Реалистичный пример с 31 полем, глубокая вложенность (PersonalData, IdentityDocument, RegistrationAddress, BusinessActivities)

**Особенности:**
- Множественные вложенные уровни
- Массив элементов (BusinessActivities.Activity)
- Сложные составные элементы (SeriesNumber внутри IdentityDocument)
- ОКВЭД коды и бизнес-логика

**Сложные маппинги:**
- `surname` → `LastName` (confidence: ~0.92)
- `passportSerial` → `Series` (внутри SeriesNumber → внутри IdentityDocument)
- `activityCode1` → `OKVEDCode` (внутри Activity)
- `taxSystem` → `SystemType` (внутри TaxationSystem)

**Тест:**

```bash
python3 doc/test/test_generator.py complex
```

---

## 🚀 Быстрый тест всех примеров

### Вариант 1: Через Swagger UI

1. Откройте http://localhost:8005/docs
2. Найдите endpoint `POST /api/complete/generate`
3. Нажмите "Try it out"
4. Скопируйте содержимое файлов в соответствующие поля
5. Нажмите "Execute"

### Вариант 2: Через Python скрипт

```bash
# Установить зависимости
pip install requests

# Запустить тесты
python3 doc/test/test_all.py
```

### Вариант 3: Через curl (вручную)

**Simple example:**
```bash
curl -X POST "http://localhost:8005/api/complete/generate" \
  -H "Content-Type: application/json" \
  -d @doc/test/payloads/simple_payload.json | jq .
```

**Medium example:**
```bash
curl -X POST "http://localhost:8005/api/complete/generate" \
  -H "Content-Type: application/json" \
  -d @doc/test/payloads/medium_payload.json | jq .
```

**Complex example:**
```bash
curl -X POST "http://localhost:8005/api/complete/generate" \
  -H "Content-Type: application/json" \
  -d @doc/test/payloads/complex_payload.json | jq .
```

---

## 📊 Ожидаемые результаты

### Simple Example

**Успех если:**
- ✅ Total mapped: 6
- ✅ Total unmapped: 0
- ✅ All confidence scores > 0.75
- ✅ Generated template contains all 6 variables
- ✅ Preview output is valid XML

**Пример ответа:**
```json
{
  "success": true,
  "parsed_json": {
    "total_fields": 6
  },
  "parsed_xsd": {
    "total_elements": 7,
    "root_element": "Person"
  },
  "mappings": [
    {
      "json_field_id": "lastName",
      "xml_element_name": "FamilyName",
      "confidence_score": 0.87
    }
  ],
  "template": "##\n## VM Template...",
  "preview_output": "<Person>...</Person>",
  "validation": {
    "is_valid": true
  }
}
```

### Medium Example

**Успех если:**
- ✅ Total mapped: 16-18 (зависит от качества маппинга)
- ✅ Correctly mapped nested structures (ApplicantInfo, Address, etc.)
- ✅ Generated template has proper hierarchy
- ✅ Preview output matches XSD structure

### Complex Example

**Успех если:**
- ✅ Total mapped: 28-31
- ✅ Correctly handles deep nesting (3+ levels)
- ✅ Properly maps array elements (BusinessActivities)
- ✅ Complex paths correctly generated
- ✅ All business logic fields mapped

---

## 🔍 Проверка качества маппинга

### Метрики качества:

| Пример  | Полей | Ожидаемый mapping rate | Min confidence | Avg confidence |
|---------|-------|------------------------|----------------|----------------|
| Simple  | 6     | 100% (6/6)            | 0.75           | 0.85           |
| Medium  | 18    | 90%+ (16+/18)         | 0.70           | 0.82           |
| Complex | 31    | 85%+ (26+/31)         | 0.65           | 0.78           |

### Проблемные маппинги (требуют внимания):

**Simple:**
- `middleName` → `Patronymic` (может быть низкий score из-за разных корней слов)

**Medium:**
- `applicantLastName` → `Surname` (разные термины)
- `postalCode` → `PostalCode` (может быть exact match)

**Complex:**
- `patronymic` → `MiddleName` (разная терминология)
- `activityCode1` → `OKVEDCode` (специфичное название)
- `taxSystem` → `SystemType` (короткое название)

---

## 🐛 Отладка

### Низкий confidence score

Если маппинг имеет низкий confidence score (<0.7):

1. Проверьте нормализацию имен
2. Проверьте labels в JSON схеме
3. Проверьте descriptions в XSD схеме
4. Отрегулируйте `MIN_CONFIDENCE_SCORE` в настройках

### Несопоставленные поля

Если есть unmapped fields:

1. Проверьте названия полей (могут быть совсем разные)
2. Добавьте labels с понятными названиями
3. Используйте ручное сопоставление через API

### Неправильная иерархия в шаблоне

Если структура XML неправильная:

1. Проверьте XSD схему (правильно ли указаны parent элементы)
2. Проверьте parsing XSD (корректно ли извлечены элементы)
3. Проверьте генератор (правильно ли строится иерархия)

---

## 📚 Дополнительные ресурсы

- **API документация:** http://localhost:8005/docs
- **Примеры API:** [generator-service/API_EXAMPLES.md](../../generator-service/API_EXAMPLES.md)
- **Архитектура:** [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Quick start:** [QUICKSTART.md](../../QUICKSTART.md)

---

## 💡 Создание своих тестовых файлов

### Шаблон JSON Schema:
```json
{
  "version": "1.0",
  "service_name": "Название услуги",
  "fields": [
    {
      "id": "fieldId",
      "label": "Человеко-читаемое название",
      "type": "string",
      "required": true,
      "description": "Описание поля"
    }
  ]
}
```

### Шаблон XSD Schema:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="RootElement">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="ElementName" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

---

**Готово к тестированию! 🚀**

