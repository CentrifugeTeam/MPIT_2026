from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    AutoMapRequest, AutoMapResponse,
    SimilarityRequest, SimilarityResponse
)
from app.services import FieldMapper

router = APIRouter()

field_mapper = FieldMapper()

@router.post("/auto-map", response_model=AutoMapResponse)
async def auto_map_fields(request: AutoMapRequest):
    """Автоматическое сопоставление полей JSON и XML. Использует алгоритмы схожести строк для нахождения соответствий"""
    try:
        mappings, unmapped_json, unmapped_xml = field_mapper.auto_map(
            request.json_schema,
            request.xsd_schema
        )
        
        return AutoMapResponse(
            success=True,
            mappings=mappings,
            total_mapped=len(mappings),
            total_unmapped=len(unmapped_json) + len(unmapped_xml),
            unmapped_json_fields=unmapped_json,
            unmapped_xml_elements=unmapped_xml
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to map fields: {str(e)}"
        )

@router.post("/calculate-similarity", response_model=SimilarityResponse)
async def calculate_similarity(request: SimilarityRequest):
    """Вычисление схожести двух строк. Полезно для ручной проверки качества маппинга"""
    try:
        similarity = field_mapper.calculate_string_similarity(
            request.source,
            request.target
        )
        
        return SimilarityResponse(
            similarity=round(similarity, 2),
            algorithm="levenshtein + fuzzy"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate similarity: {str(e)}"
        )

