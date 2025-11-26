import logging
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from ..database.connection import supabase

router = APIRouter(prefix="/tiktok", tags=["tiktok"])
logger = logging.getLogger(__name__)

BUCKET_NAME = "aivideogenerated"


class UploadVideo(BaseModel):
    id: Optional[str] = None
    video_url: Optional[HttpUrl] = Field(None, alias="videoUrl")
    video_path: Optional[str] = Field(None, alias="videoPath")
    title: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "alias_generator": None,
        "allow_population_by_field_name": True,
    }


class UploadRequest(BaseModel):
    access_token: str
    videos: List[UploadVideo]


async def _init_tiktok_publish(client: httpx.AsyncClient, access_token: str, title: Optional[str]):
    payload = {
        "post_info": {
            "title": (title or "AI video")[:150],
            "privacy_level": "PUBLIC_TO_EVERYONE",
        },
        "source_info": {"source": "FILE_UPLOAD"},
    }
    resp = await client.post(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
        timeout=30,
    )
    data = resp.json() if resp.content else {}
    upload_url = data.get("data", {}).get("upload_url")
    publish_id = data.get("data", {}).get("publish_id")
    if not resp.is_success or not upload_url or not publish_id:
        raise HTTPException(
            status_code=502,
            detail={"message": "TikTok init failed", "payload": data},
        )
    return upload_url, publish_id


async def _signed_supabase_url(path: str) -> str:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client unavailable")
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(path, 60 * 30)
        if isinstance(signed, dict):
            signed_url = signed.get("signedURL") or signed.get("signed_url")
        else:
            signed_url = signed
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to sign Supabase path")
        return signed_url
    except Exception as exc:
        logger.error("Supabase signed URL error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to sign Supabase path")


async def _stream_upload(upload_url: str, source_url: str) -> None:
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("GET", source_url) as src:
            if src.status_code != 200:
                text = await src.aread()
                raise HTTPException(
                    status_code=502,
                    detail={
                        "message": "Failed to read source video",
                        "status": src.status_code,
                        "body": text.decode(errors="ignore"),
                    },
                )

            put_resp = await client.put(
                upload_url,
                headers={"Content-Type": "video/mp4"},
                content=src.aiter_bytes(),
            )

            if not put_resp.is_success:
                raise HTTPException(
                    status_code=502,
                    detail={
                        "message": "TikTok upload failed",
                        "status": put_resp.status_code,
                        "body": put_resp.text,
                    },
                )


async def _complete_publish(client: httpx.AsyncClient, access_token: str, publish_id: str):
    resp = await client.post(
        "https://open.tiktokapis.com/v2/post/publish/complete/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"publish_id": publish_id},
        timeout=30,
    )
    data = resp.json() if resp.content else {}
    if not resp.is_success:
        raise HTTPException(
            status_code=502,
            detail={"message": "TikTok publish completion failed", "payload": data},
        )
    return data


@router.post("/upload-ai-video")
async def upload_ai_video(body: UploadRequest):
    if not body.videos:
        raise HTTPException(status_code=400, detail="No videos provided")

    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for video in body.videos:
            try:
                upload_url, publish_id = await _init_tiktok_publish(client, body.access_token, video.title)

                source_url: Optional[str] = None
                if video.video_url:
                    source_url = str(video.video_url)
                elif video.video_path:
                    source_url = await _signed_supabase_url(video.video_path)

                if not source_url:
                    raise HTTPException(status_code=400, detail="Missing video_url or video_path")

                await _stream_upload(upload_url, source_url)
                complete_payload = await _complete_publish(client, body.access_token, publish_id)

                results.append({"id": video.id, "status": "ok", "publish_id": publish_id, "result": complete_payload})
            except HTTPException as exc:
                results.append({"id": video.id, "status": "error", "error": exc.detail})
            except Exception as exc:  # pragma: no cover - unexpected
                logger.error("Unexpected TikTok upload error: %s", exc)
                results.append({"id": video.id, "status": "error", "error": "Unexpected server error"})

    return {"results": results}
