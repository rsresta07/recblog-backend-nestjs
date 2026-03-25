import { PartialType } from '@nestjs/swagger';
import { CreateMagicFixDto } from './create-magic-fix.dto';

export class UpdateMagicFixDto extends PartialType(CreateMagicFixDto) {}
