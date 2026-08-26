import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv

load_dotenv()

from routers import trips, ai, places, weather, expenses, images

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _error_response(code: str, message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


app = FastAPI(title="Adaptive AI Travel Planner API", version="1.0.0")

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(ai.router)
app.include_router(places.router)
app.include_router(weather.router)
app.include_router(expenses.router)
app.include_router(images.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    if exc.status_code == 404:
        return _error_response("NOT_FOUND", detail, status_code=404)
    if exc.status_code == 401:
        return _error_response("UNAUTHORIZED", detail, status_code=401)
    if exc.status_code == 403:
        return _error_response("FORBIDDEN", detail, status_code=403)
    return _error_response("HTTP_ERROR", detail, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response("VALIDATION_ERROR", "Invalid request data.", status_code=422)


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    return _error_response("VALIDATION_ERROR", "Invalid response data.", status_code=500)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return _error_response(exc.code, exc.message, status_code=exc.status_code)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    code = getattr(exc, "code", "INTERNAL_ERROR")
    message = getattr(exc, "message", "An unexpected error occurred.")
    status_code = getattr(exc, "status_code", 500)
    if status_code == 500:
        return _error_response("INTERNAL_ERROR", "An unexpected error occurred.", status_code=500)
    return _error_response(code, message, status_code=status_code)
