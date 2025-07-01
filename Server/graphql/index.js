// graphql/server.js
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import express from 'express';
import { User } from '../Models/user.js';
import jwt from 'jsonwebtoken';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import 'dotenv/config';
// Sample typeDefs and resolvers
// const typeDefs = `#graphql
//   type Query {
//     hello: String
//   }
// `;

// const resolvers = {
//   Query: {
//     hello: () => 'Welcome to Solo Leveling API!',
//   },
// };

const schema = makeExecutableSchema({ typeDefs, resolvers });

export const startGraphQLServer = async (app) => {
  const server = new ApolloServer({
    typeDefs, resolvers 
  });

  await server.start();
  app.use(express.json());
  app.use(
    '/graphql',
    cors({
      origin: `${process.env.CLIENT_URL}`,
      credentials: true,
    }),
    expressMiddleware(server, {
     context: async ({ req }) => {
  const token = req.cookies?.token; // cookie-parser must be used
  if (!token) return { user: null };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    req.user=user;
    return { user };
  } catch (err) {
    return { user: null };
  }
}
    })
  );

  console.log('🚀 GraphQL ready at /graphql');
};
