import { NextRequest, NextResponse } from 'next/server';
import { dbCheckPromise, isDbStructureValid } from '@/lib/database/db-check';
import { supabase } from '@/lib/database/supabase-client';
import { log } from 'console';


export async function PUT(req: NextRequest) {

  await dbCheckPromise

  if( ! isDbStructureValid ) {
    return NextResponse.json(
      { error: 'Database structure is not valid' },
      { status: 500 }
    );
  }

  try {
    const { imageIds, folderId } = await req.json();
    
    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Invalid imageIds provided' },
        { status: 400 }
      );
    }
    
    if ( ! folderId ) {

      const { error } = await supabase
      .from('imageFolders')
      .delete()
      .in('image_id', imageIds);


      if (error) {
        console.error('Error deleting images:', error);
        return NextResponse.json(
          { error: 'Failed to delete images' },
          { status: 500 }
        );
      }
      
      console.log('Moved images to root folder successfully');
      
    } else {
      
      const { data: updatedImages, error } = await supabase
      .from('imageFolders')
      .update({ folder_id: folderId })
      .in('image_id', imageIds);
        

      if( ! updatedImages ) {

        for (const imageId of imageIds) { 
            
          // Create new folder if it doesn't exist
          const { data: createdImageFolder,  error: createError } = await supabase
            .from('imageFolders')
            .insert({ folder_id: folderId, image_id: imageId }) // You may want to pass folder name in the request
            .single();
        
          if (createError) {
            console.error('Error creating folder:', createError);
            return NextResponse.json(
              { error: 'Failed to create folder' },
              { status: 500 }
            );
          }

          console.log('Created folder:', createdImageFolder);
          

        }
        
      }
      

      if (error) {
        console.error('Error updating images:', error);
        return NextResponse.json(
          { error: 'Failed to update images' },
          { status: 500 }
        );
      }
      
    }
    // Update imageFolders with the new folder_id
    
    return NextResponse.json(
      { success: true, message: 'Images moved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving images:', error);
    return NextResponse.json(
      { error: 'Failed to move images' },
      { status: 500 }
    );
  }
}
