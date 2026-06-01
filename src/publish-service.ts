import { Notice, TFile, type App } from "obsidian";
import { MailsBlogApiClient } from "./api";
import {
  clearPostBinding,
  computeMetadataSyncHash,
  computePostSyncHash,
  parseNoteMetadata,
  replaceNoteWithPost,
  writePostBinding,
} from "./frontmatter";
import type { BlogImageUploadResponse, BlogPost, MailsBlogPluginSettings, PostPayload } from "./types";

function buildPayload(metadata: Awaited<ReturnType<typeof parseNoteMetadata>>): PostPayload {
  const payload: PostPayload = {
    title: metadata.title,
    content_markdown: metadata.body,
  };
  if (metadata.category) {
    payload.category = metadata.category;
  }
  if (metadata.tags && metadata.tags.length > 0) {
    payload.tags = metadata.tags;
  }
  if (metadata.cardImage) {
    payload.card_image = metadata.cardImage;
  }
  return payload;
}

function createClient(settings: MailsBlogPluginSettings, onSettingsChanged: () => Promise<void>): MailsBlogApiClient {
  return new MailsBlogApiClient(settings, {
    onTokenRefresh: async () => {
      await onSettingsChanged();
    },
  });
}

export async function saveCurrentNoteAsDraft(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost> {
  const progressNotice = new Notice("Saving draft to Mails Blog...", 0);
  const client = createClient(settings, onSettingsChanged);
  try {
    const metadata = await parseNoteMetadata(app, file);
    const payload = buildPayload(metadata);
    const post = metadata.postId
      ? await client.updateDraft(metadata.postId, payload)
      : await client.createDraft(payload);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new Notice(`Draft saved to Mails Blog: ${post.title}`);
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function publishCurrentNote(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost> {
  const progressNotice = new Notice("Publishing current note to Mails Blog...", 0);
  try {
  const draft = await saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged);
  const client = createClient(settings, onSettingsChanged);
  const post = await client.publish(draft.id);
  await writePostBinding(app, file, post, settings.blogApiBaseUrl);
  progressNotice.hide();
  new Notice(`Published to Mails Blog: ${post.title}`);
  return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function unlinkCurrentNote(app: App, file: TFile): Promise<void> {
  await clearPostBinding(app, file);
  new Notice("Removed local Mails Blog binding from current note.");
}

export async function syncCurrentNoteFromBlog(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost> {
  const progressNotice = new Notice("Syncing current note from Mails Blog...", 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error("Current note is not linked to a Mails Blog post yet.");
    }

    const client = createClient(settings, onSettingsChanged);
    const post = await client.getPost(metadata.postId);
    const localHash = await computeMetadataSyncHash(metadata);
    const remoteHash = await computePostSyncHash(post);
    const storedHash = metadata.syncHash?.trim() ?? "";
    const remoteChangedByTimestamp = (metadata.updatedAt?.trim() ?? "") !== post.updated_at;

    if (localHash === remoteHash) {
      await writePostBinding(app, file, post, settings.blogApiBaseUrl);
      progressNotice.hide();
      new Notice(`Current note already matches blog post: ${post.title}`);
      return post;
    }

    if (!storedHash) {
      if (!remoteChangedByTimestamp) {
        progressNotice.hide();
        throw new Error("Current note has local changes and no remote updates to pull. Publish it if you want to push those edits.");
      }
      throw new Error("Both local note and remote post may have changed. Publish local edits first or resolve manually before syncing.");
    }

    const localChangedSinceLastSync = localHash !== storedHash;
    const remoteChangedSinceLastSync = remoteHash !== storedHash;

    if (localChangedSinceLastSync && remoteChangedSinceLastSync) {
      throw new Error("Sync stopped because both the local note and the remote blog post changed since the last sync.");
    }

    if (localChangedSinceLastSync && !remoteChangedSinceLastSync) {
      progressNotice.hide();
      throw new Error("Current note has local changes that are not on the blog. Publish first if you want to keep the local version.");
    }

    if (!remoteChangedSinceLastSync) {
      await writePostBinding(app, file, post, settings.blogApiBaseUrl);
      progressNotice.hide();
      new Notice(`No remote changes to sync for: ${post.title}`);
      return post;
    }

    await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new Notice(`Synced current note from Mails Blog: ${post.title}`);
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function uploadImageFromVault(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogImageUploadResponse> {
  const progressNotice = new Notice(`Uploading image: ${file.name}...`, 0);
  try {
    const binary = await app.vault.readBinary(file);
    const mimeType = guessMimeType(file.extension);
    const client = createClient(settings, onSettingsChanged);
    const uploaded = await client.uploadImage(binary, file.name, mimeType);
    progressNotice.hide();
    new Notice(`Uploaded image: ${file.name}`);
    return uploaded;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

function guessMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
