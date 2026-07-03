import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  path: string;
  color: string;
  bg: string;
  category: ToolCategory;
  isNew?: boolean;
}

export type ToolCategory = 'Organize' | 'Convert' | 'Optimize' | 'Security' | 'AI' | 'View' | 'Edit';
