from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    JsonSchemaParseRequest, JsonSchemaParseResponse,
    XsdSchemaParseRequest, XsdSchemaParseResponse
)
from app.services import JsonSchemaParser, XsdSchemaParser

router = APIRouter()

json_parser = JsonSchemaParser()
xsd_parser = XsdSchemaParser()

@router.post("/json-schema", response_model=JsonSchemaParseResponse)
async def parse_json_schema(request: JsonSchemaParseRequest):
    """Парсинг JSON-схемы формы ЕПГУ"""
    try:
        parsed_schema = json_parser.parse(request.file_content)
        
        return JsonSchemaParseResponse(
            success=True,
            data=parsed_schema,
            error=None
        )
    except ValueError as e:
        return JsonSchemaParseResponse(
            success=False,
            data=None,
            error=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse JSON schema: {str(e)}"
        )

@router.post("/xsd-schema", response_model=XsdSchemaParseResponse)
async def parse_xsd_schema(request: XsdSchemaParseRequest):
    """Парсинг XSD-схемы ведомственной системы"""
    try:
        parsed_schema = xsd_parser.parse(request.file_content)
        
        return XsdSchemaParseResponse(
            success=True,
            data=parsed_schema,
            error=None
        )
    except ValueError as e:
        return XsdSchemaParseResponse(
            success=False,
            data=None,
            error=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse XSD schema: {str(e)}"
        )

