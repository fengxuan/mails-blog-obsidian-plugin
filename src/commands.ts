import { MarkdownView, Notice, TFile, type App } from "obsidian";
import { ImageFileSuggestModal } from "./image-modal";
import { publishCurrentNote, saveCurrentNoteAsDraft, unlinkCurrentNote, uploadImageFromVault } from "./publish-service";
import type { MailsBlogPluginSettings } from "./types";

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
            new Notice(`Inserted image markdown for ${imageFile.name}`);
          } catch (error) {
            new Notice(error instanceof Error ? error.message : "Failed to upload image.");
          }
        }).open();
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Failed to open image picker.");
      }
    },
  });
}
