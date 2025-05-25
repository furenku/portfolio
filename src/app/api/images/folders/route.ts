import { NextRequest, NextResponse } from 'next/server';
import { dbCheckPromise, isDbStructureValid } from '../../../../lib/database/db-check';
import { getFolders } from '../../../../lib/database/folders-get';
import { createFolderHierarchy } from '../../../../lib/database/folder-creation';
import { renameFolder } from '../../../../lib/database/folder-rename';
import { moveFolder } from '../../../../lib/database/folder-move';
import { deleteFolder } from '../../../../lib/database/folder-delete';

export async function GET() {
  await dbCheckPromise;
  
  if (!isDbStructureValid) {
    console.error("GET /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const folders = await getFolders();
    return new NextResponse(JSON.stringify(folders || []), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/images/folders:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error fetching folders' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("POST /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { path } = await req.json();

    if (!path || typeof path !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path' }), { status: 400 });
    }

    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid folder path' }), { status: 400 });
    }

    await createFolderHierarchy(pathParts);

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder created successfully',
      path
    }), { status: 201 });

  } catch (error) {
    console.error("Error creating folder:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error creating folder' }), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("PATCH /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { folderPath, newName } = await req.json();

    if (!folderPath || !newName || typeof folderPath !== 'string' || typeof newName !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path or name' }), { status: 400 });
    }

    await renameFolder(folderPath, newName);

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder renamed successfully',
      oldPath: folderPath,
      newName
    }), { status: 200 });

  } catch (error) {
    console.error("Error renaming folder:", error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid folder path') {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 });
      }
      if (error.message === 'Folder not found') {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 404 });
      }
      if (error.message === 'A folder with this name already exists') {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 409 });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: 'Server error renaming folder' }), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("PUT /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { source, target } = await req.json();

    console.log( "PUT /api/images/folders: Received request to move folder:", source, "to:", target);


    if (!source || typeof source !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid source folder path' }), { status: 400 });
    }

    if (target !== null && typeof target !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Invalid target folder path' }), { status: 400 });
    }

    if (target && (target === source || target.startsWith(source + "/"))) {
      return new NextResponse(JSON.stringify({ error: 'Cannot move folder into itself or its descendants' }), { status: 400 });
    }

    const newPath = await moveFolder(source, target);

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder moved successfully',
      source,
      target,
      newPath
    }), { status: 200 });

  } catch (error) {
    console.error("Error moving folder:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 404 });
      }
      if (error.message.includes('already exists')) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 409 });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: 'Server error moving folder' }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("DELETE /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { folderPath } = await req.json();

    if (!folderPath || typeof folderPath !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path' }), { status: 400 });
    }

    const result = await deleteFolder(folderPath);

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder and all contents deleted successfully',
      deletedPath: folderPath,
      deletedFolders: result.deletedFolders,
    }), { status: 200 });

  } catch (error) {
    console.error("Error deleting folder:", error);
    
    if (error instanceof Error) {
      if (error.message === 'Folder not found') {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 404 });
      }
      if (error.message === 'Invalid folder path') {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: 'Server error deleting folder' }), { status: 500 });
  }
}