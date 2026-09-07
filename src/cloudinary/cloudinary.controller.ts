import { Controller, Get, Query } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Public()
  @Get('signature')
  generarFirma(@Query('folder') folder: string) {
    return this.cloudinaryService.generarFirma(folder);
  }
}