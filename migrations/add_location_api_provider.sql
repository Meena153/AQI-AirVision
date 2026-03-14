-- Migration: Add locationApiProvider to users table
-- This migration adds support for user-specific location API provider preferences

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_api_provider VARCHAR DEFAULT 'nominatim';

-- Add comment to document valid values
COMMENT ON COLUMN users.location_api_provider IS 'Location API provider preference: nominatim, openweather, google, mapbox';
