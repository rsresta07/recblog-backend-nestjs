import { PartialType } from '@nestjs/swagger';
import { CreateAboutUsDto } from './create-about-us.dto';

export class UpdateAboutUsDto extends PartialType(CreateAboutUsDto) {}
