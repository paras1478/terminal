export type AgentActivityType =
  | 'thinking'
  | 'read_file'
  | 'list_directory'
  | 'proposed_change'
  | 'file_written'
  | 'command'
  | 'command_output'
  | 'confirmation_required'
  | 'error'
  | 'done';

export interface AgentActivityEvent {
  sessionId: string;
  type: AgentActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PendingConfirmation {
  id: string;
  sessionId: string;
  kind: 'command' | 'file_write';
  description: string;
  resolve: (approved: boolean) => void;
}
