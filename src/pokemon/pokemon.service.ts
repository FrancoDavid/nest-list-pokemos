import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { isValidObjectId, Model } from 'mongoose';
import { MongoServerError } from 'mongodb';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

import { Pokemon } from './entities/pokemon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  private defaultLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = configService.getOrThrow<number>('defaultPokemonLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    try {
      createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
      const newPokemon = await this.pokemonModel.create(createPokemonDto);

      return newPokemon;
    } catch (error) {
      const mongoError = error as MongoServerError;
      this.handlerExceptions(mongoError);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1,
      })
      .select('-__v');
  }

  async findOne(term: string) {
    try {
      let pokemon: Pokemon | null;

      if (!isNaN(+term)) {
        pokemon = await this.pokemonModel.findOne({ no: +term });
      } else if (isValidObjectId(term)) {
        pokemon = await this.pokemonModel.findById(term);
      } else {
        pokemon = await this.pokemonModel.findOne({
          name: term.toLocaleLowerCase().trim(),
        });
      }

      if (!pokemon) {
        throw new BadRequestException(`Pokemon not found`);
      }

      return pokemon;
    } catch {
      throw new InternalServerErrorException(
        "Can't find Pokemon - Check server logs",
      );
    }
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    try {
      if (updatePokemonDto.name) {
        updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
      }

      await this.pokemonModel.updateOne({ _id: pokemon._id }, updatePokemonDto);

      return {
        ...pokemon.toJSON(),
        ...updatePokemonDto,
      } as Pokemon;
    } catch (error) {
      const mongoError = error as MongoServerError;
      this.handlerExceptions(mongoError);
    }
  }

  async remove(id: string) {
    try {
      const result = await this.pokemonModel.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        throw new BadRequestException('Pokemon not found');
      }

      return {
        message: 'Pokemon deleted successfully',
        id: id,
      };
    } catch {
      throw new InternalServerErrorException(
        "Can't delete Pokemon - Check server logs",
      );
    }
  }

  private handlerExceptions(error: MongoServerError) {
    if (error.code === 11000) {
      throw new BadRequestException('Pokemon already exists in the database');
    }

    throw new InternalServerErrorException(
      "Can't create Pokemon - Check server logs",
    );
  }
}
