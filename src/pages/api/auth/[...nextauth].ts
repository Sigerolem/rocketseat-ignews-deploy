import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { query as q } from 'faunadb';
import { fauna } from "../../../services/fauna";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user'
        }
      }
    }),
  ],
  secret: '24rg42g23gedqevwd1f23g2',
  callbacks: {
    async session({session}) {
      const { user } = session
      try {
        const userActiveSubscription = await fauna.query(
        q.Get(
          q.Intersection(
            q.Match(
              q.Index('subscription_by_user_ref'),
                q.Select(
                  "ref",
                  q.Get(
                    q.Match(
                      q.Index(
                        'user_by_email'
                      ),
                      q.Casefold(user?.email)
                    )
                  )
                )
            ),
            q.Match(
              q.Index('subscription_by_status'),
              "active"
            )
          )
        )
      )

      return {
        ...session,
        userActiveSubscription
      }
      
      } catch (error) {
        
        return {
          ...session,
          userActiveSubscription: null
        }
      }
    },
    async signIn({user}) {
      // console.log(user);
      try {
        await fauna.query(
          q.If(
            q.Exists(
              q.Match(
                q.Index('user_by_email'),
                user?.email
              )
            ),
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                user?.email
              )
            ),
            q.Create(
              q.Collection('users'),
              { data: { email: user?.email } }
            )
          )
        )

        return true
      } catch (error) {
        return false
      }
      
    }
  }
})