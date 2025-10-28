from typing import List, Dict, Any
import re
from lxml import etree
from jinja2 import Environment, TemplateSyntaxError
from app.schemas import ValidationError, MappingSuggestion

class TemplateValidator:
    """
    Валидатор VM-шаблонов
    
    Проверяет синтаксис Velocity и корректность XML структуры.
    """
    
    def validate_syntax(self, template: str) -> tuple[bool, List[ValidationError]]:
        """
        Валидация синтаксиса VM-шаблона
        
        Args:
            template: VM шаблон
            
        Returns:
            Tuple (is_valid, errors)
        """
        errors = []
        
        # 1. Проверка базового синтаксиса Velocity
        syntax_errors = self._check_velocity_syntax(template)
        errors.extend(syntax_errors)
        
        # 2. Проверка парности тегов
        tag_errors = self._check_xml_tags(template)
        errors.extend(tag_errors)
        
        # 3. Проверка Velocity директив
        directive_errors = self._check_velocity_directives(template)
        errors.extend(directive_errors)
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    def validate_variables(
        self, 
        template: str, 
        mappings: List[MappingSuggestion]
    ) -> tuple[bool, List[ValidationError]]:
        """
        Валидация использования переменных
        
        Проверяет, что все переменные объявлены и используются
        
        Args:
            template: VM шаблон
            mappings: Список маппингов (для проверки переменных)
            
        Returns:
            Tuple (is_valid, errors)
        """
        errors = []
        warnings = []
        
        # Извлекаем объявленные переменные
        declared_vars = self._extract_declared_variables(template)
        
        # Извлекаем использованные переменные
        used_vars = self._extract_used_variables(template)
        
        # Проверяем, что все использованные переменные объявлены
        for var in used_vars:
            if var not in declared_vars:
                errors.append(ValidationError(
                    message=f"Variable '${var}' is used but not declared",
                    severity="error"
                ))
        
        # Предупреждение о неиспользованных переменных
        for var in declared_vars:
            if var not in used_vars:
                warnings.append(ValidationError(
                    message=f"Variable '${var}' is declared but not used",
                    severity="warning"
                ))
        
        is_valid = len(errors) == 0
        return is_valid, errors + warnings
    
    def validate_output(self, xml_output: str, xsd_schema: str) -> tuple[bool, List[ValidationError]]:
        """
        Валидация выходного XML против XSD схемы
        
        Args:
            xml_output: Сгенерированный XML
            xsd_schema: XSD схема для валидации
            
        Returns:
            Tuple (is_valid, errors)
        """
        errors = []
        
        try:
            # Парсим XML
            xml_doc = etree.fromstring(xml_output.encode('utf-8'))
            
            # Парсим XSD схему
            xsd_doc = etree.fromstring(xsd_schema.encode('utf-8'))
            schema = etree.XMLSchema(xsd_doc)
            
            # Валидация
            is_valid = schema.validate(xml_doc)
            
            if not is_valid:
                for error in schema.error_log:
                    errors.append(ValidationError(
                        line=error.line,
                        message=error.message,
                        severity="error"
                    ))
            
            return is_valid, errors
            
        except etree.XMLSyntaxError as e:
            errors.append(ValidationError(
                line=e.lineno,
                message=f"XML syntax error: {str(e)}",
                severity="error"
            ))
            return False, errors
        except Exception as e:
            errors.append(ValidationError(
                message=f"Validation error: {str(e)}",
                severity="error"
            ))
            return False, errors
    
    def test_transformation(self, template: str, test_data: Dict[str, Any]) -> str:
        """
        Тестовая трансформация данных через шаблон
        
        Args:
            template: VM шаблон
            test_data: Тестовые данные
            
        Returns:
            Результат трансформации (XML)
        """
        # Преобразуем Velocity синтаксис в Jinja2 (для тестирования)
        jinja_template = self._convert_velocity_to_jinja(template)
        
        try:
            env = Environment(autoescape=False)
            tmpl = env.from_string(jinja_template)
            result = tmpl.render(request=test_data)
            return result
        except Exception as e:
            raise ValueError(f"Template rendering failed: {str(e)}")
    
    def _check_velocity_syntax(self, template: str) -> List[ValidationError]:
        """Проверка базового синтаксиса Velocity"""
        errors = []
        
        # Проверка незакрытых директив
        if_count = len(re.findall(r'#if\s*\(', template))
        end_count = len(re.findall(r'#end', template))
        
        if if_count != end_count:
            errors.append(ValidationError(
                message=f"Unmatched #if/#end directives: {if_count} #if vs {end_count} #end",
                severity="error"
            ))
        
        # Проверка синтаксиса переменных
        invalid_vars = re.findall(r'\$\{[^}]*\$', template)
        if invalid_vars:
            errors.append(ValidationError(
                message=f"Invalid variable syntax: {invalid_vars}",
                severity="error"
            ))
        
        return errors
    
    def _check_xml_tags(self, template: str) -> List[ValidationError]:
        """Проверка парности XML тегов"""
        errors = []
        
        # Удаляем Velocity директивы для проверки XML
        cleaned = re.sub(r'#.*?\n', '', template)
        cleaned = re.sub(r'\$\{[^}]+\}', 'VALUE', cleaned)
        
        # Извлекаем теги
        opening_tags = re.findall(r'<(\w+)[^/>]*>', cleaned)
        closing_tags = re.findall(r'</(\w+)>', cleaned)
        
        # Проверяем баланс
        opening_counter = {}
        closing_counter = {}
        
        for tag in opening_tags:
            opening_counter[tag] = opening_counter.get(tag, 0) + 1
        
        for tag in closing_tags:
            closing_counter[tag] = closing_counter.get(tag, 0) + 1
        
        # Сравниваем
        all_tags = set(opening_counter.keys()) | set(closing_counter.keys())
        for tag in all_tags:
            open_count = opening_counter.get(tag, 0)
            close_count = closing_counter.get(tag, 0)
            
            if open_count != close_count:
                errors.append(ValidationError(
                    message=f"Unmatched XML tags for '<{tag}'>: {open_count} opening vs {close_count} closing",
                    severity="error"
                ))
        
        return errors
    
    def _check_velocity_directives(self, template: str) -> List[ValidationError]:
        """Проверка Velocity директив"""
        errors = []
        
        # Проверка синтаксиса #set
        set_directives = re.findall(r'#set\s*\([^)]*\)', template)
        for directive in set_directives:
            if '=' not in directive:
                errors.append(ValidationError(
                    message=f"Invalid #set directive syntax: {directive}",
                    severity="error"
                ))
        
        return errors
    
    def _extract_declared_variables(self, template: str) -> set:
        """Извлечение объявленных переменных из #set директив"""
        declared = set()
        
        # Ищем #set($var = ...)
        pattern = r'#set\s*\(\s*\$(\w+)\s*='
        matches = re.findall(pattern, template)
        declared.update(matches)
        
        return declared
    
    def _extract_used_variables(self, template: str) -> set:
        """Извлечение использованных переменных"""
        used = set()
        
        # Ищем ${var} и $var (но не в #set)
        # Убираем #set директивы
        template_without_set = re.sub(r'#set\s*\([^)]+\)', '', template)
        
        # Ищем ${var}
        matches1 = re.findall(r'\$\{!?(\w+)\}', template_without_set)
        used.update(matches1)
        
        # Ищем $var (standalone)
        matches2 = re.findall(r'\$!?(\w+)(?![{])', template_without_set)
        used.update(matches2)
        
        return used
    
    def _convert_velocity_to_jinja(self, template: str) -> str:
        """Конвертация Velocity синтаксиса в Jinja2 для тестирования"""
        jinja = template
        
        # #set($var = $value) -> {% set var = value %}
        jinja = re.sub(r'#set\s*\(\s*\$(\w+)\s*=\s*\$request\.(\w+)\s*\)',
                      r'{% set \1 = request.\2 %}', jinja)
        
        # #if($var) -> {% if var %}
        jinja = re.sub(r'#if\s*\(\s*\$(\w+)\s*\)', r'{% if \1 %}', jinja)
        
        # #end -> {% endif %}
        jinja = re.sub(r'#end', r'{% endif %}', jinja)
        
        # ${var} и $!{var} -> {{ var }}
        jinja = re.sub(r'\$!?\{(\w+)\}', r'{{ \1 }}', jinja)
        
        # Убираем комментарии ##
        jinja = re.sub(r'##.*?\n', '\n', jinja)
        
        return jinja

