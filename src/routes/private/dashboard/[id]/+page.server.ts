import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
    const { data: company, error: companyError } = await supabase
        .from('targetcompanies')
        .select('*')
        .eq('id', params.id)
        .single();

    if (companyError) {
        throw error(500, 'Error fetching company details');
    }

    if (!company) {
        throw error(404, 'Company not found');
    }

    const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('target_company_id', params.id)
        .order('created_at', { ascending: false });

    if (notesError) {
        throw error(500, 'Error fetching notes');
    }

    const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('target_company_id', params.id)
        .order('scheduled_for', { ascending: false });

    if (meetingsError) {
        throw error(500, 'Error fetching meetings');
    }

    return {
        company,
        notes: notes ?? [],
        meetings: meetings ?? []
    };
}; 