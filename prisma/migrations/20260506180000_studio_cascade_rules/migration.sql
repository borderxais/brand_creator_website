-- Studio FK cascade refactor.
-- Subscription.user: RESTRICT -> CASCADE so deleting a user removes their Subscription row.
-- (Stripe subscription must still be canceled separately at the Stripe API level.)
-- Other Studio FKs (Sample.uploadedBy RESTRICT, VideoRequest.creator RESTRICT,
-- VideoRequest.{sample,claimedBy,subscription} SET NULL) already match the
-- intended policy in the prior migration; only the schema annotations were
-- added in this commit, so no SQL changes are needed for those.

ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
