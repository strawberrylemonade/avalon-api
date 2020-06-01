import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env['PGDATABASE'], process.env['PGUSER'], process.env['PGPASSWORD'], {
  host: process.env['PGHOST'],
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env['PGHOST'] !== 'localhost'
  }
});

console.log('[DEV] Attempting to connect to database');

sequelize.authenticate()
  .then(() => {
    console.log('[DEV] Successful connection to database');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed connection to database');
    console.error(err);
    process.exit(1);
  });

export default sequelize;