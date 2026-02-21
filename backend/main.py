from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, assignments, drafts, files, educator
import models  # noqa: F401 – ensures models are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="IntegrityAI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["drafts"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(educator.router, prefix="/api/educator", tags=["educator"])

@app.get("/")
def root():
    return {"message": "IntegrityAI API running", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}
