from typing import List, Dict, Optional
from lxml import etree
from app.schemas import XmlElement, ParsedXsdSchema

class XsdSchemaParser:
    """
    Парсер XSD-схем ведомственных систем
    
    Извлекает XML элементы и их структуру из XSD-схемы.
    """
    
    # XSD namespace
    XSD_NS = "http://www.w3.org/2001/XMLSchema"
    
    def parse(self, file_content: str) -> ParsedXsdSchema:
        """
        Парсинг XSD-схемы
        
        Args:
            file_content: Содержимое XSD файла
            
        Returns:
            ParsedXsdSchema с извлеченными элементами
        """
        try:
            # Парсим XML
            root = etree.fromstring(file_content.encode('utf-8'))
            
            # Извлекаем namespace
            namespace = root.get("targetNamespace")
            
            # Извлекаем элементы
            elements = self.extract_elements(root)
            
            # Находим корневой элемент
            root_element = self._find_root_element(elements)
            
            return ParsedXsdSchema(
                elements=elements,
                total_elements=len(elements),
                root_element=root_element,
                namespace=namespace
            )
        except etree.XMLSyntaxError as e:
            raise ValueError(f"Invalid XSD format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error parsing XSD schema: {str(e)}")
    
    def extract_elements(self, root: etree.Element, parent_path: str = "") -> List[XmlElement]:
        """
        Рекурсивное извлечение элементов из XSD
        
        Args:
            root: Корневой элемент XSD
            parent_path: Путь родительского элемента
            
        Returns:
            Список XML элементов
        """
        elements = []
        
        # Ищем все элементы в схеме
        for element in root.xpath("//xs:element", namespaces={"xs": self.XSD_NS}):
            xml_element = self._parse_element(element, parent_path)
            if xml_element:
                elements.append(xml_element)
                
                # Если элемент имеет complexType, парсим вложенные
                complex_type = element.find(f"{{{self.XSD_NS}}}complexType")
                if complex_type is not None:
                    nested_elements = self._parse_complex_type(
                        complex_type, 
                        xml_element.name
                    )
                    elements.extend(nested_elements)
        
        return elements
    
    def _parse_element(self, element: etree.Element, parent_path: str = "") -> Optional[XmlElement]:
        """Парсинг отдельного элемента"""
        name = element.get("name")
        if not name:
            return None
        
        # Определяем путь
        path = f"{parent_path}/{name}" if parent_path else name
        
        # Извлекаем атрибуты
        elem_type = element.get("type")
        min_occurs = int(element.get("minOccurs", "1"))
        max_occurs_str = element.get("maxOccurs", "1")
        
        # Обработка maxOccurs
        if max_occurs_str == "unbounded":
            max_occurs = None
        else:
            max_occurs = int(max_occurs_str)
        
        # Определяем required
        required = min_occurs > 0
        
        # Извлекаем документацию
        annotation = element.find(f"{{{self.XSD_NS}}}annotation")
        description = None
        if annotation is not None:
            doc = annotation.find(f"{{{self.XSD_NS}}}documentation")
            if doc is not None and doc.text:
                description = doc.text.strip()
        
        return XmlElement(
            name=name,
            type=elem_type,
            path=path,
            required=required,
            min_occurs=min_occurs,
            max_occurs=max_occurs,
            parent=parent_path if parent_path else None,
            description=description
        )
    
    def _parse_complex_type(self, complex_type: etree.Element, parent_name: str) -> List[XmlElement]:
        """Парсинг вложенных элементов из complexType"""
        elements = []
        
        # Ищем sequence
        sequence = complex_type.find(f"{{{self.XSD_NS}}}sequence")
        if sequence is not None:
            for element in sequence.findall(f"{{{self.XSD_NS}}}element"):
                xml_element = self._parse_element(element, parent_name)
                if xml_element:
                    elements.append(xml_element)
        
        # Ищем choice
        choice = complex_type.find(f"{{{self.XSD_NS}}}choice")
        if choice is not None:
            for element in choice.findall(f"{{{self.XSD_NS}}}element"):
                xml_element = self._parse_element(element, parent_name)
                if xml_element:
                    elements.append(xml_element)
        
        # Ищем all
        all_elem = complex_type.find(f"{{{self.XSD_NS}}}all")
        if all_elem is not None:
            for element in all_elem.findall(f"{{{self.XSD_NS}}}element"):
                xml_element = self._parse_element(element, parent_name)
                if xml_element:
                    elements.append(xml_element)
        
        return elements
    
    def _find_root_element(self, elements: List[XmlElement]) -> Optional[str]:
        """Находит корневой элемент (элемент без parent)"""
        for element in elements:
            if not element.parent:
                return element.name
        return None
    
    def build_hierarchy(self, elements: List[XmlElement]) -> Dict:
        """
        Построение иерархической структуры элементов
        
        Args:
            elements: Список элементов
            
        Returns:
            Иерархическая структура
        """
        hierarchy = {}
        
        # Группируем по parent
        for element in elements:
            parent = element.parent or "root"
            if parent not in hierarchy:
                hierarchy[parent] = []
            hierarchy[parent].append(element)
        
        return hierarchy
    
    def validate_schema(self, xsd_content: str) -> bool:
        """
        Валидация XSD схемы
        
        Args:
            xsd_content: Содержимое XSD
            
        Returns:
            True если валидна
        """
        try:
            root = etree.fromstring(xsd_content.encode('utf-8'))
            # Проверяем что это XSD
            if root.tag != f"{{{self.XSD_NS}}}schema":
                raise ValueError("Not a valid XSD schema")
            return True
        except Exception as e:
            raise ValueError(f"Invalid XSD schema: {str(e)}")

