import {IsOptional, IsString, IsNotEmpty, MaxLength} from 'class-validator';

export class CreateVersionDto{
    @IsOptional()
    @IsString()
    @MaxLength(500)
    commitMessage?:string;
}