import { supabase } from './supabase';
import { COVER_PREFIX } from './coverUrls';

// Storage adapter used by useBooks/useEntries. src/dev/mockApi.js provides
// an in-memory adapter with the same shape for the dev preview.
// Every method resolves to { data, error }.

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export const supabaseBackend = {
  books: {
    list: (userId) =>
      supabase.from('user_books').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    insert: (userId, row) =>
      supabase.from('user_books').insert({ ...row, user_id: userId }).select().single(),
    update: (userId, id, patch) =>
      supabase.from('user_books').update(patch).eq('id', id).eq('user_id', userId).select().single(),
    remove: (userId, id) =>
      supabase.from('user_books').delete().eq('id', id).eq('user_id', userId),
    uploadCover: async (userId, file) => {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(path, file);
      if (error) {
        // Bucket missing or blocked: keep the cover inline instead
        return { data: await fileToDataUrl(file), error: null };
      }
      // The bucket is private: store the path and sign it when shown
      return { data: `${COVER_PREFIX}${path}`, error: null };
    },
  },
  journal: {
    uploadPhoto: async (userId, blob, ext) => {
      const path = `${userId}/journal/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
      if (error) return { data: null, error: 'The photo could not be uploaded. Check your connection and try again.' };
      return { data: `${COVER_PREFIX}${path}`, error: null };
    },
  },
  entries: {
    list: (userId, kind) =>
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', kind)
        .order('entry_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
    insert: (userId, row) =>
      supabase.from('journal_entries').insert({ ...row, user_id: userId }).select().single(),
    update: (userId, id, patch) =>
      supabase.from('journal_entries').update(patch).eq('id', id).eq('user_id', userId).select().single(),
    remove: (userId, id) =>
      supabase.from('journal_entries').delete().eq('id', id).eq('user_id', userId),
  },
};
