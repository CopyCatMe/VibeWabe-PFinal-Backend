// app/api/canciones/uploadSong/route.js
import { NextResponse } from 'next/server';
import multer from 'multer';
import cloudinary from 'cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configura Multer para manejar la subida de archivos
const upload = multer({ storage: multer.memoryStorage() });

// Middleware para procesar multipart/form-data
const multerMiddleware = upload.fields([{ name: 'song' }, { name: 'image' }]);

export async function POST(request) {
  try {
    // Parsear el cuerpo de la solicitud usando Multer
    const req = await new Promise((resolve, reject) => {
      multerMiddleware(request, {}, (error) => {
        if (error) reject(error);
        else resolve(request);
      });
    });

    const { title } = req.body;

    // Validar que los archivos se hayan subido
    if (!req.files || !req.files['song'] || !req.files['image']) {
      return NextResponse.json(
        { error: 'Both song and image files are required' },
        { status: 400 }
      );
    }

    const songFile = req.files['song'][0];
    const imageFile = req.files['image'][0];

    // Subir la canción a Cloudinary
    const songResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      songFile.buffer.pipe(uploadStream);
    });

    // Subir la imagen a Cloudinary
    const imageResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      imageFile.buffer.pipe(uploadStream);
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

export const config = {
  api: {
    bodyParser: false, // Desactiva el bodyParser para manejar multipart/form-data
  },
};