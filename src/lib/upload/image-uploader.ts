import { ActionResult, UploadResult, SizeRecords } from '../types/image-types';

export const uploadOriginal = async (file: File): Promise<UploadResult> => {
  try {
    const data = new FormData();
    data.append('file', file, file.name);
    
    const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL;

    if (!uploadWorkerUrl) {
      console.error('CF_UPLOAD_WORKER_URL is not defined');
      return {
        ok: false,
        status: 500,
      };
    }

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

    const uploadWorkerData = await uploadWorkerResponse.json();

    return {
      ok: true,
      data: uploadWorkerData,
      status: uploadWorkerResponse.status,
    };

  } catch (error) {
    console.error('Error in uploadOriginal:', error);
    return {
      ok: false,
      status: 500,
    };
  }
};

export const uploadResult = async (
  name: string, 
  result: Blob, 
  size: keyof SizeRecords
): Promise<UploadResult> => {
  try {
    const data = new FormData();
    data.append('file', result, name);
    data.append('size', size);

    const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL;

    if (!uploadWorkerUrl) {
      console.error('CF_UPLOAD_WORKER_URL is not defined');
      return {
        ok: false,
        status: 500,
      };
    }

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

    const uploadWorkerData = await uploadWorkerResponse.json();

    return {
      ok: true,
      data: uploadWorkerData,
      status: uploadWorkerResponse.status,
    };

  } catch (error) {
    console.error('Error in uploading resized image:', (error as Error).message);
    return {
      ok: false,
      status: 500,
    };
  }
};