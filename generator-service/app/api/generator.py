from fastapi import APIRouter
from app.schemas import (
    GenerateTemplateRequest, GenerateTemplateResponse,
    PreviewRequest, PreviewResponse
)
from app.services import VmTemplateGenerator, TemplateValidator

router = APIRouter()

vm_generator = VmTemplateGenerator()
validator = TemplateValidator()

@router.post("/template", response_model=GenerateTemplateResponse)
async def generate_template(request: GenerateTemplateRequest):
    """Генерация VM-шаблона"""
    try:
        template = vm_generator.generate(
            mappings=request.mappings,
            xsd_structure=request.xsd_structure,
            include_comments=request.include_comments,
            include_null_checks=request.include_null_checks
        )
        
        line_count = vm_generator.count_lines(template)
        
        return GenerateTemplateResponse(
            success=True,
            template=template,
            error=None,
            line_count=line_count
        )
    except Exception as e:
        return GenerateTemplateResponse(
            success=False,
            template=None,
            error=str(e),
            line_count=0
        )

@router.post("/preview", response_model=PreviewResponse)
async def preview_transformation(request: PreviewRequest):
    """Предпросмотр результата трансформации"""
    try:
        output = validator.test_transformation(
            template=request.template,
            test_data=request.test_data
        )
        
        return PreviewResponse(
            success=True,
            output=output,
            error=None
        )
    except Exception as e:
        return PreviewResponse(
            success=False,
            output=None,
            error=str(e)
        )

