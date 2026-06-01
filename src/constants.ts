import type { MailsBlogPluginSettings } from "./types";

export const DEFAULT_SETTINGS: MailsBlogPluginSettings = {
  blogApiBaseUrl: "https://mails-blog.canyin.uk",
  obsidianPluginToken: "",
  obsidianPluginTokenExpiresAt: "",
};

export const FRONTMATTER_KEYS = {
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
  syncHash: "mails_blog_sync_hash",
} as const;
