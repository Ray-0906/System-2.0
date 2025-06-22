// apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:3000/graphql',
    credentials: 'include', // for cookies
  }),
  cache: new InMemoryCache(),
});

export default client;

