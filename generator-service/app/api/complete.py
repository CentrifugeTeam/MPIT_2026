from fastapi import APIRouter, HTTPException, status
from app.schemas import CompleteGenerationRequest, CompleteGenerationResponse
from app.services import (
    JsonSchemaParser, XsdSchemaParser, 
    FieldMapper, VmTemplateGenerator, TemplateValidator
)

router = APIRouter()

# Инициализация сервисов
json_parser = JsonSchemaParser()
xsd_parser = XsdSchemaParser()
field_mapper = FieldMapper()
vm_generator = VmTemplateGenerator()
validator = TemplateValidator()

@router.post("/generate", response_model=CompleteGenerationResponse)
async def complete_generation(request: CompleteGenerationRequest):
    """Полный цикл генерации: парсинг -> маппинг -> генерация"""
    try:
        parsed_json = json_parser.parse(request.json_schema_content)
        parsed_xsd = xsd_parser.parse(request.xsd_schema_content)
        mappings, _, _ = field_mapper.auto_map(parsed_json, parsed_xsd)
        
        template = vm_generator.generate(
            mappings=mappings,
            xsd_structure=parsed_xsd,
            include_comments=request.include_comments,
            include_null_checks=request.include_null_checks
        )
        
        is_valid, validation_errors = validator.validate_syntax(template)
        _, var_errors = validator.validate_variables(template, mappings)
        
        all_errors = validation_errors + var_errors
        errors_only = [e for e in all_errors if e.severity == "error"]
        warnings_only = [e for e in all_errors if e.severity == "warning"]
        
        from app.schemas import ValidateTemplateResponse
        validation = ValidateTemplateResponse(
            is_valid=len(errors_only) == 0,
            errors=errors_only,
            warnings=warnings_only
        )
        
        preview_output = None
        if request.include_preview and request.test_data:
            try:
                preview_output = validator.test_transformation(
                    template=template,
                    test_data=request.test_data
                )
            except Exception as e:
                preview_output = f"Preview failed: {str(e)}"
        
        return CompleteGenerationResponse(
            success=True,
            parsed_json=parsed_json,
            parsed_xsd=parsed_xsd,
            mappings=mappings,
            template=template,
            preview_output=preview_output,
            validation=validation,
            error=None
        )
        
    except ValueError as e:
        return CompleteGenerationResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete generation: {str(e)}"
        )

