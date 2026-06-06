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
var import_obsidian7 = require("obsidian");

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
var import_obsidian5 = require("obsidian");

// src/publish-service.ts
var import_obsidian4 = require("obsidian");

// src/api.ts
var import_obsidian2 = require("obsidian");

// src/errors.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
function collectMessages(value, seen) {
  if (value === null || value === void 0) {
    return [];
  }
  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized ? [normalized] : [];
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return [String(value)];
  }
  if (seen.has(value)) {
    return [];
  }
  seen.add(value);
  if (value instanceof Error) {
    return collectMessages(value.message, seen);
  }
  if (Array.isArray(value)) {
    const nested2 = value.flatMap((item) => collectMessages(item, seen));
    return Array.from(new Set(nested2));
  }
  if (!isRecord(value)) {
    const normalized = normalizeWhitespace(String(value));
    return normalized ? [normalized] : [];
  }
  const priorityKeys = [
    "message",
    "error",
    "detail",
    "details",
    "reason",
    "description",
    "title",
    "msg"
  ];
  const messages = [];
  for (const key of priorityKeys) {
    if (key in value) {
      messages.push(...collectMessages(value[key], seen));
    }
  }
  if (messages.length > 0) {
    return Array.from(new Set(messages));
  }
  const nested = Object.values(value).flatMap((item) => collectMessages(item, seen));
  return Array.from(new Set(nested));
}
function getErrorMessage(error, fallback) {
  const messages = collectMessages(error, /* @__PURE__ */ new Set());
  if (messages.length === 0) {
    return fallback;
  }
  return messages.join("; ");
}

// src/i18n.ts
var import_obsidian = require("obsidian");
var enMessages = {
  blogApiBaseUrlName: "Blog API Base URL",
  blogApiBaseUrlDesc: "The Mails Blog API base URL.",
  blogApiBaseUrlPlaceholder: "https://mails-blog.canyin.uk",
  obsidianPluginTokenName: "Obsidian Plugin Token",
  obsidianPluginTokenDesc: "Generate this token in iOS Settings -> Obsidian Plugin, then paste it here.",
  obsidianPluginTokenPlaceholder: "Paste the token copied from iOS Settings",
  tokenPreview: (token) => `Token preview: ${token.slice(0, 8)}...${token.slice(-6)}`,
  tokenNotConfigured: "Token not configured yet.",
  tokenExpiresAt: (expiresAt) => `Token expires at: ${expiresAt}`,
  testConnectionName: "Test Connection",
  testConnectionDesc: "Verify that the current API URL and token can access your blog drafts.",
  testConnectionButton: "Test",
  connectionSuccess: (count) => `Connected successfully. ${count} post(s) visible.`,
  connectionSuccessTokenRotated: (count) => `Connected successfully. ${count} post(s) visible. Token rotated and saved locally.`,
  connectionSuccessRefreshWarning: (count, warning) => `Connected successfully. ${count} post(s) visible. Warning: current token works, but refresh failed: ${warning}`,
  connectionTestFailed: "Connection test failed.",
  saveCurrentNoteAsDraftCommand: "Save Current Note as Draft",
  publishCurrentNoteCommand: "Publish Current Note",
  unlinkCurrentNoteCommand: "Unlink Current Note from Blog Post",
  syncCurrentNoteFromBlogCommand: "Sync Current Note From Blog",
  showCurrentNoteVersionHistoryCommand: "Show Current Note Version History",
  restoreCurrentNoteFromBlogVersionCommand: "Restore Current Note From Blog Version",
  uploadImageCommand: "Upload Image",
  uploadCurrentNoteUnsyncedImagesCommand: "Upload Unsynced Images in Current Note",
  openMarkdownNoteFirst: "Open a Markdown note first.",
  failedToSaveDraft: "Failed to save draft.",
  failedToPublishNote: "Failed to publish note.",
  failedToUnlinkNote: "Failed to unlink note.",
  failedToSyncCurrentNoteFromBlog: "Failed to sync current note from blog.",
  failedToLoadVersionHistory: "Failed to load version history.",
  failedToRestoreNoteFromVersionHistory: "Failed to restore note from version history.",
  failedToUploadImage: "Failed to upload image.",
  failedToUploadCurrentNoteUnsyncedImages: "Failed to upload unsynced images in current note.",
  insertedImageMarkdown: (fileName) => `Inserted image markdown for ${fileName}`,
  selectSupportedImageFile: "Please select a jpg, jpeg, png, webp, or gif image.",
  syncingCurrentNoteImages: "Uploading unsynced images in current note...",
  noLocalImagesFoundInCurrentNote: "No local images found in the current note.",
  noUnsyncedImagesFoundInCurrentNote: "All images in the current note are already synced.",
  unsupportedEmbeddedImageFormat: (fileName) => `Unsupported embedded image format: ${fileName}`,
  syncedCurrentNoteImages: (uploadedCount, skippedCount) => `Uploaded ${uploadedCount} image(s) from the current note. Skipped ${skippedCount}.`,
  versionHistoryViewTitle: "Mails Blog Version History",
  versionHistoryTitle: "Version History",
  currentNoteLabel: (fileName) => `Current note: ${fileName}`,
  noSavedVersionsYet: "No saved versions yet.",
  versionLabel: (versionNumber) => `Version ${versionNumber}`,
  currentDraftBadge: "current draft",
  currentPublishedBadge: "current published",
  updatedAt: (value) => `Updated ${value}`,
  publishedAt: (value) => `Published ${value}`,
  categoryLabel: (value) => `Category ${value}`,
  selectVersionToRestore: "Select a blog version to restore",
  noMatchingVersionsFound: "No matching versions found.",
  restoreSelectedVersion: "Restore selected version",
  cancel: "Cancel",
  restoreBlogVersionTitle: "Restore blog version?",
  versionWillBecomeCurrentRemoteDraft: (versionNumber) => `Version ${versionNumber} will become the current remote draft.`,
  replaceLocalNoteContent: (filePath) => `This also replaces the local note content in ${filePath}.`,
  restore: "Restore",
  savingDraft: "Saving draft to Mails Blog...",
  draftSaved: (title) => `Draft saved to Mails Blog: ${title}`,
  publishingCurrentNote: "Publishing current note to Mails Blog...",
  published: (title) => `Published to Mails Blog: ${title}`,
  removedLocalBinding: "Removed local Mails Blog binding from current note.",
  syncingCurrentNote: "Syncing current note from Mails Blog...",
  currentNoteNotLinked: "Current note is not linked to a Mails Blog post yet.",
  currentNoteAlreadyMatches: (title) => `Current note already matches blog post: ${title}`,
  localChangesNoRemoteUpdates: "Current note has local changes and no remote updates to pull. Publish it if you want to push those edits.",
  bothChangedManualResolve: "Both local note and remote post may have changed. Publish local edits first or resolve manually before syncing.",
  syncStoppedBothChanged: "Sync stopped because both the local note and the remote blog post changed since the last sync.",
  localChangesNotOnBlog: "Current note has local changes that are not on the blog. Publish first if you want to keep the local version.",
  noRemoteChangesToSync: (title) => `No remote changes to sync for: ${title}`,
  syncedCurrentNote: (title) => `Synced current note from Mails Blog: ${title}`,
  uploadingImage: (fileName) => `Uploading image: ${fileName}...`,
  uploadedImage: (fileName) => `Uploaded image: ${fileName}`,
  loadingVersionHistory: "Loading version history from Mails Blog...",
  noSavedVersionsAvailableToRestore: "No saved versions available to restore.",
  alreadyCurrentDraft: (versionLabel2) => `${versionLabel2} is already the current draft.`,
  restoringSelectedVersion: "Restoring selected version...",
  restoredIntoCurrentDraft: (versionLabel2) => `Restored ${versionLabel2} into current draft.`,
  noBodyContentSavedForVersion: "No body content saved for this version.",
  unexpectedFrontmatterDataShape: "Unexpected frontmatter data shape.",
  currentNoteBodyEmpty: "Current note body is empty.",
  imageUploadFailedStatus: (status) => `Image upload failed with status ${status}`,
  requestFailedStatus: (status) => `Request failed with status ${status}`,
  blogApiBaseUrlRequired: "Blog API Base URL is required.",
  obsidianPluginTokenRequired: "Obsidian plugin token is required.",
  tokenRefreshFailed: "Token refresh failed.",
  statusLabel: (status) => {
    switch (status) {
      case "draft":
        return "draft";
      case "published":
        return "published";
      case "archived":
        return "archived";
      default:
        return status;
    }
  }
};
var zhMessages = {
  blogApiBaseUrlName: "\u535A\u5BA2 API \u5730\u5740",
  blogApiBaseUrlDesc: "Mails Blog API \u7684\u57FA\u7840\u5730\u5740\u3002",
  blogApiBaseUrlPlaceholder: "https://mails-blog.canyin.uk",
  obsidianPluginTokenName: "Obsidian \u63D2\u4EF6\u4EE4\u724C",
  obsidianPluginTokenDesc: "\u8BF7\u5148\u5728 iOS \u8BBE\u7F6E -> Obsidian Plugin \u4E2D\u751F\u6210\u4EE4\u724C\uFF0C\u7136\u540E\u7C98\u8D34\u5230\u8FD9\u91CC\u3002",
  obsidianPluginTokenPlaceholder: "\u7C98\u8D34\u4ECE iOS \u8BBE\u7F6E\u590D\u5236\u7684\u4EE4\u724C",
  tokenPreview: (token) => `\u4EE4\u724C\u9884\u89C8\uFF1A${token.slice(0, 8)}...${token.slice(-6)}`,
  tokenNotConfigured: "\u8FD8\u6CA1\u6709\u914D\u7F6E\u4EE4\u724C\u3002",
  tokenExpiresAt: (expiresAt) => `\u4EE4\u724C\u8FC7\u671F\u65F6\u95F4\uFF1A${expiresAt}`,
  testConnectionName: "\u6D4B\u8BD5\u8FDE\u63A5",
  testConnectionDesc: "\u9A8C\u8BC1\u5F53\u524D API \u5730\u5740\u548C\u4EE4\u724C\u662F\u5426\u53EF\u4EE5\u8BBF\u95EE\u4F60\u7684\u535A\u5BA2\u8349\u7A3F\u3002",
  testConnectionButton: "\u6D4B\u8BD5",
  connectionSuccess: (count) => `\u8FDE\u63A5\u6210\u529F\uFF0C\u53EF\u89C1 ${count} \u7BC7\u6587\u7AE0\u3002`,
  connectionSuccessTokenRotated: (count) => `\u8FDE\u63A5\u6210\u529F\uFF0C\u53EF\u89C1 ${count} \u7BC7\u6587\u7AE0\u3002\u4EE4\u724C\u5DF2\u8F6E\u6362\u5E76\u4FDD\u5B58\u5230\u672C\u5730\u3002`,
  connectionSuccessRefreshWarning: (count, warning) => `\u8FDE\u63A5\u6210\u529F\uFF0C\u53EF\u89C1 ${count} \u7BC7\u6587\u7AE0\u3002\u8B66\u544A\uFF1A\u5F53\u524D\u4EE4\u724C\u53EF\u7528\uFF0C\u4F46\u5237\u65B0\u5931\u8D25\uFF1A${warning}`,
  connectionTestFailed: "\u8FDE\u63A5\u6D4B\u8BD5\u5931\u8D25\u3002",
  saveCurrentNoteAsDraftCommand: "\u4FDD\u5B58\u5F53\u524D\u7B14\u8BB0\u4E3A\u8349\u7A3F",
  publishCurrentNoteCommand: "\u53D1\u5E03\u5F53\u524D\u7B14\u8BB0",
  unlinkCurrentNoteCommand: "\u53D6\u6D88\u5F53\u524D\u7B14\u8BB0\u4E0E\u535A\u5BA2\u6587\u7AE0\u7684\u5173\u8054",
  syncCurrentNoteFromBlogCommand: "\u4ECE\u535A\u5BA2\u540C\u6B65\u5F53\u524D\u7B14\u8BB0",
  showCurrentNoteVersionHistoryCommand: "\u67E5\u770B\u5F53\u524D\u7B14\u8BB0\u7684\u7248\u672C\u5386\u53F2",
  restoreCurrentNoteFromBlogVersionCommand: "\u4ECE\u535A\u5BA2\u7248\u672C\u6062\u590D\u5F53\u524D\u7B14\u8BB0",
  uploadImageCommand: "\u4E0A\u4F20\u56FE\u7247",
  uploadCurrentNoteUnsyncedImagesCommand: "\u4E0A\u4F20\u5F53\u524D\u7B14\u8BB0\u672A\u540C\u6B65\u7684\u5168\u90E8\u56FE\u7247",
  openMarkdownNoteFirst: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u7B14\u8BB0\u3002",
  failedToSaveDraft: "\u4FDD\u5B58\u8349\u7A3F\u5931\u8D25\u3002",
  failedToPublishNote: "\u53D1\u5E03\u7B14\u8BB0\u5931\u8D25\u3002",
  failedToUnlinkNote: "\u53D6\u6D88\u5173\u8054\u5931\u8D25\u3002",
  failedToSyncCurrentNoteFromBlog: "\u4ECE\u535A\u5BA2\u540C\u6B65\u5F53\u524D\u7B14\u8BB0\u5931\u8D25\u3002",
  failedToLoadVersionHistory: "\u52A0\u8F7D\u7248\u672C\u5386\u53F2\u5931\u8D25\u3002",
  failedToRestoreNoteFromVersionHistory: "\u4ECE\u7248\u672C\u5386\u53F2\u6062\u590D\u7B14\u8BB0\u5931\u8D25\u3002",
  failedToUploadImage: "\u4E0A\u4F20\u56FE\u7247\u5931\u8D25\u3002",
  failedToUploadCurrentNoteUnsyncedImages: "\u4E0A\u4F20\u5F53\u524D\u7B14\u8BB0\u672A\u540C\u6B65\u56FE\u7247\u5931\u8D25\u3002",
  insertedImageMarkdown: (fileName) => `\u5DF2\u63D2\u5165\u56FE\u7247 Markdown\uFF1A${fileName}`,
  selectSupportedImageFile: "\u8BF7\u9009\u62E9 jpg\u3001jpeg\u3001png\u3001webp \u6216 gif \u56FE\u7247\u3002",
  syncingCurrentNoteImages: "\u6B63\u5728\u4E0A\u4F20\u5F53\u524D\u7B14\u8BB0\u672A\u540C\u6B65\u7684\u56FE\u7247...",
  noLocalImagesFoundInCurrentNote: "\u5F53\u524D\u7B14\u8BB0\u4E2D\u6CA1\u6709\u627E\u5230\u672C\u5730\u56FE\u7247\u3002",
  noUnsyncedImagesFoundInCurrentNote: "\u5F53\u524D\u7B14\u8BB0\u4E2D\u7684\u56FE\u7247\u90FD\u5DF2\u7ECF\u540C\u6B65\u3002",
  unsupportedEmbeddedImageFormat: (fileName) => `\u4E0D\u652F\u6301\u7684\u5D4C\u5165\u56FE\u7247\u683C\u5F0F\uFF1A${fileName}`,
  syncedCurrentNoteImages: (uploadedCount, skippedCount) => `\u5DF2\u4E0A\u4F20\u5F53\u524D\u7B14\u8BB0\u4E2D\u7684 ${uploadedCount} \u5F20\u56FE\u7247\uFF0C\u8DF3\u8FC7 ${skippedCount} \u5F20\u3002`,
  versionHistoryViewTitle: "Mails Blog \u7248\u672C\u5386\u53F2",
  versionHistoryTitle: "\u7248\u672C\u5386\u53F2",
  currentNoteLabel: (fileName) => `\u5F53\u524D\u7B14\u8BB0\uFF1A${fileName}`,
  noSavedVersionsYet: "\u8FD8\u6CA1\u6709\u5DF2\u4FDD\u5B58\u7684\u7248\u672C\u3002",
  versionLabel: (versionNumber) => `\u7248\u672C ${versionNumber}`,
  currentDraftBadge: "\u5F53\u524D\u8349\u7A3F",
  currentPublishedBadge: "\u5F53\u524D\u5DF2\u53D1\u5E03",
  updatedAt: (value) => `\u66F4\u65B0\u4E8E ${value}`,
  publishedAt: (value) => `\u53D1\u5E03\u4E8E ${value}`,
  categoryLabel: (value) => `\u5206\u7C7B ${value}`,
  selectVersionToRestore: "\u9009\u62E9\u8981\u6062\u590D\u7684\u535A\u5BA2\u7248\u672C",
  noMatchingVersionsFound: "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u7248\u672C\u3002",
  restoreSelectedVersion: "\u6062\u590D\u6240\u9009\u7248\u672C",
  cancel: "\u53D6\u6D88",
  restoreBlogVersionTitle: "\u6062\u590D\u535A\u5BA2\u7248\u672C\uFF1F",
  versionWillBecomeCurrentRemoteDraft: (versionNumber) => `\u7248\u672C ${versionNumber} \u5C06\u6210\u4E3A\u5F53\u524D\u8FDC\u7AEF\u8349\u7A3F\u3002`,
  replaceLocalNoteContent: (filePath) => `\u8FD9\u4E5F\u4F1A\u66FF\u6362\u672C\u5730\u7B14\u8BB0\u5185\u5BB9\uFF1A${filePath}\u3002`,
  restore: "\u6062\u590D",
  savingDraft: "\u6B63\u5728\u4FDD\u5B58\u8349\u7A3F\u5230 Mails Blog...",
  draftSaved: (title) => `\u8349\u7A3F\u5DF2\u4FDD\u5B58\u5230 Mails Blog\uFF1A${title}`,
  publishingCurrentNote: "\u6B63\u5728\u53D1\u5E03\u5F53\u524D\u7B14\u8BB0\u5230 Mails Blog...",
  published: (title) => `\u5DF2\u53D1\u5E03\u5230 Mails Blog\uFF1A${title}`,
  removedLocalBinding: "\u5DF2\u79FB\u9664\u5F53\u524D\u7B14\u8BB0\u7684\u672C\u5730 Mails Blog \u7ED1\u5B9A\u3002",
  syncingCurrentNote: "\u6B63\u5728\u4ECE Mails Blog \u540C\u6B65\u5F53\u524D\u7B14\u8BB0...",
  currentNoteNotLinked: "\u5F53\u524D\u7B14\u8BB0\u8FD8\u6CA1\u6709\u5173\u8054\u5230 Mails Blog \u6587\u7AE0\u3002",
  currentNoteAlreadyMatches: (title) => `\u5F53\u524D\u7B14\u8BB0\u5DF2\u4E0E\u535A\u5BA2\u6587\u7AE0\u4E00\u81F4\uFF1A${title}`,
  localChangesNoRemoteUpdates: "\u5F53\u524D\u7B14\u8BB0\u6709\u672C\u5730\u6539\u52A8\uFF0C\u8FDC\u7AEF\u6CA1\u6709\u53EF\u62C9\u53D6\u7684\u66F4\u65B0\u3002\u5982\u679C\u8981\u63A8\u9001\u8FD9\u4E9B\u6539\u52A8\uFF0C\u8BF7\u5148\u53D1\u5E03\u3002",
  bothChangedManualResolve: "\u672C\u5730\u7B14\u8BB0\u548C\u8FDC\u7AEF\u6587\u7AE0\u53EF\u80FD\u90FD\u5DF2\u53D8\u66F4\u3002\u8BF7\u5148\u53D1\u5E03\u672C\u5730\u6539\u52A8\uFF0C\u6216\u624B\u52A8\u5904\u7406\u51B2\u7A81\u540E\u518D\u540C\u6B65\u3002",
  syncStoppedBothChanged: "\u540C\u6B65\u5DF2\u505C\u6B62\uFF0C\u56E0\u4E3A\u81EA\u4E0A\u6B21\u540C\u6B65\u540E\uFF0C\u672C\u5730\u7B14\u8BB0\u548C\u8FDC\u7AEF\u535A\u5BA2\u6587\u7AE0\u90FD\u53D1\u751F\u4E86\u53D8\u5316\u3002",
  localChangesNotOnBlog: "\u5F53\u524D\u7B14\u8BB0\u6709\u5C1A\u672A\u540C\u6B65\u5230\u535A\u5BA2\u7684\u672C\u5730\u6539\u52A8\u3002\u5982\u679C\u60F3\u4FDD\u7559\u672C\u5730\u7248\u672C\uFF0C\u8BF7\u5148\u53D1\u5E03\u3002",
  noRemoteChangesToSync: (title) => `\u6CA1\u6709\u53EF\u540C\u6B65\u7684\u8FDC\u7AEF\u66F4\u65B0\uFF1A${title}`,
  syncedCurrentNote: (title) => `\u5DF2\u4ECE Mails Blog \u540C\u6B65\u5F53\u524D\u7B14\u8BB0\uFF1A${title}`,
  uploadingImage: (fileName) => `\u6B63\u5728\u4E0A\u4F20\u56FE\u7247\uFF1A${fileName}...`,
  uploadedImage: (fileName) => `\u56FE\u7247\u5DF2\u4E0A\u4F20\uFF1A${fileName}`,
  loadingVersionHistory: "\u6B63\u5728\u4ECE Mails Blog \u52A0\u8F7D\u7248\u672C\u5386\u53F2...",
  noSavedVersionsAvailableToRestore: "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u5DF2\u4FDD\u5B58\u7248\u672C\u3002",
  alreadyCurrentDraft: (versionLabel2) => `${versionLabel2} \u5DF2\u7ECF\u662F\u5F53\u524D\u8349\u7A3F\u3002`,
  restoringSelectedVersion: "\u6B63\u5728\u6062\u590D\u6240\u9009\u7248\u672C...",
  restoredIntoCurrentDraft: (versionLabel2) => `\u5DF2\u5C06 ${versionLabel2} \u6062\u590D\u4E3A\u5F53\u524D\u8349\u7A3F\u3002`,
  noBodyContentSavedForVersion: "\u8FD9\u4E2A\u7248\u672C\u6CA1\u6709\u4FDD\u5B58\u6B63\u6587\u5185\u5BB9\u3002",
  unexpectedFrontmatterDataShape: "Frontmatter \u6570\u636E\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F\u3002",
  currentNoteBodyEmpty: "\u5F53\u524D\u7B14\u8BB0\u6B63\u6587\u4E3A\u7A7A\u3002",
  imageUploadFailedStatus: (status) => `\u56FE\u7247\u4E0A\u4F20\u5931\u8D25\uFF0C\u72B6\u6001\u7801 ${status}`,
  requestFailedStatus: (status) => `\u8BF7\u6C42\u5931\u8D25\uFF0C\u72B6\u6001\u7801 ${status}`,
  blogApiBaseUrlRequired: "\u5FC5\u987B\u586B\u5199\u535A\u5BA2 API \u5730\u5740\u3002",
  obsidianPluginTokenRequired: "\u5FC5\u987B\u586B\u5199 Obsidian \u63D2\u4EF6\u4EE4\u724C\u3002",
  tokenRefreshFailed: "\u4EE4\u724C\u5237\u65B0\u5931\u8D25\u3002",
  statusLabel: (status) => {
    switch (status) {
      case "draft":
        return "\u8349\u7A3F";
      case "published":
        return "\u5DF2\u53D1\u5E03";
      case "archived":
        return "\u5DF2\u5F52\u6863";
      default:
        return status;
    }
  }
};
function getMessages() {
  const language = ((0, import_obsidian.requireApiVersion)("1.8.7") ? (0, import_obsidian.getLanguage)() : window.navigator.language).trim().toLowerCase();
  if (!language.startsWith("zh")) {
    return enMessages;
  }
  return {
    ...enMessages,
    ...zhMessages
  };
}

// src/api.ts
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
    const messages = getMessages();
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
        refreshWarning = getErrorMessage(error, messages.tokenRefreshFailed);
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
  async listPostVersions(postId) {
    const response = await this.request(
      `/api/posts/${encodeURIComponent(postId)}/versions`,
      "GET"
    );
    return response.versions;
  }
  async getPostVersion(postId, versionId) {
    const response = await this.request(
      `/api/posts/${encodeURIComponent(postId)}/versions/${encodeURIComponent(versionId)}`,
      "GET"
    );
    return response.version;
  }
  async restorePostVersion(postId, versionId) {
    const response = await this.request(
      `/api/posts/${encodeURIComponent(postId)}/versions/${encodeURIComponent(versionId)}/restore`,
      "POST",
      {}
    );
    return response.post;
  }
  async uploadImage(data, filename, mimeType) {
    const messages = getMessages();
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
    const fallbackText = response.text?.trim();
    throw new MailsBlogApiError(
      getErrorMessage(errorBody ?? fallbackText, messages.imageUploadFailedStatus(response.status)),
      response.status
    );
  }
  async request(path, method, body, options = {}) {
    const messages = getMessages();
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
    const fallbackText = response.text?.trim();
    throw new MailsBlogApiError(
      getErrorMessage(errorBody ?? fallbackText, messages.requestFailedStatus(response.status)),
      response.status
    );
  }
  requireBaseUrl() {
    const messages = getMessages();
    const blogApiBaseUrl = this.settings.blogApiBaseUrl.trim().replace(/\/+$/, "");
    if (!blogApiBaseUrl) {
      throw new MailsBlogApiError(messages.blogApiBaseUrlRequired);
    }
    return blogApiBaseUrl;
  }
  requireToken() {
    const messages = getMessages();
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError(messages.obsidianPluginTokenRequired);
    }
    return token;
  }
  async ensureTokenReady() {
    const messages = getMessages();
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError(messages.obsidianPluginTokenRequired);
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
    const messages = getMessages();
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
      const fallbackText = response.text?.trim();
      const message = getErrorMessage(errorBody ?? fallbackText, messages.tokenRefreshFailed);
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
var import_obsidian3 = require("obsidian");
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readFrontmatterShape(value) {
  return isRecord2(value) ? value : {};
}
function requireFrontmatterShape(value) {
  const messages = getMessages();
  if (!isRecord2(value)) {
    throw new Error(messages.unexpectedFrontmatterDataShape);
  }
  return value;
}
function readTrimmedFrontmatterString(frontmatter, key) {
  const value = frontmatter[key];
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed || void 0;
}
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
async function replaceNoteWithPost(app, file, post, blogApiBaseUrl) {
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
  const frontmatterObject = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== void 0 && value !== null && value !== "") {
      frontmatterObject[key] = value;
    }
  }
  const frontmatterText = (0, import_obsidian3.stringifyYaml)(frontmatterObject).trim();
  const body = (post.content_markdown ?? "").trim();
  const nextContent = frontmatterText ? `---
${frontmatterText}
---

${body}${body ? "\n" : ""}` : `${body}${body ? "\n" : ""}`;
  await app.vault.process(file, () => nextContent);
}
async function parseNoteMetadata(app, file) {
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
    category: category || void 0,
    tags,
    cardImage: cardImage || void 0,
    postId: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.postId),
    slug: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.slug),
    url: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.url),
    status: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.status),
    authorSlug: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.authorSlug),
    updatedAt: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.updatedAt),
    syncHash: readTrimmedFrontmatterString(frontmatter, FRONTMATTER_KEYS.syncHash),
    body
  };
}
async function writePostBinding(app, file, post, blogApiBaseUrl) {
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
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
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    const nextFrontmatter = requireFrontmatterShape(frontmatter);
    nextFrontmatter[FRONTMATTER_KEYS.syncHash] = syncHash;
  });
}
async function clearPostBinding(app, file) {
  const existingFrontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!isRecord2(existingFrontmatter)) {
    return;
  }
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
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

// src/publish-service.ts
var BLOG_VERSION_HISTORY_VIEW_TYPE = "mails-blog-version-history";
var BlogVersionHistoryView = class extends import_obsidian4.ItemView {
  constructor(leaf) {
    super(leaf);
    this.versions = [];
    this.postTitle = "";
    this.fileName = "";
  }
  getViewType() {
    return BLOG_VERSION_HISTORY_VIEW_TYPE;
  }
  getDisplayText() {
    return getMessages().versionHistoryViewTitle;
  }
  async setState(state) {
    this.postTitle = state.postTitle;
    this.fileName = state.fileName;
    this.versions = state.versions;
    this.render();
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    const messages = getMessages();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mails-blog-version-history-view");
    contentEl.createEl("h2", { text: this.postTitle || messages.versionHistoryTitle });
    if (this.fileName) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-subtitle",
        text: messages.currentNoteLabel(this.fileName)
      });
    }
    if (this.versions.length === 0) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-empty",
        text: messages.noSavedVersionsYet
      });
      return;
    }
    const listEl = contentEl.createDiv({ cls: "mails-blog-version-history-list" });
    this.versions.forEach((version) => {
      const cardEl = listEl.createDiv({ cls: "mails-blog-version-history-card" });
      const topRow = cardEl.createDiv({ cls: "mails-blog-version-history-top" });
      topRow.createEl("strong", { text: messages.versionLabel(version.version_number) });
      const badgesEl = topRow.createDiv({ cls: "mails-blog-version-history-badges" });
      badgesEl.createSpan({
        cls: `mails-blog-version-history-badge is-${version.status}`,
        text: messages.statusLabel(version.status)
      });
      if (version.is_current_draft) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-draft",
          text: messages.currentDraftBadge
        });
      }
      if (version.is_current_published) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-published",
          text: messages.currentPublishedBadge
        });
      }
      cardEl.createEl("div", {
        cls: "mails-blog-version-history-title",
        text: version.title
      });
      const metaParts = [
        messages.updatedAt(formatTimestamp(version.updated_at)),
        version.published_at ? messages.publishedAt(formatTimestamp(version.published_at)) : "",
        version.category ? messages.categoryLabel(version.category) : ""
      ].filter(Boolean);
      if (metaParts.length > 0) {
        cardEl.createEl("div", {
          cls: "mails-blog-version-history-meta",
          text: metaParts.join(" \xB7 ")
        });
      }
      if (version.tags.length > 0) {
        cardEl.createEl("div", {
          cls: "mails-blog-version-history-tags",
          text: version.tags.map((tag) => `#${tag}`).join(" ")
        });
      }
      const body = (version.content_markdown ?? "").trim() || version.excerpt.trim();
      cardEl.createEl("pre", {
        cls: "mails-blog-version-history-preview",
        text: previewBody(body)
      });
    });
  }
};
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
var BlogVersionSuggestModal = class extends import_obsidian4.SuggestModal {
  constructor(app, versions, resolveSelection) {
    super(app);
    this.versions = versions;
    this.didResolve = false;
    const messages = getMessages();
    this.resolveSelection = resolveSelection;
    this.setPlaceholder(messages.selectVersionToRestore);
    this.emptyStateText = messages.noMatchingVersionsFound;
    this.setInstructions([
      { command: "Enter", purpose: messages.restoreSelectedVersion },
      { command: "Esc", purpose: messages.cancel }
    ]);
  }
  getSuggestions(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.versions;
    }
    return this.versions.filter((version) => {
      const haystack = [
        version.version_number.toString(),
        version.title,
        version.status,
        version.category ?? "",
        version.tags.join(" ")
      ].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }
  renderSuggestion(version, el) {
    const messages = getMessages();
    el.createDiv({ text: `${versionLabel(version)} \xB7 ${version.title}` });
    const details = [
      messages.statusLabel(version.status),
      messages.updatedAt(formatTimestamp(version.updated_at)),
      version.is_current_draft ? messages.currentDraftBadge : "",
      version.is_current_published ? messages.currentPublishedBadge : ""
    ].filter(Boolean);
    el.createEl("small", { text: details.join(" \xB7 ") });
  }
  onChooseSuggestion(version) {
    this.didResolve = true;
    this.resolveSelection(version);
  }
  onClose() {
    super.onClose();
    if (!this.didResolve) {
      this.resolveSelection(null);
    }
  }
};
var RestoreVersionConfirmationModal = class extends import_obsidian4.Modal {
  constructor(app, file, version, resolveConfirmation) {
    super(app);
    this.file = file;
    this.version = version;
    this.didResolve = false;
    this.resolveConfirmation = resolveConfirmation;
  }
  onOpen() {
    const messages = getMessages();
    this.setTitle(messages.restoreBlogVersionTitle);
    this.contentEl.createEl("p", {
      text: messages.versionWillBecomeCurrentRemoteDraft(this.version.version_number)
    });
    this.contentEl.createEl("p", {
      text: messages.replaceLocalNoteContent(this.file.path)
    });
    const actionsEl = this.contentEl.createDiv({ cls: "modal-button-container" });
    const restoreButton = actionsEl.createEl("button", {
      cls: "mod-warning",
      text: messages.restore
    });
    restoreButton.addEventListener("click", () => {
      this.didResolve = true;
      this.resolveConfirmation(true);
      this.close();
    });
    const cancelButton = actionsEl.createEl("button", {
      text: messages.cancel
    });
    cancelButton.addEventListener("click", () => {
      this.didResolve = true;
      this.resolveConfirmation(false);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
    if (!this.didResolve) {
      this.resolveConfirmation(false);
    }
  }
};
function chooseVersionToRestore(app, versions) {
  return new Promise((resolve) => {
    const modal = new BlogVersionSuggestModal(app, versions, resolve);
    modal.open();
  });
}
function confirmVersionRestore(app, file, version) {
  return new Promise((resolve) => {
    const modal = new RestoreVersionConfirmationModal(app, file, version, resolve);
    modal.open();
  });
}
function versionLabel(version) {
  return getMessages().versionLabel(version.version_number);
}
async function saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.savingDraft, 0);
  const client = createClient(settings, onSettingsChanged);
  try {
    const metadata = await parseNoteMetadata(app, file);
    const payload = buildPayload(metadata);
    const post = metadata.postId ? await client.updateDraft(metadata.postId, payload) : await client.createDraft(payload);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian4.Notice(messages.draftSaved(post.title));
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function publishCurrentNote(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.publishingCurrentNote, 0);
  try {
    const draft = await saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged);
    const client = createClient(settings, onSettingsChanged);
    const post = await client.publish(draft.id);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian4.Notice(messages.published(post.title));
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function unlinkCurrentNote(app, file) {
  const messages = getMessages();
  await clearPostBinding(app, file);
  new import_obsidian4.Notice(messages.removedLocalBinding);
}
async function syncCurrentNoteFromBlog(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.syncingCurrentNote, 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error(messages.currentNoteNotLinked);
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
      new import_obsidian4.Notice(messages.currentNoteAlreadyMatches(post.title));
      return post;
    }
    if (!storedHash) {
      if (!remoteChangedByTimestamp) {
        progressNotice.hide();
        throw new Error(messages.localChangesNoRemoteUpdates);
      }
      throw new Error(messages.bothChangedManualResolve);
    }
    const localChangedSinceLastSync = localHash !== storedHash;
    const remoteChangedSinceLastSync = remoteHash !== storedHash;
    if (localChangedSinceLastSync && remoteChangedSinceLastSync) {
      throw new Error(messages.syncStoppedBothChanged);
    }
    if (localChangedSinceLastSync && !remoteChangedSinceLastSync) {
      progressNotice.hide();
      throw new Error(messages.localChangesNotOnBlog);
    }
    if (!remoteChangedSinceLastSync) {
      await writePostBinding(app, file, post, settings.blogApiBaseUrl);
      progressNotice.hide();
      new import_obsidian4.Notice(messages.noRemoteChangesToSync(post.title));
      return post;
    }
    await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new import_obsidian4.Notice(messages.syncedCurrentNote(post.title));
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function uploadImageFile(file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.uploadingImage(file.name), 0);
  try {
    const client = createClient(settings, onSettingsChanged);
    const uploaded = await client.uploadImage(file.data, file.name, file.mimeType);
    progressNotice.hide();
    new import_obsidian4.Notice(messages.uploadedImage(file.name));
    return uploaded;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function uploadCurrentNoteUnsyncedImages(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.syncingCurrentNoteImages, 0);
  try {
    const content = await app.vault.read(file);
    const embeddedImages = collectEmbeddedLocalImages(app, file, content);
    if (embeddedImages.length === 0) {
      progressNotice.hide();
      new import_obsidian4.Notice(messages.noLocalImagesFoundInCurrentNote);
      return {
        uploadedCount: 0,
        skippedCount: 0,
        replacedContent: false
      };
    }
    let nextContent = content;
    let uploadedCount = 0;
    let skippedCount = 0;
    const uploadsByFilePath = /* @__PURE__ */ new Map();
    for (const embeddedImage of embeddedImages) {
      if (!nextContent.includes(embeddedImage.originalText)) {
        skippedCount += 1;
        continue;
      }
      let uploaded = uploadsByFilePath.get(embeddedImage.resolvedFile.path);
      if (!uploaded) {
        const mimeType = normalizeVaultImageMimeType(embeddedImage.resolvedFile);
        if (!mimeType) {
          throw new Error(messages.unsupportedEmbeddedImageFormat(embeddedImage.resolvedFile.name));
        }
        const data = await app.vault.readBinary(embeddedImage.resolvedFile);
        uploaded = await uploadImageFile(
          {
            data,
            mimeType,
            name: embeddedImage.resolvedFile.name
          },
          settings,
          onSettingsChanged
        );
        uploadsByFilePath.set(embeddedImage.resolvedFile.path, uploaded);
        uploadedCount += 1;
      }
      nextContent = replaceFirstOccurrence(nextContent, embeddedImage.originalText, uploaded.markdown);
    }
    if (uploadedCount === 0) {
      progressNotice.hide();
      new import_obsidian4.Notice(messages.noUnsyncedImagesFoundInCurrentNote);
      return {
        uploadedCount: 0,
        skippedCount,
        replacedContent: false
      };
    }
    await app.vault.modify(file, nextContent);
    progressNotice.hide();
    new import_obsidian4.Notice(messages.syncedCurrentNoteImages(uploadedCount, skippedCount));
    return {
      uploadedCount,
      skippedCount,
      replacedContent: true
    };
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function showCurrentNoteVersionHistory(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.loadingVersionHistory, 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error(messages.currentNoteNotLinked);
    }
    const client = createClient(settings, onSettingsChanged);
    const versions = await client.listPostVersions(metadata.postId);
    progressNotice.hide();
    const leaf = app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: BLOG_VERSION_HISTORY_VIEW_TYPE,
      active: true
    });
    const view = leaf.view;
    if (view instanceof BlogVersionHistoryView) {
      await view.setState({
        postTitle: metadata.title,
        fileName: file.path,
        versions
      });
    }
    await app.workspace.revealLeaf(leaf);
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
async function restoreCurrentNoteFromVersionHistory(app, file, settings, onSettingsChanged = async () => {
}) {
  const messages = getMessages();
  const progressNotice = new import_obsidian4.Notice(messages.loadingVersionHistory, 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error(messages.currentNoteNotLinked);
    }
    const client = createClient(settings, onSettingsChanged);
    const versions = await client.listPostVersions(metadata.postId);
    progressNotice.hide();
    if (versions.length === 0) {
      throw new Error(messages.noSavedVersionsAvailableToRestore);
    }
    const selectedVersion = await chooseVersionToRestore(app, versions);
    if (!selectedVersion) {
      return null;
    }
    if (selectedVersion.is_current_draft) {
      new import_obsidian4.Notice(messages.alreadyCurrentDraft(versionLabel(selectedVersion)));
      return null;
    }
    const confirmed = await confirmVersionRestore(app, file, selectedVersion);
    if (!confirmed) {
      return null;
    }
    const restoreNotice = new import_obsidian4.Notice(messages.restoringSelectedVersion, 0);
    try {
      const post = await client.restorePostVersion(metadata.postId, selectedVersion.id);
      await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
      restoreNotice.hide();
      new import_obsidian4.Notice(messages.restoredIntoCurrentDraft(versionLabel(selectedVersion)));
      return post;
    } catch (error) {
      restoreNotice.hide();
      throw error;
    }
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}
function registerBlogVersionHistoryView(registerView) {
  registerView(BLOG_VERSION_HISTORY_VIEW_TYPE, (leaf) => new BlogVersionHistoryView(leaf));
}
function previewBody(body) {
  const messages = getMessages();
  const normalized = body.trim();
  if (!normalized) {
    return messages.noBodyContentSavedForVersion;
  }
  return normalized.length > 800 ? `${normalized.slice(0, 800).trimEnd()}
\u2026` : normalized;
}
function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(void 0, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
function collectEmbeddedLocalImages(app, sourceFile, content) {
  const cache = app.metadataCache.getFileCache(sourceFile);
  const embeds = cache?.embeds ?? [];
  const results = [];
  const seenRanges = /* @__PURE__ */ new Set();
  for (const embed of embeds) {
    const originalText = readOriginalEmbedText(content, embed);
    if (!originalText) {
      continue;
    }
    if (isRemoteImageReference(originalText)) {
      continue;
    }
    const resolvedFile = resolveEmbeddedFile(app, sourceFile, embed);
    if (!resolvedFile || !isSupportedImageFile(resolvedFile)) {
      continue;
    }
    const rangeKey = `${embed.position.start.offset}:${embed.position.end.offset}`;
    if (seenRanges.has(rangeKey)) {
      continue;
    }
    seenRanges.add(rangeKey);
    results.push({
      originalText,
      resolvedFile
    });
  }
  return results;
}
function readOriginalEmbedText(content, embed) {
  const startOffset = embed.position.start.offset;
  const endOffset = embed.position.end.offset;
  if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset) || startOffset < 0 || endOffset <= startOffset) {
    return null;
  }
  const originalText = content.slice(startOffset, endOffset);
  return originalText.trim() ? originalText : null;
}
function isRemoteImageReference(value) {
  return /!\[[^\]]*]\((?:https?:)?\/\//i.test(value) || /!\[[^\]]*]\(data:/i.test(value);
}
function resolveEmbeddedFile(app, sourceFile, embed) {
  const linkpath = extractLinkpath(embed.link);
  if (!linkpath) {
    return null;
  }
  const resolved = app.metadataCache.getFirstLinkpathDest(linkpath, sourceFile.path);
  if (resolved instanceof import_obsidian4.TFile) {
    return resolved;
  }
  return null;
}
function extractLinkpath(link) {
  const trimmed = link.trim();
  if (!trimmed) {
    return "";
  }
  const pipeIndex = trimmed.indexOf("|");
  const withoutAlias = pipeIndex >= 0 ? trimmed.slice(0, pipeIndex) : trimmed;
  const hashIndex = withoutAlias.indexOf("#");
  return (hashIndex >= 0 ? withoutAlias.slice(0, hashIndex) : withoutAlias).trim();
}
function isSupportedImageFile(file) {
  if (!(file instanceof import_obsidian4.TFile)) {
    return false;
  }
  return normalizeVaultImageMimeType(file) !== null;
}
function normalizeVaultImageMimeType(file) {
  const extension = file.extension.trim().toLowerCase();
  switch (extension) {
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
      return null;
  }
}
function replaceFirstOccurrence(content, target, replacement) {
  const index = content.indexOf(target);
  if (index < 0) {
    return content;
  }
  return content.slice(0, index) + replacement + content.slice(index + target.length);
}

// src/commands.ts
function getCurrentMarkdownFile(app) {
  const messages = getMessages();
  const activeView = app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
  const file = activeView?.file;
  if (!file) {
    throw new Error(messages.openMarkdownNoteFirst);
  }
  return file;
}
function getCurrentMarkdownView(app) {
  const messages = getMessages();
  const activeView = app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
  if (!activeView) {
    throw new Error(messages.openMarkdownNoteFirst);
  }
  return activeView;
}
function registerCommands(app, plugin) {
  const messages = getMessages();
  plugin.addCommand({
    id: "save-current-note-as-draft",
    name: messages.saveCurrentNoteAsDraftCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await saveCurrentNoteAsDraft(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToSaveDraft));
      }
    }
  });
  plugin.addCommand({
    id: "publish-current-note",
    name: messages.publishCurrentNoteCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await publishCurrentNote(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToPublishNote));
      }
    }
  });
  plugin.addCommand({
    id: "unlink-current-note",
    name: messages.unlinkCurrentNoteCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await unlinkCurrentNote(app, file);
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToUnlinkNote));
      }
    }
  });
  plugin.addCommand({
    id: "sync-current-note-from-blog",
    name: messages.syncCurrentNoteFromBlogCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await syncCurrentNoteFromBlog(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToSyncCurrentNoteFromBlog));
      }
    }
  });
  plugin.addCommand({
    id: "show-current-note-version-history",
    name: messages.showCurrentNoteVersionHistoryCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await showCurrentNoteVersionHistory(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToLoadVersionHistory));
      }
    }
  });
  plugin.addCommand({
    id: "restore-current-note-from-blog-version",
    name: messages.restoreCurrentNoteFromBlogVersionCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await restoreCurrentNoteFromVersionHistory(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToRestoreNoteFromVersionHistory));
      }
    }
  });
  plugin.addCommand({
    id: "upload-image-from-vault",
    name: messages.uploadImageCommand,
    callback: async () => {
      try {
        const view = getCurrentMarkdownView(app);
        const imageFile = await promptForImageFile();
        if (!imageFile) {
          return;
        }
        const uploaded = await uploadImageFile(imageFile, plugin.settings, async () => {
          await plugin.saveSettings();
        });
        view.editor.replaceSelection(uploaded.markdown);
        new import_obsidian5.Notice(messages.insertedImageMarkdown(imageFile.name));
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToUploadImage));
      }
    }
  });
  plugin.addCommand({
    id: "upload-unsynced-images-in-current-note",
    name: messages.uploadCurrentNoteUnsyncedImagesCommand,
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await uploadCurrentNoteUnsyncedImages(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new import_obsidian5.Notice(getErrorMessage(error, messages.failedToUploadCurrentNoteUnsyncedImages));
      }
    }
  });
}
function promptForImageFile() {
  const messages = getMessages();
  return new Promise((resolve, reject) => {
    const activeDocument = window.activeDocument;
    const input = activeDocument.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif";
    input.addClass("mails-blog-hidden-file-input");
    activeDocument.body.appendChild(input);
    const cleanup = () => {
      window.removeEventListener("focus", onWindowFocus, true);
      input.remove();
    };
    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (input.files?.length) {
          return;
        }
        cleanup();
        resolve(null);
      }, 0);
    };
    input.addEventListener(
      "change",
      () => {
        void (async () => {
          try {
            const file = input.files?.item(0);
            if (!file) {
              cleanup();
              resolve(null);
              return;
            }
            const mimeType = normalizeSelectedFileMimeType(file);
            if (!mimeType) {
              throw new Error(messages.selectSupportedImageFile);
            }
            const data = await file.arrayBuffer();
            cleanup();
            resolve({
              data,
              mimeType,
              name: file.name
            });
          } catch (error) {
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        })();
      },
      { once: true }
    );
    window.addEventListener("focus", onWindowFocus, true);
    input.click();
  });
}
function normalizeSelectedFileMimeType(file) {
  const normalizedType = file.type.trim().toLowerCase();
  if (normalizedType === "image/png") {
    return normalizedType;
  }
  if (normalizedType === "image/jpeg") {
    return normalizedType;
  }
  if (normalizedType === "image/webp") {
    return normalizedType;
  }
  if (normalizedType === "image/gif") {
    return normalizedType;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
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
      return null;
  }
}

// src/settings.ts
var import_obsidian6 = require("obsidian");
var MailsBlogSettingTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const messages = getMessages();
    new import_obsidian6.Setting(containerEl).setName(messages.blogApiBaseUrlName).setDesc(messages.blogApiBaseUrlDesc).addText((text) => {
      text.setPlaceholder(messages.blogApiBaseUrlPlaceholder).setValue(this.plugin.settings.blogApiBaseUrl).onChange(async (value) => {
        this.plugin.settings.blogApiBaseUrl = value.trim();
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian6.Setting(containerEl).setName(messages.obsidianPluginTokenName).setDesc(messages.obsidianPluginTokenDesc).addTextArea((text) => {
      text.setPlaceholder(messages.obsidianPluginTokenPlaceholder).setValue(this.plugin.settings.obsidianPluginToken).onChange(async (value) => {
        this.plugin.settings.obsidianPluginToken = value.trim();
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 4;
    });
    const preview = containerEl.createDiv({ cls: "mails-blog-plugin-setting-help" });
    const token = this.plugin.settings.obsidianPluginToken.trim();
    preview.setText(token ? messages.tokenPreview(token) : messages.tokenNotConfigured);
    if (this.plugin.settings.obsidianPluginTokenExpiresAt.trim()) {
      containerEl.createEl("p", {
        cls: "mails-blog-plugin-setting-help",
        text: messages.tokenExpiresAt(this.plugin.settings.obsidianPluginTokenExpiresAt)
      });
    }
    new import_obsidian6.Setting(containerEl).setName(messages.testConnectionName).setDesc(messages.testConnectionDesc).addButton((button) => {
      button.setButtonText(messages.testConnectionButton);
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
          if (result.tokenRefreshed) {
            new import_obsidian6.Notice(messages.connectionSuccessTokenRotated(result.posts.items.length));
          } else if (result.refreshWarning) {
            new import_obsidian6.Notice(messages.connectionSuccessRefreshWarning(result.posts.items.length, result.refreshWarning));
          } else {
            new import_obsidian6.Notice(messages.connectionSuccess(result.posts.items.length));
          }
        } catch (error) {
          const message = getErrorMessage(error, messages.connectionTestFailed);
          new import_obsidian6.Notice(message);
        } finally {
          button.setDisabled(false);
        }
      });
    });
  }
};

// main.ts
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readStringSetting(value) {
  return typeof value === "string" ? value : void 0;
}
function parseLoadedSettings(value) {
  if (!isRecord3(value)) {
    return {};
  }
  const parsed = {};
  const blogApiBaseUrl = readStringSetting(value.blogApiBaseUrl);
  const obsidianPluginToken = readStringSetting(value.obsidianPluginToken);
  const obsidianPluginTokenExpiresAt = readStringSetting(value.obsidianPluginTokenExpiresAt);
  if (blogApiBaseUrl !== void 0) {
    parsed.blogApiBaseUrl = blogApiBaseUrl;
  }
  if (obsidianPluginToken !== void 0) {
    parsed.obsidianPluginToken = obsidianPluginToken;
  }
  if (obsidianPluginTokenExpiresAt !== void 0) {
    parsed.obsidianPluginTokenExpiresAt = obsidianPluginTokenExpiresAt;
  }
  return parsed;
}
var MailsBlogPublisherPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    registerBlogVersionHistoryView((type, viewCreator) => this.registerView(type, viewCreator));
    this.addSettingTab(new MailsBlogSettingTab(this.app, this));
    registerCommands(this.app, this);
  }
  async loadSettings() {
    const loadedRaw = await this.loadData();
    const loaded = parseLoadedSettings(loadedRaw);
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
