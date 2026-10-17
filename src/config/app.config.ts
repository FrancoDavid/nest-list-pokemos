export const AppConfig = () => ({
  enviroment: process.env.NODE_ENV || 'development',
  mongoDb: process.env.MONGO_DB || '',
  port: process.env.PORT || 3000,
  defaultPokemonLimit: Number(process.env.DEFAULT_POKEMON_LIMIT) || 5,
});
