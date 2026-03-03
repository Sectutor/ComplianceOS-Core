/**
 * Google Drive Integration
 *
 * Integration for connecting to Google Drive to fetch and sync evidence files.
 */

import type {
  IntegrationManifest,
  IntegrationContext,
  IntegrationResult,
} from "../types";

export const googleDriveManifest: IntegrationManifest = {
  slug: "google-drive",
  name: "Google Drive",
  version: "1.0.0",
  description:
    "Connect to Google Drive to fetch and sync evidence files securely.",
  author: {
    name: "ComplianceOS",
    url: "https://complianceos.com",
  },
  license: "MIT",
  category: "storage", // Matches CATEGORY_ICONS and CATEGORY_COLORS
  tags: ["storage", "evidence", "documents", "files"],
  icon: "📦", // Or perhaps a Google Drive specific icon if available
  homepage: "https://drive.google.com",

  // We only need read capabilities for now based on the requirements
  capabilities: {
    read: true,
    sync: true,
  },

  authentication: {
    type: "oauth2",
    fields: [],
    oauthConfig: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
      ],
      clientId: "", // Will be configured in settings
    },
  },

  actions: [
    {
      id: "list-files",
      name: "List Files",
      description: "List all files or files in a specific folder",
      inputSchema: {
        type: "object",
        properties: {
          folderId: {
            type: "string",
            description: "Optional folder ID to list files from",
          },
          query: { type: "string", description: "Optional search query" },
        },
      },
      outputSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            mimeType: { type: "string" },
            webViewLink: { type: "string" },
            iconLink: { type: "string" },
            modifiedTime: { type: "string" },
          },
        },
      },
    },
    {
      id: "get-file",
      name: "Get File Metadata",
      description: "Get metadata for a specific file by ID",
      inputSchema: {
        type: "object",
        properties: {
          fileId: { type: "string" },
        },
        required: ["fileId"],
      },
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          mimeType: { type: "string" },
          webViewLink: { type: "string" },
          webContentLink: { type: "string" },
        },
      },
    },
  ],

  triggers: [
    {
      id: "file-added",
      name: "File Added",
      description: "Trigger when a new file is added to a watched folder",
    },
  ],

  complianceosVersion: "1.0.0",
};

/**
 * Google Drive API Client
 */
export class GoogleDriveClient {
  private token: string;
  private baseUrl = "https://www.googleapis.com/drive/v3";

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(
        `Google Drive API error: ${error.error?.message || response.statusText}`,
      );
    }

    return response.json();
  }

  async listFiles(folderId?: string, query?: string): Promise<any[]> {
    let q = "";
    if (folderId) {
      q += `'${folderId}' in parents and `;
    }
    if (query) {
      q += `name contains '${query}' and `;
    }
    q += "trashed = false";

    const params = new URLSearchParams({
      q: q,
      fields:
        "files(id, name, mimeType, webViewLink, iconLink, modifiedTime, webContentLink)",
      pageSize: "100",
      orderBy: "modifiedTime desc",
    });

    const data: any = await this.request(`/files?${params.toString()}`);
    return data.files || [];
  }

  async getFile(fileId: string): Promise<any> {
    const params = new URLSearchParams({
      fields:
        "id, name, mimeType, webViewLink, iconLink, modifiedTime, webContentLink",
    });
    return this.request(`/files/${fileId}?${params.toString()}`);
  }
}

/**
 * Google Drive Action Executors
 */
export const googleDriveActions = {
  "list-files": async (
    context: IntegrationContext,
    params?: { folderId?: string; query?: string },
  ): Promise<IntegrationResult> => {
    try {
      const client = new GoogleDriveClient(context.credentials.accessToken);
      const files = await client.listFiles(params?.folderId, params?.query);

      return {
        success: true,
        data: files,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  },

  "get-file": async (
    context: IntegrationContext,
    params: { fileId: string },
  ): Promise<IntegrationResult> => {
    try {
      if (!params?.fileId) {
        throw new Error("fileId is required");
      }
      const client = new GoogleDriveClient(context.credentials.accessToken);
      const file = await client.getFile(params.fileId);

      return {
        success: true,
        data: file,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  },
};

/**
 * Main execute function
 */
export async function executeGoogleDriveAction(
  actionId: string,
  context: IntegrationContext,
  params?: any,
): Promise<IntegrationResult> {
  const executor =
    googleDriveActions[actionId as keyof typeof googleDriveActions];

  if (!executor) {
    return {
      success: false,
      error: `Unknown action: ${actionId}`,
      timestamp: new Date(),
    };
  }

  return executor(context, params);
}

export default googleDriveManifest;
