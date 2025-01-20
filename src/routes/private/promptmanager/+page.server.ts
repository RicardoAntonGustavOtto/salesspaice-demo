import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading prompts:', error);
    return { prompts: [] };
  }

  return { prompts };
}; 