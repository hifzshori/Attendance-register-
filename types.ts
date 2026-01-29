export interface Student {
  id: string;
  name: string;
  rollNo: string;
}

export type AttendanceStatus = 'P' | 'A' | null;

// Map of date (1-31) to status
export type AttendanceRecord = Record<number, AttendanceStatus>;

// Map of student ID to their attendance record
export type ClassAttendance = Record<string, AttendanceRecord>;

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

// New structure: One Class has many months
export interface SchoolClass {
  id: string;
  name: string;
  students: Student[];
  // Map of Month Name (e.g. "September") -> Attendance Data
  attendance: Record<string, ClassAttendance>;
  createdAt: number;
  shareCode?: string; // For syncing with Firestore
}