import { supabase } from '../lib/supabase';
import type { Analysis, Action } from '../types';

export const fetchAnalyses = async (userId: string, isAdmin: boolean) => {
  let query = supabase
    .from('swm_failure_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((item: any) => ({
    ...item.data,
    id: item.id,
    user_id: item.user_id,
    created_at: item.created_at
  })) as Analysis[];
};

export const saveAnalysis = async (userId: string, analysis: Analysis) => {
  const { data, error } = await supabase
    .from('swm_failure_analyses')
    .upsert({
      id: analysis.id,
      user_id: userId,
      equipment: analysis.equipment,
      area: analysis.area,
      tag: analysis.tag,
      data: analysis
    })
    .select();

  if (error) throw error;
  return data;
};

export const deleteAnalysis = async (id: string) => {
  const { error } = await supabase
    .from('swm_failure_analyses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, username')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};
