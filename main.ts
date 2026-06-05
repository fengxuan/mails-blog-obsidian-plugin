import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./src/constants";
import { registerCommands } from "./src/commands";
import { registerBlogVersionHistoryView } from "./src/publish-service";
import { MailsBlogSettingTab } from "./src/settings";
import type { MailsBlogPluginSettings } from "./src/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringSetting(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseLoadedSettings(value: unknown): Partial<MailsBlogPluginSettings> {
  if (!isRecord(value)) {
    return {};
  }

  const parsed: Partial<MailsBlogPluginSettings> = {};
  const blogApiBaseUrl = readStringSetting(value.blogApiBaseUrl);
  const obsidianPluginToken = readStringSetting(value.obsidianPluginToken);
  const obsidianPluginTokenExpiresAt = readStringSetting(value.obsidianPluginTokenExpiresAt);

  if (blogApiBaseUrl !== undefined) {
    parsed.blogApiBaseUrl = blogApiBaseUrl;
  }
  if (obsidianPluginToken !== undefined) {
    parsed.obsidianPluginToken = obsidianPluginToken;
  }
  if (obsidianPluginTokenExpiresAt !== undefined) {
    parsed.obsidianPluginTokenExpiresAt = obsidianPluginTokenExpiresAt;
  }

  return parsed;
}

export default class MailsBlogPublisherPlugin extends Plugin {
  settings: MailsBlogPluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    registerBlogVersionHistoryView((type, viewCreator) => this.registerView(type, viewCreator));
    this.addSettingTab(new MailsBlogSettingTab(this.app, this));
    registerCommands(this.app, this);
  }

  async loadSettings(): Promise<void> {
    const loadedRaw: unknown = await this.loadData();
    const loaded = parseLoadedSettings(loadedRaw);
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
