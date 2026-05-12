# PayPulse Security Specification

## Data Invariants
1. A **transaction** must always have a valid `phoneNumber` (E.164 format roughly), `amount` (> 0), and a `createdBy` UID that matches the requester.
2. The initial `status` of any transaction created via client SDK MUST be `pending`.
3. Users cannot modify their own `role` or `isAdmin` status.
4. `createdAt` and `createdBy` are immutable once set.
5. `auditLogs` are write-only from the client (or strictly controlled).

## The Dirty Dozen (Payloads to Block)
1. **Identity Theft**: Creating a transaction with someone else's `createdBy` UID.
2. **Status Injection**: Creating a transaction with `status: 'completed'` to bypass payment.
3. **Privilege Escalation**: Updating user profile to set `role: 'admin'`.
4. **ID Poisoning**: Using a 100KB string as an ID.
5. **Shadow Fields**: Adding `isVerified: true` to a transaction.
6. **Negative Billing**: Setting `amount: -100`.
7. **Ghost Update**: Changing `amount` of a pending transaction after initiation.
8. **PII Leak**: Unauthorized read of another user's phone number.
9. **History Erasure**: Deleting audit logs.
10. **Timestamp Spoofing**: Setting a future `createdAt`.
11. **Mass Extraction**: Querying all transactions without a filter.
12. **Orphaned Writes**: Creating a transaction for a non-existent user profile (relational check).

## The "Master Gate" Logic
- Users must have a profile in `/users/{userId}` with a valid role.
- Transaction updates for `status` are strictly handled by the server (admin SDK), so the client rules will block most updates.

[Rules generation following...]
