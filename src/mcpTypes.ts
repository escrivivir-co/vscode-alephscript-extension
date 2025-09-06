export interface IMcpServerDescriptor {
  id: string;
  name: string;
  url?: string;
  port?: number;
}

export interface IMcpClient {
  listServers(): Promise<IMcpServerDescriptor[]>;
  healthCheck(id: string): Promise<{ ok: boolean; status: number; details?: any }>; 
}

export type McpStatus = 'running' | 'stopped' | 'error';
