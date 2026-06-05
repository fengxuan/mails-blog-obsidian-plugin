import {
  ItemView,
  Modal,
  Notice,
  SuggestModal,
  TFile,
  WorkspaceLeaf,
  type App,
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
import type { BlogImageUploadResponse, BlogPost, BlogPostVersion, MailsBlogPluginSettings, PostPayload } from "./types";

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
    return "Mails Blog Version History";
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
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mails-blog-version-history-view");

    contentEl.createEl("h2", { text: this.postTitle || "Version History" });
    if (this.fileName) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-subtitle",
        text: `Current note: ${this.fileName}`,
      });
    }

    if (this.versions.length === 0) {
      contentEl.createEl("p", {
        cls: "mails-blog-version-history-empty",
        text: "No saved versions yet.",
      });
      return;
    }

    const listEl = contentEl.createDiv({ cls: "mails-blog-version-history-list" });
    this.versions.forEach((version) => {
      const cardEl = listEl.createDiv({ cls: "mails-blog-version-history-card" });
      const topRow = cardEl.createDiv({ cls: "mails-blog-version-history-top" });
      topRow.createEl("strong", { text: `Version ${version.version_number}` });

      const badgesEl = topRow.createDiv({ cls: "mails-blog-version-history-badges" });
      badgesEl.createSpan({
        cls: `mails-blog-version-history-badge is-${version.status}`,
        text: version.status,
      });
      if (version.is_current_draft) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-draft",
          text: "current draft",
        });
      }
      if (version.is_current_published) {
        badgesEl.createSpan({
          cls: "mails-blog-version-history-badge is-current-published",
          text: "current published",
        });
      }

      cardEl.createEl("div", {
        cls: "mails-blog-version-history-title",
        text: version.title,
      });

      const metaParts = [
        `Updated ${formatTimestamp(version.updated_at)}`,
        version.published_at ? `Published ${formatTimestamp(version.published_at)}` : "",
        version.category ? `Category ${version.category}` : "",
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
    this.resolveSelection = resolveSelection;
    this.setPlaceholder("Select a blog version to restore");
    this.emptyStateText = "No matching versions found.";
    this.setInstructions([
      { command: "Enter", purpose: "Restore selected version" },
      { command: "Esc", purpose: "Cancel" },
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
    el.createDiv({ text: `${versionLabel(version)} · ${version.title}` });
    const details = [
      version.status,
      `Updated ${formatTimestamp(version.updated_at)}`,
      version.is_current_draft ? "current draft" : "",
      version.is_current_published ? "current published" : "",
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
    this.setTitle("Restore blog version?");
    this.contentEl.createEl("p", {
      text: `Version ${this.version.version_number} will become the current remote draft.`,
    });
    this.contentEl.createEl("p", {
      text: `This also replaces the local note content in ${this.file.path}.`,
    });

    const actionsEl = this.contentEl.createDiv({ cls: "modal-button-container" });
    const restoreButton = actionsEl.createEl("button", {
      cls: "mod-warning",
      text: "Restore",
    });
    restoreButton.addEventListener("click", () => {
      this.didResolve = true;
      this.resolveConfirmation(true);
      this.close();
    });

    const cancelButton = actionsEl.createEl("button", {
      text: "Cancel",
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
  return `Version ${version.version_number}`;
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

export async function uploadImageFile(
  file: {
    data: ArrayBuffer;
    mimeType: string;
    name: string;
  },
  settings: MailsBlogPluginSettings,
  onSettingsChanged: () => Promise<void> = async () => {},
): Promise<BlogImageUploadResponse> {
  const progressNotice = new Notice(`Uploading image: ${file.name}...`, 0);
  try {
    const client = createClient(settings, onSettingsChanged);
    const uploaded = await client.uploadImage(file.data, file.name, file.mimeType);
    progressNotice.hide();
    new Notice(`Uploaded image: ${file.name}`);
    return uploaded;
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
  const progressNotice = new Notice("Loading version history from Mails Blog...", 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error("Current note is not linked to a Mails Blog post yet.");
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
  const progressNotice = new Notice("Loading version history from Mails Blog...", 0);
  try {
    const metadata = await parseNoteMetadata(app, file);
    if (!metadata.postId) {
      throw new Error("Current note is not linked to a Mails Blog post yet.");
    }

    const client = createClient(settings, onSettingsChanged);
    const versions = await client.listPostVersions(metadata.postId);
    progressNotice.hide();

    if (versions.length === 0) {
      throw new Error("No saved versions available to restore.");
    }

    const selectedVersion = await chooseVersionToRestore(app, versions);
    if (!selectedVersion) {
      return null;
    }

    if (selectedVersion.is_current_draft) {
      new Notice(`${versionLabel(selectedVersion)} is already the current draft.`);
      return null;
    }

    const confirmed = await confirmVersionRestore(app, file, selectedVersion);
    if (!confirmed) {
      return null;
    }

    const restoreNotice = new Notice("Restoring selected version...", 0);
    try {
      const post = await client.restorePostVersion(metadata.postId, selectedVersion.id);
      await replaceNoteWithPost(app, file, post, settings.blogApiBaseUrl);
      restoreNotice.hide();
      new Notice(`Restored ${versionLabel(selectedVersion)} into current draft.`);
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
  const normalized = body.trim();
  if (!normalized) {
    return "No body content saved for this version.";
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
