from sqlalchemy import Column, String, DateTime, Text, Boolean, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base

class ProjectStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    mappings = relationship("FieldMapping", back_populates="project", cascade="all, delete-orphan")
    history = relationship("ProjectHistory", back_populates="project", cascade="all, delete-orphan")

class FieldMapping(Base):
    __tablename__ = "field_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # JSON поле
    json_field_id = Column(String, nullable=False)  # Например: "lastName"
    json_field_path = Column(String, nullable=False)  # JSONPath: "$request.lastName"
    json_field_label = Column(String, nullable=True)  # Человеко-читаемое название
    
    # XML элемент
    xml_element_name = Column(String, nullable=False)  # Например: "FamilyName"
    xml_element_path = Column(String, nullable=True)  # XPath если нужен
    
    # VM переменная
    variable_name = Column(String, nullable=False)  # Имя переменной в VM шаблоне
    
    # Метаданные маппинга
    is_auto_mapped = Column(Boolean, default=True, nullable=False)  # Автоматически или вручную
    confidence_score = Column(Float, nullable=True)  # Уверенность алгоритма (0.0 - 1.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связь с проектом
    project = relationship("Project", back_populates="mappings")

class ProjectHistory(Base):
    __tablename__ = "project_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    action = Column(String, nullable=False)  # CREATED, UPDATED, GENERATED, MAPPED, etc.
    user_id = Column(String, nullable=True)  # Email пользователя
    changes = Column(JSON, nullable=True)  # Детали изменений
    description = Column(Text, nullable=True)  # Человеко-читаемое описание
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связь с проектом
    project = relationship("Project", back_populates="history")

