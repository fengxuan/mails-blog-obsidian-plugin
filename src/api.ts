import { requestUrl } from "obsidian";
import type {
  BlogImageUploadResponse,
  BlogPost,
  BlogPostResponse,
  MailsBlogPluginSettings,
  ObsidianPluginTokenRefreshResponse,
  PostListResponse,
  PostPayload,
} from "./types";

export class MailsBlogApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MailsBlogApiError";
    this.status = status;
  }
}

export class MailsBlogApiClient {
  constructor(
    private readonly settings: MailsBlogPluginSettings,
    private readonly options: {
      onTokenRefresh?: (token: string, expiresAt: string) => Promise<void> | void;
    } = {},
  ) {}

  async testConnection(): Promise<PostListResponse> {
    return this.request<PostListResponse>("/api/posts/me", "GET");
  }

  async createDraft(payload: PostPayload): Promise<BlogPost> {
    const response = await this.request<BlogPostResponse>("/api/posts", "POST", payload);
    return response.post;
  }

  async updateDraft(postId: string, payload: PostPayload): Promise<BlogPost> {
    const response = await this.request<BlogPostResponse>(`/api/posts/${encodeURIComponent(postId)}`, "PATCH", payload);
    return response.post;
  }

  async publish(postId: string): Promise<BlogPost> {
    const response = await this.request<BlogPostResponse>(
      `/api/posts/${encodeURIComponent(postId)}/publish`,
      "POST",
    );
    return response.post;
  }

  async getPost(postId: string): Promise<BlogPost> {
    const response = await this.request<BlogPostResponse>(`/api/posts/${encodeURIComponent(postId)}`, "GET");
    return response.post;
  }

  async uploadImage(data: ArrayBuffer, filename: string, mimeType: string): Promise<BlogImageUploadResponse> {
    await this.ensureTokenReady();
    const blogApiBaseUrl = this.requireBaseUrl();
    const token = this.requireToken();
    const boundary = `Boundary-${crypto.randomUUID()}`;
    const body = createMultipartBody(boundary, "file", filename, mimeType, data);

    const response = await requestUrl({
      url: `${blogApiBaseUrl}/api/uploads/images`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      contentType: `multipart/form-data; boundary=${boundary}`,
      body,
      throw: false,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.json as BlogImageUploadResponse;
    }

    const errorBody = response.json as { error?: string; message?: string } | undefined;
    throw new MailsBlogApiError(
      errorBody?.message ?? errorBody?.error ?? `Image upload failed with status ${response.status}`,
      response.status,
    );
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    await this.ensureTokenReady();
    const blogApiBaseUrl = this.requireBaseUrl();
    const token = this.requireToken();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await requestUrl({
      url: `${blogApiBaseUrl}${path}`,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      throw: false,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.json as T;
    }

    const errorBody = response.json as { error?: string; message?: string } | undefined;
    throw new MailsBlogApiError(
      errorBody?.message ?? errorBody?.error ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  private requireBaseUrl(): string {
    const blogApiBaseUrl = this.settings.blogApiBaseUrl.trim().replace(/\/+$/, "");
    if (!blogApiBaseUrl) {
      throw new MailsBlogApiError("Blog API Base URL is required.");
    }
    return blogApiBaseUrl;
  }

  private requireToken(): string {
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError("Obsidian plugin token is required.");
    }
    return token;
  }

  private async ensureTokenReady(): Promise<void> {
    const token = this.settings.obsidianPluginToken.trim();
    if (!token) {
      throw new MailsBlogApiError("Obsidian plugin token is required.");
    }

    const expiresAt = this.settings.obsidianPluginTokenExpiresAt.trim();
    if (!expiresAt) {
      await this.refreshToken(token);
      return;
    }

    const expiresAtMs = Date.parse(expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      await this.refreshToken(token);
      return;
    }

    const refreshThresholdMs = 1000 * 60 * 60 * 24 * 3;
    if (expiresAtMs - Date.now() <= refreshThresholdMs) {
      await this.refreshToken(token);
    }
  }

  private async refreshToken(currentToken: string): Promise<void> {
    const blogApiBaseUrl = this.requireBaseUrl();
    const response = await requestUrl({
      url: `${blogApiBaseUrl}/api/plugin-auth/refresh`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      throw: false,
    });

    if (response.status < 200 || response.status >= 300) {
      const errorBody = response.json as { error?: { message?: string } | string; message?: string } | undefined;
      const message = typeof errorBody?.error === "string"
        ? errorBody.error
        : errorBody?.error?.message ?? errorBody?.message ?? "Token refresh failed.";
      throw new MailsBlogApiError(message, response.status);
    }

    const payload = response.json as ObsidianPluginTokenRefreshResponse;
    this.settings.obsidianPluginToken = payload.token;
    this.settings.obsidianPluginTokenExpiresAt = payload.expires_at;
    await this.options.onTokenRefresh?.(payload.token, payload.expires_at);
  }
}

function createMultipartBody(
  boundary: string,
  name: string,
  filename: string,
  mimeType: string,
  data: ArrayBuffer,
): ArrayBuffer {
  const encoder = new TextEncoder();
  const header =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${name}"; filename="${escapeQuotes(filename)}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const headerBytes = encoder.encode(header);
  const fileBytes = new Uint8Array(data);
  const footerBytes = encoder.encode(footer);
  const output = new Uint8Array(headerBytes.length + fileBytes.length + footerBytes.length);
  output.set(headerBytes, 0);
  output.set(fileBytes, headerBytes.length);
  output.set(footerBytes, headerBytes.length + fileBytes.length);
  return output.buffer;
}

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}
