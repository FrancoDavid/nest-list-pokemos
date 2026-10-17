import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { PokeResponse } from './interfaces/poke-response.interface';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async executeSeed() {
    await this.pokemonModel.deleteMany({});

    const data = await fetch(
      'https://pokeapi.co/api/v2/pokemon?limit=150&offset=0',
    );
    const { results }: PokeResponse = await data.json();

    await this.pokemonModel.insertMany(
      results.map(({ name, url }) => {
        const segmentsUrl = url.split('/');
        const no = Number(segmentsUrl[segmentsUrl.length - 2]);

        return { name, no };
      }),
    );

    return 'Seed Execute!';
  }
}
