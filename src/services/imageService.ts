import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const uploadHeaderImage = async (file: File, _postId?: string): Promise<string> => {
  // Use a predictable or unique path.
  // We can use a combination of timestamp and random string
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Create a reference to 'headers/filename'
  const storageRef = ref(storage, `headers/${fileName}`);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get the URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};
