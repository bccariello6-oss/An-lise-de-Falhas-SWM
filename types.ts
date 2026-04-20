
export type Status = 'Aberta' | 'Em andamento' | 'Concluída';
export type FailureFrequency = 'Eventual' | 'Recorrente' | 'Crônica';
export type ActionType = 'Corretiva' | 'Preventiva' | 'Melhoria';

export interface WhyCell {
  question: string;   // linha 1: "Por que ocorre...?" 
  answer: string;     // linha 2: a hipótese/resposta
  validated: 'V' | 'F' | null; // V = Verdadeiro, F = Falso
}

export interface WhysRow {
  id: string; // A, B, C, D, E, F, G, H, I...
  rounds: WhyCell[]; // 5 rounds
  improvement: string; // IDEIAS DE MELHORIAS
}

export interface WhysMatrix {
  rows: WhysRow[];
}

// Legacy support: old format was string[] or { A: string[], B: string[], C: string[], D: string[] }
export type WhysData = string[] | WhysMatrix | { A: string[]; B: string[]; C: string[]; D: string[] };

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface Action {
  id: string;
  description: string;
  type: ActionType;
  responsible: string;
  dueDate: string;
  status: Status;
  evidence?: string;
}

export interface IshikawaCategory {
  causes: string[];
  attachments: Attachment[];
}

export interface Ishikawa {
  machine: IshikawaCategory;
  method: IshikawaCategory;
  material: IshikawaCategory;
  manpower: IshikawaCategory;
  measurement: IshikawaCategory;
  environment: IshikawaCategory;
}

export interface Analysis {
  id: string;
  sequentialNumber?: number;
  // Step 1
  area: string;
  equipment: string;
  authorName: string;
  authorRole: string;
  failureDate: string;
  description: string;
  // Step 2 (5W1H)
  what: string;
  where: string;
  when: string;
  who: string;
  howMuch: string;
  how: string;
  phenomenon: string;
  // Step 3
  symptom: string;
  history: string;
  frequency: FailureFrequency;
  attachmentUrl?: string;
  // Step 4 (Porque Porque)
  whys: WhysData;
  rootCause: string;
  // Step 5 (Ishikawa)
  ishikawa: Ishikawa;
  // Step 6 (Actions)
  actions: Action[];
  // Step 7
  reoccurred: boolean | null;
  effectivenessEvidence: string;
  needsRevision: boolean;
  needsTraining: boolean;
  // Meta
  summary?: string;
  lastUpdated?: string;
}

// Helper to check if whys is the new matrix format
export function isNewWhysMatrix(whys: WhysData): whys is WhysMatrix {
  return whys !== null && typeof whys === 'object' && !Array.isArray(whys) && 'rows' in whys;
}

// Helper to create an empty WhyCell
export function createEmptyCell(): WhyCell {
  return { question: '', answer: '', validated: null };
}

// Helper to create an empty row
export function createEmptyRow(id: string): WhysRow {
  return {
    id,
    rounds: [createEmptyCell(), createEmptyCell(), createEmptyCell(), createEmptyCell(), createEmptyCell()],
    improvement: ''
  };
}

// Helper to create the default initial matrix (rows A-E)
export function createInitialWhysMatrix(): WhysMatrix {
  return {
    rows: ['A', 'B', 'C', 'D', 'E'].map(id => createEmptyRow(id))
  };
}

// Row IDs follow alphabetical order
export const ROW_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export enum StepId {
  IDENTIFICATION = 0,
  W5H1 = 1,
  DETAILS = 2,
  FIVE_WHYS = 3,
  ISHIKAWA = 4,
  ACTIONS = 5,
  VERIFICATION = 6,
  DASHBOARD = 7,
  KANBAN = 8
}
