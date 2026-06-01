# Mails Blog Obsidian Plugin

Publish the current Obsidian note to Mails Blog using the dedicated Obsidian plugin token generated in the iOS app.

For architecture, cross-repo auth flow, debugging notes, and current limitations, see [AI_HANDOFF.md](./AI_HANDOFF.md).

## Features

- Save the current note as a draft
- Publish the current note
- Update an already linked note and republish it
- Sync a linked note back from Mails Blog with conflict protection
- Upload an image from the vault and insert returned Markdown
- Write blog binding fields back into note frontmatter

## Commands

- `Mails Blog: Save Current Note as Draft`
- `Mails Blog: Publish Current Note`
- `Mails Blog: Sync Current Note From Blog`
- `Mails Blog: Unlink Current Note from Blog Post`
- `Mails Blog: Upload Image from Vault`

Command behavior summary:

- `Save Current Note as Draft`
  - creates a new remote draft when the note is not linked yet
  - updates the existing remote post when `mails_blog_post_id` already exists in frontmatter
- `Publish Current Note`
  - always saves the current note as a draft first
  - then publishes that remote post
- `Sync Current Note From Blog`
  - pulls the linked remote post back into the current note
  - only overwrites automatically when the remote post changed and the local note has not changed since the last sync/save/publish
  - stops with a conflict notice when both local and remote changed
- `Unlink Current Note from Blog Post`
  - removes only local plugin-managed binding keys from frontmatter
  - does not delete the remote post
- `Upload Image from Vault`
  - uploads a supported image from the current vault
  - inserts returned Markdown at the current cursor position

## Setup

1. Generate a token in iOS `Settings -> Obsidian Plugin`.
   Use one device label per Obsidian client, for example `MacBook Air` or `Work Mac Mini`.
2. Open the plugin settings in Obsidian.
3. Fill in:
   - `Blog API Base URL`
   - `Obsidian Plugin Token`
4. Run `Test Connection`.

`Test Connection` now checks the current token first by reading `/api/posts/me`.
If that succeeds and the stored expiry is missing, invalid, or within 3 days of expiry, the plugin then tries to rotate its own token and persist the refreshed token + expiry locally.
If the read succeeds but the refresh path fails, the test still reports success and shows a warning so auth connectivity is not masked by token-rotation issues.

After the first successful setup, the plugin will try to rotate its own token automatically and persist the refreshed token + expiry locally, so normal use should not require frequent manual copy/paste.
Rotating a token in iOS only invalidates the previous token for the same device label. Tokens belonging to other devices stay active.
If a token has already expired, was manually revoked, or was regenerated elsewhere with the same label, the plugin cannot recover by itself and you need to copy a fresh token again from iOS `Settings -> Obsidian Plugin`.

## Token Model

The plugin itself uses only the dedicated Obsidian plugin token copied from iOS.
It does not directly use backend service secrets such as `INTERNAL_API_TOKEN`, `BLOG_CHAT_API_INTERNAL_TOKEN`, `ACCESS_TOKEN_SECRET`, or `INTERNAL_SERVICE_SECRET`.

That means the recent removal of legacy `AUTH_SECRET` runtime usage does not require any plugin-side token migration.

Backend dependencies that still matter for this plugin flow are:

- `ACCESS_TOKEN_SECRET`
  - shared by `mails-chat-api`, `mails-blog`, `mailsdev/worker`, and `mails-realtime-notify`
  - used when `mails-blog` accepts a normal chat access token on editor routes
- `BLOG_CHAT_API_INTERNAL_TOKEN`
  - stored on `mails-blog`
  - must match `mails-chat-api` `INTERNAL_API_TOKEN`
  - used when `mails-blog` verifies Obsidian plugin tokens through `mails-chat-api`
- `INTERNAL_SERVICE_SECRET`
  - shared by `mails-chat-api` and `mails-blog`
  - used for other internal blog service tokens such as subscription confirmation
  - not used directly by the Obsidian plugin

## Test Connection Behavior

`Test Connection` is intentionally a lightweight auth smoke test, not a full publish simulation.

What it proves:

- the configured `Blog API Base URL` is reachable
- the current bearer token can authenticate against `mails-blog` editor routes
- `mails-blog` can verify the token either as a normal chat JWT or, more commonly here, through the Obsidian plugin token fallback

What it does not prove:

- image upload works
- draft save or publish flows work end-to-end
- backend refresh wiring is healthy, unless the token actually needs refresh and the warning/success message mentions it

For the full command-to-backend architecture and future AI maintenance notes, see [AI_HANDOFF.md](./AI_HANDOFF.md).

## Network And Data Disclosure

This plugin connects to the configured `Blog API Base URL` and sends:

- your Obsidian plugin bearer token
- the current note title, metadata, and markdown body
- selected vault image files when you use the upload command

This plugin writes back into the current note:

- blog binding metadata in frontmatter
- synchronized remote content when you run `Sync Current Note From Blog`

The plugin does not collect analytics, does not bundle ads, and does not upload notes unless you explicitly run a publish, draft, sync, or image-upload command.

## Manual Install

1. Build the plugin with `npm run build`.
2. Copy these files into your vault plugin folder:
   - `manifest.json`
   - `main.js`
   - `styles.css`
3. Target folder example:
   - `<your-vault>/.obsidian/plugins/mails-blog-publisher/`
4. Enable `Mails Blog Publisher` in Obsidian community plugins.

For a ready-to-copy release folder, run `npm run release:package`.
It creates `release/mails-blog-publisher/` with the installable files and companion docs.

## Release Artifact

The installable plugin payload is intentionally small:

- `manifest.json`
- `main.js`
- `styles.css`

The packaged release folder also includes:

- `README.md`
- `AI_HANDOFF.md`
- `versions.json`

It does not include local secrets such as `.env.local`.

## Community Plugin Release Notes

For Community Plugins submission:

- the source repository should keep `manifest.json`, `README.md`, and `LICENSE`
- release assets should include:
  - `manifest.json`
  - `main.js`
  - `styles.css`
- the GitHub release tag must exactly match `manifest.json` `version`

## Frontmatter

Supported metadata fields:

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
- `mails_blog_sync_hash`

The plugin strips YAML frontmatter from the note body before sending `content_markdown` to Mails Blog.

## Sync Behavior

If the blog post was updated elsewhere and Obsidian has not been updated yet, run:

- `Mails Blog: Sync Current Note From Blog`

The plugin uses:

- `mails_blog_updated_at` as the remote version timestamp
- `mails_blog_sync_hash` as the last synchronized content snapshot

Safety rules:

- remote changed, local unchanged:
  - plugin replaces the current note with the remote blog content
- local changed, remote unchanged:
  - plugin keeps the local note and asks you to publish if you want to push it
- local changed and remote changed:
  - plugin stops with a conflict notice instead of overwriting either side

## Image Upload

The first version uploads images that already exist inside the current Obsidian vault.
Supported formats are `jpg`, `jpeg`, `png`, `webp`, and `gif`.
Returned markdown now uses a default alt text derived from the uploaded file name.
After upload, the plugin inserts the returned markdown snippet at the current editor selection.
