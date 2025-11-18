"""
Database module for Campaign API
"""

from .connection import supabase, create_supabase_client

__all__ = ["supabase", "create_supabase_client"]