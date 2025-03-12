import { revalidatePath } from 'next/cache';
import cloudinary from 'cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadMedia(prevState, formData) {
  const imageFile = formData.get('image'); // Archivo de imagen
  const videoFile = formData.get('video'); // Archivo de video

  // Validar que se hayan subido ambos archivos
  if (!imageFile || !videoFile) {
    return { error: 'Both image and video files are required' };
  }

  try {
    // Subir la imagen a Cloudinary
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageUri = `data:${imageFile.type};base64,${imageBase64}`;

    const imageResult = await cloudinary.uploader.upload(imageUri, {
      resource_type: 'image', // Tipo de recurso: imagen
      folder: 'vibewabe', // Carpeta en Cloudinary
      public_id: `image_${Date.now()}`, // Nombre único para la imagen
    });

    // Subir el video a Cloudinary
    const videoBuffer = await videoFile.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const videoUri = `data:${videoFile.type};base64,${videoBase64}`;

    const videoResult = await cloudinary.uploader.upload(videoUri, {
      resource_type: 'video', // Tipo de recurso: video
      folder: 'vibewabe', // Carpeta en Cloudinary
      public_id: `video_${Date.now()}`, // Nombre único para el video
    });

    // Revalidar la ruta si es necesario
    revalidatePath('/');

    // Devolver los resultados
    return {
      success: 'Archivos subidos correctamente',
      imageUrl: imageResult.secure_url,
      videoUrl: videoResult.secure_url,
    };
  } catch (error) {
    return { error: error.message };
  }
}