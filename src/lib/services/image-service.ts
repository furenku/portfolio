import { Image } from 'components-react';
import { supabase } from '../database/supabase-client';
import { ApiImage } from '../types/image-types';

export const getImagesFromDb = async (): Promise<ApiImage[]> => {
  const { data: imagesData, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });


  const { data: imageFolders, error: imageFoldersError } = await supabase
    .from('imageFolders')
    .select('*')
    .order('created_at', { ascending: false });

  if ( !imageFolders || error || imageFoldersError) {
    console.error('Supabase GET error:', error);
    throw error;
  }  

  const formattedImages: ApiImage[] = imagesData?.map(img => ({
    id: img.id,
    src: img.src, 
    alt: img.alt_text,     
    caption: img.caption,      
    sizes: img.sizes,        
    preview: img.preview,  
    filename: img.filename,    
    created_at: img.created_at,
    width: img.width,
    height: img.height,
    folder_id: imageFolders.find(imgFolder => imgFolder.image_id === img.id)?.folder_id || null,
  })) || [];

  return formattedImages;
};

export const saveImageToDb = async (imageData: Image): Promise<ApiImage> => {
  const { data: dbData, error: dbError } = await supabase
    .from('images')
    .insert([imageData])
    .select()
    .single();

  if (dbError) {
    console.error('Supabase POST error:', dbError);
    throw new Error(`Failed to save image metadata to database: ${dbError.message}`);
  }

  return {
    id: dbData.id,
    src: dbData.src,
    alt: dbData.alt_text,
    caption: dbData.caption,
    sizes: dbData.sizes,
    preview: dbData.preview,
    name: dbData.name,
    created_at: dbData.created_at,
    width: dbData.width,
    height: dbData.height,
  };
};

export const moveImagesToPath = async (imageIds: string[], targetPath: string): Promise<void> => {
  const { error } = await supabase
    .from('images')
    .update({ 
      path: targetPath === '' ? null : targetPath 
    })
    .in('id', imageIds);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Failed to move images: ${error.message}`);
  }
};