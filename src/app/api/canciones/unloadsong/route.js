// app/api/canciones/uploadSong/route.js
import { NextResponse } from 'next/server';
import cloudinary from '../cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Obtener los datos del formulario
    const formData = await request.formData();

    // Extraer los campos del formulario
    const title = formData.get('title');
    const imageFile = formData.get('image');
    const songFile = formData.get('song');

    // Validar que los archivos se hayan subido
    if (!songFile || !imageFile) {
      return NextResponse.json(
        { error: 'Both song and image files are required' },
        { status: 400 }
      );
    }

    // Convertir los archivos a buffers
    const imageBuffer = await imageFile.arrayBuffer();
    const songBuffer = await songFile.arrayBuffer();

    // Subir la imagen a Cloudinary
    const imageResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(Buffer.from(imageBuffer));
    });

    // Subir la canción a Cloudinary
    const songResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(Buffer.from(songBuffer));
    });

    // Responder con los URLs de los archivos subidos
    return NextResponse.json({
      title,
      songUrl: songResult.secure_url,
      imageUrl: imageResult.secure_url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
