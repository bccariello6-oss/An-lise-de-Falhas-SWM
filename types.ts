
export type Status = 'Aberta' | 'Em andamento' | 'Concluída';
export type FailureFrequency = 'Eventual' | 'Recorrente' | 'Crônica';
export type ActionType = 'Corretiva' | 'Preventiva' | 'Melhoria';

export interface WhysMatrix {
  A: string[]; // 5 strings: 0=Sintoma, 1=Desculpa, 2=Culpado, 3=Causa, 4=Causa Raiz
  B: string[];
  C: string[];
  D: string[];
}

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
  // Step 4 (5 Whys)
  whys: string[] | WhysMatrix;
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
