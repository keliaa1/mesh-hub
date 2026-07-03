import {diskStorage} from 'multer';
import {extname} from 'path';
import {randomUUID} from 'crypto';

export const multerConfig = {
    storage: diskStorage({
        destination: './uploads',
        filename:(req,file,callback)=>{
            const uniqueName =
            randomUUID()+extname(file.originalname);

            callback(null, uniqueName);
        }
    })
}