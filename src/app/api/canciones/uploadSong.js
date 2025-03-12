// pages/api/uploadSong.js
import nextConnect from 'next-connect';
import multer from 'multer';
import cloudinary from 'cloudinary';

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadSong = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry, something went wrong! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

uploadSong.use(upload.fields([{ name: 'song' }, { name: 'image' }]));

uploadSong.post(async (req, res) => {
  try {
    const { title } = req.body;

    // Validar que los archivos se hayan subido
    if (!req.files || !req.files['song'] || !req.files['image']) {
      return res.status(400).json({ error: 'Both song and image files are required' });
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
    res.status(200).json({
      title,
      songUrl: songResult.secure_url,
      imageUrl: imageResult.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default uploadSong;

export const config = {
  api: {
    bodyParser: false, // Desactiva el bodyParser para manejar multipart/form-data
  },
};