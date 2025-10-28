from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from app.schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, ProjectDetailedResponse,
    FieldMappingCreate, FieldMappingUpdate, FieldMappingResponse, FieldMappingListResponse,
    ProjectStatus
)
from app.services.projects_service import ProjectsService
from app.services.auth_service import AuthService
from app.services.files_service import FilesService
from app.services.generator_client import GeneratorClient
from app.api.auth import get_current_user

router = APIRouter()
security = HTTPBearer()

projects_service = ProjectsService()
auth_service = AuthService()
files_service = FilesService()
generator_client = GeneratorClient()

# ============ PROJECTS ENDPOINTS ============

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Создать новый проект (с автоматическим версионированием если название существует)"""
    import re

    user_email = current_user.get("email")

    # Проверяем существующие проекты с таким названием и добавляем версию
    all_projects = await projects_service.get_projects(limit=250)
    existing_projects = all_projects.get("projects", [])

    # Базовое имя без версии
    base_name = re.sub(r'\s+\(версия\s+\d+\)$', '', project.name)

    # Находим все проекты с похожим названием
    matching_projects = []
    for proj in existing_projects:
        proj_name = proj.get("name", "")
        # Проверяем точное совпадение или с версией
        if proj_name == base_name or re.match(rf'^{re.escape(base_name)}\s+\(версия\s+\d+\)$', proj_name):
            matching_projects.append(proj_name)

    # Если есть совпадения - добавляем версию
    project_name = project.name
    if matching_projects:
        max_version = 1  # Если есть проект без версии, начинаем с версии 2

        for proj_name in matching_projects:
            # Ищем версию в названии
            version_match = re.search(r'\(версия\s+(\d+)\)$', proj_name)
            if version_match:
                version = int(version_match.group(1))
                max_version = max(max_version, version)

        # Формируем новое название с версией
        project_name = f"{base_name} (версия {max_version + 1})"

    result = await projects_service.create_project(
        name=project_name,
        description=project.description,
        created_by=user_email
    )
    return ProjectResponse(**result)

@router.get("/", response_model=ProjectListResponse)
async def get_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Поиск по названию проекта"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: Optional[str] = Query(None, description="Поле для сортировки"),
    sort_order: Optional[str] = Query(None, description="Направление сортировки (asc/desc)"),
    current_user: dict = Depends(get_current_user)
):
    """Получить список проектов с поиском, фильтрацией и сортировкой"""
    result = await projects_service.get_projects(
        status_filter=status_filter.value if status_filter else None,
        search=search,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return ProjectListResponse(**result)

@router.get("/my", response_model=ProjectListResponse)
async def get_my_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Поиск по названию проекта"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: Optional[str] = Query(None, description="Поле для сортировки"),
    sort_order: Optional[str] = Query(None, description="Направление сортировки (asc/desc)"),
    current_user: dict = Depends(get_current_user)
):
    """Получить все проекты текущего пользователя с поиском и сортировкой"""
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email not found in token"
        )

    result = await projects_service.get_user_projects(
        user_email=user_email,
        status_filter=status_filter.value if status_filter else None,
        search=search,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return ProjectListResponse(**result)

@router.get("/{project_id}", response_model=ProjectDetailedResponse)
async def get_project(
    project_id: str,
    include_mappings: bool = Query(True),
    include_history: bool = Query(False),
    include_files: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """Получить проект по ID с файлами"""
    result = await projects_service.get_project(
        project_id=project_id,
        include_mappings=include_mappings,
        include_history=include_history,
        include_files=include_files
    )
    return ProjectDetailedResponse(**result)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновить проект (с автоматическим версионированием если название существует)"""
    import re

    user_email = current_user.get("email")
    update_data = project_update.dict(exclude_unset=True)

    # Если обновляется название, проверяем на дубликаты и добавляем версию
    if "name" in update_data:
        # Получаем текущий проект, чтобы исключить его из проверки
        current_project = await projects_service.get_project(project_id)
        if not current_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Проверяем существующие проекты с таким названием и добавляем версию
        all_projects = await projects_service.get_projects(limit=250)
        existing_projects = all_projects.get("projects", [])

        # Исключаем текущий проект из проверки
        existing_projects = [p for p in existing_projects if p.get("id") != project_id]

        # Базовое имя без версии
        base_name = re.sub(r'\s+\(версия\s+\d+\)$', '', update_data["name"])

        # Находим все проекты с похожим названием
        matching_projects = []
        for proj in existing_projects:
            proj_name = proj.get("name", "")
            # Проверяем точное совпадение или с версией
            if proj_name == base_name or re.match(rf'^{re.escape(base_name)}\s+\(версия\s+\d+\)$', proj_name):
                matching_projects.append(proj_name)

        # Если есть совпадения - добавляем версию
        if matching_projects:
            max_version = 1  # Если есть проект без версии, начинаем с версии 2

            for proj_name in matching_projects:
                # Ищем версию в названии
                version_match = re.search(r'\(версия\s+(\d+)\)$', proj_name)
                if version_match:
                    version = int(version_match.group(1))
                    max_version = max(max_version, version)

            # Формируем новое название с версией
            update_data["name"] = f"{base_name} (версия {max_version + 1})"

    result = await projects_service.update_project(
        project_id=project_id,
        update_data=update_data,
        user_id=user_email
    )
    return ProjectResponse(**result)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Удалить проект"""
    await projects_service.delete_project(project_id)
    return None

# ============ FIELD MAPPINGS ENDPOINTS ============

@router.post("/{project_id}/mappings", response_model=FieldMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_field_mapping(
    project_id: str,
    mapping: FieldMappingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Создать маппинг поля для проекта"""
    result = await projects_service.create_field_mapping(
        project_id=project_id,
        mapping_data=mapping.dict()
    )
    return FieldMappingResponse(**result)

@router.post("/{project_id}/mappings/bulk", response_model=FieldMappingListResponse, status_code=status.HTTP_201_CREATED)
async def bulk_create_mappings(
    project_id: str,
    mappings: List[FieldMappingCreate],
    current_user: dict = Depends(get_current_user)
):
    """Массовое создание маппингов для проекта"""
    result = await projects_service.bulk_create_mappings(
        project_id=project_id,
        mappings=[m.dict() for m in mappings]
    )
    return FieldMappingListResponse(**result)

@router.get("/{project_id}/mappings", response_model=FieldMappingListResponse)
async def get_project_mappings(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Получить все маппинги проекта"""
    result = await projects_service.get_project_mappings(project_id)
    return FieldMappingListResponse(**result)

@router.put("/mappings/{mapping_id}", response_model=FieldMappingResponse)
async def update_field_mapping(
    mapping_id: str,
    mapping_update: FieldMappingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновить маппинг поля"""
    result = await projects_service.update_field_mapping(
        mapping_id=mapping_id,
        update_data=mapping_update.dict(exclude_unset=True)
    )
    return FieldMappingResponse(**result)

@router.delete("/mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field_mapping(
    mapping_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Удалить маппинг поля"""
    await projects_service.delete_field_mapping(mapping_id)
    return None

# ============ FULL PROJECT CREATION ENDPOINT ============

@router.post("/full", status_code=status.HTTP_201_CREATED)
async def create_full_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    file_types: str = Form(...),  # Принимаем как строку (для Swagger)
    generate: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """
    Создать проект с файлами и опционально сгенерировать VM шаблон

    Полный цикл в одном запросе:
    1. Создаёт проект (с автоматическим версионированием если название существует)
    2. Загружает файлы
    3. Опционально генерирует VM шаблон (если generate=true)

    - **name**: Название проекта (если уже существует, добавится v2, v3 и т.д.)
    - **description**: Описание проекта (опционально)
    - **files**: Список файлов для загрузки
    - **file_types**: Типы файлов через запятую, например: "JSON_SCHEMA,XSD_SCHEMA,TEST_DATA"
    - **generate**: Запустить генерацию VM шаблона сразу (по умолчанию false)
    """
    try:
        import re

        user_email = current_user.get("email")
        user_uuid = current_user.get("uuid")

        file_types_list = [ft.strip() for ft in file_types.split(',')]

        if len(files) != len(file_types_list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Number of files ({len(files)}) must match number of file_types ({len(file_types_list)})"
            )

        # Проверяем существующие проекты с таким названием и добавляем версию
        all_projects = await projects_service.get_projects(limit=250)
        existing_projects = all_projects.get("projects", [])

        # Базовое имя без версии
        base_name = re.sub(r'\s+\(версия\s+\d+\)$', '', name)

        # Находим все проекты с похожим названием
        matching_projects = []
        for proj in existing_projects:
            proj_name = proj.get("name", "")
            # Проверяем точное совпадение или с версией
            if proj_name == base_name or re.match(rf'^{re.escape(base_name)}\s+\(версия\s+\d+\)$', proj_name):
                matching_projects.append(proj_name)

        # Если есть совпадения - добавляем версию
        if matching_projects:
            max_version = 1  # Если есть проект без версии, начинаем с версии 2

            for proj_name in matching_projects:
                # Ищем версию в названии
                version_match = re.search(r'\(версия\s+(\d+)\)$', proj_name)
                if version_match:
                    version = int(version_match.group(1))
                    max_version = max(max_version, version)

            # Формируем новое название с версией
            name = f"{base_name} (версия {max_version + 1})"


        project = await projects_service.create_project(
            name=name,
            description=description,
            created_by=user_email
        )
        project_id = project["id"]

        uploaded_files = []
        for file, file_type in zip(files, file_types_list):
            valid_types = ["JSON_SCHEMA", "XSD_SCHEMA", "TEST_DATA", "VM_TEMPLATE"]
            if file_type not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file_type: {file_type}. Must be one of {valid_types}"
                )

            file_result = await files_service.upload_file(
                file=file,
                project_id=project_id,
                file_type=file_type,
                uploaded_by=user_uuid
            )
            uploaded_files.append(file_result)

        generation_result = None
        if generate:
            try:
                project_files = await files_service.get_project_files(project_id)

                json_file = next((f for f in project_files if f.get("file_type") == "JSON_SCHEMA"), None)
                xsd_file = next((f for f in project_files if f.get("file_type") == "XSD_SCHEMA"), None)

                if not json_file or not xsd_file:
                    generation_result = {
                        "success": False,
                        "error": "JSON_SCHEMA and XSD_SCHEMA files are required for generation"
                    }
                else:
                    json_content_bytes = await files_service.download_file(json_file["id"])
                    xsd_content_bytes = await files_service.download_file(xsd_file["id"])

                    json_content = json_content_bytes.decode('utf-8')
                    xsd_content = xsd_content_bytes.decode('utf-8')

                    test_data = None
                    test_data_file = next((f for f in project_files if f.get("file_type") == "TEST_DATA"), None)
                    if test_data_file:
                        import json as json_lib
                        test_data_content_bytes = await files_service.download_file(test_data_file["id"])
                        test_data_content = test_data_content_bytes.decode('utf-8')
                        test_data = json_lib.loads(test_data_content)

                    result = await generator_client.complete_generation(
                        json_schema_content=json_content,
                        xsd_schema_content=xsd_content,
                        test_data=test_data,
                        include_preview=bool(test_data)
                    )

                    if result.get("success"):
                        mappings = result.get("mappings", [])
                        if mappings:
                            await projects_service.bulk_create_mappings(project_id, mappings)

                        template = result.get("template", "")
                        if template:
                            template_file = await files_service.upload_file_content(
                                project_id=project_id,
                                file_name="generated_template.vm",
                                file_content=template.encode('utf-8'),
                                file_type="VM_TEMPLATE",
                                uploaded_by=user_uuid
                            )

                            await projects_service.update_project(
                                project_id=project_id,
                                update_data={"status": "COMPLETED"}
                            )

                            generation_result = {
                                "success": True,
                                "template_file_id": template_file.get("id"),
                                "mappings_count": len(mappings),
                                "validation": result.get("validation")
                            }
                    else:
                        generation_result = {
                            "success": False,
                            "error": result.get("error")
                        }

            except Exception as e:
                generation_result = {
                    "success": False,
                    "error": f"Generation failed: {str(e)}"
                }

        final_project = await projects_service.get_project(
            project_id=project_id,
            include_mappings=True,
            include_history=True,
            include_files=True
        )

        return {
            "success": True,
            "project": final_project,
            "uploaded_files": uploaded_files,
            "generation": generation_result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create full project: {str(e)}"
        )

