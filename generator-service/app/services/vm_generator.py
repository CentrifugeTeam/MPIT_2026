from typing import List, Dict
from app.schemas import MappingSuggestion, ParsedXsdSchema, XmlElement, DataType

class VmTemplateGenerator:
    """
    Генератор Apache Velocity шаблонов
    
    Создает VM-шаблоны для трансформации JSON в XML.
    """
    
    def generate(
        self,
        mappings: List[MappingSuggestion],
        xsd_structure: ParsedXsdSchema,
        include_comments: bool = True,
        include_null_checks: bool = True
    ) -> str:
        """
        Генерация VM-шаблона
        
        Args:
            mappings: Список маппингов полей
            xsd_structure: Структура XSD схемы
            include_comments: Включить комментарии
            include_null_checks: Включить проверки на null
            
        Returns:
            Velocity шаблон
        """
        template_parts = []
        
        # Заголовок
        if include_comments:
            template_parts.append(self._generate_header())
        
        # Объявление переменных
        variables = self.generate_variable_declarations(mappings, include_comments)
        template_parts.append(variables)
        
        # XML структура
        xml_structure = self.generate_xml_structure(
            mappings, 
            xsd_structure, 
            include_comments,
            include_null_checks
        )
        template_parts.append(xml_structure)
        
        return "\n".join(template_parts)
    
    def _generate_header(self) -> str:
        """Генерация заголовка шаблона"""
        return """##
## VM Template for EPGU-VIS Integration
## Generated automatically
##
## This template transforms JSON data from EPGU forms to XML for departmental systems
##"""
    
    def generate_variable_declarations(
        self, 
        mappings: List[MappingSuggestion],
        include_comments: bool = True
    ) -> str:
        """
        Генерация объявлений переменных
        
        Args:
            mappings: Список маппингов
            include_comments: Включить комментарии
            
        Returns:
            Блок объявлений переменных
        """
        lines = []
        
        if include_comments:
            lines.append("## Variable declarations")
        
        for mapping in mappings:
            # Комментарий с описанием
            if include_comments and mapping.json_field_label:
                lines.append(f"## {mapping.json_field_label}")
            
            # Объявление переменной
            var_declaration = f"#set(${mapping.variable_name} = {mapping.json_field_path})"
            lines.append(var_declaration)
        
        return "\n".join(lines)
    
    def generate_xml_structure(
        self,
        mappings: List[MappingSuggestion],
        xsd_structure: ParsedXsdSchema,
        include_comments: bool = True,
        include_null_checks: bool = True
    ) -> str:
        """
        Генерация XML структуры
        
        Args:
            mappings: Список маппингов
            xsd_structure: Структура XSD
            include_comments: Включить комментарии
            include_null_checks: Включить проверки на null
            
        Returns:
            XML структура
        """
        lines = []
        
        if include_comments:
            lines.append("\n## XML output structure")
        
        # Создаем словарь маппингов для быстрого поиска
        mapping_dict = {m.xml_element_name: m for m in mappings}
        
        # Строим иерархию элементов
        hierarchy = self._build_hierarchy(xsd_structure.elements)
        
        # Генерируем XML структуру
        root_element = xsd_structure.root_element
        if root_element:
            xml_content = self._generate_element_xml(
                root_element,
                hierarchy,
                mapping_dict,
                include_null_checks,
                indent=0
            )
            lines.append(xml_content)
        else:
            # Если нет корневого элемента, генерируем flat структуру
            lines.append("<Root>")
            for mapping in mappings:
                element_xml = self._generate_simple_element(
                    mapping,
                    include_null_checks,
                    indent=1
                )
                lines.append(element_xml)
            lines.append("</Root>")
        
        return "\n".join(lines)
    
    def _build_hierarchy(self, elements: List[XmlElement]) -> Dict[str, List[XmlElement]]:
        """Построение иерархии элементов"""
        hierarchy = {}
        for element in elements:
            parent = element.parent or "root"
            if parent not in hierarchy:
                hierarchy[parent] = []
            hierarchy[parent].append(element)
        return hierarchy
    
    def _generate_element_xml(
        self,
        element_name: str,
        hierarchy: Dict[str, List[XmlElement]],
        mapping_dict: Dict[str, MappingSuggestion],
        include_null_checks: bool,
        indent: int = 0
    ) -> str:
        """Рекурсивная генерация XML элемента"""
        lines = []
        indent_str = "  " * indent
        
        # Находим элемент в иерархии
        children = hierarchy.get(element_name, [])
        
        if children:
            # Элемент с дочерними элементами
            lines.append(f"{indent_str}<{element_name}>")
            
            for child in children:
                if child.name in mapping_dict:
                    # Элемент с маппингом
                    mapping = mapping_dict[child.name]
                    child_xml = self._generate_simple_element(
                        mapping,
                        include_null_checks,
                        indent + 1
                    )
                    lines.append(child_xml)
                else:
                    # Рекурсивно обрабатываем вложенные элементы
                    child_xml = self._generate_element_xml(
                        child.name,
                        hierarchy,
                        mapping_dict,
                        include_null_checks,
                        indent + 1
                    )
                    lines.append(child_xml)
            
            lines.append(f"{indent_str}</{element_name}>")
        else:
            # Конечный элемент
            if element_name in mapping_dict:
                mapping = mapping_dict[element_name]
                return self._generate_simple_element(mapping, include_null_checks, indent)
            else:
                lines.append(f"{indent_str}<{element_name}></{element_name}>")
        
        return "\n".join(lines)
    
    def _generate_simple_element(
        self,
        mapping: MappingSuggestion,
        include_null_checks: bool,
        indent: int = 0
    ) -> str:
        """
        Генерация простого XML элемента с маппингом
        
        Args:
            mapping: Маппинг поля
            include_null_checks: Включить проверку на null
            indent: Уровень отступа
            
        Returns:
            XML элемент с Velocity логикой
        """
        indent_str = "  " * indent
        element_name = mapping.xml_element_name
        var_name = mapping.variable_name
        
        if include_null_checks:
            # С проверкой на null
            lines = [
                f"{indent_str}#if(${var_name})",
                f"{indent_str}  <{element_name}>${{!{var_name}}}</{element_name}>",
                f"{indent_str}#end"
            ]
            return "\n".join(lines)
        else:
            # Без проверки (используем $! для безопасного вывода)
            return f"{indent_str}<{element_name}>${{!{var_name}}}</{element_name}>"
    
    def generate_conditions(self, mappings: List[MappingSuggestion]) -> str:
        """
        Генерация условий для required полей
        
        Args:
            mappings: Список маппингов
            
        Returns:
            Velocity условия
        """
        lines = []
        
        for mapping in mappings:
            if mapping.data_type == DataType.DATE:
                # Форматирование даты
                lines.append(
                    f"## Format date for {mapping.variable_name}\n"
                    f"#if(${mapping.variable_name})\n"
                    f"  #set($formatted_{mapping.variable_name} = "
                    f"$dateUtil.format('yyyy-MM-dd', ${mapping.variable_name}))\n"
                    f"#end"
                )
        
        return "\n".join(lines)
    
    def count_lines(self, template: str) -> int:
        """Подсчет строк в шаблоне"""
        return len(template.split('\n'))

