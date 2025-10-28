from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import projects, mappings
from app.database import engine, Base

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Projects Service",
    description="Project Management Service for VM Template Generator",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(mappings.router, prefix="/mappings", tags=["mappings"])

@app.get("/")
async def root():
    return {"message": "Projects Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

