from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.generator import (
    ParseFilesRequest, ParseFilesResponse,
    GenerateAndSaveRequest, GenerateAndSaveResponse,
    AutoMapRequest, AutoMapResponse,
    GenerateTemplateRequest, GenerateTemplateResponse,
    PreviewRequest, PreviewResponse
)
from app.services.generator_client import GeneratorClient
from app.services.files_service import FilesService
from app.services.projects_service import ProjectsService
import httpx
import json

router = APIRouter()

def get_generator_client():
    return GeneratorClient()

def get_files_service():
    return FilesService()

def get_projects_service():
    return ProjectsService()

@router.post("/parse-files", response_model=ParseFilesResponse)
async def parse_project_files(
    request: ParseFilesRequest,
    generator_client: GeneratorClient = Depends(get_generator_client),
    files_service: FilesService = Depends(get_files_service),
    projects_service: ProjectsService = Depends(get_projects_service)
):
    """Парсинг JSON и XSD файлов проекта"""
    try:
        project = await projects_service.get_project(request.project_id)

        project_files = await files_service.get_project_files(request.project_id)

        json_file = next((f for f in project_files if f.get("file_type") == "JSON_SCHEMA"), None)
        xsd_file = next((f for f in project_files if f.get("file_type") == "XSD_SCHEMA"), None)

        if not json_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="JSON schema file not found for this project"
            )

        if not xsd_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="XSD schema file not found for this project"
            )

        json_content_bytes = await files_service.download_file(json_file["id"])
        xsd_content_bytes = await files_service.download_file(xsd_file["id"])

        json_content = json_content_bytes.decode('utf-8')
        xsd_content = xsd_content_bytes.decode('utf-8')

        json_parse_result = await generator_client.parse_json_schema(json_content)
        if not json_parse_result.get("success"):
            return ParseFilesResponse(
                success=False,
                error=f"Failed to parse JSON schema: {json_parse_result.get('error')}"
            )

        xsd_parse_result = await generator_client.parse_xsd_schema(xsd_content)
        if not xsd_parse_result.get("success"):
            return ParseFilesResponse(
                success=False,
                error=f"Failed to parse XSD schema: {xsd_parse_result.get('error')}"
            )

        return ParseFilesResponse(
            success=True,
            json_schema=json_parse_result.get("data"),
            xsd_schema=xsd_parse_result.get("data")
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse files: {str(e)}"
        )

@router.post("/auto-map", response_model=AutoMapResponse)
async def auto_map_fields(
    request: AutoMapRequest,
    generator_client: GeneratorClient = Depends(get_generator_client)
):
    """Автоматическое сопоставление полей JSON и XML"""
    try:
        result = await generator_client.auto_map_fields(
            json_schema=request.json_schema.dict(),
            xsd_schema=request.xsd_schema.dict()
        )
        return AutoMapResponse(**result)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Generator service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-map fields: {str(e)}"
        )

@router.post("/generate-template", response_model=GenerateTemplateResponse)
async def generate_template(
    request: GenerateTemplateRequest,
    generator_client: GeneratorClient = Depends(get_generator_client)
):
    """Генерация VM-шаблона на основе маппингов"""
    try:
        result = await generator_client.generate_template(
            mappings=[m.dict() for m in request.mappings],
            xsd_structure=request.xsd_structure.dict(),
            include_comments=request.include_comments,
            include_null_checks=request.include_null_checks
        )
        return GenerateTemplateResponse(**result)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Generator service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate template: {str(e)}"
        )

@router.post("/preview", response_model=PreviewResponse)
async def preview_transformation(
    request: PreviewRequest,
    generator_client: GeneratorClient = Depends(get_generator_client)
):
    """Предпросмотр результата трансформации"""
    try:
        result = await generator_client.preview_transformation(
            template=request.template,
            test_data=request.test_data
        )
        return PreviewResponse(**result)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Generator service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview transformation: {str(e)}"
        )

@router.post("/generate-and-save", response_model=GenerateAndSaveResponse)
async def generate_and_save_template(
    request: GenerateAndSaveRequest,
    generator_client: GeneratorClient = Depends(get_generator_client),
    files_service: FilesService = Depends(get_files_service),
    projects_service: ProjectsService = Depends(get_projects_service)
):
    """парсинг → маппинг → генерация → сохранение"""
    try:
        project_files = await files_service.get_project_files(request.project_id)

        json_file = next((f for f in project_files if f.get("file_type") == "JSON_SCHEMA"), None)
        xsd_file = next((f for f in project_files if f.get("file_type") == "XSD_SCHEMA"), None)

        if not json_file or not xsd_file:
            return GenerateAndSaveResponse(
                success=False,
                error="Required files not found (JSON_SCHEMA or XSD_SCHEMA)"
            )

        json_content_bytes = await files_service.download_file(json_file["id"])
        xsd_content_bytes = await files_service.download_file(xsd_file["id"])

        json_content = json_content_bytes.decode('utf-8')
        xsd_content = xsd_content_bytes.decode('utf-8')

        test_data = request.test_data
        if not test_data:
            # Ищем TEST_DATA файл с расширением .json
            test_data_file = next(
                (f for f in project_files
                 if f.get("file_type") == "TEST_DATA" and f.get("file_name", "").endswith(".json")),
                None
            )
            if test_data_file:
                test_data_content_bytes = await files_service.download_file(test_data_file["id"])
                test_data_content = test_data_content_bytes.decode('utf-8')
                try:
                    test_data = json.loads(test_data_content)
                except json.JSONDecodeError:
                    # Если файл не JSON - пропускаем test_data
                    test_data = None

        result = await generator_client.complete_generation(
            json_schema_content=json_content,
            xsd_schema_content=xsd_content,
            test_data=test_data,
            include_preview=bool(test_data),
            include_comments=request.include_comments,
            include_null_checks=request.include_null_checks
        )

        if not result.get("success"):
            return GenerateAndSaveResponse(
                success=False,
                error=result.get("error", "Generation failed")
            )

        mappings = result.get("mappings", [])
        if mappings:
            await projects_service.bulk_create_mappings(request.project_id, mappings)

        template = result.get("template", "")
        if template:
            file_upload_result = await files_service.upload_file_content(
                project_id=request.project_id,
                file_name="generated_template.vm",
                file_content=template.encode('utf-8'),
                file_type="VM_TEMPLATE"
            )
            template_file_id = file_upload_result.get("id")

            await projects_service.update_project(
                project_id=request.project_id,
                update_data={"status": "COMPLETED"}
            )

            return GenerateAndSaveResponse(
                success=True,
                template_file_id=template_file_id,
                template=template,
                mappings_count=len(mappings),
                validation=result.get("validation")
            )

        return GenerateAndSaveResponse(
            success=False,
            error="Template generation returned empty result"
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and save template: {str(e)}"
        )

@router.get("/health")
async def generator_health_check(
    generator_client: GeneratorClient = Depends(get_generator_client)
):
    """Проверка здоровья Generator Service"""
    try:
        result = await generator_client.health_check()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Generator service unavailable: {str(e)}"
        )

