export interface ProgressEntry {
  date: string;
  string: string;
  note: string;
  timeTaken: number;
  correctNotesCount: number;
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