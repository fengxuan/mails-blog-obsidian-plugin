import { MarkdownView, Notice, type App } from "obsidian";
import {
  publishCurrentNote,
  restoreCurrentNoteFromVersionHistory,
  saveCurrentNoteAsDraft,
  showCurrentNoteVersionHistory,
  syncCurrentNoteFromBlog,
  unlinkCurrentNote,
  uploadImageFile,
} from "./publish-service";
import type { MailsBlogPluginSettings } from "./types";
import { TFile } from "obsidian";

function getCurrentMarkdownFile(app: App): TFile {
  const activeView = app.workspace.getActiveViewOfType(MarkdownView);
  const file = activeView?.file;
  if (!file) {
    throw new Error("Open a Markdown note first.");
  }
  return file;
}

function getCurrentMarkdownView(app: App): MarkdownView {
  const activeView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!activeView) {
    throw new Error("Open a Markdown note first.");
  }
  return activeView;
}

export function registerCommands(
  app: App,
  plugin: {
    addCommand(command: {
      id: string;
      name: string;
      callback: () => Promise<void> | void;
    }): void;
    settings: MailsBlogPluginSettings;
    saveSettings(): Promise<void>;
  },
): void {
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
        new Notice(error instanceof Error ? error.message : "Failed to save draft.");
      }
    },
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
        new Notice(error instanceof Error ? error.message : "Failed to publish note.");
      }
    },
  });

  plugin.addCommand({
    id: "unlink-current-note",
    name: "Unlink Current Note from Blog Post",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await unlinkCurrentNote(app, file);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Failed to unlink note.");
      }
    },
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
        new Notice(error instanceof Error ? error.message : "Failed to sync current note from blog.");
      }
    },
  });

  plugin.addCommand({
    id: "show-current-note-version-history",
    name: "Show Current Note Version History",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await showCurrentNoteVersionHistory(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Failed to load version history.");
      }
    },
  });

  plugin.addCommand({
    id: "restore-current-note-from-blog-version",
    name: "Restore Current Note From Blog Version",
    callback: async () => {
      try {
        const file = getCurrentMarkdownFile(app);
        await restoreCurrentNoteFromVersionHistory(app, file, plugin.settings, async () => {
          await plugin.saveSettings();
        });
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Failed to restore note from version history.");
      }
    },
  });

  plugin.addCommand({
    id: "upload-image-from-vault",
    name: "Upload Image",
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
        new Notice(`Inserted image markdown for ${imageFile.name}`);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Failed to upload image.");
      }
    },
  });
}

type SelectedImageFile = {
  data: ArrayBuffer;
  mimeType: string;
  name: string;
};

function promptForImageFile(): Promise<SelectedImageFile | null> {
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
              throw new Error("Please select a jpg, jpeg, png, webp, or gif image.");
            }

            const data = await file.arrayBuffer();
            cleanup();
            resolve({
              data,
              mimeType,
              name: file.name,
            });
          } catch (error: unknown) {
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        })();
      },
      { once: true },
    );

    window.addEventListener("focus", onWindowFocus, true);
    input.click();
  });
}

function normalizeSelectedFileMimeType(file: File): string | null {
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
