# Mails Blog Publisher

Publish notes from Obsidian to Mails Blog.
This plugin is for people who already use Mails Blog and want to draft, publish, sync, and upload images without leaving Obsidian.

## What It Does

- Save the current note as a draft
- Publish the current note
- Sync a linked note back from Mails Blog
- View saved version history for a linked note
- Upload an image from the vault and insert the returned Markdown
- Write blog binding metadata back into frontmatter automatically

## Requirements

- A Mails Blog account
- The Mails iOS app to generate an `Obsidian Plugin Token`
- A reachable `Blog API Base URL`
- This plugin only publishes to Mails Blog

## Install

If the plugin is available in the Obsidian Community Plugins directory:

1. Open `Settings -> Community plugins -> Browse`.
2. Search for `Mails Blog Publisher`.
3. Install and enable the plugin.

For a manual install or an unreleased build:

1. Copy these files into your vault plugin folder:
   - `manifest.json`
   - `main.js`
   - `styles.css`
2. Target folder example:
   - `<your-vault>/.obsidian/plugins/mails-blog-publisher/`
3. Enable `Mails Blog Publisher` in Obsidian community plugins.

If you build from source, run `npm run release:package` to create a ready-to-copy `release/mails-blog-publisher/` folder.

## Release A New Version

From the plugin repo:

```bash
npm run release:new -- 1.0.15
```

From the workspace root:

```bash
npm run release:obsidian-plugin -- 1.0.15
```

What the release command does:

- bumps `package.json` and `package-lock.json`
- syncs `manifest.json` and `versions.json`
- rebuilds and refreshes `release/mails-blog-publisher/`
- creates a `Release <version>` git commit
- creates the matching Git tag
- pushes the branch and tag so `.github/workflows/release.yml` can publish the GitHub Release
- leaves the Obsidian review request as a separate manual portal step

Useful options:

- `--minor` or `--major` to auto-bump instead of passing an explicit version
- `--min-app-version 1.8.0` to update the required Obsidian version for this release
- `--skip-push` to prepare the commit and tag locally without pushing
- `--dry-run` to preview every step without changing files or git state

## Submit The New Version For Obsidian Review

After the GitHub Actions release workflow finishes and the new GitHub Release is visible:

1. Open `https://community.obsidian.md/account/plugins`.
2. If you are not signed in, Obsidian will first redirect you to the login page and then return you to the plugins portal.
3. Open the `Mails Blog Publisher` plugin entry.
4. Use `Add new version` to submit the just-published release version for review.
5. Wait for Obsidian staff review.

Notes:

- This plugin is already listed in the Obsidian community plugins directory.
- The public directory entry currently shows that it has not been manually reviewed by Obsidian staff yet.
- Treat the portal review submission as required release follow-up whenever you want a new version to enter the Obsidian manual review queue.

## Setup

1. In iOS, open `Settings -> Obsidian Plugin`.
2. Generate a token for this Obsidian device and copy it.
3. Open Obsidian plugin settings for `Mails Blog Publisher`.
4. Fill in:
   - `Blog API Base URL`
   - `Obsidian Plugin Token`
5. Run `Test Connection`.

If the token stops working later, generate a new one in iOS and paste it again.

## Publish A Note

1. Open a Markdown note in Obsidian.
2. Optional frontmatter fields:
   - `title`
   - `category`
   - `tags`
   - `card_image`
3. Run `Mails Blog: Save Current Note as Draft` to create or update the remote draft.
4. Run `Mails Blog: Publish Current Note` to publish it.

The plugin writes the blog link and sync metadata back into frontmatter automatically.

## Typical Workflow

1. Write in Obsidian as usual.
2. Save a draft to create or update the linked remote post.
3. Publish when you are ready to make it live.
4. Use `Sync Current Note From Blog` if the remote post changed elsewhere.
5. Use `Upload Image` to choose a local image file and insert uploaded image Markdown into the current note.
6. Use `Upload Unsynced Images in Current Note` to batch-upload local images already referenced in the current note and replace them with blog-hosted Markdown.
7. Use `Show Current Note Version History` to inspect saved draft and published snapshots for the linked post.

## Other Commands

- `Mails Blog: Sync Current Note From Blog`
  - pulls the linked blog post back into the current note when it is safe to do so
- `Mails Blog: Unlink Current Note from Blog Post`
  - removes only the local link to the remote post
- `Mails Blog: Upload Image`
  - choose a local `jpg`, `jpeg`, `png`, `webp`, or `gif` image file to upload
- `Mails Blog: Upload Unsynced Images in Current Note`
  - scans the current note for local embedded images, uploads supported ones, and replaces those embeds with blog-hosted image Markdown
- `Mails Blog: Show Current Note Version History`
  - opens a read-only history view for the linked post's saved versions

## Notes

- `Publish Current Note` always saves a draft first.
- `Sync Current Note From Blog` stops when both the local note and the remote post changed.
- The plugin uploads notes or images only when you explicitly run one of its commands.

## Current Limitations

- Token generation currently starts in the Mails iOS app.
- Supported image formats are `jpg`, `jpeg`, `png`, `webp`, and `gif`.
- When both the local note and the remote post changed, sync stops instead of trying to merge them automatically.

## Privacy And Network Use

- This plugin connects to your configured `Blog API Base URL`.
- It sends your plugin token, note title, frontmatter metadata, note body, and the image file you explicitly choose or batch-upload from the current note only when you run publish, draft, sync, or image upload commands.
- It writes blog binding metadata back into note frontmatter and can replace the current note when you run `Sync Current Note From Blog`.
- It does not include ads or telemetry.

For implementation and maintenance details, see [AI_HANDOFF.md](./AI_HANDOFF.md).
