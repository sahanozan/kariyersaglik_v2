import { supabase } from './supabase';

export const uploadAvatar = async (userId: string, file: File | Blob, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`${userId}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${userId}/${fileName}`);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
};

export const deleteAvatar = async (userId: string, fileName: string) => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/${fileName}`]);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const uploadPostMedia = async (userId: string, file: File | Blob, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(`${userId}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(`${userId}/${fileName}`);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
};

export const deletePostMedia = async (userId: string, fileName: string) => {
  try {
    const { error } = await supabase.storage
      .from('post-media')
      .remove([`${userId}/${fileName}`]);

    return { error };
  } catch (error) {
    return { error };
  }
};