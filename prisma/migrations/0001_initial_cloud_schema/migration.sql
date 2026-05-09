-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedDek" BYTEA NOT NULL,
    "dekSalt" BYTEA NOT NULL,
    "dekIv" BYTEA NOT NULL,
    "dekAuthTag" BYTEA NOT NULL,
    "passwordVerifier" BYTEA NOT NULL,
    "salt" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encryptedContent" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- ROW LEVEL SECURITY POLICIES (CLOUD MODE ONLY)
-- ============================================

-- Enable RLS on Conversation table
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own conversations
CREATE POLICY "Users can view their own conversations" ON "Conversation"
    FOR SELECT
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only insert their own conversations
CREATE POLICY "Users can create their own conversations" ON "Conversation"
    FOR INSERT
    WITH CHECK ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only update their own conversations
CREATE POLICY "Users can update their own conversations" ON "Conversation"
    FOR UPDATE
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only delete their own conversations
CREATE POLICY "Users can delete their own conversations" ON "Conversation"
    FOR DELETE
    USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only read their own account data
CREATE POLICY "Users can view their own account" ON "User"
    FOR SELECT
    USING ("id" = current_setting('app.current_user_id', true)::TEXT);

-- Policy: Users can only update their own account data
CREATE POLICY "Users can update their own account" ON "User"
    FOR UPDATE
    USING ("id" = current_setting('app.current_user_id', true)::TEXT);
