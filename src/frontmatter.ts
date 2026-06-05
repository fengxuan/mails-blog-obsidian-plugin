import { stringifyYaml, TFile, type App } from "obsidian";
import { FRONTMATTER_KEYS } from "./constants";
import { getMessages } from "./i18n";
import type { BlogPost, ParsedNoteMetadata } from "./types";

type FrontmatterShape = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFrontmatterShape(value: unknown): FrontmatterShape {
  return isRecord(value) ? value : {};
}

function requireFrontmatterShape(value: unknown): FrontmatterShape {
  const messages = getMessages();
  if (!isRecord(value)) {
    throw new Error(messages.unexpectedFrontmatterDataShape);
  }

  return value;
}

function readTrimmedFrontmatterString(frontmatter: FrontmatterShape, key: string): string | undefined {
  const value = frontmatter[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeTags(input: unknown): string[] | undefined {
  if (Array.isArray(input)) {
    const tags = input
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
    return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
  }

  if (typeof input === "string") {
    const tags = input
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
  }

  return undefined;
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) {
    return content.trim();
  }

  return content.slice(match[0].length).trim();
}

function normalizeStringArray(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function serializeSyncSnapshot(input: {
  title: string;
  category?: string;
  tags?: string[];
  cardImage?: string;
  body: string;
}): string {
  return JSON.stringify({
    title: input.title.trim(),
    category: input.category?.trim() ?? "",
    tags: normalizeStringArray(input.tags),
    cardImage: input.cardImage?.trim() ?? "",
    body: input.body.trim(),
  });
}

export async function computeSyncHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const digestBytes = new Uint8Array(digest);
  return Array.from(digestBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computePostSyncHash(post: BlogPost): Promise<string> {
  return await computeSyncHash(serializeSyncSnapshot({
    title: post.title,
    category: post.category ?? undefined,
    tags: post.tags,
    cardImage: post.card_image ?? undefined,
    body: post.content_markdown ?? "",
  }));
}

export async function computeMetadataSyncHash(metadata: Pick<ParsedNoteMetadata, "title" | "category" | "tags" | "cardImage" | "body">): Promise<string> {
  return await computeSyncHash(serializeSyncSnapshot(metadata));
}

export async function replaceNoteWithPost(
  app: App,
  file: TFile,
  post: BlogPost,
  blogApiBaseUrl: string,
): Promise<void> {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = { ...readFrontmatterShape(cache?.frontmatter) };

  frontmatter[FRONTMATTER_KEYS.title] = post.title;
  if (post.category) {
    frontmatter[FRONTMATTER_KEYS.category] = post.category;
  } else {
    delete frontmatter[FRONTMATTER_KEYS.category];
  }
  if (post.tags.length > 0) {
    frontmatter[FRONTMATTER_KEYS.tags] = post.tags;
  } else {
    delete frontmatter[FRONTMATTER_KEYS.tags];
  }
  if (post.card_image) {
    frontmatter[FRONTMATTER_KEYS.cardImage] = post.card_image;
  } else {
    delete frontmatter[FRONTMATTER_KEYS.cardImage];
  }

  frontmatter[FRONTMATTER_KEYS.postId] = post.id;
  frontmatter[FRONTMATTER_KEYS.slug] = post.slug;
  frontmatter[FRONTMATTER_KEYS.status] = post.status;
  frontmatter[FRONTMATTER_KEYS.authorSlug] = post.author_slug;
  frontmatter[FRONTMATTER_KEYS.updatedAt] = post.updated_at;
  frontmatter[FRONTMATTER_KEYS.url] = `${blogApiBaseUrl.replace(/\/+$/, "")}/blog/${post.author_slug}/${post.slug}`;
  frontmatter[FRONTMATTER_KEYS.syncHash] = await computePostSyncHash(post);

  const frontmatterObject: FrontmatterShape = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null && value !== "") {
      frontmatterObject[key] = value;
    }
  }
  const frontmatterText = stringifyYaml(frontmatterObject).trim();
  const body = (post.content_markdown ?? "").trim();
  const nextContent = frontmatterText
    ? `---\n${frontmatterText}\n---\n\n${body}${body ? "\n" : ""}`
    : `${body}${body ? "\n" : ""}`;
  await app.vault.process(file, () => nextContent);
}

export async function parseNoteMetadata(app: App, file: TFile): Promise<ParsedNoteMetadata> {
  const messages = getMessages();
  const content = await app.vault.read(file);
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = readFrontmatterShape(cache?.frontmatter);
  const frontmatterTitle = readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.title) ?? "";
  const fallbackTitle = file.basename.trim();
  const title = frontmatterTitle || fallbackTitle;
  const category = readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.category);
  const tags = normalizeTags(frontmatter[FRONTMATTER_KEYS.tags]);
  const cardImage = readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.cardImage);

  const body = stripFrontmatter(content);
  if (!body) {
    throw new Error(messages.currentNoteBodyEmpty);
  }

  return {
    title,
    category: category || undefined,
    tags,
    cardImage: cardImage || undefined,
    postId: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.postId),
    slug: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.slug),
    url: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.url),
    status: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.status),
    authorSlug: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.authorSlug),
    updatedAt: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.updatedAt),
    syncHash: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.syncHash),
    body,
  };
}

export async function writePostBinding(
  app: App,
  file: TFile,
  post: BlogPost,
  blogApiBaseUrl: string,
): Promise<void> {
  await app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
    const nextFrontmatter = requireFrontmatterShape(frontmatter);
    nextFrontmatter[FRONTMATTER_KEYS.title] = post.title;
    if (post.category) {
      nextFrontmatter[FRONTMATTER_KEYS.category] = post.category;
    } else {
      delete nextFrontmatter[FRONTMATTER_KEYS.category];
    }
    if (post.tags.length > 0) {
      nextFrontmatter[FRONTMATTER_KEYS.tags] = post.tags;
    } else {
      delete nextFrontmatter[FRONTMATTER_KEYS.tags];
    }
    if (post.card_image) {
      nextFrontmatter[FRONTMATTER_KEYS.cardImage] = post.card_image;
    } else {
      delete nextFrontmatter[FRONTMATTER_KEYS.cardImage];
    }

    nextFrontmatter[FRONTMATTER_KEYS.postId] = post.id;
    nextFrontmatter[FRONTMATTER_KEYS.slug] = post.slug;
    nextFrontmatter[FRONTMATTER_KEYS.status] = post.status;
    nextFrontmatter[FRONTMATTER_KEYS.authorSlug] = post.author_slug;
    nextFrontmatter[FRONTMATTER_KEYS.updatedAt] = post.updated_at;
    nextFrontmatter[FRONTMATTER_KEYS.url] = `${blogApiBaseUrl.replace(/\/+$/, "")}/blog/${post.author_slug}/${post.slug}`;
  });
  const syncHash = await computePostSyncHash(post);
  await app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
    const nextFrontmatter = requireFrontmatterShape(frontmatter);
    nextFrontmatter[FRONTMATTER_KEYS.syncHash] = syncHash;
  });
}

export async function clearPostBinding(app: App, file: TFile): Promise<void> {
  const existingFrontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!isRecord(existingFrontmatter)) {
    return;
  }

  await app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
    const nextFrontmatter = requireFrontmatterShape(frontmatter);
    delete nextFrontmatter[FRONTMATTER_KEYS.postId];
    delete nextFrontmatter[FRONTMATTER_KEYS.slug];
    delete nextFrontmatter[FRONTMATTER_KEYS.url];
    delete nextFrontmatter[FRONTMATTER_KEYS.status];
    delete nextFrontmatter[FRONTMATTER_KEYS.authorSlug];
    delete nextFrontmatter[FRONTMATTER_KEYS.updatedAt];
    delete nextFrontmatter[FRONTMATTER_KEYS.syncHash];
  });
}
