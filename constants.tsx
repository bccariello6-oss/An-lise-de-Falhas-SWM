
import React from 'react';
import { StepId } from './types';
import { 
  IdCard, 
  HelpCircle, 
  Search, 
  ListOrdered, 
  Fish, 
  CheckSquare, 
  CheckCircle2, 
  LayoutDashboard, 
  Columns 
} from 'lucide-react';

export const getSteps = (t: (key: string) => string) => [
  { id: StepId.IDENTIFICATION, label: t('steps.1'), icon: <IdCard size={18} /> },
  { id: StepId.W5H1, label: t('steps.2'), icon: <HelpCircle size={18} /> },
  { id: StepId.DETAILS, label: t('steps.3'), icon: <Search size={18} /> },
  { id: StepId.ISHIKAWA, label: t('steps.4'), icon: <Fish size={18} /> },
  { id: StepId.FIVE_WHYS, label: t('steps.5'), icon: <ListOrdered size={18} /> },
  { id: StepId.ACTIONS, label: t('steps.6'), icon: <CheckSquare size={18} /> },
  { id: StepId.VERIFICATION, label: t('steps.7'), icon: <CheckCircle2 size={18} /> },
  { id: StepId.KANBAN, label: t('steps.8'), icon: <Columns size={18} /> },
  { id: StepId.DASHBOARD, label: t('steps.dashboard'), icon: <LayoutDashboard size={18} /> }
];

export const getTips = (t: (key: string) => string) => ({
  what: t('tips.what'),
  where: t('tips.where'),
  when: t('tips.when'),
  howMuch: t('tips.howMuch'),
  how: t('tips.how'),
  why: t('tips.why')
});

export const getIshikawaQuestions = (t: (key: string) => string) => ({
  machine: t('ishikawa.machine'),
  method: t('ishikawa.method'),
  material: t('ishikawa.material'),
  manpower: t('ishikawa.manpower'),
  measurement: t('ishikawa.measurement'),
  environment: t('ishikawa.environment')
});
