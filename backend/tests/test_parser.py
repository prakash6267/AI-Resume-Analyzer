import pytest
import io
import fitz # PyMuPDF
import docx
from fastapi import HTTPException
from app.services.parser_service import parser_service

def test_extract_text_from_pdf():
    # Create an in-memory PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Jane Doe\nSenior Cloud Engineer\njane.doe@example.com\nSan Francisco, CA\n\nExperience:\n- Built Kubernetes clusters saving $400k annually.")
    pdf_bytes = doc.tobytes()
    doc.close()

    extracted_text, page_count = parser_service.extract_text_from_pdf(pdf_bytes)
    assert page_count == 1
    assert "Jane Doe" in extracted_text
    assert "Senior Cloud Engineer" in extracted_text
    assert "Kubernetes" in extracted_text

def test_extract_text_from_pdf_page_limit_exceeded():
    # Create a 6-page PDF
    doc = fitz.open()
    for i in range(6):
        page = doc.new_page()
        page.insert_text((50, 72), f"Page {i+1} Content")
    pdf_bytes = doc.tobytes()
    doc.close()

    with pytest.raises(HTTPException) as exc_info:
        parser_service.extract_text_from_pdf(pdf_bytes)
    
    assert exc_info.value.status_code == 400
    assert "exceeds maximum allowed 5 pages" in exc_info.value.detail

def test_extract_text_from_docx():
    # Create an in-memory DOCX
    doc = docx.Document()
    doc.add_heading("Alex Morgan", level=1)
    doc.add_paragraph("Full Stack Developer • alex@example.com")
    doc.add_paragraph("Engineered high scale web application serving 100k daily active users.")
    
    buf = io.BytesIO()
    doc.save(buf)
    docx_bytes = buf.getvalue()

    extracted = parser_service.extract_text_from_docx(docx_bytes)
    assert "Alex Morgan" in extracted
    assert "Full Stack Developer" in extracted
    assert "100k daily active users" in extracted
