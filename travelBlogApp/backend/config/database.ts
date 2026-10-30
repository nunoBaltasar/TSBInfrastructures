import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.resolve(
          process.cwd(),
          env('DATABASE_FILENAME', '.tmp/data.db')
        ),
      },
      useNullAsDefault: true,
      acquireConnectionTimeout: env.int(
        'DATABASE_CONNECTION_TIMEOUT',
        60000
      ),
    },
  };
};

export default config;