from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.schemas import Expense, ExpenseCreate, ExpenseUpdate
from services.auth import get_current_user, AuthenticatedUser
from db.supabase_client import (
    create_expense,
    get_expense,
    list_trip_expenses,
    update_expense,
    delete_expense,
    get_expense_summary,
)

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("/", response_model=Expense)
async def create_expense_endpoint(request: ExpenseCreate, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        data = request.model_dump()
        data["user_id"] = user.user_id
        saved = await create_expense(data)
        return Expense(**saved)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/trip/{trip_id}", response_model=List[Expense])
async def list_expenses(trip_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        rows = await list_trip_expenses(trip_id)
        if not rows:
            return []
        owner_id = rows[0].get("user_id")
        if owner_id and owner_id != user.user_id:
            raise HTTPException(status_code=404, detail="Trip not found")
        return [Expense(**r) for r in rows]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/trip/{trip_id}/summary")
async def expense_summary(trip_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        rows = await list_trip_expenses(trip_id)
        if rows and rows[0].get("user_id") != user.user_id:
            raise HTTPException(status_code=404, detail="Trip not found")
        summary = await get_expense_summary(trip_id)
        return summary
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/{expense_id}", response_model=Expense)
async def get_expense_endpoint(expense_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        expense = await get_expense(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        if expense.get("user_id") != user.user_id:
            raise HTTPException(status_code=404, detail="Expense not found")
        return Expense(**expense)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.put("/{expense_id}", response_model=Expense)
async def update_expense_endpoint(expense_id: str, updates: ExpenseUpdate, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        existing = await get_expense(expense_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")
        if existing.get("user_id") != user.user_id:
            raise HTTPException(status_code=404, detail="Expense not found")
        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        updated = await update_expense(expense_id, update_data)
        return Expense(**updated)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.delete("/{expense_id}")
async def delete_expense_endpoint(expense_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        existing = await get_expense(expense_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")
        if existing.get("user_id") != user.user_id:
            raise HTTPException(status_code=404, detail="Expense not found")
        success = await delete_expense(expense_id)
        return {"success": success}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
