declare const process: {
  env: Record<string, string | undefined>;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

declare class URL {
  pathname: string;
  constructor(input: string, base?: string);
}

declare module "node:http" {
  export interface IncomingMessage {
    url?: string;
    method?: string;
    on(event: "data", listener: (chunk: string) => void): void;
    on(event: "end", listener: () => void): void;
    on(event: "error", listener: (error: Error) => void): void;
  }

  export interface ServerResponse {
    writeHead(statusCode: number, headers?: Record<string, string>): void;
    end(chunk?: string): void;
  }

  export interface Server {
    listen(port: number, listener?: () => void): void;
  }

  export function createServer(
    requestListener: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
  ): Server;
}
