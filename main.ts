import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./src/constants";
import { registerCommands } from "./src/commands";
import { registerBlogVersionHistoryView } from "./src/publish-service";
import { MailsBlogSettingTab } from "./src/settings";
import type { MailsBlogPluginSettings } from "./src/types";

export default class MailsBlogPublisherPlugin extends Plugin {
  settings: MailsBlogPluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    registerBlogVersionHistoryView((type, viewCreator) => this.registerView(type, viewCreator));
    this.addSettingTab(new MailsBlogSettingTab(this.app, this));
    registerCommands(this.app, this);
  }

  async loadSettings(): Promise<void> {
    const loaded = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(loaded ?? {}),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
