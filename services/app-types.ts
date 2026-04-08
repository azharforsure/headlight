export type IndustryType = 'ecommerce' | 'local' | 'saas' | 'elearning';

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  url: string;
  industry: IndustryType;
  created_at: string;
  // Crawler connection — auto-populated after each crawl
  domain?: string;
  last_crawl_at?: string;
  last_crawl_score?: number;
  last_crawl_grade?: string;
  crawl_count?: number;
  // Integration status flags
  gsc_connected?: boolean;
  ga4_connected?: boolean;
  // Auto-crawl scheduling
  auto_crawl_enabled?: boolean;
  auto_crawl_interval?: 'daily' | 'weekly' | 'monthly';
  notification_email?: string;
}

export type TeamRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'client';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export type CommentTargetType = 'issue' | 'page' | 'task' | 'crawl' | 'keyword' | 'report';

export interface CrawlComment {
  id: string;
  project_id: string;
  session_id: string | null;
  target_type: CommentTargetType;
  target_id: string;
  parent_id: string | null;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  text: string;
  mentions_json: string | null;
  reactions_json: string | null;
  attachments_json: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  edited_at: string | null;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'wont_fix';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'crawler' | 'manual' | 'ai_suggestion' | 'keyword' | 'backlink';

export interface CrawlTask {
  id: string;
  project_id: string;
  session_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  source: TaskSource;
  linked_issue_id: string | null;
  affected_urls_json: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  tags_json: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CrawlSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  entity_type: 'comment' | 'task' | 'crawl' | 'issue' | 'member';
  entity_id: string;
  metadata_json: string | null;
  created_at: string;
}

export type TriggerType = 'issue_severity' | 'issue_category' | 'health_drop' | 'keyword_drop' | 'content_decay' | 'toxic_backlink' | 'traffic_anomaly';
export type AssignmentStrategy = 'specific' | 'round_robin' | 'category_owner';

export interface AssignmentRule {
  id: string;
  project_id: string;
  rule_name: string;
  trigger_type: TriggerType;
  trigger_condition_json: string;
  action_type: 'create_task' | 'notify' | 'create_task_and_notify';
  assignee_id: string | null;
  assignee_strategy: AssignmentStrategy;
  priority_override: string | null;
  enabled: boolean;
  created_at: string;
}

export type NotificationType = 'mention' | 'task_assigned' | 'comment_reply' | 'crawl_complete' | 'issue_new' | 'task_overdue' | 'alert';

export interface NotificationRecord {
  id: string;
  project_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}
