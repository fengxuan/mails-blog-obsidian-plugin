export interface MailsBlogPluginSettings {
  blogApiBaseUrl: string;
  obsidianPluginToken: string;
  obsidianPluginTokenExpiresAt: string;
}

export interface ObsidianPluginTokenRefreshResponse {
  token: string;
  mailbox: string;
  expires_at: string;
}

export interface PostListResponse {
  items: BlogPostSummary[];
  next_cursor: string | null;
}

export interface TestConnectionResult {
  posts: PostListResponse;
  tokenRefreshed: boolean;
  refreshWarning: string | null;
}

export interface BlogPostResponse {
  post: BlogPost;
}

export interface BlogPostVersionsResponse {
  versions: BlogPostVersion[];
}

export interface BlogPostVersionResponse {
  version: BlogPostVersion;
}

export interface BlogPostSummary {
  id: string;
  author_slug: string;
  title: string;
  slug: string;
  category: string | null;
  tags: string[];
  card_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  excerpt: string;
  has_unpublished_changes: boolean;
  is_pinned: boolean;
}

export interface BlogPost extends BlogPostSummary {
  content_markdown: string | null;
  content_html: string;
}

export interface BlogPostVersion {
  id: string;
  post_id: string;
  version_number: number;
  status: "draft" | "published" | "archived";
  title: string;
  slug: string;
  category: string | null;
  tags: string[];
  card_image: string | null;
  excerpt: string;
  content_markdown: string | null;
  content_html: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  derived_from_version_id: string | null;
  is_current_draft: boolean;
  is_current_published: boolean;
}

export interface PostPayload {
  title: string;
  category?: string;
  tags?: string[];
  card_image?: string;
  content_markdown: string;
}

export interface BlogImageUploadResponse {
  asset_url: string;
  markdown: string;
  mime_type: string;
  byte_size: number;
  content_sha256?: string | null;
}

export interface ParsedNoteMetadata {
  title: string;
  category?: string;
  tags?: string[];
  cardImage?: string;
  postId?: string;
  slug?: string;
  url?: string;
  status?: string;
  authorSlug?: string;
  updatedAt?: string;
  syncHash?: string;
  body: string;
}
