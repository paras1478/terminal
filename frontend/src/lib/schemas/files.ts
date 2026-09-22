export type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
};

export interface FileContent {
  path: string;
  content: string;
  truncated: boolean;
}
