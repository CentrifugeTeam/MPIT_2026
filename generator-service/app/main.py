from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import parser, mapper, generator, validator, complete

# Создание FastAPI приложения
app = FastAPI(
    title="Generator Service",
    description="VM Template Generator for EPGU-VIS Integration",
    version="1.0.0"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(parser.router, prefix="/api/parse", tags=["Parser"])
app.include_router(mapper.router, prefix="/api/mapper", tags=["Mapper"])
app.include_router(generator.router, prefix="/api/generate", tags=["Generator"])
app.include_router(validator.router, prefix="/api/validate", tags=["Validator"])
app.include_router(complete.router, prefix="/api/complete", tags=["Complete Flow"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "service": settings.SERVICE_NAME,
        "status": "healthy",
        "endpoints": {
            "parse": "/api/v1/parse",
            "mapper": "/api/v1/mapper",
            "generate": "/api/v1/generate",
            "validate": "/api/v1/validate",
            "complete": "/api/v1/complete"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

