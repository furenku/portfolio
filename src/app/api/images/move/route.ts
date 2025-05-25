import { NextRequest, NextResponse } from 'next/server';
import { dbCheckPromise, isDbStructureValid } from '@/lib/database/db-check';
import { supabase } from '@/lib/database/supabase-client';


export async function POST(req: NextRequest) {

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
    
    // Update images with the new folder_id
    const { error } = await supabase
      .from('images')
      .update({ folder_id: folderId })
      .in('id', imageIds);
        
    if (error) {
      console.error('Error updating images:', error);
      return NextResponse.json(
        { error: 'Failed to update images' },
        { status: 500 }
      );
    }
    
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
