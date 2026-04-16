import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import imageCompression from 'browser-image-compression';

export const uploadHeaderImage = async (file: File, _postId?: string): Promise<string> => {
  // Opciones de compresión para asegurar que no pesen demasiado y evitar mal score en Lighthouse
  const options = {
    maxSizeMB: 0.8, // Límite de ~800KB
    maxWidthOrHeight: 1920, // Resolución recomendada 
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // Use a predictable or unique path.
    // We can use a combination of timestamp and random string
    const fileExt = compressedFile.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Create a reference to 'headers/filename'
    const storageRef = ref(storage, `headers/${fileName}`);
    
    // Upload the file
    await uploadBytes(storageRef, compressedFile);
    
    // Get the URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al comprimir la imagen: ", error);
    throw error;
  }
};
