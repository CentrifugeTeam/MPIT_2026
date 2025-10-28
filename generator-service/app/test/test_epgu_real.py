#!/usr/bin/env python3
"""
Тест generator-service на реальных данных ЕПГУ

Этот скрипт тестирует работу сервиса на файлах госуслуг:
- JSON схема услуги (18k строк)
- XSD схема ведомства
"""

import json
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.services.json_parser import JsonSchemaParser
from app.services.xsd_parser import XsdSchemaParser
from app.services.field_mapper import FieldMapper
from app.services.vm_generator import VmTemplateGenerator


def read_file(file_path: str) -> str:
    """Чтение файла"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def print_separator():
    """Красивый разделитель"""
    print("\n" + "="*80 + "\n")


def test_json_parsing():
    """Тест парсинга JSON схемы ЕПГУ"""
    print("🔍 ТЕСТ 1: Парсинг JSON схемы ЕПГУ")
    print_separator()
    
    # Путь к файлу - поднимаемся на 3 уровня (app/test -> app -> generator-service -> workspace root)
    json_file = Path(__file__).parent.parent.parent.parent / "doc/test/files/госуслуги/бе•ђ† гбЂг£®.json"
    
    if not json_file.exists():
        print(f"❌ Файл не найден: {json_file}")
        return None
    
    print(f"📄 Читаем файл: {json_file.name}")
    content = read_file(str(json_file))
    print(f"✓ Размер файла: {len(content):,} символов ({len(content.splitlines()):,} строк)")
    
    # Парсинг
    parser = JsonSchemaParser()
    try:
        print("\n⚙️  Парсим JSON схему...")
        result = parser.parse(content)
        
        print(f"✅ Успешно! Найдено полей: {result.total_fields}")
        print(f"📊 Версия схемы: {result.schema_version or 'не указана'}")
        
        # Показываем первые 10 полей
        print("\n📋 Первые 10 извлеченных полей:")
        for i, field in enumerate(result.fields[:10], 1):
            label = field.label[:50] + "..." if field.label and len(field.label) > 50 else field.label
            print(f"  {i}. ID: {field.id}")
            print(f"     Label: {label}")
            print(f"     Type: {field.type}")
            print(f"     Path: {field.path}")
            print()
        
        if result.total_fields > 10:
            print(f"  ... и еще {result.total_fields - 10} полей")
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка парсинга: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_xsd_parsing():
    """Тест парсинга XSD схемы"""
    print("\n🔍 ТЕСТ 2: Парсинг XSD схемы")
    print_separator()
    
    # Путь к файлу - поднимаемся на 3 уровня
    xsd_file = Path(__file__).parent.parent.parent.parent / "doc/test/files/госуслуги/бе•ђ† Ґ®§† бҐ•§•≠®©.txt"
    
    if not xsd_file.exists():
        print(f"❌ Файл не найден: {xsd_file}")
        return None
    
    print(f"📄 Читаем файл: {xsd_file.name}")
    content = read_file(str(xsd_file))
    print(f"✓ Размер файла: {len(content):,} символов ({len(content.splitlines()):,} строк)")
    
    # Парсинг
    parser = XsdSchemaParser()
    try:
        print("\n⚙️  Парсим XSD схему...")
        result = parser.parse(content)
        
        print(f"✅ Успешно! Найдено элементов: {result.total_elements}")
        print(f"📊 Корневой элемент: {result.root_element}")
        print(f"📊 Namespace: {result.namespace}")
        
        # Показываем первые 10 элементов
        print("\n📋 Первые 10 извлеченных элементов:")
        for i, element in enumerate(result.elements[:10], 1):
            desc = element.description[:50] + "..." if element.description and len(element.description) > 50 else element.description
            print(f"  {i}. Name: {element.name}")
            print(f"     Type: {element.type}")
            print(f"     Required: {element.required}")
            if desc:
                print(f"     Description: {desc}")
            print()
        
        if result.total_elements > 10:
            print(f"  ... и еще {result.total_elements - 10} элементов")
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка парсинга: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_field_mapping(parsed_json, parsed_xsd):
    """Тест автоматического маппинга"""
    print("\n🔍 ТЕСТ 3: Автоматический маппинг полей")
    print_separator()
    
    if not parsed_json or not parsed_xsd:
        print("❌ Пропускаем тест - нет данных из предыдущих шагов")
        return None
    
    mapper = FieldMapper()
    
    try:
        print("⚙️  Выполняем автоматический маппинг...")
        mappings, unmapped_json, unmapped_xml = mapper.auto_map(parsed_json, parsed_xsd)
        
        print(f"\n✅ Маппинг завершен!")
        print(f"📊 Смаплено полей: {len(mappings)}")
        print(f"⚠️  Несмапленных JSON полей: {len(unmapped_json)}")
        print(f"⚠️  Несмапленных XML элементов: {len(unmapped_xml)}")
        
        # Статистика по confidence score
        if mappings:
            high_confidence = [m for m in mappings if m.confidence_score >= 0.8]
            medium_confidence = [m for m in mappings if 0.5 <= m.confidence_score < 0.8]
            low_confidence = [m for m in mappings if m.confidence_score < 0.5]
            
            print(f"\n📈 Распределение по уверенности:")
            print(f"  🟢 Высокая (≥0.8): {len(high_confidence)} ({len(high_confidence)/len(mappings)*100:.1f}%)")
            print(f"  🟡 Средняя (0.5-0.8): {len(medium_confidence)} ({len(medium_confidence)/len(mappings)*100:.1f}%)")
            print(f"  🔴 Низкая (<0.5): {len(low_confidence)} ({len(low_confidence)/len(mappings)*100:.1f}%)")
            
            # Топ-10 лучших маппингов
            print(f"\n🎯 ТОП-10 лучших маппингов:")
            sorted_mappings = sorted(mappings, key=lambda m: m.confidence_score, reverse=True)
            for i, m in enumerate(sorted_mappings[:10], 1):
                label = m.json_field_label[:40] + "..." if m.json_field_label and len(m.json_field_label) > 40 else m.json_field_label
                print(f"  {i}. {m.json_field_id} → {m.xml_element_name}")
                print(f"     Label: {label}")
                print(f"     Confidence: {m.confidence_score:.2f}")
                print()
            
            # Проблемные маппинги
            if low_confidence:
                print(f"\n⚠️  Первые 5 маппингов с низкой уверенностью (требуют проверки):")
                for i, m in enumerate(low_confidence[:5], 1):
                    label = m.json_field_label[:40] + "..." if m.json_field_label and len(m.json_field_label) > 40 else m.json_field_label
                    print(f"  {i}. {m.json_field_id} → {m.xml_element_name}")
                    print(f"     Label: {label}")
                    print(f"     Confidence: {m.confidence_score:.2f} ⚠️")
                    print()
        
        return mappings
        
    except Exception as e:
        print(f"❌ Ошибка маппинга: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_template_generation(mappings, parsed_xsd):
    """Тест генерации VM шаблона"""
    print("\n🔍 ТЕСТ 4: Генерация VM шаблона")
    print_separator()
    
    if not mappings or not parsed_xsd:
        print("❌ Пропускаем тест - нет данных из предыдущих шагов")
        return None
    
    generator = VmTemplateGenerator()
    
    try:
        print("⚙️  Генерируем Velocity шаблон...")
        template = generator.generate(
            mappings=mappings,
            xsd_structure=parsed_xsd,
            include_comments=True,
            include_null_checks=True
        )
        
        line_count = len(template.split('\n'))
        print(f"\n✅ Шаблон сгенерирован!")
        print(f"📊 Строк в шаблоне: {line_count}")
        print(f"📊 Символов: {len(template):,}")
        
        # Сохраняем в файл (в папку test)
        output_file = Path(__file__).parent / "output_generated_template.vm"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(template)
        print(f"\n💾 Шаблон сохранен в: {output_file}")
        
        # Показываем первые 50 строк
        print(f"\n📄 Первые 50 строк шаблона:")
        print("-" * 80)
        for line in template.split('\n')[:50]:
            print(line)
        print("-" * 80)
        
        return template
        
    except Exception as e:
        print(f"❌ Ошибка генерации: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Основная функция тестирования"""
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "ТЕСТИРОВАНИЕ GENERATOR-SERVICE" + " " * 28 + "║")
    print("║" + " " * 25 + "на реальных данных ЕПГУ" + " " * 30 + "║")
    print("╚" + "═" * 78 + "╝")
    
    # Тест 1: Парсинг JSON
    parsed_json = test_json_parsing()
    
    # Тест 2: Парсинг XSD
    parsed_xsd = test_xsd_parsing()
    
    # Тест 3: Маппинг
    mappings = test_field_mapping(parsed_json, parsed_xsd)
    
    # Тест 4: Генерация шаблона
    template = test_template_generation(mappings, parsed_xsd)
    
    # Итоговый отчет
    print("\n" + "╔" + "═" * 78 + "╗")
    print("║" + " " * 30 + "ИТОГОВЫЙ ОТЧЕТ" + " " * 34 + "║")
    print("╚" + "═" * 78 + "╝")
    
    tests_passed = sum([
        parsed_json is not None,
        parsed_xsd is not None,
        mappings is not None,
        template is not None
    ])
    
    print(f"\n✅ Пройдено тестов: {tests_passed}/4")
    
    if tests_passed == 4:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("\n📝 Выводы:")
        print("  ✓ JSON Parser работает с форматом ЕПГУ")
        print("  ✓ XSD Parser корректно извлекает элементы")
        print("  ✓ Field Mapper выполняет автоматический маппинг")
        print("  ✓ VM Generator создает Velocity шаблон")
        print(f"\n  Найдено полей: {parsed_json.total_fields if parsed_json else 0}")
        print(f"  Найдено элементов: {parsed_xsd.total_elements if parsed_xsd else 0}")
        print(f"  Смаплено: {len(mappings) if mappings else 0}")
        print(f"  Сгенерировано строк: {len(template.split(chr(10))) if template else 0}")
    else:
        print("\n⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ")
        print("Смотрите детали выше")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    main()

