from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import health_router, sft_router, harbor_router
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting SeekingData Pro Backend...")
    print(f"📁 Tasks directory: {settings.tasks_dir}")
    print(f"🔑 LLM API configured: {'Yes' if settings.llm_api_key else 'No'}")
    yield
    print("👋 Shutting down SeekingData Pro Backend...")


app = FastAPI(
    title="SeekingData Pro",
    description="SFT Data Generation + Harbor Task Management Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(sft_router)
app.include_router(harbor_router)


@app.get("/")
async def root():
    return {
        "message": "SeekingData Pro API",
        "version": "0.1.0",
        "docs": "/docs",
    }
