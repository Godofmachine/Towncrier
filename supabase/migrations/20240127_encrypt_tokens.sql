-- SECURITY: Migrate gmail_tokens to use encrypted storage
-- This migration adds encrypted columns and provides functions for migration

-- 1. Add encrypted columns to gmail_tokens table
ALTER TABLE gmail_tokens 
ADD COLUMN IF NOT EXISTS encrypted_access_token TEXT,
ADD COLUMN IF NOT EXISTS encrypted_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- 2. Add comment explaining the columns
COMMENT ON COLUMN gmail_tokens.encrypted_access_token IS 'Encrypted OAuth access token (AES-256-GCM)';
COMMENT ON COLUMN gmail_tokens.encrypted_refresh_token IS 'Encrypted OAuth refresh token (AES-256-GCM)';
COMMENT ON COLUMN gmail_tokens.is_encrypted IS 'Flag indicating if this record uses encrypted tokens';

-- 3. Create index for faster lookups on encrypted flag
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_encrypted ON gmail_tokens(is_encrypted);

-- Note: The actual encryption/decryption happens in the application layer
-- Old tokens in 'access_token' and 'refresh_token' columns remain until migrated
-- New tokens will be stored in 'encrypted_*' columns

-- Migration strategy:
-- 1. Application will check is_encrypted flag
-- 2. If FALSE, read from old columns (backward compatible)
-- 3. If TRUE, decrypt from new columns
-- 4. On token refresh, always write to encrypted columns and set is_encrypted = TRUE
-- 5. Eventually, drop old columns when all tokens are migrated (manual step, not automated)
