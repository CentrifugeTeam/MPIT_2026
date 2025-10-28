import httpx
from typing import Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()

class GeneratorClient:    
    def __init__(self):
        self.base_url = settings.GENERATOR_SERVICE_URL
        self.timeout = 30.0
    
    async def parse_json_schema(self, file_content: str) -> Dict[str, Any]:
        """Парсинг JSON-схемы"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/parse/json-schema",
                json={"file_content": file_content}
            )
            response.raise_for_status()
            return response.json()
    
    async def parse_xsd_schema(self, file_content: str) -> Dict[str, Any]:
        """Парсинг XSD-схемы"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/parse/xsd-schema",
                json={"file_content": file_content}
            )
            response.raise_for_status()
            return response.json()
    
    async def auto_map_fields(
        self, 
        json_schema: Dict[str, Any], 
        xsd_schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Автоматическое сопоставление полей"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/mapper/auto-map",
                json={
                    "json_schema": json_schema,
                    "xsd_schema": xsd_schema
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def calculate_similarity(self, source: str, target: str) -> Dict[str, Any]:
        """Вычисление схожести двух строк"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/mapper/calculate-similarity",
                json={"source": source, "target": target}
            )
            response.raise_for_status()
            return response.json()
    
    async def generate_template(
        self,
        mappings: list,
        xsd_structure: Dict[str, Any],
        include_comments: bool = True,
        include_null_checks: bool = True
    ) -> Dict[str, Any]:
        """Генерация VM-шаблона"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate/template",
                json={
                    "mappings": mappings,
                    "xsd_structure": xsd_structure,
                    "include_comments": include_comments,
                    "include_null_checks": include_null_checks
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def preview_transformation(
        self,
        template: str,
        test_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Предпросмотр результата трансформации"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate/preview",
                json={
                    "template": template,
                    "test_data": test_data
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def validate_template(
        self,
        template: str,
        mappings: Optional[list] = None
    ) -> Dict[str, Any]:
        """Валидация VM-шаблона"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/validate/template",
                json={
                    "template": template,
                    "mappings": mappings
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def validate_output(
        self,
        xml_output: str,
        xsd_schema: str
    ) -> Dict[str, Any]:
        """Валидация выходного XML"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/validate/output",
                json={
                    "xml_output": xml_output,
                    "xsd_schema": xsd_schema
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def complete_generation(
        self,
        json_schema_content: str,
        xsd_schema_content: str,
        test_data: Optional[Dict[str, Any]] = None,
        include_preview: bool = False,
        include_comments: bool = True,
        include_null_checks: bool = True
    ) -> Dict[str, Any]:
        """Полный цикл генерации"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/complete/generate",
                json={
                    "json_schema_content": json_schema_content,
                    "xsd_schema_content": xsd_schema_content,
                    "test_data": test_data,
                    "include_preview": include_preview,
                    "include_comments": include_comments,
                    "include_null_checks": include_null_checks
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def health_check(self) -> Dict[str, Any]:
        """Проверка здоровья сервиса"""
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()

