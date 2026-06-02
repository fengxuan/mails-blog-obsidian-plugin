# Mails Blog Obsidian Plugin Handoff

This document is for future AI/dev work on the Obsidian publishing flow.
It describes the current architecture, cross-repo dependencies, API calls, known limitations, and the fastest debugging entry points.
`README.md` is intentionally user-facing and should stay focused on install, setup, and note publishing.
Token internals, auth flow, release plumbing, and debugging details belong here instead.

Last reviewed: 2026-06-02

## 1. Scope

The Obsidian publishing flow spans four projects:

- `mails-blog-obsidian-plugin`
  - Obsidian desktop plugin.
  - Lets the user save a note as a draft, publish it, unlink it, and upload supported images.
- `mails-chat-ios`
  - User-facing token generation UI.
  - iOS `Settings -> Obsidian Plugin` is the only current token generation entry point.
- `mails-chat-api`
  - Issues the blog-only token.
  - Verifies the token for `mails-blog`.
- `mails-blog`
  - Accepts either a normal chat JWT access token or the Obsidian blog plugin token on editor routes.

Important current auth note:

- The Obsidian plugin itself does not use `AUTH_SECRET`.
- Runtime fallback to `AUTH_SECRET` has been removed from the active backend code paths.
- The plugin flow still depends on:
  - `ACCESS_TOKEN_SECRET` for normal chat JWT verification on blog editor routes
  - `BLOG_CHAT_API_INTERNAL_TOKEN` on `mails-blog`, which must match `mails-chat-api` `INTERNAL_API_TOKEN`
  - the dedicated Obsidian plugin token issued by `mails-chat-api`
- `INTERNAL_SERVICE_SECRET` now exists between `mails-chat-api` and `mails-blog`, but it is used for internal signed service tokens like subscription confirmation, not for the Obsidian plugin token itself.

## 2. Source Of Truth In The Plugin Repo

Important:

- Edit `main.ts` and `src/*`.
- Do not hand-edit `main.js`; it is a generated bundle.

Build commands:

- `npm run check`
- `npm run build`
- `npm run dev`

Build details:

- `esbuild.config.mjs` bundles `main.ts` into `main.js`.
- The plugin currently has no dedicated automated tests.

## 3. User Flow

End-to-end flow today:

1. User opens iOS `Settings -> Obsidian Plugin`.
2. iOS calls `POST /api/auth/obsidian-token` on `mails-chat-api`.
3. `mails-chat-api` revokes any existing active Obsidian plugin token for the same device label, then issues a new one.
4. iOS shows the token, lets the user copy it, and persists the latest token in Keychain locally.
5. User pastes the token into Obsidian plugin settings.
6. Obsidian plugin stores the token and expiry in plugin settings data.
7. Before normal write/upload API calls, the plugin can auto-refresh the token through `mails-blog` if the token is missing expiry info or is close to expiry.
8. Obsidian plugin sends `Authorization: Bearer <plugin-token>` to `mails-blog`.
9. `mails-blog` tries normal JWT auth first. If that fails with `401`, it falls back to plugin-token verification through `mails-chat-api`.
10. Once authenticated, `mails-blog` draft/publish APIs run normally.
11. Plugin writes binding metadata back into the note frontmatter.

## 4. Plugin File Map

### `main.ts`

- Plugin bootstrap.
- Loads saved settings with `loadData()`.
- Registers the settings tab and commands.

### `src/settings.ts`

- Settings UI inside Obsidian.
- Fields:
  - `Blog API Base URL`
  - `Obsidian Plugin Token`
- `Test Connection` calls `GET /api/posts/me`.

Current `Test Connection` behavior:

- It first tries `GET /api/posts/me` with the currently stored token and does not force a pre-refresh.
- If that read succeeds and the stored expiry is missing, invalid, or within 3 days of expiry, it then tries to refresh the token and save the rotated token locally.
- If the read succeeds but refresh fails, the UI still reports connection success and adds a warning about token rotation.

Important tradeoff:

- The token is stored in the plugin settings data via `saveData()`.
- In practice this means the token lives in the plugin data file, not a secure OS keychain.
- The plugin now also stores `obsidianPluginTokenExpiresAt` in the same settings data.

### `src/commands.ts`

Registers four commands:

- `Save Current Note as Draft`
- `Publish Current Note`
- `Unlink Current Note from Blog Post`
- `Upload Image from Vault`

### `src/publish-service.ts`

Main orchestration layer.

- `saveCurrentNoteAsDraft(...)`
  - Reads note metadata/body.
  - If `mails_blog_post_id` exists, calls update draft.
  - Otherwise calls create draft.
  - Writes returned binding metadata back to frontmatter.
- `publishCurrentNote(...)`
  - Calls `saveCurrentNoteAsDraft(...)` first.
  - Then calls publish on the returned post ID.
  - Writes final binding metadata back again.
- `unlinkCurrentNote(...)`
  - Removes only plugin-managed binding keys from frontmatter.
- `uploadImageFromVault(...)`
  - Reads a vault file as binary.
  - Detects MIME type from extension.
  - Calls blog image upload API.

### `src/frontmatter.ts`

Reads and writes note metadata.

Read behavior:

- Reads frontmatter through `app.metadataCache`.
- Uses frontmatter `title` if present; otherwise falls back to the file basename.
- Reads `category`, `tags`, `card_image`.
- Reads plugin binding fields such as `mails_blog_post_id`.
- Removes YAML frontmatter from the note body before sending `content_markdown`.

Write behavior:

- Updates `title`, `category`, `tags`, `card_image` from the returned blog post.
- Writes plugin-managed binding fields.

### `src/api.ts`

HTTP client for `mails-blog`.

Methods currently implemented:

- `testConnection()`
- `createDraft(payload)`
- `updateDraft(postId, payload)`
- `publish(postId)`
- `getPost(postId)`
- `uploadImage(data, filename, mimeType)`

Errors are wrapped in `MailsBlogApiError`.

### `src/constants.ts`

Contains:

- default API URL: `https://mails-blog.canyin.uk`
- frontmatter key names

### `src/image-modal.ts`

- Opens a fuzzy picker over image files in the current vault.
- Supported extensions:
  - `png`
  - `jpg`
  - `jpeg`
  - `webp`
  - `gif`

## 5. Frontmatter Contract

User-editable fields:

- `title`
- `category`
- `tags`
- `card_image`

Plugin-managed binding fields:

- `mails_blog_post_id`
- `mails_blog_slug`
- `mails_blog_url`
- `mails_blog_status`
- `mails_blog_author_slug`
- `mails_blog_updated_at`

Behavior notes:

- The plugin strips YAML frontmatter before sending markdown to the server.
- `mails-blog` itself does not parse frontmatter for post metadata.
- Metadata is sent as explicit JSON fields in the API payload.

## 6. Current Plugin API Calls

The plugin directly calls these `mails-blog` routes:

- `GET /api/posts/me`
  - Used by `Test Connection` as the primary auth smoke test.
- `POST /api/posts`
  - Create draft.
- `PATCH /api/posts/:id`
  - Update linked draft/post draft state.
- `POST /api/posts/:id/publish`
  - Publish an existing draft/post.
- `GET /api/posts/:id`
  - Supported in client code, not currently wired to a command.
- `POST /api/uploads/images`
  - Used by the image upload command.

Headers used by the plugin:

- `Authorization: Bearer <obsidian-plugin-token>`
- For JSON endpoints:
  - `Content-Type: application/json`
- For image upload:
  - `Content-Type: multipart/form-data; boundary=...`
  - `X-Client-Time-Zone: <local IANA time zone>`

## 7. Payload Shape Sent By The Plugin

Draft/publish payloads are built from note frontmatter + body:

```json
{
  "title": "Post title",
  "category": "optional category",
  "tags": ["optional", "tags"],
  "card_image": "optional image url",
  "content_markdown": "note body without yaml frontmatter"
}
```

The plugin does not currently send:

- `content_html`
- `content_json`

Those are derived server-side by `mails-blog`, and `content_json` is no longer part of the public response contract.

## 8. Token Lifecycle

### iOS generation

Relevant files:

- `mails-chat-ios/MailsChat/Views/SettingsView.swift`
- `mails-chat-ios/MailsChat/State/SessionStore.swift`
- `mails-chat-ios/MailsChat/Storage/KeychainStore.swift`

Behavior:

- iOS exposes an `Obsidian Plugin` section in Settings.
- User can enter a device label, generate, copy, regenerate, and revoke token entries.
- Regeneration warns that the previous token for the same label is immediately invalidated.
- iOS stores the latest locally generated full token and expiry in Keychain.
- iOS can list active token summaries returned by the backend.

### `mails-chat-api` issuance

Relevant route:

- `POST /api/auth/obsidian-token`
- `GET /api/auth/obsidian-tokens`
- `POST /api/auth/obsidian-tokens/revoke`

Relevant implementation:

- `issueBlogPluginToken(...)`
- `createBlogPluginToken(...)`
- `revokeActiveBlogPluginTokensForUserLabel(...)`
- `listBlogPluginTokens(...)`

### Impact of the AUTH_SECRET removal

- No plugin-side token format change was required.
- Existing valid Obsidian plugin tokens should continue to work.
- If the plugin flow breaks after a backend auth change, first inspect:
  - `BLOG_CHAT_API_INTERNAL_TOKEN` on `mails-blog`
  - `INTERNAL_API_TOKEN` on `mails-chat-api`
  - `ACCESS_TOKEN_SECRET` alignment if normal chat JWT editor auth is also failing
- `revokeBlogPluginToken(...)`

Current rules:

- Token format is opaque: `<id>.<secret>`
- TTL is currently 30 days from issue time.
- Multiple active Obsidian plugin tokens can exist per user at the same time.
- Intended model is one active token per device label.
- Issuing or refreshing a token only revokes the previous token for that same label.
- This is a rolling-renew design, not a separate refresh-token design.

### Auto-renew behavior

Implemented on 2026-05-31.

Relevant routes:

- `mails-chat-api`
  - `POST /api/auth/obsidian-token`
  - `POST /api/auth/obsidian-token/refresh`
- `mails-blog`
  - `POST /api/plugin-auth/refresh`

Plugin behavior:

- The plugin stores both:
  - `obsidianPluginToken`
  - `obsidianPluginTokenExpiresAt`
- Before normal write/upload API requests, the plugin checks expiry first.
- If expiry is missing, invalid, or within 3 days of expiration, it calls:
  - `POST /api/plugin-auth/refresh`
- On success, the plugin replaces the saved token and expiry locally.
- The refreshed token keeps the same device label lineage as the old token.

`Test Connection` intentionally behaves a little differently:

- It first answers the narrower question "does this token work right now?" by calling `GET /api/posts/me` without forcing refresh.
- Only after that read succeeds does it try best-effort refresh if local expiry metadata says rotation is needed.
- This avoids false-negative connection failures caused by refresh-path problems when the current token is still valid for reads.

Operational consequence:

- In normal active use, the user should not need to return to iOS every 30 days.
- The token keeps rolling forward as long as the plugin can refresh it before it expires.
- Refresh on one device should not invalidate tokens belonging to other device labels.
- If the token is already expired or has been revoked elsewhere, the plugin cannot recover by itself.
- Recovery path in that case is still:
  1. Open iOS `Settings -> Obsidian Plugin`
  2. Generate/regenerate token
  3. Copy it back into the Obsidian plugin

### Current production notes

As of 2026-05-31:

- `mails-chat-api` production includes working token refresh support.
- `mails-blog` production includes:
  - plugin refresh proxy support
  - plugin image upload auth support
- The latest locally backed-up production token may be stored in:
  - `mails-blog-obsidian-plugin/.env.local`

Backed-up values are for operator convenience only:

- `MAILS_BLOG_OBSIDIAN_PLUGIN_TOKEN`
- `MAILS_BLOG_OBSIDIAN_PLUGIN_TOKEN_EXPIRES_AT`
- `MAILS_BLOG_API_BASE_URL`

Important limitation:

- There is no server API to reveal an old token again after issue time.
- The local `.env.local` backup is optional and should never be included in release artifacts.
- If that file is lost and the active token is unknown, the only recovery path is generating a new token from iOS.

### Production verification completed on 2026-05-31

Confirmed live:

- Direct `mails-chat-api` refresh returned a new token successfully.
- `mails-blog /api/plugin-auth/refresh` returned a new token successfully after proxy fix.
- The newest token was confirmed usable against `mails-blog /api/posts/me`.

Partially verified / residual risk:

- Revoked old tokens definitely return `401` from `mails-chat-api` direct refresh.
- `mails-blog /api/posts/me` checks for revoked historical tokens hit intermittent Cloudflare timeout/no-body behavior during final smoke checks.
- Code was adjusted so revoked plugin-token verification errors are mapped back to `401`, but if this exact symptom reappears, first re-check:
  - `mails-blog/src/lib/api.ts`
  - `mails-blog/src/lib/errors.ts`
  - whether `mails-chat-api /api/internal/auth/blog-plugin-token/verify` returns a normal JSON `401`
- Token is not a normal chat access JWT
- TTL is 30 days
- Multiple active tokens per user are allowed
- Creating a new token revokes the previous one for the same label immediately

Refresh behavior:

- `mails-chat-api` now exposes `POST /api/auth/obsidian-token/refresh`
- It accepts the current valid plugin token as bearer auth
- It revokes the presented token and issues a new one for the same user and same label
- This keeps the single-active-token-per-label rule while allowing the plugin to roll forward automatically

Storage:

- Table: `blog_plugin_tokens`
- Migration: `mails-chat-api/migrations/0013_blog_plugin_tokens.sql`

Stored columns:

- `id`
- `user_id`
- `token_hash`
- `label`
- `expires_at`
- `revoked_at`
- `created_at`
- `last_used_at`

### `mails-chat-api` verification

Relevant route:

- `POST /api/internal/auth/blog-plugin-token/verify`

Current behavior:

- Requires `Authorization: Bearer <INTERNAL_API_TOKEN>`
- Returns:
  - `user_id`
  - `email`
  - `mailbox`

Verification checks:

- token id exists
- token hash matches
- token not revoked
- token not expired
- user still active

On success it also updates `last_used_at`.

## 9. Multi-Device Model

- One iOS account can provision tokens for multiple Obsidian devices.
- Each device should use its own stable label such as `MacBook Air` or `Work MacBook Pro`.
- Backend uniqueness rule is one active token per `(user_id, label)`.
- Sharing the exact same token string across multiple machines is no longer the recommended model.
- If two machines intentionally reuse the same label, whichever one regenerates or refreshes later will invalidate the earlier token for that label lineage.

## 9A. Detailed Test Connection Flow

Current flow:

1. User clicks `Test Connection` in plugin settings.
2. Plugin calls `GET /api/posts/me` with the currently stored bearer token.
3. `mails-blog` route uses `withEditorSession(...)`.
4. `withEditorSession(...)` first attempts `ACCESS_TOKEN_SECRET` JWT verification.
5. On `401`, it falls back to `mails-chat-api /api/internal/auth/blog-plugin-token/verify`.
6. That verify call requires `mails-blog` `BLOG_CHAT_API_INTERNAL_TOKEN` to match `mails-chat-api` `INTERNAL_API_TOKEN`.
7. If `/api/posts/me` succeeds, the plugin reports connection success.
8. Only after that success, if local expiry metadata is missing, invalid, or near expiry, the plugin calls `POST /api/plugin-auth/refresh`.
9. `mails-blog` proxies refresh to `mails-chat-api /api/auth/obsidian-token/refresh`.
10. `mails-chat-api` verifies the current plugin token, revokes it, issues a replacement token for the same label, and returns the new token + expiry.
11. Plugin saves the rotated token and new expiry locally.

What this test proves:

- the configured `Blog API Base URL` is reachable
- the current token can authenticate against blog editor routes
- the plugin-token verify bridge between `mails-blog` and `mails-chat-api` is working

What it does not fully prove:

- image upload works
- draft save and publish work end-to-end
- refresh wiring is healthy, unless the UI explicitly says the token was rotated or shows a refresh warning

## 10. How `mails-blog` Accepts Plugin Tokens

Relevant files:

- `mails-blog/src/lib/editor-session.ts`
- `mails-blog/src/lib/api.ts`
- `mails-blog/src/lib/runtime.ts`
- `mails-blog/wrangler.toml`

Current auth behavior:

1. `withEditorSession(...)` is used for plugin-compatible editor routes.
2. `requireEditorSessionFromRequest(...)` first tries normal JWT verification.
3. If JWT verification returns `401`, it falls back to plugin-token verification.
4. The fallback calls `mails-chat-api` internal verify endpoint.

Important production detail:

- `mails-blog` now prefers a Cloudflare service binding:
  - `CHAT_API_SERVICE = mails-chat-api`
- It only falls back to `BLOG_CHAT_API_BASE_URL` if the binding is unavailable.

Required config on `mails-blog`:

- secret: `BLOG_CHAT_API_INTERNAL_TOKEN`
  - must match `mails-chat-api` `INTERNAL_API_TOKEN`
- secret: `INTERNAL_SERVICE_SECRET`
  - must match `mails-chat-api`
  - not used directly by the Obsidian plugin token flow, but now required by `mails-blog` for other internal service-token routes
- var: `BLOG_CHAT_API_BASE_URL`
  - fallback only
- service binding:
  - `CHAT_API_SERVICE`

This service-binding path was added after a production bug where public-URL callback auth could hang and return `500` from `mails-blog`.

## 11. Routes That Currently Work With The Plugin Token

These `mails-blog` editor routes are currently wired through `withEditorSession(...)`:

- `GET /api/posts/me`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `POST /api/posts/:id/publish`
- `POST /api/posts/publish`
- `GET /api/uploads/images`
- `POST /api/uploads/images`

## 12. Image Upload Status

Image upload is now wired for the Obsidian plugin token flow.

Relevant files:

- `mails-blog/src/pages/api/uploads/images.ts`
- `mails-blog/src/lib/media.ts`
- `mails-blog-obsidian-plugin/src/image-modal.ts`
- `mails-blog-obsidian-plugin/src/publish-service.ts`

Current behavior:

- `POST /api/uploads/images` accepts the Obsidian plugin token.
- `GET /api/uploads/images` also accepts the Obsidian plugin token.
- The plugin only offers formats the server currently supports.
- Returned markdown uses a default alt text derived from the uploaded file name.

Supported MIME types on the server:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Current limitation:

- `svg` is intentionally not offered by the plugin because the server does not accept it.

## 13. Known Tradeoffs / Gaps

- The Obsidian plugin token is stored in Obsidian plugin data, not a secure keychain.
- The plugin repo has no dedicated automated tests right now.
- `getPost(postId)` exists in the client but is not exposed as a command.
- The plugin only uploads images that already exist in the vault; it does not yet support paste/clipboard upload flows.
- Frontmatter is the plugin-side metadata source of truth, but the server does not parse frontmatter itself.

## 14. Detailed Command Flows

This section is the most important one for future AI changes.
It maps each Obsidian command to the plugin code, HTTP calls, auth behavior, backend write model, and local side effects.

### A. Save Current Note as Draft

Command entry:

- `mails-blog-obsidian-plugin/src/commands.ts`
  - command id: `save-current-note-as-draft`
  - requires an active `MarkdownView`
  - errors with `Open a Markdown note first.` if no markdown file is active

Plugin flow:

1. Command calls `saveCurrentNoteAsDraft(...)`.
2. `saveCurrentNoteAsDraft(...)` creates a `MailsBlogApiClient`.
3. It calls `parseNoteMetadata(...)`.
4. `parseNoteMetadata(...)`:
   - reads the full note text from the vault
   - reads frontmatter from `metadataCache`
   - uses frontmatter `title` if present, otherwise falls back to file basename
   - reads optional `category`, `tags`, `card_image`
   - reads plugin binding fields such as `mails_blog_post_id`
   - strips YAML frontmatter from the outgoing markdown body
   - throws if the resulting body is empty
5. The plugin builds a payload with:
   - `title`
   - `category` if present
   - `tags` if present
   - `card_image` if present
   - `content_markdown`
6. Decision point:
   - if local frontmatter contains `mails_blog_post_id`, plugin calls `PATCH /api/posts/:id`
   - otherwise plugin calls `POST /api/posts`
7. Before the request, the client may refresh the plugin token if local expiry metadata is missing, invalid, or within 3 days of expiry.
8. On success, plugin writes returned post fields back into frontmatter with `writePostBinding(...)`.
9. Plugin shows `Draft saved to Mails Blog: <title>`.

Backend route mapping:

- `POST /api/posts`
  - `mails-blog/src/pages/api/posts/index.ts`
  - calls `createDraft(session, body)`
- `PATCH /api/posts/:id`
  - `mails-blog/src/pages/api/posts/[id].ts`
  - calls `updateMyDraft(session, postID, body)`

Backend draft behavior:

- `createDraft(...)`
  - ensures a blog author exists for the user
  - normalizes title/metadata
  - converts markdown into server-side `content_html` and internal `content_json`
  - creates a new row in `posts`
  - initial status is `draft`
  - chooses a unique slug immediately, even before publish
- `updateMyDraft(...)`
  - if the target post is still `draft`, it updates the live draft fields directly
  - if the target post is already `published`, it writes into `draft_*` fields and sets `has_unpublished_changes = 1`
  - this means save-draft on a published post does not change the public post yet

Important rules:

- Draft/update selection is based only on local `mails_blog_post_id`.
- The plugin does not try to re-find a post by slug or URL.
- If local `mails_blog_post_id` is stale or wrong, save-draft will fail with the backend post lookup error.
- Future AI should preserve this behavior unless deliberately adding a relink/recover flow.

Local frontmatter side effects after success:

- user-editable fields overwritten from server response:
  - `title`
  - `category`
  - `tags`
  - `card_image`
- plugin-managed binding fields updated:
  - `mails_blog_post_id`
  - `mails_blog_slug`
  - `mails_blog_url`
  - `mails_blog_status`
  - `mails_blog_author_slug`
  - `mails_blog_updated_at`

### B. Publish Current Note

Command entry:

- `mails-blog-obsidian-plugin/src/commands.ts`
  - command id: `publish-current-note`
  - requires an active `MarkdownView`

Plugin flow:

1. Command calls `publishCurrentNote(...)`.
2. `publishCurrentNote(...)` first calls `saveCurrentNoteAsDraft(...)`.
3. After draft save returns a post ID, plugin calls `POST /api/posts/:id/publish`.
4. On success, plugin writes the returned post object back into frontmatter again.
5. Plugin shows `Published to Mails Blog: <title>`.

Backend route mapping:

- `POST /api/posts/:id/publish`
  - `mails-blog/src/pages/api/posts/[id]/publish.ts`
  - calls `publishMyPost(session, postID)`
  - then triggers:
    - `notifyPostPublished(post)`
    - `notifyAuthorSubscribers(post)`
    - `warmPublicCacheAfterPublish(post)`

Backend publish behavior:

- If the post is still `draft`:
  - current draft fields become the published post
- If the post is already `published` and `has_unpublished_changes = 1`:
  - `draft_*` fields are promoted into the live published fields
  - `draft_*` fields are then cleared
  - `has_unpublished_changes` is reset to `0`
- A new slug may be generated from the current title during publish
  - this can change the public URL when title changes
- `published_at` and `updated_at` are set to the publish timestamp
- tag indexes are synced through `syncPostTags(...)`
- public cache revisions are bumped

Important rules:

- Publish always goes through save-draft first in the plugin.
- There is no plugin path that publishes unsaved local edits directly.
- Because publish can regenerate slug from title, future AI must not assume the old frontmatter URL stays stable after publish.
- If you add a new publish-related feature, also review webhook, subscription, and cache warming side effects in `mails-blog`.

### C. Unlink Current Note From Blog Post

Command entry:

- `mails-blog-obsidian-plugin/src/commands.ts`
  - command id: `unlink-current-note`

Plugin flow:

1. Command calls `unlinkCurrentNote(...)`.
2. `unlinkCurrentNote(...)` calls `clearPostBinding(...)`.
3. Plugin removes only plugin-managed frontmatter keys.
4. Plugin shows `Removed local Mails Blog binding from current note.`

Important rules:

- Unlink is local-only.
- It does not delete or revoke the remote blog post.
- It does not clear user-editable metadata like `title`, `category`, `tags`, or `card_image`.
- After unlink, the next save-draft creates a new remote draft because `mails_blog_post_id` is gone.

### D. Upload Image From Vault

Command entry:

- `mails-blog-obsidian-plugin/src/commands.ts`
  - command id: `upload-image-from-vault`
  - requires an active markdown editor view

Plugin flow:

1. Command opens `ImageFileSuggestModal`.
2. The modal lists only vault files whose extension is:
   - `png`
   - `jpg`
   - `jpeg`
   - `webp`
   - `gif`
3. After user picks a file, plugin reads the binary from the vault.
4. Plugin derives MIME type from file extension.
5. Plugin calls `POST /api/uploads/images` as multipart form-data with field name `file`.
6. Plugin also sends `X-Client-Time-Zone` based on the local IANA time zone.
7. Backend returns:
   - `asset_url`
   - `markdown`
   - `mime_type`
   - `byte_size`
   - `content_sha256`
8. Plugin inserts returned `markdown` at the current editor selection.
9. Plugin shows `Inserted image markdown for <file>`.

Backend route mapping:

- `POST /api/uploads/images`
  - `mails-blog/src/pages/api/uploads/images.ts`
  - calls `uploadImage(session, file, timeZone)`
- `GET /api/uploads/images`
  - already exists for listing assets
  - not currently used by the plugin UI

Backend upload behavior:

- Auth goes through `withEditorSession(...)`, so Obsidian plugin token support already applies.
- Server rejects:
  - video uploads
  - unsupported MIME types
  - empty files
  - files larger than 10 MB
- Current daily upload limit is 20 images per author per resolved quota day.
- Server deduplicates by `content_sha256` per author:
  - if the same file content was already uploaded by the same author, it reuses the existing asset instead of creating a new object
- New files are stored in `BLOG_MEDIA`
- Returned markdown uses a default alt text derived from the stored file name

Important rules:

- The plugin currently supports only vault-file upload, not clipboard/paste upload.
- The plugin trusts extension-to-MIME mapping on the client, but the server still validates MIME type.
- If future AI adds new image types, update both:
  - plugin picker/extension list
  - backend `SUPPORTED_IMAGE_TYPES`

### E. Shared Auth Behavior For All Write Flows

All three mutation flows above rely on the same auth chain:

1. Obsidian plugin sends `Authorization: Bearer <obsidian-plugin-token>` to `mails-blog`.
2. `mails-blog` route uses `withEditorSession(...)`.
3. `withEditorSession(...)` first attempts normal JWT auth with `ACCESS_TOKEN_SECRET`.
4. On `401`, it falls back to plugin-token verification through `mails-chat-api /api/internal/auth/blog-plugin-token/verify`.
5. That fallback requires:
   - `mails-blog` `BLOG_CHAT_API_INTERNAL_TOKEN`
   - matching `mails-chat-api` `INTERNAL_API_TOKEN`

Future AI note:

- If a new editor route should work for the plugin token, it must use `withEditorSession(...)`, not `withSession(...)`.

## 15. Safe Extension Rules For Future AI

If adding or changing plugin features, use these rules first:

1. Change `main.ts` and `src/*` only.
   - `main.js` is generated and must be rebuilt, not hand-edited.
2. Treat frontmatter binding keys as the local link to remote post state.
   - `mails_blog_post_id` is the primary remote identity.
3. Do not silently change the meaning of unlink.
   - it is currently local-only and users may rely on that
4. If you add a new write route in `mails-blog`, prefer `withEditorSession(...)` if Obsidian should be able to call it.
5. If you add a new media type or upload capability, update both plugin-side filtering and backend validation together.
6. If you change token handling, update:
   - plugin code
   - `README.md`
   - `AI_HANDOFF.md`
   - packaged release docs under `release/mails-blog-publisher/`
7. If you change auth behavior across repos, also re-check:
   - `mails-blog`
   - `mails-chat-api`
   - token sync requirements documented in the repo docs

Recommended edit points by feature:

- new command:
  - `src/commands.ts`
  - usually `src/publish-service.ts`
- new note metadata field:
  - `src/constants.ts`
  - `src/frontmatter.ts`
  - payload shape in `src/publish-service.ts`
- new blog API call:
  - `src/api.ts`
  - corresponding `mails-blog` route
- new upload capability:
  - `src/image-modal.ts` or new modal
  - `src/publish-service.ts`
  - `mails-blog/src/pages/api/uploads/*`
  - `mails-blog/src/lib/media.ts`

## 16. Fast Debugging Checklist

If `Test Connection` fails:

1. Verify the Obsidian plugin settings:
   - base URL is correct
   - token is present
2. Regenerate a token in iOS Settings and paste the new one into Obsidian.
3. Check whether `GET /api/posts/me` returns:
   - `401`: token invalid/revoked/expired, or blog auth bridge is misconfigured
   - `500`: likely blog-side auth bridge/config regression
4. If `Test Connection` succeeds but shows a refresh warning:
   - current token auth is working
   - refresh proxy or refresh backend path needs inspection
   - first re-check `mails-blog /api/plugin-auth/refresh` and `mails-chat-api /api/auth/obsidian-token/refresh`
4. Confirm `mails-blog` has:
   - `BLOG_CHAT_API_INTERNAL_TOKEN`
   - `CHAT_API_SERVICE` binding
5. Confirm `mails-chat-api` internal verify route is healthy.

If draft publish updates the wrong post:

1. Check `mails_blog_post_id` in note frontmatter.
2. If it is stale, use `Unlink Current Note from Blog Post`.
3. Save/publish again to create a fresh binding.

If metadata looks wrong on the blog:

1. Check local frontmatter keys:
   - `title`
   - `category`
   - `tags`
   - `card_image`
2. Confirm the note body is not empty after frontmatter stripping.

If image upload fails:

1. Check whether the file type is one of:
   - `jpg`
   - `jpeg`
   - `png`
   - `webp`
   - `gif`
2. Inspect `mails-blog/src/pages/api/uploads/images.ts`.
3. Confirm the route is still using `withEditorSession(...)`.
4. Inspect `mails-blog/src/lib/media.ts` for MIME validation or quota rejection.

## 15. Useful Manual Verification

Known-good production check as of 2026-05-31:

- `GET https://mails-blog.canyin.uk/api/posts/me` with a valid plugin token returned `200`
- `GET https://mails-chat-api.canyin.uk/api/me` with the same plugin token returned `401`

That is the intended security boundary:

- plugin token can manage blog posts
- plugin token cannot act as a general `mails-chat-api` user access token

Useful curl patterns:

```bash
curl -sS https://mails-blog.canyin.uk/api/posts/me \
  -H "Authorization: Bearer <OBSIDIAN_PLUGIN_TOKEN>"
```

```bash
curl -sS https://mails-chat-api.canyin.uk/api/me \
  -H "Authorization: Bearer <OBSIDIAN_PLUGIN_TOKEN>"
```

Expected result:

- first call: `200`
- second call: `401`

## 16. Release Notes

Installable plugin files:

- `manifest.json`
- `main.js`
- `styles.css`

Release helper commands:

- `npm run check`
- `npm run build`
- `npm run release:package`

Release packaging behavior:

- `npm run release:package` creates `release/mails-blog-publisher/`
- The packaged folder includes:
  - `manifest.json`
  - `main.js`
  - `styles.css`
  - `versions.json`
  - `README.md`
  - `AI_HANDOFF.md`
- It does not include:
  - `.env.local`
  - `node_modules`
  - source `.ts` files

Current publish model:

- This plugin is ready for manual distribution and manual install.
- It is not yet wired to the public Obsidian community plugin registry workflow.
- Before any broader public release, re-check:
  - `manifest.json` metadata
  - plugin author/contact URLs
  - whether `isDesktopOnly` should remain `false`

## 17. Safe Extension Ideas

Good next steps for future work:

- Add automated tests in the plugin repo for:
  - frontmatter parsing
  - payload building
  - binding writes
  - API error surfacing
- Add a command to refresh local frontmatter from a remote post.
- Add better UX around token validation and expired-token guidance inside the Obsidian settings tab.
- Consider a safer local storage option for the token if Obsidian platform constraints allow it.
