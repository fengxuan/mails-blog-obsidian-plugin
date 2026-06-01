import {
  App,
  Notice,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { MailsBlogApiClient } from "./api";
import type MailsBlogPublisherPlugin from "../main";

export class MailsBlogSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: MailsBlogPublisherPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Mails Blog Publisher" });

    new Setting(containerEl)
      .setName("Blog API Base URL")
      .setDesc("The Mails Blog API base URL.")
      .addText((text) => {
        text
          .setPlaceholder("https://mails-blog.canyin.uk")
          .setValue(this.plugin.settings.blogApiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.blogApiBaseUrl = value.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = "100%";
      });

    new Setting(containerEl)
      .setName("Obsidian Plugin Token")
      .setDesc("Generate this token in iOS Settings -> Obsidian Plugin, then paste it here.")
      .addTextArea((text) => {
        text
          .setPlaceholder("Paste the token copied from iOS Settings")
          .setValue(this.plugin.settings.obsidianPluginToken)
          .onChange(async (value) => {
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
        text: `Token expires at: ${this.plugin.settings.obsidianPluginTokenExpiresAt}`,
      });
    }

    new Setting(containerEl)
      .setName("Test Connection")
      .setDesc("Verify that the current API URL and token can access your blog drafts.")
      .addButton((button) => {
        button.setButtonText("Test");
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
            new Notice(`Connected successfully. ${result.items.length} post(s) visible.`);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Connection test failed.";
            new Notice(message);
          } finally {
            button.setDisabled(false);
          }
        });
      });
  }
}
