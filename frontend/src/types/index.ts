export interface Task {
  id: number;
  description: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  description?: string;
  completed?: boolean;
  order_index?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}