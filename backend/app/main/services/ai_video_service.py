import logging
import uuid
from typing import Optional, Set

from fastapi import HTTPException, UploadFile

from ..config.settings import settings
from ..database.connection import supabase
from ..models.ai_video import AiVideoGenerateResponse

logger = logging.getLogger(__name__)


class AiVideoService:
    """Service layer responsible for storing AI video generation requests."""

    BUCKET_NAME = "aivideo"
    MAX_FILE_BYTES = 25 * 1024 * 1024  # 25 MB

    IMAGE_MIME_TYPES: Set[str] = {"image/jpeg", "image/png", "image/webp"}
    VOICE_MIME_TYPES: Set[str] = {
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/aac",
        "audio/mp4",
        "audio/x-m4a",
    }

    EXTENSION_CONTENT_TYPES = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "aac": "audio/aac",
        "m4a": "audio/mp4",
        "webm": "audio/webm",
    }

    @classmethod
    async def create_video_request(
        cls,
        creator_id: str,
        prompt: str,
        voice_sample: Optional[UploadFile],
        image: Optional[UploadFile],
    ) -> AiVideoGenerateResponse:
        """Persist a new AI video request and organize assets in storage."""
        logger.info("Creating AI video request for creator_id=%s", creator_id)
        client = cls._require_supabase()

        if not creator_id or not creator_id.strip():
            raise HTTPException(status_code=400, detail="creator_id is required")

        if not prompt or not prompt.strip():
            raise HTTPException(status_code=400, detail="prompt is required")

        request_id = str(uuid.uuid4())
        storage_root = f"{creator_id}/{request_id}"

        voice_sample_url = await cls._store_optional_asset(
            client=client,
            file=voice_sample,
            folder=storage_root,
            filename_prefix="voice-sample",
            allowed_types=cls.VOICE_MIME_TYPES,
            default_extension="wav",
        )

        image_url = await cls._store_optional_asset(
            client=client,
            file=image,
            folder=storage_root,
            filename_prefix="reference-image",
            allowed_types=cls.IMAGE_MIME_TYPES,
            default_extension="jpg",
        )

        payload = {
            "id": request_id,
            "creator_id": creator_id,
            "prompt": prompt.strip(),
            "voice_sample": voice_sample_url,
            "image": image_url,
        }

        try:
            client.table("AiVideoRequest").insert(payload).execute()
            logger.info("Stored AiVideoRequest record %s", request_id)
        except Exception as exc:
            logger.error("Failed to insert AiVideoRequest record: %s", exc)
            raise HTTPException(status_code=500, detail="Failed to save AI video request")

        return AiVideoGenerateResponse(
            request_id=request_id,
            creator_id=creator_id,
            prompt=payload["prompt"],
            voice_sample_url=voice_sample_url,
            image_url=image_url,
            storage_path=storage_root,
            status="queued",
            message="AI video request queued successfully",
        )

    @classmethod
    def _require_supabase(cls):
        if not supabase:
            logger.error("Supabase client is not configured")
            raise HTTPException(status_code=500, detail="Supabase client not configured")
        return supabase

    @classmethod
    async def _store_optional_asset(
        cls,
        client,
        file: Optional[UploadFile],
        folder: str,
        filename_prefix: str,
        allowed_types: Set[str],
        default_extension: str,
    ) -> Optional[str]:
        """Upload the provided file to storage and return its public URL."""
        if not file:
            return None

        cls._validate_content_type(file, allowed_types, filename_prefix)

        raw_content = await cls._read_file(file)
        extension = cls._extract_extension(file.filename, default_extension)
        storage_path = f"{folder}/{filename_prefix}.{extension}"
        options = {
            "content-type": file.content_type or cls._guess_content_type(extension),
            "upsert": True,
        }

        cls._upload_to_bucket(client, storage_path, raw_content, options, filename_prefix)
        return cls._get_public_url(client, storage_path)

    @classmethod
    def _validate_content_type(cls, file: UploadFile, allowed_types: Set[str], asset_label: str) -> None:
        if file.content_type and allowed_types and file.content_type not in allowed_types:
            readable = ", ".join(sorted(allowed_types))
            raise HTTPException(
                status_code=400,
                detail=f"{asset_label.replace('-', ' ').capitalize()} must be one of: {readable}",
            )

    @classmethod
    async def _read_file(cls, file: UploadFile) -> bytes:
        content = await file.read()
        file.file.seek(0)

        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        if len(content) > cls.MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 25MB per upload")

        return content

    @classmethod
    def _extract_extension(cls, filename: Optional[str], default_extension: str) -> str:
        if not filename or "." not in filename:
            return default_extension
        return filename.rsplit(".", 1)[1].lower()

    @classmethod
    def _guess_content_type(cls, extension: str) -> str:
        return cls.EXTENSION_CONTENT_TYPES.get(extension.lower(), "application/octet-stream")

    @classmethod
    def _get_public_url(cls, client, path: str) -> str:
        try:
            response = client.storage.from_(cls.BUCKET_NAME).get_public_url(path)
            return response
        except Exception as exc:
            logger.error("Failed to resolve public URL for %s: %s", path, exc)
            base_url = settings.SUPABASE_URL.rstrip("/")
            return f"{base_url}/storage/v1/object/public/{cls.BUCKET_NAME}/{path}"

    @classmethod
    def _upload_to_bucket(cls, client, path: str, content: bytes, file_options: dict, asset_label: str) -> None:
        """Mirror upload logic from UploadService for consistent behavior."""
        try:
            client.storage.from_(cls.BUCKET_NAME).upload(path, content, file_options)
            logger.info("Uploaded %s to %s bucket", path, cls.BUCKET_NAME)
        except Exception as exc:
            logger.error("Upload error for %s: %s", path, exc)
            # Attempt to remove stale file then retry, similar to UploadService
            try:
                client.storage.from_(cls.BUCKET_NAME).remove([path])
                logger.info("Removed existing object at %s before retry", path)
            except Exception:
                pass

            try:
                client.storage.from_(cls.BUCKET_NAME).upload(path, content)
                logger.info("Fallback upload succeeded for %s", path)
            except Exception as retry_exc:
                logger.error("Retry upload failed for %s: %s", path, retry_exc)
                raise HTTPException(
                    status_code=500,
                    detail=f"Unable to upload {asset_label.replace('-', ' ')} asset to storage",
                )
