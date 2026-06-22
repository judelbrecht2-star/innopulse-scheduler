import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      timeZone: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string | null;
    timeZone: string;
  }
}
