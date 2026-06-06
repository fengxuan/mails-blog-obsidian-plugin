import {
  ItemView,
  Modal,
  Notice,
  SuggestModal,
  TAbstractFile,
  TFile,
  WorkspaceLeaf,
  type App,
  type EmbedCache,
} from "obsidian";
import { MailsBlogApiClient } from "./api";
import {
  clearPostBinding,
  computeMetadataSyncHash,
  computePostSyncHash,
  parseNoteMetadata,
  replaceNoteWithPost,
  writePostBinding,
} from "./frontmatter";
import { getMessages } from "./i18n";
import type {
  BlogImageUploadResponse,
  BlogPost,
  BlogPostVersion,
  CurrentNoteImageSyncResult,
  MailsBlogPluginSettings,
  PostPayload,
} from "./types";

export const BLOG_VERSION_HISTORY_VIEW_TYPE = "mails-blog-version-history";

class BlogVersionHistoryView extends ItemView {
  private versions: BlogPostVersion[] = [];
  private postTitle = "";
  private fileName = "";

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return BLOG_VERSION_HISTORY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return getMessages().versionHistoryViewTitle;
  }

  async setState(state: { postTitle: string; fileName: string; versions: BlogPostVersion[] }): Promise<void> {
    this.postTitle = state.postTitle;
    this.fileName = state.fileName;
    this.versions = state.versions;
    this.render();
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private render(): void {
    const messages = getMessages();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mails-blog-version-history-view");

    contentEl.createEl("h2", { text: this.postTitle || messages.versionHistoryTitle });
    if (this.fileName) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-subtitle",
        text: messages.currentNoteLabel(this.fileName),
      });
    }

    if (this.versions.length === 0) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-empty",
        text: messages.noSavedVersionsYet,
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
        text: messages.statusLabel(version.status),
      });
      if (version.is_current_draft) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-draft",
          text: messages.currentDraftBadge,
        });
      }
      if (version.is_current_published) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-published",
          text: messages.currentPublishedBadge,
        });
      }

      cardEl.createEl("div", {
        cls: "mails-blog-version-history-title",
        text: version.title,
      });

      const metaParts = [
        messages.updatedAt(formatTimestamp(version.updated_at)),
        version.published_at ? messages.publishedAt(formatTimestamp(version.published_at)) : "",
        version.category ? messages.categoryLabel(version.category) : "",
      ].filter(Boolean);

      if (metaParts.length > 0) {
        cardEl.createEl("div", {
          cls: "mails-blog-version-history-meta",
          text: metaParts.join(" · "),
        });
      }

      if (version.tags.length > 0) {
        cardEl.createEl("div", {
          cls: "mails-blog-version-history-tags",
          text: version.tags.map((tag) => `#${tag}`).join(" "),
        });
      }

      const body = (version.content_markdown ?? "").trim() || version.excerpt.trim();
      cardEl.createEl("pre", {
        cls: "mails-blog-version-history-preview",
        text: previewBody(body),
      });
    });
  }
}

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

class BlogVersionSuggestModal extends SuggestModal<BlogPostVersion> {
  private readonly resolveSelection: (version: BlogPostVersion | null) => void;
  private didResolve = false;

  constructor(
    app: App,
    private readonly versions: BlogPostVersion[],
    resolveSelection: (version: BlogPostVersion | null) => void,
  ) {
    super(app);
    const messages = getMessages();
    this.resolveSelection = resolveSelection;
    this.setPlaceholder(messages.selectVersionToRestore);
    this.emptyStateText = messages.noMatchingVersionsFound;
    this.setInstructions([
      { command: "Enter", purpose: messages.restoreSelectedVersion },
      { command: "Esc", purpose: messages.cancel },
    ]);
  }

  getSuggestions(query: string): BlogPostVersion[] {
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
        version.tags.join(" "),
      ].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }

  renderSuggestion(version: BlogPostVersion, el: HTMLElement): void {
    const messages = getMessages();
    el.createDiv({ text: `${versionLabel(version)} · ${version.title}` });
    const details = [
      messages.statusLabel(version.status),
      messages.updatedAt(formatTimestamp(version.updated_at)),
      version.is_current_draft ? messages.currentDraftBadge : "",
      version.is_current_published ? messages.currentPublishedBadge : "",
    ].filter(Boolean);
    el.createEl("small", { text: details.join(" · ") });
  }

  onChooseSuggestion(version: BlogPostVersion): void {
    this.didResolve = true;
    this.resolveSelection(version);
  }

  onClose(): void {
    super.onClose();
    if (!this.didResolve) {
      this.resolveSelection(null);
    }
  }
}

class RestoreVersionConfirmationModal extends Modal {
  private readonly resolveConfirmation: (confirmed: boolean) => void;
  private didResolve = false;

  constructor(
    app: App,
    private readonly file: TFile,
    private readonly version: BlogPostVersion,
    resolveConfirmation: (confirmed: boolean) => void,
  ) {
    super(app);
    this.resolveConfirmation = resolveConfirmation;
  }

  onOpen(): void {
    const messages = getMessages();
    this.setTitle(messages.restoreBlogVersionTitle);
    this.contentEl.createEl("p", {
      text: messages.versionWillBecomeCurrentRemoteDraft(this.version.version_number),
    });
    this.contentEl.createEl("p", {
      text: messages.replaceLocalNoteContent(this.file.path),
    });

    const actionsEl = this.contentEl.createDiv({ cls: "modal-button-container" });
    const restoreButton = actionsEl.createEl("button", {
      cls: "mod-warning",
      text: messages.restore,
    });
    restoreButton.addEventListener("click", () => {
      this.didResolve = true;
      this.resolveConfirmation(true);
      this.close();
    });

    const cancelButton = actionsEl.createEl("button", {
      text: messages.cancel,
    });
    cancelButton.addEventListener("click", () => {
      this.didResolve = true;
      this.resolveConfirmation(false);
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.didResolve) {
      this.resolveConfirmation(false);
    }
  }
}

function chooseVersionToRestore(app: App, versions: BlogPostVersion[]): Promise<BlogPostVersion | null> {
  return new Promise((resolve) => {
    const modal = new BlogVersionSuggestModal(app, versions, resolve);
    modal.open();
  });
}

function confirmVersionRestore(app: App, file: TFile, version: BlogPostVersion): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new RestoreVersionConfirmationModal(app, file, version, resolve);
    modal.open();
  });
}

function versionLabel(version: BlogPostVersion): string {
  return getMessages().versionLabel(version.version_number);
}

export async function saveCurrentNoteAsDraft(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.savingDraft, 0);
  const client = createClient(settings, onSettingsChanged);
  try {
    const metadata = await parseNoteMetadata(app, file);
    const payload = buildPayload(metadata);
    const post = metadata.postId
      ? await client.updateDraft(metadata.postId, payload)
      : await client.createDraft(payload);
    await writePostBinding(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new Notice(messages.draftSaved(post.title));
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
  const messages = getMessages();
  const progressNotice = new Notice(messages.publishingCurrentNote, 0);
  try {
  const draft = await saveCurrentNoteAsDraft(app, file, settings, onSettingsChanged);
  const client = createClient(settings, onSettingsChanged);
  const post = await client.publish(draft.id);
  await writePostBinding(app, file, post, settings.blogApiBaseUrl);
  progressNotice.hide();
  new Notice(messages.published(post.title));
  return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function unlinkCurrentNote(app: App, file: TFile): Promise<void> {
  const messages = getMessages();
  await clearPostBinding(app, file);
  new Notice(messages.removedLocalBinding);
}

export async function syncCurrentNoteFromBlog(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.syncingCurrentNote, 0);
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
      new Notice(messages.currentNoteAlreadyMatches(post.title));
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
      new Notice(messages.noRemoteChangesToSync(post.title));
      return post;
    }

    await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
    progressNotice.hide();
    new Notice(messages.syncedCurrentNote(post.title));
    return post;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function uploadImageFile(
  file: {
    data: ArrayBuffer;
    mimeType: string;
    name: string;
  },
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogImageUploadResponse> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.uploadingImage(file.name), 0);
  try {
    const client = createClient(settings, onSettingsChanged);
    const uploaded = await client.uploadImage(file.data, file.name, file.mimeType);
    progressNotice.hide();
    new Notice(messages.uploadedImage(file.name));
    return uploaded;
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

type EmbeddedLocalImage = {
  originalText: string;
  resolvedFile: TFile;
};

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export async function uploadCurrentNoteUnsyncedImages(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<CurrentNoteImageSyncResult> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.syncingCurrentNoteImages, 0);
  try {
    const content = await app.vault.read(file);
    const embeddedImages = collectEmbeddedLocalImages(app, file, content);

    if (embeddedImages.length === 0) {
      progressNotice.hide();
      new Notice(messages.noLocalImagesFoundInCurrentNote);
      return {
        uploadedCount: 0,
        skippedCount: 0,
        replacedContent: false,
      };
    }

    let nextContent = content;
    let uploadedCount = 0;
    let skippedCount = 0;
    const uploadsByFilePath = new Map<string, BlogImageUploadResponse>();

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
            name: embeddedImage.resolvedFile.name,
          },
          settings,
          onSettingsChanged,
        );
        uploadsByFilePath.set(embeddedImage.resolvedFile.path, uploaded);
        uploadedCount += 1;
      }

      nextContent = replaceFirstOccurrence(nextContent, embeddedImage.originalText, uploaded.markdown);
    }

    if (uploadedCount === 0) {
      progressNotice.hide();
      new Notice(messages.noUnsyncedImagesFoundInCurrentNote);
      return {
        uploadedCount: 0,
        skippedCount,
        replacedContent: false,
      };
    }

    await app.vault.modify(file, nextContent);
    progressNotice.hide();
    new Notice(messages.syncedCurrentNoteImages(uploadedCount, skippedCount));
    return {
      uploadedCount,
      skippedCount,
      replacedContent: true,
    };
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function showCurrentNoteVersionHistory(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<void> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.loadingVersionHistory, 0);
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
      active: true,
    });
    const view = leaf.view;
    if (view instanceof BlogVersionHistoryView) {
      await view.setState({
        postTitle: metadata.title,
        fileName: file.path,
        versions,
      });
    }
    await app.workspace.revealLeaf(leaf);
  } catch (error) {
    progressNotice.hide();
    throw error;
  }
}

export async function restoreCurrentNoteFromVersionHistory(
  app: App,
  file: TFile,
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogPost | null> {
  const messages = getMessages();
  const progressNotice = new Notice(messages.loadingVersionHistory, 0);
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
      new Notice(messages.alreadyCurrentDraft(versionLabel(selectedVersion)));
      return null;
    }

    const confirmed = await confirmVersionRestore(app, file, selectedVersion);
    if (!confirmed) {
      return null;
    }

    const restoreNotice = new Notice(messages.restoringSelectedVersion, 0);
    try {
      const post = await client.restorePostVersion(metadata.postId, selectedVersion.id);
      await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
      restoreNotice.hide();
      new Notice(messages.restoredIntoCurrentDraft(versionLabel(selectedVersion)));
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

export function registerBlogVersionHistoryView(
  registerView: (type: string, viewCreator: (leaf: WorkspaceLeaf) => ItemView) => void,
): void {
  registerView(BLOG_VERSION_HISTORY_VIEW_TYPE, (leaf) => new BlogVersionHistoryView(leaf));
}

function previewBody(body: string): string {
  const messages = getMessages();
  const normalized = body.trim();
  if (!normalized) {
    return messages.noBodyContentSavedForVersion;
  }
  return normalized.length > 800 ? `${normalized.slice(0, 800).trimEnd()}\n…` : normalized;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function collectEmbeddedLocalImages(
  app: App,
  sourceFile: TFile,
  content: string,
): EmbeddedLocalImage[] {
  const cache = app.metadataCache.getFileCache(sourceFile);
  const embeds = cache?.embeds ?? [];
  const results: EmbeddedLocalImage[] = [];
  const seenRanges = new Set<string>();

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
      resolvedFile,
    });
  }

  return results;
}

function readOriginalEmbedText(content: string, embed: EmbedCache): string | null {
  const startOffset = embed.position.start.offset;
  const endOffset = embed.position.end.offset;
  if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset) || startOffset < 0 || endOffset <= startOffset) {
    return null;
  }

  const originalText = content.slice(startOffset, endOffset);
  return originalText.trim() ? originalText : null;
}

function isRemoteImageReference(value: string): boolean {
  return /!\[[^\]]*]\((?:https?:)?\/\//i.test(value) || /!\[[^\]]*]\(data:/i.test(value);
}

function resolveEmbeddedFile(app: App, sourceFile: TFile, embed: EmbedCache): TFile | null {
  const linkpath = extractLinkpath(embed.link);
  if (!linkpath) {
    return null;
  }

  const resolved = app.metadataCache.getFirstLinkpathDest(linkpath, sourceFile.path);
  if (resolved instanceof TFile) {
    return resolved;
  }
  return null;
}

function extractLinkpath(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) {
    return "";
  }
  const pipeIndex = trimmed.indexOf("|");
  const withoutAlias = pipeIndex >= 0 ? trimmed.slice(0, pipeIndex) : trimmed;
  const hashIndex = withoutAlias.indexOf("#");
  return (hashIndex >= 0 ? withoutAlias.slice(0, hashIndex) : withoutAlias).trim();
}

function isSupportedImageFile(file: TAbstractFile): file is TFile {
  if (!(file instanceof TFile)) {
    return false;
  }
  return normalizeVaultImageMimeType(file) !== null;
}

function normalizeVaultImageMimeType(file: TFile): string | null {
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

function replaceFirstOccurrence(content: string, target: string, replacement: string): string {
  const index = content.indexOf(target);
  if (index < 0) {
    return content;
  }
  return content.slice(0, index) + replacement + content.slice(index + target.length);
}
