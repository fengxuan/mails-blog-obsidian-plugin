import { getLanguage, requireApiVersion } from "obsidian";

type BlogStatus = "draft" | "published" | "archived";

type MessageCatalog = {
  blogApiBaseUrlName: string;
  blogApiBaseUrlDesc: string;
  blogApiBaseUrlPlaceholder: string;
  obsidianPluginTokenName: string;
  obsidianPluginTokenDesc: string;
  obsidianPluginTokenPlaceholder: string;
  tokenPreview: (token: string) => string;
  tokenNotConfigured: string;
  tokenExpiresAt: (expiresAt: string) => string;
  testConnectionName: string;
  testConnectionDesc: string;
  testConnectionButton: string;
  connectionSuccess: (count: number) => string;
  connectionSuccessTokenRotated: (count: number) => string;
  connectionSuccessRefreshWarning: (count: number, warning: string) => string;
  connectionTestFailed: string;
  saveCurrentNoteAsDraftCommand: string;
  publishCurrentNoteCommand: string;
  unlinkCurrentNoteCommand: string;
  syncCurrentNoteFromBlogCommand: string;
  showCurrentNoteVersionHistoryCommand: string;
  restoreCurrentNoteFromBlogVersionCommand: string;
  uploadImageCommand: string;
  openMarkdownNoteFirst: string;
  failedToSaveDraft: string;
  failedToPublishNote: string;
  failedToUnlinkNote: string;
  failedToSyncCurrentNoteFromBlog: string;
  failedToLoadVersionHistory: string;
  failedToRestoreNoteFromVersionHistory: string;
  failedToUploadImage: string;
  insertedImageMarkdown: (fileName: string) => string;
  selectSupportedImageFile: string;
  versionHistoryViewTitle: string;
  versionHistoryTitle: string;
  currentNoteLabel: (fileName: string) => string;
  noSavedVersionsYet: string;
  versionLabel: (versionNumber: number) => string;
  currentDraftBadge: string;
  currentPublishedBadge: string;
  updatedAt: (value: string) => string;
  publishedAt: (value: string) => string;
  categoryLabel: (value: string) => string;
  selectVersionToRestore: string;
  noMatchingVersionsFound: string;
  restoreSelectedVersion: string;
  cancel: string;
  restoreBlogVersionTitle: string;
  versionWillBecomeCurrentRemoteDraft: (versionNumber: number) => string;
  replaceLocalNoteContent: (filePath: string) => string;
  restore: string;
  savingDraft: string;
  draftSaved: (title: string) => string;
  publishingCurrentNote: string;
  published: (title: string) => string;
  removedLocalBinding: string;
  syncingCurrentNote: string;
  currentNoteNotLinked: string;
  currentNoteAlreadyMatches: (title: string) => string;
  localChangesNoRemoteUpdates: string;
  bothChangedManualResolve: string;
  syncStoppedBothChanged: string;
  localChangesNotOnBlog: string;
  noRemoteChangesToSync: (title: string) => string;
  syncedCurrentNote: (title: string) => string;
  uploadingImage: (fileName: string) => string;
  uploadedImage: (fileName: string) => string;
  loadingVersionHistory: string;
  noSavedVersionsAvailableToRestore: string;
  alreadyCurrentDraft: (versionLabel: string) => string;
  restoringSelectedVersion: string;
  restoredIntoCurrentDraft: (versionLabel: string) => string;
  noBodyContentSavedForVersion: string;
  unexpectedFrontmatterDataShape: string;
  currentNoteBodyEmpty: string;
  imageUploadFailedStatus: (status: number) => string;
  requestFailedStatus: (status: number) => string;
  blogApiBaseUrlRequired: string;
  obsidianPluginTokenRequired: string;
  tokenRefreshFailed: string;
  statusLabel: (status: BlogStatus) => string;
};

const enMessages: MessageCatalog = {
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
  connectionSuccessRefreshWarning: (count, warning) =>
    `Connected successfully. ${count} post(s) visible. Warning: current token works, but refresh failed: ${warning}`,
  connectionTestFailed: "Connection test failed.",
  saveCurrentNoteAsDraftCommand: "Save Current Note as Draft",
  publishCurrentNoteCommand: "Publish Current Note",
  unlinkCurrentNoteCommand: "Unlink Current Note from Blog Post",
  syncCurrentNoteFromBlogCommand: "Sync Current Note From Blog",
  showCurrentNoteVersionHistoryCommand: "Show Current Note Version History",
  restoreCurrentNoteFromBlogVersionCommand: "Restore Current Note From Blog Version",
  uploadImageCommand: "Upload Image",
  openMarkdownNoteFirst: "Open a Markdown note first.",
  failedToSaveDraft: "Failed to save draft.",
  failedToPublishNote: "Failed to publish note.",
  failedToUnlinkNote: "Failed to unlink note.",
  failedToSyncCurrentNoteFromBlog: "Failed to sync current note from blog.",
  failedToLoadVersionHistory: "Failed to load version history.",
  failedToRestoreNoteFromVersionHistory: "Failed to restore note from version history.",
  failedToUploadImage: "Failed to upload image.",
  insertedImageMarkdown: (fileName) => `Inserted image markdown for ${fileName}`,
  selectSupportedImageFile: "Please select a jpg, jpeg, png, webp, or gif image.",
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
  localChangesNoRemoteUpdates:
    "Current note has local changes and no remote updates to pull. Publish it if you want to push those edits.",
  bothChangedManualResolve:
    "Both local note and remote post may have changed. Publish local edits first or resolve manually before syncing.",
  syncStoppedBothChanged:
    "Sync stopped because both the local note and the remote blog post changed since the last sync.",
  localChangesNotOnBlog:
    "Current note has local changes that are not on the blog. Publish first if you want to keep the local version.",
  noRemoteChangesToSync: (title) => `No remote changes to sync for: ${title}`,
  syncedCurrentNote: (title) => `Synced current note from Mails Blog: ${title}`,
  uploadingImage: (fileName) => `Uploading image: ${fileName}...`,
  uploadedImage: (fileName) => `Uploaded image: ${fileName}`,
  loadingVersionHistory: "Loading version history from Mails Blog...",
  noSavedVersionsAvailableToRestore: "No saved versions available to restore.",
  alreadyCurrentDraft: (versionLabel) => `${versionLabel} is already the current draft.`,
  restoringSelectedVersion: "Restoring selected version...",
  restoredIntoCurrentDraft: (versionLabel) => `Restored ${versionLabel} into current draft.`,
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
  },
};

const zhMessages: Partial<MessageCatalog> = {
  blogApiBaseUrlName: "博客 API 地址",
  blogApiBaseUrlDesc: "Mails Blog API 的基础地址。",
  blogApiBaseUrlPlaceholder: "https://mails-blog.canyin.uk",
  obsidianPluginTokenName: "Obsidian 插件令牌",
  obsidianPluginTokenDesc: "请先在 iOS 设置 -> Obsidian Plugin 中生成令牌，然后粘贴到这里。",
  obsidianPluginTokenPlaceholder: "粘贴从 iOS 设置复制的令牌",
  tokenPreview: (token) => `令牌预览：${token.slice(0, 8)}...${token.slice(-6)}`,
  tokenNotConfigured: "还没有配置令牌。",
  tokenExpiresAt: (expiresAt) => `令牌过期时间：${expiresAt}`,
  testConnectionName: "测试连接",
  testConnectionDesc: "验证当前 API 地址和令牌是否可以访问你的博客草稿。",
  testConnectionButton: "测试",
  connectionSuccess: (count) => `连接成功，可见 ${count} 篇文章。`,
  connectionSuccessTokenRotated: (count) => `连接成功，可见 ${count} 篇文章。令牌已轮换并保存到本地。`,
  connectionSuccessRefreshWarning: (count, warning) =>
    `连接成功，可见 ${count} 篇文章。警告：当前令牌可用，但刷新失败：${warning}`,
  connectionTestFailed: "连接测试失败。",
  saveCurrentNoteAsDraftCommand: "保存当前笔记为草稿",
  publishCurrentNoteCommand: "发布当前笔记",
  unlinkCurrentNoteCommand: "取消当前笔记与博客文章的关联",
  syncCurrentNoteFromBlogCommand: "从博客同步当前笔记",
  showCurrentNoteVersionHistoryCommand: "查看当前笔记的版本历史",
  restoreCurrentNoteFromBlogVersionCommand: "从博客版本恢复当前笔记",
  uploadImageCommand: "上传图片",
  openMarkdownNoteFirst: "请先打开一个 Markdown 笔记。",
  failedToSaveDraft: "保存草稿失败。",
  failedToPublishNote: "发布笔记失败。",
  failedToUnlinkNote: "取消关联失败。",
  failedToSyncCurrentNoteFromBlog: "从博客同步当前笔记失败。",
  failedToLoadVersionHistory: "加载版本历史失败。",
  failedToRestoreNoteFromVersionHistory: "从版本历史恢复笔记失败。",
  failedToUploadImage: "上传图片失败。",
  insertedImageMarkdown: (fileName) => `已插入图片 Markdown：${fileName}`,
  selectSupportedImageFile: "请选择 jpg、jpeg、png、webp 或 gif 图片。",
  versionHistoryViewTitle: "Mails Blog 版本历史",
  versionHistoryTitle: "版本历史",
  currentNoteLabel: (fileName) => `当前笔记：${fileName}`,
  noSavedVersionsYet: "还没有已保存的版本。",
  versionLabel: (versionNumber) => `版本 ${versionNumber}`,
  currentDraftBadge: "当前草稿",
  currentPublishedBadge: "当前已发布",
  updatedAt: (value) => `更新于 ${value}`,
  publishedAt: (value) => `发布于 ${value}`,
  categoryLabel: (value) => `分类 ${value}`,
  selectVersionToRestore: "选择要恢复的博客版本",
  noMatchingVersionsFound: "没有找到匹配的版本。",
  restoreSelectedVersion: "恢复所选版本",
  cancel: "取消",
  restoreBlogVersionTitle: "恢复博客版本？",
  versionWillBecomeCurrentRemoteDraft: (versionNumber) => `版本 ${versionNumber} 将成为当前远端草稿。`,
  replaceLocalNoteContent: (filePath) => `这也会替换本地笔记内容：${filePath}。`,
  restore: "恢复",
  savingDraft: "正在保存草稿到 Mails Blog...",
  draftSaved: (title) => `草稿已保存到 Mails Blog：${title}`,
  publishingCurrentNote: "正在发布当前笔记到 Mails Blog...",
  published: (title) => `已发布到 Mails Blog：${title}`,
  removedLocalBinding: "已移除当前笔记的本地 Mails Blog 绑定。",
  syncingCurrentNote: "正在从 Mails Blog 同步当前笔记...",
  currentNoteNotLinked: "当前笔记还没有关联到 Mails Blog 文章。",
  currentNoteAlreadyMatches: (title) => `当前笔记已与博客文章一致：${title}`,
  localChangesNoRemoteUpdates: "当前笔记有本地改动，远端没有可拉取的更新。如果要推送这些改动，请先发布。",
  bothChangedManualResolve: "本地笔记和远端文章可能都已变更。请先发布本地改动，或手动处理冲突后再同步。",
  syncStoppedBothChanged: "同步已停止，因为自上次同步后，本地笔记和远端博客文章都发生了变化。",
  localChangesNotOnBlog: "当前笔记有尚未同步到博客的本地改动。如果想保留本地版本，请先发布。",
  noRemoteChangesToSync: (title) => `没有可同步的远端更新：${title}`,
  syncedCurrentNote: (title) => `已从 Mails Blog 同步当前笔记：${title}`,
  uploadingImage: (fileName) => `正在上传图片：${fileName}...`,
  uploadedImage: (fileName) => `图片已上传：${fileName}`,
  loadingVersionHistory: "正在从 Mails Blog 加载版本历史...",
  noSavedVersionsAvailableToRestore: "没有可恢复的已保存版本。",
  alreadyCurrentDraft: (versionLabel) => `${versionLabel} 已经是当前草稿。`,
  restoringSelectedVersion: "正在恢复所选版本...",
  restoredIntoCurrentDraft: (versionLabel) => `已将 ${versionLabel} 恢复为当前草稿。`,
  noBodyContentSavedForVersion: "这个版本没有保存正文内容。",
  unexpectedFrontmatterDataShape: "Frontmatter 数据格式不符合预期。",
  currentNoteBodyEmpty: "当前笔记正文为空。",
  imageUploadFailedStatus: (status) => `图片上传失败，状态码 ${status}`,
  requestFailedStatus: (status) => `请求失败，状态码 ${status}`,
  blogApiBaseUrlRequired: "必须填写博客 API 地址。",
  obsidianPluginTokenRequired: "必须填写 Obsidian 插件令牌。",
  tokenRefreshFailed: "令牌刷新失败。",
  statusLabel: (status) => {
    switch (status) {
      case "draft":
        return "草稿";
      case "published":
        return "已发布";
      case "archived":
        return "已归档";
      default:
        return status;
    }
  },
};

export function getMessages(): MessageCatalog {
  const language = (
    requireApiVersion("1.8.7")
      ? getLanguage()
      : window.navigator.language
  ).trim().toLowerCase();
  if (!language.startsWith("zh")) {
    return enMessages;
  }

  return {
    ...enMessages,
    ...zhMessages,
  };
}
