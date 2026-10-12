export type TaskStatus = 'to_do' | 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  taskId: string;
  actor: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  timestamp: string;
}

export let tasks: Task[] = [];
export let auditLogs: AuditLog[] = [];

export const validTransitions: Record<TaskStatus, TaskStatus[]> = {
  'to_do': ['pending'],
  'pending': ['in_progress'],
  'in_progress': ['done'],
  'done': []
};