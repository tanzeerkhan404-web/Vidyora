# VIDYORA Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All unspecified paths under `/databases/{database}/documents` are denied for both reads and writes.
2. **Admin-Only Content Management (`/video_lessons/{lessonId}`)**:
   - Only verified administrators (`isBootstrapAdmin()` or `/admins/{uid}` document holder with `email_verified == true`) can create, update, publish/unpublish, or delete video lessons.
   - Public/student reads (`get` and `list`) are strictly restricted to documents where `resource.data.published == true`. Unpublished drafts are invisible to students and unauthenticated clients.
   - Every `videoUrl` MUST start with `https://` and adhere to `maxLength <= 500`.
   - `createdBy` and `createdAt` are immutable on updates; `updatedAt` MUST equal `request.time`.
3. **Strict Student Ownership (`/student_progress/{userId}`)**:
   - Students can ONLY read (`get`) and write (`create`, `update`, `delete`) their own progress document where `userId == request.auth.uid` and `request.auth.token.email_verified == true`.
   - `list` queries on `/student_progress` are strictly restricted to `resource.data.userId == request.auth.uid` (no cross-student enumeration).
   - No PII (`email`, `phone`, `address`) is stored in `/student_progress`.
   - Bounded arrays enforced: `completedLessonIds.size() <= 500`, `favouriteLessonIds.size() <= 200`, `recentLessonIds.size() <= 50`.
4. **Private Student AI Study Chats (`/study_chats/{chatId}`)**:
   - Students can ONLY read (`get`, `list`), create, update, and delete conversations where `userId == request.auth.uid` and `request.auth.token.email_verified == true`.
   - `list` queries strictly enforce `existing().userId == request.auth.uid` with zero DB lookups inside `list`.
   - `userId` and `createdAt` are immutable after creation; `updatedAt == request.time`.
   - Strict schema allowlists (`subject`, `level`, `mode`), bounded `messages` list (`size() <= 40` with map type check), and NO PII fields allowed (`keys().hasOnly(...)`).
   - Uploaded doubt-solver images are NEVER persisted to Firestore.
5. **Privilege Escalation Prevention (`/admins/{adminId}`)**:
   - Regular signed-in students cannot self-register or modify `/admins/{uid}`. Only the verified bootstrap administrator (`touhidkhan955@gmail.com` with `email_verified == true`) can create/delete admin registry documents.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Be Rejected)
1. **Unauthenticated Draft Read**: Unauthenticated user calls `get(/video_lessons/draft-1)` where `published == false` -> DENIED.
2. **Student Lesson Creation**: Regular signed-in student attempts `create(/video_lessons/hack-1)` -> DENIED.
3. **Unverified Admin Email Spoof**: User with email `touhidkhan955@gmail.com` and `email_verified: false` attempts `create(/video_lessons/spoof-1)` -> DENIED.
4. **Shadow Field Injection on Video Lesson**: Admin creates `/video_lessons/l1` with extra ghost key `isSuperFeatured: true` -> DENIED (`keys().hasOnly(...)`).
5. **Unsafe Video URL Injection**: Admin submits `videoUrl: "javascript:alert(1)"` -> DENIED (`matches('^https://.*$')`).
6. **ID Poisoning**: Admin attempts to create `/video_lessons/<150-char-string-with-spaces>` -> DENIED (`isValidId(lessonId)`).
7. **Immutable Field Tampering**: Admin updates `/video_lessons/l1` attempting to alter `createdBy` or `createdAt` -> DENIED.
8. **Client-Spoofed Timestamp**: Admin creates `/video_lessons/l1` with client-provided `createdAt != request.time` -> DENIED.
9. **Cross-Student Chat Read**: Student A attempts `get(/study_chats/chatOfStudentB)` -> DENIED (`existing().userId == request.auth.uid`).
10. **Study Chat Identity Spoofing**: Student A attempts `create(/study_chats/c1)` with `userId: "studentB"` -> DENIED (`data.userId == request.auth.uid`).
11. **Study Chat Shadow PII Field & Message Flooding**: Student A submits `phoneNumber: "9999999999"` or 45 messages (> 40 max) to `/study_chats/c1` -> DENIED.
12. **Self-Assigned Admin Escalation**: Regular student attempts `create(/admins/studentA)` with `{ uid: "studentA", role: "admin" }` -> DENIED.
