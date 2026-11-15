
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from tickets import router as ticket_router
from agent_tickets import router as agent_router
from agent_messages import router as agent_messages_router
from customer_messages import router as customer_messages_router
from admin import router as admin_router
from agent_ai import router as agent_ai_router
from notifications import router as notifications_router

from database import Base, engine
import models


app = FastAPI(
    title="AI Customer Support API",
    description="AI-powered customer support and ticket management system",
    version="1.0.0"
)


# CORS Configuration

frontend_url = os.getenv("FRONTEND_URL")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers

app.include_router(auth_router)
app.include_router(ticket_router)
app.include_router(agent_router)
app.include_router(agent_messages_router)
app.include_router(customer_messages_router)
app.include_router(admin_router)
app.include_router(agent_ai_router)
app.include_router(notifications_router)


# Root Endpoint

@app.get("/")
def home():
    return {"message": "AI Customer Support API is running!"}


# Health Check Endpoint

@app.get("/health")
def health_check():
    return {"status": "ok"}


# Create Database Tables

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
