import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.join("uploads", "originals");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDir);

    },

    filename(req, file, cb) {

        const extensionByMimeType = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        };
        const ext = extensionByMimeType[file.mimetype] || path.extname(file.originalname);

        cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);

    },

});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter(_req, file, cb) {
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
        ]);

        if (!allowedTypes.has(file.mimetype)) {
            return cb(new Error("ניתן להעלות תמונות JPG, PNG או WebP בלבד"));
        }

        cb(null, true);
    },
});

export default upload;
