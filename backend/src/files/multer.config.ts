import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

export const multerConfig = {
    storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
            const uniqueName = randomUUID() + extname(file.originalname);
            callback(null, uniqueName);
        }
    }),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB limit
    },
    fileFilter: (req: any, file: any, callback: any) => {
        // Allow basic 3D file extensions
        const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.blend', '.stl', '.ply', '.3ds', '.dae'];
        const ext = extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(ext)) {
            callback(null, true);
        } else {
            callback(new BadRequestException(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
        }
    }
};