/* eslint-disable */
// This file is built automatically by esbuild.

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MailsBlogPublisherPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/constants.ts
var DEFAULT_SETTINGS = {
  blogApiBaseUrl: "https://mails-blog.canyin.uk",
  obsidianPluginToken: "",
  obsidianPluginTokenExpiresAt: ""
};
var FRONTMATTER_KEYS = {
  title: "title",
  category: "category",
  tags: "tags",
  cardImage: "card_image",
  postId: "mails_blog_post_id",
  slug: "mails_blog_slug",
  url: "mails_blog_url",
  status: "mails_blog_status",
  authorSlug: "mails_blog_author_slug",
  updatedAt: "mails_blog_updated_at",
  syncHash: "mails_blog_sync_hash"
};

// src/commands.ts
var import_obsidian4 = require("obsidian");

// src/image-modal.ts
var import_obsidian = require("obsidian");
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "webp", "gif"]);
var ImageFileSuggestModal = class extends import_obsidian.FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder("Select an image from your vault");
  }
  getItems() {
    return this.app.vault.getFiles().filter((file) => IMAGE_EXTENSIONS.has(file.extension.toLowerCase()));
  }
  getItemText(item) {
    return item.path;
  }
  onChooseItem(item) {
    this.onChoose(item);
  }
};

// src/publish-service.ts
var import_obsidian3 = require("obsidian");

// src/api.ts
var import_obsidian2 = require("obsidian");
var MailsBlogApiError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MailsBlogApiError";
    this.status = status;
  }
};
var MailsBlogApiClient = class {
  constructor(settings, options = {}) {
    this.settings = settings;
    this.options = options;
  }
  async testConnection() {
    const posts = await this.request("/api/posts/me", "GET", void 0, {
      skipTokenRefresh: true
    });
    let tokenRefreshed = false;
    let refreshWarning = null;
    const currentToken = this.settings.obsidianPluginToken.trim();
    if (currentToken && this.shouldRefreshToken()) {
      try {
        await this.refreshToken(currentToken);
        tokenRefreshed = true;
      } catch (error) {
        refreshWarning = error instanceof Error ? error.message : "Token refresh failed.";
      }
    }
    return {
      posts,
      tokenRefreshed,
      refreshWarning
    };
  }
  async createDraft(payload) {
    const response = await this.request("/api/posts", "POST", payload);
    return response.post;
  }
  async updateDraft(postId, payload) {
    const response = await this.request(`/api/posts/${encodeURIComponent(postId)}`, "PATCH", payload);
    return response.post;
  }
  async publish(postId) {
    const response = await this.request(
      `/api/posts/${encodeURIComponent(postId)}/publish`,
      "POST"
    );
    return response.post;
  }
  async getPost(postId) {
    const response = await this.request(`/api/posts/${encodeURIComponent(postId)}`, "GET");
    return response.post;
  }
  async uploadImage(data, filename, mimeType) {
    await this.ensureTokenReady();
    const blogApiBaseUrl = this.requireBaseUrl();
    const token = this.requireToken();
    const boundary = `Boundary-${crypto.randomUUID()}`;
    const body = createMultipartBody(boundary, "file", filename, mimeType, data);
    const response = await (0, import_obsidian2.requestUrl)({
      url: `${blogApiBaseUrl}/api/uploads/images`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      contentType: `multipart/form-data; boundary=${boundary}`,
      body,
      throw: false
    });
    if (response.status >= 200 && response.status < 300) {
      return response.json;
    }
    const errorBody = response.json;
    throw new MailsBlogApiError(
      errorBody?.message ?? errorBody?.error ?? `Image upload failed with status ${response.status}`,
      response.status
    );
  }
  async request(path, method, body, options = {}) {
    if (!options.skipTokenRefresh) {
      await this.ensureTokenReady();
    } else {
      this.requireToken();
    }
    const blogApiBaseUrl = this.requireBaseUrl();
    const token = this.requireToken();
    const headers = {
      Authorization: `Bearer ${token}`
    };
    if (body !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    const response = await (0, import_obsidian2.requestUrl)({
      url: `${blogApiBaseUrl}${path}`,
      method,
      headers,
      body: body === void 0 ? void 0 : JSON.stringify(body),
      throw: false
    });
    if (response.status >= 200 && response.status < 300) {
      return response.json;
    }
    const errorBody = response.json;
    throw new MailsBlogApiError(
      errorBody?.message ?? errorBody?.error ?? `Request failed with status ${response.status}`,
      response.status
    );
  }
  requireBaseUrl() {
    const blogApiBaseUrl = this.settings.blogApiBaseUrl.trim().replace(/\/+$/, "");
    if (!blogApiBaseUrl) {
      throw new MailsBlogApiError("Blog API Base URL is required.");
    }
    return blogApiBaseUrl;
  }
  requireToken() {
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError("Obsidian plugin token is required.");
    }
    return token;
  }
  async ensureTokenReady() {
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError("Obsidian plugin token is required.");
    }
    if (this.shouldRefreshToken()) {
      await this.refreshToken(token);
    }
  }
  shouldRefreshToken() {
    const expiresAt = this.settings.obsidianPluginTokenExpiresAt.trim();
    if (!expiresAt) {
      return true;
    }
    const expiresAtMs = Date.parse(expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      return true;
    }
    const refreshThresholdMs = 1e3 * 60 * 60 * 24 * 3;
    return expiresAtMs - Date.now() <= refreshThresholdMs;
  }
  async refreshToken(currentToken) {
    const blogApiBaseUrl = this.requireBaseUrl();
    const response = await (0, import_obsidian2.requestUrl)({
      url: `${blogApiBaseUrl}/api/plugin-auth/refresh`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      const errorBody = response.json;
      const message = typeof errorBody?.error === "string" ? errorBody.error : errorBody?.error?.message ?? errorBody?.message ?? "Token refresh failed.";
      throw new MailsBlogApiError(message, response.status);
    }
    const payload = response.json;
    this.settings.obsidianPluginToken = payload.token;
    this.settings.obsidianPluginTokenExpiresAt = payload.expires_at;
    await this.options.onTokenRefresh?.(payload.token, payload.expires_at);
  }
};
function createMultipartBody(boundary, name, filename, mimeType, data) {
  const encoder = new TextEncoder();
  const header = `--${boundary}\r
Content-Disposition: form-data; name="${name}"; filename="${escapeQuotes(filename)}"\r
Content-Type: ${mimeType}\r
\r
`;
  const footer = `\r
--${boundary}--\r
`;
  const headerBytes = encoder.encode(header);
  const fileBytes = new Uint8Array(data);
  const footerBytes = encoder.encode(footer);
  const output = new Uint8Array(headerBytes.length + fileBytes.length + footerBytes.length);
  output.set(headerBytes, 0);
  output.set(fileBytes, headerBytes.length);
  output.set(footerBytes, headerBytes.length + fileBytes.length);
  return output.buffer;
}
function escapeQuotes(value) {
  return value.replace(/"/g, '\\"');
}

// src/frontmatter.ts
function normalizeTags(input) {
  if (Array.isArray(input)) {
    const tags = input.map((value) => String(value).trim()).filter((value) => value.length > 0);
    return tags.length > 0 ? Array.from(new Set(tags)) : void 0;
  }
  if (typeof input === "string") {
    const tags = input.split(",").map((value) => value.trim()).filter((value) => value.length > 0);
    return tags.length > 0 ? Array.from(new Set(tags)) : void 0;
  }
  return void 0;
}
function stripFrontmatter(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) {
    return content.trim();
  }
  return content.slice(match[0].length).trim();
}
function normalizeStringArray(values) {
  if (!values || values.length === 0) {
    return [];
  }
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}
function serializeSyncSnapshot(input) {
  return JSON.stringify({
    title: input.title.trim(),
    category: input.category?.trim() ?? "",
    tags: normalizeStringArray(input.tags),
    cardImage: input.cardImage?.trim() ?? "",
    body: input.body.trim()
  });
}
async function computeSyncHash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const digestBytes = new Uint8Array(digest);
  return Array.from(digestBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function computePostSyncHash(post) {
  return await computeSyncHash(serializeSyncSnapshot({
    title: post.title,
    category: post.category ?? void 0,
    tags: post.tags,
    cardImage: post.card_image ?? void 0,
    body: post.content_markdown ?? ""
  }));
}
async function computeMetadataSyncHash(metadata) {
  return await computeSyncHash(serializeSyncSnapshot(metadata));
}
function buildFrontmatter(content) {
  const trimmed = content.trim();
  return trimmed ? `---
${trimmed}
---

` : "";
}
function renderFrontmatterValue(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(", ")}]`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(String(value));
}
async function replaceNoteWithPost(app, file, post, blogApiBaseUrl) {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = { ...cache?.frontmatter ?? {} };
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
  const frontmatterEntries = Object.entries(frontmatter).filter(([, value]) => value !== void 0 && value !== null && value !== "");
  const frontmatterText = frontmatterEntries.map(([key, value]) => `${key}: ${renderFrontmatterValue(value)}`).join("\n");
  const body = (post.content_markdown ?? "").trim();
  const nextContent = `${buildFrontmatter(frontmatterText)}${body}${body ? "\n" : ""}`;
  await app.vault.modify(file, nextContent);
}
async function parseNoteMetadata(app, file) {
  const content = await app.vault.read(file);
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = cache?.frontmatter ?? {};
  const frontmatterTitle = typeof frontmatter[FRONTMATTER_KEYS.title] === "string" ? frontmatter[FRONTMATTER_KEYS.title].trim() : "";
  const fallbackTitle = file.basename.trim();
  const title = frontmatterTitle || fallbackTitle;
  const category = typeof frontmatter[FRONTMATTER_KEYS.category] === "string" ? frontmatter[FRONTMATTER_KEYS.category].trim() : void 0;
  const tags = normalizeTags(frontmatter[FRONTMATTER_KEYS.tags]);
  const cardImage = typeof frontmatter[FRONTMATTER_KEYS.cardImage] === "string" ? frontmatter[FRONTMATTER_KEYS.cardImage].trim() : void 0;
  const body = stripFrontmatter(content);
  if (!body) {
    throw new Error("Current note body is empty.");
  }
  return {
    title,
    category: category || void 0,
    tags,
    cardImage: cardImage || void 0,
    postId: typeof frontmatter[FRONTMATTER_KEYS.postId] === "string" ? frontmatter[FRONTMATTER_KEYS.postId].trim() : void 0,
    slug: typeof frontmatter[FRONTMATTER_KEYS.slug] === "string" ? frontmatter[FRONTMATTER_KEYS.slug].trim() : void 0,
    url: typeof frontmatter[FRONTMATTER_KEYS.url] === "string" ? frontmatter[FRONTMATTER_KEYS.url].trim() : void 0,
    status: typeof frontmatter[FRONTMATTER_KEYS.status] === "string" ? frontmatter[FRONTMATTER_KEYS.status].trim() : void 0,
    authorSlug: typeof frontmatter[FRONTMATTER_KEYS.authorSlug] === "string" ? frontmatter[FRONTMATTER_KEYS.authorSlug].trim() : void 0,
    updatedAt: typeof frontmatter[FRONTMATTER_KEYS.updatedAt] === "string" ? frontmatter[FRONTMATTER_KEYS.updatedAt].trim() : void 0,
    syncHash: typeof frontmatter[FRONTMATTER_KEYS.syncHash] === "string" ? frontmatter[FRONTMATTER_KEYS.syncHash].trim() : void 0,
    body
  };
}
async function writePostBinding(app, file, post, blogApiBaseUrl) {
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
  const syncHash = await computePostSyncHash(post);
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter[FRONTMATTER_KEYS.syncHash] = syncHash;
  });
}
async function clearPostBinding(app, file) {
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
    delete frontmatter[FRONTMATTER_KEYS.syncHash];
  });
}

// src/publish-service.ts
function buildPayload(metadata) {
  const payload = {
    title: metadata.title,
    content_markdown: metadata.body
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
function createClient(settings, onSettingsChanged) {
  return new MailsBlogApiClient(settings, {
    onTokenRefresh: async () => {
      await onSettingsChanged();
    }
  });
}
async function saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged = async () => {
}) {
  const progressNotice = new import_obsidian3.Notice("Saving draft to Mails Blog...", 0);
  const client = createClient(settings, onSettingsChanged);
  try {
    const metadata = await parseNoteMetadata(app, file);
    const payload = buildPayload(metadata);
    const post = metadata.postId ? await client.updateDraft(metadata.postId, payload) : await client.createDraft(payload);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian3.Notice(`Draft saved to Mails Blog: ${post.title}`);
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function publishCurrentNote(app, file, settings, onSettingsChanged = async () => {
}) {
  const progressNotice = new import_obsidian3.Notice("Publishing current note to Mails Blog...", 0);
  try {
    const draft = await saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged);
    const client = createClient(settings, onSettingsChanged);
    const post = await client.publish(draft.id);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian3.Notice(`Published to Mails Blog: ${post.title}`);
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function unlinkCurrentNote(app, file) {
  await clearPostBinding(app, file);
  new import_obsidian3.Notice("Removed local Mails Blog binding from current note.");
}
async function syncCurrentNoteFromBlog(app, file, settings, onSettingsChanged = async () => {
}) {
  const progressNotice = new import_obsidian3.Notice("Syncing current note from Mails Blog...", 0);
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
      new import_obsidian3.Notice(`Current note already matches blog post: ${post.title}`);
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
      new import_obsidian3.Notice(`No remote changes to sync for: ${post.title}`);
      return post;
    }
    await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian3.Notice(`Synced current note from Mails Blog: ${post.title}`);
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function uploadImageFromVault(app, file, settings, onSettingsChanged = async () => {
}) {
  const progressNotice = new import_obsidian3.Notice(`Uploading image: ${file.name}...`, 0);
  try {
    const binary = await app.vault.readBinary(file);
    const mimeType = guessMimeType(file.extension);
    const client = createClient(settings, onSettingsChanged);
    const uploaded = await client.uploadImage(binary, file.name, mimeType);
    progressNotice.hide();
    new import_obsidian3.Notice(`Uploaded image: ${file.name}`);
    return uploaded;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
function guessMimeType(extension) {
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

// src/commands.ts
function getCurrentMarkdownFile(app) {
  const activeView = app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
  const file = activeView?.file;
  if (!file) {
    throw new Error("Open a Markdown note first.");
  }
  return file;
}
function getCurrentMarkdownView(app) {
  const activeView = app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
  if (!activeView) {
    throw new Error("Open a Markdown note first.");
  }
  return activeView;
}
function registerCommands(app, plugin) {
  plugin.addCommand({
    id: "save-current-note-as-draft",
    name: "Save Current Note as Draft",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await saveCurrentNoteAsDraft(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to save draft.");
      }
    }
  });
  plugin.addCommand({
    id: "publish-current-note",
    name: "Publish Current Note",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await publishCurrentNote(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to publish note.");
      }
    }
  });
  plugin.addCommand({
    id: "unlink-current-note",
    name: "Unlink Current Note from Blog Post",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await unlinkCurrentNote(app, file);
      } catch (error) {
        new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to unlink note.");
      }
    }
  });
  plugin.addCommand({
    id: "sync-current-note-from-blog",
    name: "Sync Current Note From Blog",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await syncCurrentNoteFromBlog(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to sync current note from blog.");
      }
    }
  });
  plugin.addCommand({
    id: "upload-image-from-vault",
    name: "Upload Image from Vault",
    callback: async () => {
      try {
        const view = getCurrentMarkdownView(app);
        new ImageFileSuggestModal(app, async (imageFile) => {
          try {
            const uploaded = await uploadImageFromVault(app, imageFile, plugin.settings, async () => {
              await plugin.saveSettings();
            });
            view.editor.replaceSelection(uploaded.markdown);
            new import_obsidian4.Notice(`Inserted image markdown for ${imageFile.name}`);
          } catch (error) {
            new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to upload image.");
          }
        }).open();
      } catch (error) {
        new import_obsidian4.Notice(error instanceof Error ? error.message : "Failed to open image picker.");
      }
    }
  });
}

// src/settings.ts
var import_obsidian5 = require("obsidian");
var MailsBlogSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Mails Blog Publisher" });
    new import_obsidian5.Setting(containerEl).setName("Blog API Base URL").setDesc("The Mails Blog API base URL.").addText((text) => {
      text.setPlaceholder("https://mails-blog.canyin.uk").setValue(this.plugin.settings.blogApiBaseUrl).onChange(async (value) => {
        this.plugin.settings.blogApiBaseUrl = value.trim();
        await this.plugin.saveSettings();
      });
      text.inputEl.style.width = "100%";
    });
    new import_obsidian5.Setting(containerEl).setName("Obsidian Plugin Token").setDesc("Generate this token in iOS Settings -> Obsidian Plugin, then paste it here.").addTextArea((text) => {
      text.setPlaceholder("Paste the token copied from iOS Settings").setValue(this.plugin.settings.obsidianPluginToken).onChange(async (value) => {
        this.plugin.settings.obsidianPluginToken = value.trim();
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 4;
      text.inputEl.style.width = "100%";
    });
    const preview = containerEl.createDiv({ cls: "mails-blog-plugin-setting-help" });
    const token = this.plugin.settings.obsidianPluginToken.trim();
    preview.setText(token ? `Token preview: ${token.slice(0, 8)}...${token.slice(-6)}` : "Token not configured yet.");
    if (this.plugin.settings.obsidianPluginTokenExpiresAt.trim()) {
      containerEl.createEl("p", {
        cls: "mails-blog-plugin-setting-help",
        text: `Token expires at: ${this.plugin.settings.obsidianPluginTokenExpiresAt}`
      });
    }
    new import_obsidian5.Setting(containerEl).setName("Test Connection").setDesc("Verify that the current API URL and token can access your blog drafts.").addButton((button) => {
      button.setButtonText("Test");
      button.onClick(async () => {
        button.setDisabled(true);
        try {
          const client = new MailsBlogApiClient(this.plugin.settings, {
            onTokenRefresh: async () => {
              await this.plugin.saveSettings();
            }
          });
          const result = await client.testConnection();
          await this.plugin.saveSettings();
          const baseMessage = `Connected successfully. ${result.posts.items.length} post(s) visible.`;
          if (result.tokenRefreshed) {
            new import_obsidian5.Notice(`${baseMessage} Token rotated and saved locally.`);
          } else if (result.refreshWarning) {
            new import_obsidian5.Notice(`${baseMessage} Warning: current token works, but refresh failed: ${result.refreshWarning}`);
          } else {
            new import_obsidian5.Notice(baseMessage);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Connection test failed.";
          new import_obsidian5.Notice(message);
        } finally {
          button.setDisabled(false);
        }
      });
    });
  }
};

// main.ts
var MailsBlogPublisherPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MailsBlogSettingTab(this.app, this));
    registerCommands(this.app, this);
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded ?? {}
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
