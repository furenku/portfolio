import { Breakpoint, ImageSize } from '@/types/media-server';
import { ActionResult, ResizeResult, SizeRecords } from '../types/image-types';
import { uploadResult } from '../upload/image-uploader';

export const createResized = async (
  name: string, 
  src: string, 
  size?: Breakpoint
): Promise<ResizeResult> => {
  const storageUrl = process.env.CF_STORAGE_WORKER_URL;
  const sizes: SizeRecords = {};
  
  try {
    const sizesList: (keyof typeof sizes)[] = size ? [size] : ['xs', 'sm', 'md', 'lg', 'xl'];
    
    for (const currentSize of sizesList) {
      const data = new FormData();
      data.append('size', currentSize);
      data.append('url', src);

      const imageWorkerUrl = process.env.CF_IMAGE_WORKER_URL;

      if (!imageWorkerUrl) {
        console.error('CF_IMAGE_WORKER_URL is not defined');
        return {
          ok: false,
          status: 500,
        };
      }

      const resizeWorkerResponse = await fetch(imageWorkerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESIZE_WORKER_TOKEN}`,
        },
        body: data
      });

      if (!resizeWorkerResponse.ok) {
        const errorText = await resizeWorkerResponse.text();
        console.error(`Worker error: ${resizeWorkerResponse.status} ${resizeWorkerResponse.statusText}`, errorText);
        return {
          ok: false,
          status: resizeWorkerResponse.status,
        };
      }

      const result = await resizeWorkerResponse.blob();
      const didUpload = await uploadResult(name, result, currentSize);

      if (!didUpload.ok) {
        return didUpload as ActionResult;
      }
      
      if (!didUpload.data?.width || !didUpload.data?.height) {
        console.error('Failed to get image dimensions');
        return {
          ok: false,
          status: 500,
        };
      }

      sizes[currentSize as keyof typeof sizes] = {
        src: storageUrl + '/resized/' + currentSize + '/' + name,
        width: didUpload.data.width,
        height: didUpload.data.height,
      };
    }
    
    const result: ResizeResult = {
      ok: true,
      status: 200
    };

    if (!size) {
      result.sizes = sizes;      
    } else {
      result.data = sizes[size];
    }

    return result;
    
  } catch (error) {
    console.error('Error in createResized:', error);
    return {
      ok: false,
      status: 500
    };
  }
};

export const createPreviewDataUrl = async (previewImageSize: ImageSize): Promise<string> => {
  const imageResponse = await fetch(previewImageSize.src);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const previewContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  return `data:${previewContentType};base64,${base64}`;
};