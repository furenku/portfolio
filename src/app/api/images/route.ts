import { NextRequest, NextResponse } from 'next/server';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ApiImage {
  src?: string;
  alt?: string;
  caption?: string;
  sizes: {
    [key in Breakpoint]: string;
  },
  preview?: string;

}

type SizeRecord = {
  [ key in Breakpoint ]?: string
}


interface ActionResult {
  ok: boolean;
  status: number;
}

import images from "../../../../data/test/images/get.json"


const uploadOriginal = async (file: File) : Promise<ActionResult> => {
  try {
  
    const data = new FormData();
    data.append('file', file, file.name);
    

    const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPLOAD_WORKER_TOKEN}`,
      },
      body: data,        
    });

    // Check if the worker responded successfully
    if (!uploadWorkerResponse.ok) {
      const errorText = await uploadWorkerResponse.text();
      console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
      return {
        ok: false,
        status: uploadWorkerResponse.status,
      };
    }

    return {
      ok: true,
      status: uploadWorkerResponse.status,
    };

  } catch (error) {
    console.error('Error in POST /api/images:', error);
    return {
      ok: false,
      status: 500,
    };
  }
}

const uploadResult = async ( name: string, result: Blob, size: keyof SizeRecord ) : Promise<ActionResult> => {          
  try {


    const data = new FormData();
    data.append('file', result, name);
    data.append('size', size );
    



    const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPLOAD_WORKER_TOKEN}`,
      },
      body: data,        
    });

    if (!uploadWorkerResponse.ok) {
      const errorText = await uploadWorkerResponse.text();
      console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
      return {
        ok: false,
        status: uploadWorkerResponse.status,
      };
    }


    return {
      ok: true,
      status: uploadWorkerResponse.status,
    };
    


  } catch (error) {

  console.error('Error in uploading resized image:', (error as Error).message);

  return {
    ok: false,
    status: 500,
  };
}
}

const createResized = async (name:string, url:string) : Promise<ActionResult & { sizes?: SizeRecord }> => {
  
  const sizes : SizeRecord = {}
  
  try {

    const sizesList: (keyof typeof sizes)[]  = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    for (const size of sizesList) {

      const data = new FormData();

      console.log("size", size);
      
      data.append('size', size);
      data.append('url', url);

      const resizeWorkerResponse = await fetch( imageWorkerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESIZE_WORKER_TOKEN}`,
        },
        body: data
      });

      
      if( ! resizeWorkerResponse.ok ) {
        const errorText = await resizeWorkerResponse.text();
        console.error(`Worker error: ${resizeWorkerResponse.status} ${resizeWorkerResponse.statusText}`, errorText);

        return NextResponse.json(
          {
            error: 'Failed to resize image',
            workerStatus: resizeWorkerResponse.status,
            resizeWorkerResponse: errorText, // Include worker response for debugging
          },
          { status: resizeWorkerResponse.status } // Forward the worker's status code
        );
      }

      const result = await resizeWorkerResponse.blob()
      

      const didUpload = await uploadResult( name, result, size )

      if( ! didUpload.ok ) {
        return didUpload
      }

      sizes[size as keyof typeof sizes] = storageUrl + '/resized/' + size + '/' + name
      
    }
    
    return {
      ok: true,
      sizes,
      status: 200
    }
    
  } catch (error) {
    
    console.error('Error in reupload:', error);
    
    return {
      ok: false,
      status: 500
    };

  }

}




const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL;
const storageUrl = process.env.CF_STORAGE_WORKER_URL;
const imageWorkerUrl = process.env.CF_IMAGE_WORKER_URL;




export async function GET() {
  try {
    
    return new NextResponse(JSON.stringify(images), { status: 200 });

  } catch (error) {
    console.error('Error fetching images:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch images' }), { status: 500 });
  }

}



export async function POST(req: NextRequest) {
  
  
  if (!storageUrl) {
    console.error('CF_STORAGE_WORKER_URL environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Worker URL missing' },
      { status: 500 }
    );
  }
  if (!imageWorkerUrl) {
    console.error('CF_IMAGE_WORKER_URL  environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Worker URL missing' },
      { status: 500 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
       return NextResponse.json(
         { error: 'Invalid content type, expected multipart/form-data' },
         { status: 415 } // Unsupported Media Type
       );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file found in the request' },
        { status: 400 }
      );
    }

    const originalUrl = storageUrl + '/original/' + file.name;



  
    const didUpload = await uploadOriginal( file )

    if( ! didUpload.ok ) {

      return NextResponse.json(
        { error: 'Could not upload' },
        { status: didUpload.status }
      );

      
    }
    
    const response = await createResized( file.name, originalUrl )

    if( ! response.ok ) {
      return NextResponse.json(
        { error: 'Could not create resized images' },
        { status: response.status }
      );

    } 

  
    return NextResponse.json( {
      original: originalUrl,
      sizes: response.sizes
    }, { status: 201 }); // 201 Created is often suitable for successful POST
      
      


  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in POST /api/images:', message);
    // Distinguish between client errors (e.g., bad form data) and server errors
    if (error instanceof TypeError && error.message.includes('Could not parse content as FormData')) {
       return NextResponse.json(
           { error: 'Bad request: Invalid form data' },
           { status: 400 }
       );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}