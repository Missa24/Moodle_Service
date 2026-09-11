import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary-test')
export class CloudinaryTestController {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Post('video')
    @UseInterceptors(FileInterceptor('file'))
    async uploadVideo(
        @UploadedFile() file: Express.Multer.File,
    ) {
        const video = await this.cloudinaryService.uploadVideoTest(
            file,
            'test-videos',
        );

        const url = this.cloudinaryService.generarUrlVideoPrivada(
            video.publicId,
        );

        return {
            publicId: video.publicId,
            resourceType: video.resourceType,
            format: video.format,
            url,
        };
    }
}
