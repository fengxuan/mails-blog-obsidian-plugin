import {
  App,
  Notice,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { MailsBlogApiClient } from "./api";
import { getErrorMessage } from "./errors";
import { getMessages } from "./i18n";
import type MailsBlogPublisherPlugin from "../main";

export class MailsBlogSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: MailsBlogPublisherPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const messages = getMessages();

    new Setting(containerEl)
      .setName(messages.blogApiBaseUrlName)
      .setDesc(messages.blogApiBaseUrlDesc)
      .addText((text) => {
        text
          .setPlaceholder(messages.blogApiBaseUrlPlaceholder)
          .setValue(this.plugin.settings.blogApiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.blogApiBaseUrl = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(messages.obsidianPluginTokenName)
      .setDesc(messages.obsidianPluginTokenDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(messages.obsidianPluginTokenPlaceholder)
          .setValue(this.plugin.settings.obsidianPluginToken)
          .onChange(async (value) => {
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
        text: messages.tokenExpiresAt(this.plugin.settings.obsidianPluginTokenExpiresAt),
      });
    }

    new Setting(containerEl)
      .setName(messages.testConnectionName)
      .setDesc(messages.testConnectionDesc)
      .addButton((button) => {
        button.setButtonText(messages.testConnectionButton);
        button.onClick(async () => {
          button.setDisabled(true);
          try {
            const client = new MailsBlogApiClient(this.plugin.settings, {
              onTokenRefresh: async () => {
                await this.plugin.saveSettings();
              },
            });
            const result = await client.testConnection();
            await this.plugin.saveSettings();
            if (result.tokenRefreshed) {
              new Notice(messages.connectionSuccessTokenRotated(result.posts.items.length));
            } else if (result.refreshWarning) {
              new Notice(messages.connectionSuccessRefreshWarning(result.posts.items.length, result.refreshWarning));
            } else {
              new Notice(messages.connectionSuccess(result.posts.items.length));
            }
          } catch (error) {
            const message = getErrorMessage(error, messages.connectionTestFailed);
            new Notice(message);
          } finally {
            button.setDisabled(false);
          }
        });
      });
  }
}
