import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
    const { data: company, error: companyError } = await supabase
        .from('targetcompanies')
        .select(`
            *,
            recentActivity:activities(
                type,
                title,
                created_at
            )
        `)
        .eq('id', params.id)
        .single();

    if (companyError) throw error(404, 'Company not found');

    const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('target_company_id', params.id)
        .order('created_at', { ascending: false });

    const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('target_company_id', params.id)
        .order('scheduled_for', { ascending: false });

    const { data: transcripts } = await supabase
        .from('transcripts')
        .select('*')
        .eq('target_company_id', params.id)
        .order('created_at', { ascending: false });

    return {
        company: {
            ...company,
            recentActivity: company.recentActivity?.map(activity => ({
                ...activity,
                date: new Date(activity.created_at).toLocaleDateString()
            }))
        },
        notes: notes?.map(note => ({
            ...note,
            date: new Date(note.created_at).toLocaleDateString()
        })),
        meetings: meetings?.map(meeting => ({
            ...meeting,
            date: new Date(meeting.scheduled_for).toLocaleDateString()
        })),
        transcripts: transcripts?.map(transcript => ({
            ...transcript,
            date: new Date(transcript.created_at).toLocaleDateString()
        }))
    };
}; 