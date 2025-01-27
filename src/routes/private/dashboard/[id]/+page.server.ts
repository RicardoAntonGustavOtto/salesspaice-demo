import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
    const { data: company, error: companyError } = await supabase
        .from('targetcompanies')
        .select('*')
        .eq('id', params.id)
        .single();

    if (companyError) {
        throw error(404, 'Company not found');
    }

    const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('target_company_id', params.id)
        .order('created_at', { ascending: false });

    if (notesError) {
        console.error('Error fetching notes:', notesError);
        throw error(500, 'Error fetching notes');
    }

    return {
        company,
        notes: notes ?? []
    };
}; 