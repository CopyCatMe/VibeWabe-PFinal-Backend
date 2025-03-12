// pages/api/uploadSong.js
import nextConnect from 'next-connect';
import multer from 'multer';
import cloudinary from './cloudinary';

const upload = multer({ storage: multer.memoryStorage() });
const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry, something went wrong! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.fields([{ name: 'song' }, { name: 'image' }]));

apiRoute.post((req, res) => {
  const { title } = req.body;
  const songFile = req.files['song'][0];
  const imageFile = req.files['image'][0];

  const uploadSong = cloudinary.uploader.upload_stream(
    { resource_type: 'video' },
    (error, songResult) => {
      if (error) return res.status(500).json({ error: error.message });

      const uploadImage = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, imageResult) => {
          if (error) return res.status(500).json({ error: error.message });

          res.status(200).json({
            title,
            songUrl: songResult.secure_url,
            imageUrl: imageResult.secure_url,
          });
        }
      );

      imageFile.buffer.pipe(uploadImage);
    }
  );

  songFile.buffer.pipe(uploadSong);
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
