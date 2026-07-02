import {IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {Visibility} from '@prisma/client';

export class CreateProjectDto{
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    title:string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?:string;

    @IsEnum(Visibility)
    visibility:Visibility;

}