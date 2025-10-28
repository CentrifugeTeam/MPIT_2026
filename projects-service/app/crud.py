from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from uuid import UUID
from typing import List, Optional
from app.models import Project, FieldMapping, ProjectHistory, ProjectStatus
from app.schemas import ProjectCreate, ProjectUpdate, FieldMappingCreate, FieldMappingUpdate

# ============ PROJECT CRUD ============

def create_project(
    db: Session,
    project: ProjectCreate,
    created_by: Optional[str] = None
) -> Project:
    """Создать новый проект"""
    db_project = Project(
        name=project.name,
        description=project.description,
        created_by=created_by,  # Теперь это email
        status=ProjectStatus.DRAFT
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Добавить запись в историю
    create_history_entry(
        db=db,
        project_id=db_project.id,
        action="CREATED",
        user_id=created_by,  # email
        description=f"Project '{project.name}' created"
    )

    return db_project

def get_project(db: Session, project_id: UUID) -> Optional[Project]:
    """Получить проект по ID"""
    return db.query(Project).filter(Project.id == project_id).first()

def get_projects(
    db: Session,
    created_by: Optional[str] = None,
    status: Optional[ProjectStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
) -> List[Project]:
    """Получить список проектов с фильтрацией и сортировкой"""
    query = db.query(Project)

    if created_by:
        query = query.filter(Project.created_by == created_by)

    if status:
        query = query.filter(Project.status == status)

    if search:
        query = query.filter(Project.name.ilike(f"{search}%"))

    # Сортировка
    order_func = desc if sort_order == "desc" else asc

    if sort_by == "created_at":
        query = query.order_by(order_func(Project.created_at))
    elif sort_by == "name":
        query = query.order_by(order_func(Project.name))
    elif sort_by == "status":
        query = query.order_by(order_func(Project.status))
    elif sort_by == "total_size":
        # total_size не хранится в БД, поэтому сортируем по created_at по умолчанию
        # Сортировка по размеру будет на уровне приложения после получения размеров
        query = query.order_by(desc(Project.created_at))
    else:
        # По умолчанию сортируем по дате создания (от новых к старым)
        query = query.order_by(desc(Project.created_at))

    return query.offset(skip).limit(limit).all()

def count_projects(
    db: Session,
    created_by: Optional[str] = None,
    status: Optional[ProjectStatus] = None,
    search: Optional[str] = None
) -> int:
    """Подсчитать общее количество проектов с учетом фильтров"""
    query = db.query(Project)

    if created_by:
        query = query.filter(Project.created_by == created_by)

    if status:
        query = query.filter(Project.status == status)

    if search:
        query = query.filter(Project.name.ilike(f"{search}%"))

    return query.count()

def update_project(
    db: Session,
    project_id: UUID,
    project_update: ProjectUpdate,
    user_id: Optional[str] = None
) -> Optional[Project]:
    """Обновить проект"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None

    update_data = project_update.dict(exclude_unset=True)
    changes = {}

    for field, value in update_data.items():
        old_value = getattr(db_project, field)
        if old_value != value:
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)

    # Добавить в историю
    if changes:
        create_history_entry(
            db=db,
            project_id=project_id,
            action="UPDATED",
            user_id=user_id,  # email
            changes=changes,
            description=f"Project updated: {', '.join(changes.keys())}"
        )

    return db_project

def delete_project(db: Session, project_id: UUID) -> bool:
    """Удалить проект"""
    db_project = get_project(db, project_id)
    if not db_project:
        return False

    db.delete(db_project)
    db.commit()
    return True

# ============ FIELD MAPPING CRUD ============

def create_field_mapping(
    db: Session,
    project_id: UUID,
    mapping: FieldMappingCreate
) -> FieldMapping:
    """Создать маппинг поля"""
    db_mapping = FieldMapping(
        project_id=project_id,
        **mapping.dict()
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping

def get_field_mapping(db: Session, mapping_id: UUID) -> Optional[FieldMapping]:
    """Получить маппинг по ID"""
    return db.query(FieldMapping).filter(FieldMapping.id == mapping_id).first()

def get_project_mappings(db: Session, project_id: UUID) -> List[FieldMapping]:
    """Получить все маппинги проекта"""
    return db.query(FieldMapping).filter(FieldMapping.project_id == project_id).all()

def update_field_mapping(
    db: Session,
    mapping_id: UUID,
    mapping_update: FieldMappingUpdate
) -> Optional[FieldMapping]:
    """Обновить маппинг"""
    db_mapping = get_field_mapping(db, mapping_id)
    if not db_mapping:
        return None

    update_data = mapping_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_mapping, field, value)

    db.commit()
    db.refresh(db_mapping)
    return db_mapping

def delete_field_mapping(db: Session, mapping_id: UUID) -> bool:
    """Удалить маппинг"""
    db_mapping = get_field_mapping(db, mapping_id)
    if not db_mapping:
        return False

    db.delete(db_mapping)
    db.commit()
    return True

def bulk_create_mappings(
    db: Session,
    project_id: UUID,
    mappings: List[FieldMappingCreate]
) -> List[FieldMapping]:
    """Массовое создание маппингов"""
    db_mappings = [
        FieldMapping(project_id=project_id, **mapping.dict())
        for mapping in mappings
    ]
    db.add_all(db_mappings)
    db.commit()

    for mapping in db_mappings:
        db.refresh(mapping)

    return db_mappings

# ============ PROJECT HISTORY CRUD ============

def create_history_entry(
    db: Session,
    project_id: UUID,
    action: str,
    user_id: Optional[str] = None,
    changes: Optional[dict] = None,
    description: Optional[str] = None
) -> ProjectHistory:
    """Создать запись в истории проекта"""
    db_history = ProjectHistory(
        project_id=project_id,
        action=action,
        user_id=user_id,  # email
        changes=changes,
        description=description
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_project_history(
    db: Session,
    project_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> List[ProjectHistory]:
    """Получить историю проекта"""
    return (
        db.query(ProjectHistory)
        .filter(ProjectHistory.project_id == project_id)
        .order_by(desc(ProjectHistory.timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )

