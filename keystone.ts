import { createAuth } from '@keystone-next/auth';
import { config, createSchema } from '@keystone-next/keystone/schema';
import { User } from './schemas/User';
import { Product } from './schemas/Product';
import { ProductImage } from './schemas/ProductImage';

// imports all variables in .env file
import 'dotenv/config';
import {
  withItemData,
  statelessSessions,
} from '@keystone-next/keystone/session';
import { insertSeedData } from './seed-data';

// define database URL
const databaseURL =
  process.env.DATABASE_URL || 'mongodb://localhost/keystone-sick-fits-tutorial';

// authenticate users
const sessionConfig = {
  // how long does the user stay signed in
  maxAge: 60 * 60 * 24 * 360,
  secret: process.env.COOKIE_SECRET,
};

const { withAuth } = createAuth({
  // Needs to know which schema is necessary
  listKey: 'User',
  // Which field in User will identify person
  identityField: 'email',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    // TODO: Add initial roles here
  },
});

export default withAuth(
  config({
    server: {
      cors: {
        origin: [process.env.FRONTEND_URL],
        credentials: true,
      },
    },
    db: {
      adapter: 'mongoose',
      url: databaseURL,
      // onConnect is a function that runs when npm run dev is called
      // we'll use it here to inject the real/seed data
      async onConnect(keystone) {
        console.log('connected to the db');
        if (process.argv.includes('--seed-data')) {
          await insertSeedData(keystone);
        }
      },
      // TODO: add data seeding here
    },
    lists: createSchema({
      User,
      Product,
      ProductImage,
    }),
    ui: {
      // . Show the UI only for people who pass this test
      isAccessAllowed: ({ session }) =>
        // use sessions to see what kind of data is associated with the logged in
        !!session?.data,
    },
    session: withItemData(statelessSessions(sessionConfig), {
      // Will pass ID and any other data we query so that we have access to all fields
      User: 'id',
    }),
  })
);
