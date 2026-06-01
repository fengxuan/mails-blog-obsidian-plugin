import { TFile, type App } from "obsidian";
import { FRONTMATTER_KEYS } from "./constants";
import type { BlogPost, ParsedNoteMetadata } from "./types";

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

export async function parseNoteMetadata(app: App, file: TFile): Promise<ParsedNoteMetadata> {
  const content = await app.vault.read(file);
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = cache?.frontmatter ?? {};
  const frontmatterTitle = typeof frontmatter[FRONTMATTER_KEYS.title] === "string"
    ? frontmatter[FRONTMATTER_KEYS.title].trim()
    : "";
  const fallbackTitle = file.basename.trim();
  const title = frontmatterTitle || fallbackTitle;
  const category = typeof frontmatter[FRONTMATTER_KEYS.category] === "string"
    ? frontmatter[FRONTMATTER_KEYS.category].trim()
    : undefined;
  const tags = normalizeTags(frontmatter[FRONTMATTER_KEYS.tags]);
  const cardImage = typeof frontmatter[FRONTMATTER_KEYS.cardImage] === "string"
    ? frontmatter[FRONTMATTER_KEYS.cardImage].trim()
    : undefined;

  const body = stripFrontmatter(content);
  if (!body) {
    throw new Error("Current note body is empty.");
  }

  return {
    title,
    category: category || undefined,
    tags,
    cardImage: cardImage || undefined,
    postId: typeof frontmatter[FRONTMATTER_KEYS.postId] === "string"
      ? frontmatter[FRONTMATTER_KEYS.postId].trim()
      : undefined,
    slug: typeof frontmatter[FRONTMATTER_KEYS.slug] === "string"
      ? frontmatter[FRONTMATTER_KEYS.slug].trim()
      : undefined,
    url: typeof frontmatter[FRONTMATTER_KEYS.url] === "string"
      ? frontmatter[FRONTMATTER_KEYS.url].trim()
      : undefined,
    status: typeof frontmatter[FRONTMATTER_KEYS.status] === "string"
      ? frontmatter[FRONTMATTER_KEYS.status].trim()
      : undefined,
    authorSlug: typeof frontmatter[FRONTMATTER_KEYS.authorSlug] === "string"
      ? frontmatter[FRONTMATTER_KEYS.authorSlug].trim()
      : undefined,
    updatedAt: typeof frontmatter[FRONTMATTER_KEYS.updatedAt] === "string"
      ? frontmatter[FRONTMATTER_KEYS.updatedAt].trim()
      : undefined,
    body,
  };
}

export async function writePostBinding(
  app: App,
  file: TFile,
  post: BlogPost,
  blogApiBaseUrl: string,
): Promise<void> {
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
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
  });
}

export async function clearPostBinding(app: App, file: TFile): Promise<void> {
  const existingFrontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!existingFrontmatter) {
    return;
  }

  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    delete frontmatter[FRONTMATTER_KEYS.postId];
    delete frontmatter[FRONTMATTER_KEYS.slug];
    delete frontmatter[FRONTMATTER_KEYS.url];
    delete frontmatter[FRONTMATTER_KEYS.status];
    delete frontmatter[FRONTMATTER_KEYS.authorSlug];
    delete frontmatter[FRONTMATTER_KEYS.updatedAt];
  });
}
