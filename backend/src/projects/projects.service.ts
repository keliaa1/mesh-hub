import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateProjectDto} from './dto/create-project.dto';

@Injectable()
export class ProjectsService{
    constructor(private readonly prisma: PrismaService){}

    async create(dto: CreateProjectDto, ownerId: string){
        const project =  await this.prisma.project.create({
            data:{
                title: dto.title,
                description: dto.description,
                visibility: dto.visibility,
                ownerId,
            },
        });
        return project
    }
}