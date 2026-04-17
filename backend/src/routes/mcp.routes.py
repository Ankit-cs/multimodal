from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.concurrency import run_in_threadpool
from typing import Dict, Any
import uuid

from src.db.database import db_service
from src.services.rag import extract_text_from_file, chunk_text, embed_texts

router = APIRouter(prefix="/api", tags=["MCP & Resources"])

@router.post("/upload")
async def upload_document(session_id: str = Form(...), file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        def process_doc(c, filename):
            t = extract_text_from_file(c, filename)
            chr = chunk_text(t, chunk_size=800, overlap=100)
            if not chr: return None, None
            emb = embed_texts(chr)
            return chr, emb
            
        chunks, embeddings = await run_in_threadpool(process_doc, content, file.filename)
        
        if not chunks:
            return {"status": "error", "message": "No text extracted from document"}
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{uuid.uuid4().hex[:8]}"
            metadata = {"filename": file.filename, "chunk_index": i}
            await db_service.save_chunk(session_id, chunk_id, chunk, embedding, metadata)
            
        return {"status": "success", "chunks_processed": len(chunks), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mcp")
async def get_mcp_configs():
    configs = await db_service.get_mcp_configs()
    return {"configs": configs}

@router.post("/mcp")
async def save_mcp_config(config: Dict[str, Any]):
    if "id" not in config:
        config["id"] = f"mcp-{str(uuid.uuid4())[:8]}"
    await db_service.save_mcp_config(config)
    return config

@router.delete("/mcp/{mcp_id}")
async def delete_mcp_config(mcp_id: str):
    await db_service.delete_mcp_config(mcp_id)
    return {"status": "success"}
