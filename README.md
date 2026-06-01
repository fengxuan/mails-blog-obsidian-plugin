# Mails Blog Obsidian Plugin

Publish the current Obsidian note to Mails Blog using the dedicated Obsidian plugin token generated in the iOS app.

For architecture, cross-repo auth flow, debugging notes, and current limitations, see [AI_HANDOFF.md](./AI_HANDOFF.md).

## Features

- Save the current note as a draft
- Publish the current note
- Update an already linked note and republish it
- Upload an image from the vault and insert returned Markdown
- Write blog binding fields back into note frontmatter

## Commands

- `Mails Blog: Save Current Note as Draft`
- `Mails Blog: Publish Current Note`
- `Mails Blog: Unlink Current Note from Blog Post`
- `Mails Blog: Upload Image from Vault`

## Setup

1. Generate a token in iOS `Settings -> Obsidian Plugin`.
   Use one device label per Obsidian client, for example `MacBook Air` or `Work Mac Mini`.
2. Open the plugin settings in Obsidian.
3. Fill in:
   - `Blog API Base URL`
   - `Obsidian Plugin Token`
4. Run `Test Connection`.

After the first successful setup, the plugin will try to rotate its own token automatically and persist the refreshed token + expiry locally, so normal use should not require frequent manual copy/paste.
Rotating a token in iOS only invalidates the previous token for the same device label. Tokens belonging to other devices stay active.
If a token has already expired, was manually revoked, or was regenerated elsewhere with the same label, the plugin cannot recover by itself and you need to copy a fresh token again from iOS `Settings -> Obsidian Plugin`.

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

The plugin strips YAML frontmatter from the note body before sending `content_markdown` to Mails Blog.

## Image Upload

The first version uploads images that already exist inside the current Obsidian vault.
Supported formats are `jpg`, `jpeg`, `png`, `webp`, and `gif`.
Returned markdown now uses a default alt text derived from the uploaded file name.
After upload, the plugin inserts the returned markdown snippet at the current editor selection.
