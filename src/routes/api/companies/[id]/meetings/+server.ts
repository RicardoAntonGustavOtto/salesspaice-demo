import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals: { supabase } }) => {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const { title, scheduled_for, location, attendees, summary } = await request.json();

        if (!title || !scheduled_for || !location) {
            throw error(400, 'Title, date/time, and location are required');
        }

        // Validate the date format
        const scheduledDate = new Date(scheduled_for);
        if (isNaN(scheduledDate.getTime())) {
            throw error(400, 'Invalid date format');
        }

        const { error: supabaseError } = await supabase
            .from('meetings')
            .insert({
                target_company_id: params.id,
                title,
                scheduled_for: scheduledDate.toISOString(),
                location,
                attendees: attendees || [],
                summary: summary || null,
                created_by: user.id
            });

        if (supabaseError) {
            console.error('Error scheduling meeting:', supabaseError);
            throw error(500, 'Error scheduling meeting: ' + supabaseError.message);
        }

        return json({ success: true });
    } catch (e) {
        console.error('Error in meetings POST handler:', e);
        throw error(500, 'Internal server error');
    }
};