/** @format */
import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/client';
import { formSchema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
  const { supabase } = await parent();
  const form = await superValidate(zod(formSchema));

  return {
    form,
    supabase
  };
}; 
