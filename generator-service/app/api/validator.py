from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    ValidateTemplateRequest, ValidateTemplateResponse,
    ValidateOutputRequest, ValidateOutputResponse
)
from app.services import TemplateValidator

router = APIRouter()

validator = TemplateValidator()

@router.post("/template", response_model=ValidateTemplateResponse)
async def validate_template(request: ValidateTemplateRequest):
    """Валидация VM-шаблона"""
    try:
        is_syntax_valid, syntax_errors = validator.validate_syntax(request.template)
        
        errors = []
        warnings = []
        
        for error in syntax_errors:
            if error.severity == "error":
                errors.append(error)
            else:
                warnings.append(error)
        
        if request.mappings:
            is_vars_valid, var_errors = validator.validate_variables(
                request.template,
                request.mappings
            )
            
            for error in var_errors:
                if error.severity == "error":
                    errors.append(error)
                else:
                    warnings.append(error)
        
        is_valid = len(errors) == 0
        
        return ValidateTemplateResponse(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate template: {str(e)}"
        )

@router.post("/output", response_model=ValidateOutputResponse)
async def validate_output(request: ValidateOutputRequest):
    """Валидация выходного XML"""
    try:
        is_valid, errors = validator.validate_output(
            request.xml_output,
            request.xsd_schema
        )
        
        return ValidateOutputResponse(
            is_valid=is_valid,
            errors=errors
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate output: {str(e)}"
        )

