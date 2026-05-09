-- Create UserSettings table
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS on UserSettings
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own settings
CREATE POLICY "Users can view their own settings" ON "UserSettings"
    FOR SELECT
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only insert their own settings
CREATE POLICY "Users can create their own settings" ON "UserSettings"
    FOR INSERT
    WITH CHECK ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only update their own settings
CREATE POLICY "Users can update their own settings" ON "UserSettings"
    FOR UPDATE
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only delete their own settings
CREATE POLICY "Users can delete their own settings" ON "UserSettings"
    FOR DELETE
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);
