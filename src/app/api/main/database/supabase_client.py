"""
Database module for Campaign API
"""

from .connection import supabase, create_supabase_client

__all__ = ["supabase", "create_supabase_client"]

def get_supabase_client():
    """Get Supabase client instance."""
    try:
        return create_supabase_client()
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        raise