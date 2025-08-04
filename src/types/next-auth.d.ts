<<<<<<< HEAD
import NextAuth, { type DefaultSession } from 'next-auth';
=======

import NextAuth from 'next-auth';
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
<<<<<<< HEAD
      username: string;
=======
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
    } & DefaultSession['user'];
  }
}
