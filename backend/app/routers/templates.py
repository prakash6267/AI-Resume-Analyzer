from typing import List
from fastapi import APIRouter
from app.schemas import TemplateInfo
from app.services.render_service import render_service

router = APIRouter(prefix="/api/templates", tags=["Templates"])

@router.get("", response_model=List[TemplateInfo])
async def list_templates():
    return render_service.get_template_list()
