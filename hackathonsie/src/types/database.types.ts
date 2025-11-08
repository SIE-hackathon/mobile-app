/**
 * Database Types
 * Generated from Supabase schema
 */

// Enums
export type GroupMemberRole = 'owner' | 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityAction = 
  | 'task_created' 
  | 'task_updated' 
  | 'task_assigned' 
  | 'status_changed'
  | 'task_deleted' 
  | 'group_created' 
  | 'group_updated' 
  | 'member_added' 
  | 'member_removed'  
  | 'role_changed';
export type AssignmentType = 'manual' | 'auto' | 'reassign';
export type SyncStatus = 'pending' | 'synced' | 'conflict';

// Table Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  description_encrypted?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  due_date?: string;
  created_by: string;
  assigned_to_user?: string;
  assigned_to_group?: string;
  parent_task_id?: string;
  is_subtask?: boolean;
  subtask_count?: number;
  completed_subtask_count?: number;
  encryption_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  task_id?: string;
  group_id?: string;
  action: ActivityAction;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  timestamp: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  assigned_from?: string;
  assigned_to_user?: string;
  assigned_to_group?: string;
  assignment_type: AssignmentType;
  assigned_at: string;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  sync_status: SyncStatus;
  created_at: string;
  synced_at?: string;
}

// Insert Types (for creating new records)
export type GroupInsert = Omit<Group, 'id' | 'created_at' | 'updated_at'>;
export type GroupMemberInsert = Omit<GroupMember, 'id' | 'joined_at'>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type TaskAssignmentInsert = Omit<TaskAssignment, 'id' | 'assigned_at'>;
export type ActivityLogInsert = Omit<ActivityLog, 'id' | 'timestamp'>;

// Update Types (for updating records)
export type GroupUpdate = Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;
export type GroupMemberUpdate = Partial<Omit<GroupMember, 'id' | 'group_id' | 'user_id' | 'joined_at'>>;
