import logging
import os
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from database import client
from seed import seed_database
from routers import schools, students, stamps, classes, recap, rgpd, analytics

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PasseportEtudiant API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

for router_module in (schools, students, stamps, classes, recap, rgpd, analytics):
    app.include_router(router_module.router, prefix="/api")


@app.on_event("startup")
async def startup():
    await seed_database()
    logger.info("Seed done.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
