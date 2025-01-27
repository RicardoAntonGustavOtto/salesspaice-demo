import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals: { supabase } }) => {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const { title, content, type = 'general', tags = [], metadata = {} } = await request.json();

        if (!title || !content) {
            throw error(400, 'Title and content are required');
        }

        if (!['general', 'meeting', 'transcript'].includes(type)) {
            throw error(400, 'Invalid note type');
        }

        const { error: supabaseError } = await supabase
            .from('notes')
            .insert({
                target_company_id: params.id,
                title,
                content,
                type,
                tags,
                metadata,
                created_by: user.id
            });

        if (supabaseError) {
            console.error('Error adding note:', supabaseError);
            throw error(500, 'Error adding note: ' + supabaseError.message);
        }

        return json({ success: true });
    } catch (e) {
        console.error('Error in notes POST handler:', e);
        throw error(500, 'Internal server error');
    }
};

export const DELETE: RequestHandler = async ({ params, url, locals: { supabase } }) => {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        throw error(401, 'Unauthorized');
    }

    const noteId = url.searchParams.get('noteId');
    if (!noteId) {
        throw error(400, 'Note ID is required');
    }

    try {
        const { error: supabaseError } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('target_company_id', params.id)
            .eq('created_by', user.id);

        if (supabaseError) {
            console.error('Error deleting note:', supabaseError);
            throw error(500, 'Error deleting note: ' + supabaseError.message);
        }

        return json({ success: true });
    } catch (e) {
        console.error('Error in notes DELETE handler:', e);
        throw error(500, 'Internal server error');
    }
}; 