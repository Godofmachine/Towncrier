-- Enable RLS
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to INSERT members if they own the group
DROP POLICY IF EXISTS "Enable insert for group owners" ON "group_members";
CREATE POLICY "Enable insert for group owners"
ON "group_members"
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM "broadcast_groups" WHERE id = "group_members".group_id
  )
);

-- Policy to allow users to UPDATE members if they own the group
DROP POLICY IF EXISTS "Enable update for group owners" ON "group_members";
CREATE POLICY "Enable update for group owners"
ON "group_members"
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM "broadcast_groups" WHERE id = "group_members".group_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM "broadcast_groups" WHERE id = "group_members".group_id
  )
);

-- Policy to allow users to DELETE members if they own the group
DROP POLICY IF EXISTS "Enable delete for group owners" ON "group_members";
CREATE POLICY "Enable delete for group owners"
ON "group_members"
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM "broadcast_groups" WHERE id = "group_members".group_id
  )
);

-- Policy to allow users to SELECT members if they own the group
DROP POLICY IF EXISTS "Enable select for group owners" ON "group_members";
CREATE POLICY "Enable select for group owners"
ON "group_members"
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM "broadcast_groups" WHERE id = "group_members".group_id
  )
);
