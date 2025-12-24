
export type Priority = 'High' | 'Medium' | 'Low';

export interface ChecklistItem {
  id: string;
  task: string;
  description: string;
  priority: Priority;
  isCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export type Language = 'ar' | 'en';

export interface AuditChecklistResult {
  task_id: string; // Maps to our internal IDs
  status: 'pass' | 'fail';
  reason: string;
}

export interface AuditResponse {
  overall_score: number;
  checklist_results: AuditChecklistResult[];
  ai_recommendations: {
    title: string;
    description: string;
    advice: string;
  };
  content_gap: string;
  priority_action: string;
}
