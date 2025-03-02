export interface ProgressEntry {
  date: string;
  string: string;       // String label like "1 (E)"
  stringNumber: number; // Actual string number (1-6) for filtering
  note: string;
  timeTaken: number;
  correctNotesCount: number;
  errors: number;
  success: boolean;
}

export interface NoteData {
  note: string;
  octave: number;
  noteName?: string;
}

export interface PlayedNote {
  note: string;
  octave: 'first' | 'next';
}
export interface Challenge {
  string: number;
  note: string;
  fullNote: string;
}