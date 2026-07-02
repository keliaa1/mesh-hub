import {IsString, IsOptional, IsEnum} from 'class-validator';
import {Visibility} from '@prisma/client';

export class UpdateProjectDto{
    @IsString()
    @IsOptional()
    title?:string;

    @IsString()
    @IsOptional()
    description?:string;

    @IsEnum(Visibility)
    @IsOptional()
    visibility?:Visibility;
}