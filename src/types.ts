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
  items: BlogPost[];
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

export interface BlogPost {
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
  content_markdown: string | null;
  content_html: string;
  content_json: string;
  has_unpublished_changes: boolean;
  is_pinned: boolean;
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
