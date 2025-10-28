from typing import List, Tuple, Optional
from fuzzywuzzy import fuzz
import Levenshtein
import re
from app.schemas import (
    JsonField, XmlElement, MappingSuggestion, 
    ParsedJsonSchema, ParsedXsdSchema, DataType
)
from app.core.config import settings

class FieldMapper:
    """
    Автоматическое сопоставление полей JSON и XML
    
    Использует алгоритмы схожести строк для нахождения соответствий.
    """
    
    def __init__(self):
        self.min_confidence = settings.MIN_CONFIDENCE_SCORE
        self.auto_map_threshold = settings.AUTO_MAP_THRESHOLD
    
    def auto_map(
        self, 
        json_schema: ParsedJsonSchema, 
        xsd_schema: ParsedXsdSchema
    ) -> Tuple[List[MappingSuggestion], List[str], List[str]]:
        """
        Автоматическое сопоставление полей
        
        Args:
            json_schema: Распарсенная JSON схема
            xsd_schema: Распарсенная XSD схема
            
        Returns:
            Tuple (mappings, unmapped_json, unmapped_xml)
        """
        mappings = []
        mapped_json_ids = set()
        mapped_xml_names = set()
        
        # Для каждого JSON поля ищем наилучшее совпадение в XML
        for json_field in json_schema.fields:
            best_match = self.find_best_match(json_field, xsd_schema.elements)
            
            if best_match and best_match[1] >= self.min_confidence:
                xml_element, confidence = best_match
                
                # Создаем маппинг
                mapping = MappingSuggestion(
                    json_field_id=json_field.id,
                    json_field_path=json_field.path,
                    json_field_label=json_field.label,
                    xml_element_name=xml_element.name,
                    xml_element_path=xml_element.path,
                    variable_name=self._generate_variable_name(json_field.id),
                    confidence_score=round(confidence, 2),
                    is_auto_mapped=True,
                    data_type=json_field.type
                )
                
                mappings.append(mapping)
                mapped_json_ids.add(json_field.id)
                mapped_xml_names.add(xml_element.name)
        
        # Находим несопоставленные поля
        unmapped_json = [
            f.id for f in json_schema.fields 
            if f.id not in mapped_json_ids
        ]
        
        unmapped_xml = [
            e.name for e in xsd_schema.elements 
            if e.name not in mapped_xml_names and not e.parent
        ]
        
        return mappings, unmapped_json, unmapped_xml
    
    def find_best_match(
        self, 
        json_field: JsonField, 
        xml_elements: List[XmlElement]
    ) -> Optional[Tuple[XmlElement, float]]:
        """
        Находит наилучшее совпадение для JSON поля среди XML элементов
        
        Args:
            json_field: JSON поле
            xml_elements: Список XML элементов
            
        Returns:
            Tuple (best_element, confidence) или None
        """
        best_match = None
        best_score = 0.0
        
        # Фильтруем только элементы без parent (root level)
        root_elements = [e for e in xml_elements if not e.parent]
        
        if not root_elements:
            root_elements = xml_elements
        
        for xml_element in root_elements:
            score = self.calculate_similarity(json_field, xml_element)
            
            if score > best_score:
                best_score = score
                best_match = xml_element
        
        if best_match and best_score >= self.min_confidence:
            return (best_match, best_score)
        
        return None
    
    def calculate_similarity(self, json_field: JsonField, xml_element: XmlElement) -> float:
        """
        Вычисляет схожесть между JSON полем и XML элементом
        
        УЛУЧШЕННЫЙ АЛГОРИТМ для работы с ЕПГУ данными:
        - Приоритет на сравнение label vs element name
        - Levenshtein distance (базовая схожесть)
        - Token sort ratio (порядок слов не важен)
        - Partial ratio (частичное совпадение)
        - Семантические правила
        
        Args:
            json_field: JSON поле
            xml_element: XML элемент
            
        Returns:
            Оценка схожести от 0.0 до 1.0
        """
        json_name = json_field.id
        xml_name = xml_element.name
        
        # 1. Exact match по ID (точное совпадение)
        if json_name.lower() == xml_name.lower():
            return 1.0
        
        # 2. Нормализуем названия (camelCase -> snake_case -> lowercase)
        json_normalized = self._normalize_name(json_name)
        xml_normalized = self._normalize_name(xml_name)
        
        if json_normalized == xml_normalized:
            return 0.95
        
        # 3. Базовые метрики по ID
        levenshtein_score = Levenshtein.ratio(json_normalized, xml_normalized)
        token_sort_score = fuzz.token_sort_ratio(json_normalized, xml_normalized) / 100.0
        partial_score = fuzz.partial_ratio(json_normalized, xml_normalized) / 100.0
        
        # 4. УЛУЧШЕНО: Приоритет на label (для ЕПГУ с техническими ID типа "c58")
        label_vs_name_score = 0.0
        label_vs_desc_score = 0.0
        
        if json_field.label:
            label_normalized = self._normalize_name(json_field.label)
            
            # Сравниваем label с именем XML элемента
            label_vs_name_score = max(
                Levenshtein.ratio(label_normalized, xml_normalized),
                fuzz.token_sort_ratio(label_normalized, xml_normalized) / 100.0,
                fuzz.partial_ratio(label_normalized, xml_normalized) / 100.0
            )
            
            # Сравниваем label с description XML элемента
            if xml_element.description:
                desc_normalized = self._normalize_name(xml_element.description)
                label_vs_desc_score = max(
                    Levenshtein.ratio(label_normalized, desc_normalized),
                    fuzz.token_sort_ratio(label_normalized, desc_normalized) / 100.0,
                    fuzz.partial_ratio(label_normalized, desc_normalized) / 100.0
                )
        
        # 5. Проверяем ключевые слова в label (семантический матчинг)
        semantic_score = self._calculate_semantic_similarity(json_field, xml_element)
        
        # УЛУЧШЕННЫЕ ВЕСА: больший приоритет на label для ЕПГУ
        if json_field.label and len(json_field.label) > 3:
            # Если есть осмысленный label, используем его как основу
            weights = {
                'label_vs_name': 0.40,      # Главное: label vs имя элемента
                'label_vs_desc': 0.25,      # Дополнительно: label vs description
                'semantic': 0.15,            # Семантическая схожесть
                'token_sort': 0.10,          # Token sort по ID
                'partial': 0.05,             # Частичное совпадение ID
                'levenshtein': 0.05          # Levenshtein по ID
            }
            
            final_score = (
                weights['label_vs_name'] * label_vs_name_score +
                weights['label_vs_desc'] * label_vs_desc_score +
                weights['semantic'] * semantic_score +
                weights['token_sort'] * token_sort_score +
                weights['partial'] * partial_score +
                weights['levenshtein'] * levenshtein_score
            )
        else:
            # Если label нет или он короткий, используем старые веса
            weights = {
                'levenshtein': 0.30,
                'token_sort': 0.30,
                'partial': 0.20,
                'label_vs_name': 0.15,
                'semantic': 0.05
            }
            
            final_score = (
                weights['levenshtein'] * levenshtein_score +
                weights['token_sort'] * token_sort_score +
                weights['partial'] * partial_score +
                weights['label_vs_name'] * label_vs_name_score +
                weights['semantic'] * semantic_score
            )
        
        return min(final_score, 1.0)
    
    def _calculate_semantic_similarity(self, json_field: JsonField, xml_element: XmlElement) -> float:
        """
        Семантическая схожесть на основе ключевых слов
        
        Проверяет наличие общих ключевых слов в label и описании.
        Например: "Фамилия" в label должна матчиться с "lastName" или "FamilyName"
        
        Args:
            json_field: JSON поле
            xml_element: XML элемент
            
        Returns:
            Оценка от 0.0 до 1.0
        """
        # Словарь семантических соответствий (можно расширять)
        semantic_map = {
            # ФИО
            'фамилия': ['lastname', 'family', 'surname'],
            'имя': ['firstname', 'given', 'name'],
            'отчество': ['middlename', 'patronymic', 'middle'],
            
            # Даты
            'дата рождения': ['birthdate', 'birth', 'dateofbirth'],
            'дата выдачи': ['issuedate', 'issue', 'date'],
            
            # Документы
            'паспорт': ['passport', 'document', 'doc'],
            'серия': ['series', 'serial'],
            'номер': ['number', 'num'],
            'снилс': ['snils', 'insurance'],
            
            # Контакты
            'телефон': ['phone', 'mobile', 'tel'],
            'email': ['email', 'mail', 'e-mail'],
            'адрес': ['address', 'addr'],
            
            # Общие
            'пол': ['gender', 'sex'],
            'возраст': ['age'],
        }
        
        if not json_field.label:
            return 0.0
        
        label_lower = json_field.label.lower()
        xml_name_lower = xml_element.name.lower()
        xml_desc_lower = (xml_element.description or "").lower()
        
        # Проверяем каждое семантическое правило
        for key_russian, key_english_variants in semantic_map.items():
            if key_russian in label_lower:
                # Проверяем наличие английских вариантов в XML
                for variant in key_english_variants:
                    if variant in xml_name_lower or variant in xml_desc_lower:
                        return 1.0  # Нашли семантическое соответствие
        
        return 0.0
    
    def _normalize_name(self, name: str) -> str:
        """
        Нормализация названия для сравнения
        
        Examples:
            lastName -> last name
            LastName -> last name
            last-name -> last name
            LAST_NAME -> last name
        """
        # Разбиваем camelCase и PascalCase
        name = re.sub('([a-z0-9])([A-Z])', r'\1 \2', name)
        
        # Заменяем разделители на пробелы
        name = re.sub(r'[-_]', ' ', name)
        
        # Приводим к нижнему регистру и убираем лишние пробелы
        name = ' '.join(name.lower().split())
        
        return name
    
    def _generate_variable_name(self, field_id: str) -> str:
        """
        Генерация имени переменной для VM шаблона
        
        Преобразует в camelCase, если необходимо
        
        Args:
            field_id: ID поля
            
        Returns:
            Имя переменной в camelCase
        """
        # Если уже в camelCase, возвращаем как есть
        if field_id and field_id[0].islower() and '_' not in field_id and '-' not in field_id:
            return field_id
        
        # Преобразуем snake_case или kebab-case в camelCase
        parts = re.split(r'[-_]', field_id)
        if len(parts) > 1:
            return parts[0].lower() + ''.join(p.capitalize() for p in parts[1:])
        
        # Приводим первую букву к нижнему регистру
        return field_id[0].lower() + field_id[1:] if field_id else field_id
    
    def calculate_string_similarity(self, source: str, target: str) -> float:
        """
        Публичный метод для вычисления схожести двух строк
        
        Args:
            source: Исходная строка
            target: Целевая строка
            
        Returns:
            Оценка схожести от 0.0 до 1.0
        """
        source_norm = self._normalize_name(source)
        target_norm = self._normalize_name(target)
        
        levenshtein_score = Levenshtein.ratio(source_norm, target_norm)
        token_sort_score = fuzz.token_sort_ratio(source_norm, target_norm) / 100.0
        
        return (levenshtein_score + token_sort_score) / 2.0

