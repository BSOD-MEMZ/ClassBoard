export type WeekType = "odd" | "even" | "all";

export interface Lesson {
  day: number;
  weekType: WeekType;
  start: string;
  end: string;
  startM: number;
  endM: number;
  course: string;
  teacher: string;
}

export interface CsesParseResult {
  ok: boolean;
  lessons: Lesson[];
  error?: string;
  warning?: string;
}

export interface ClassState {
  statusText: string;
  courseText: string;
  teacherText: string;
  showProgress: boolean;
  progress: number;
  progressNote: string;
}
