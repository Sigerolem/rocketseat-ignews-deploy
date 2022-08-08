import { query as q } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = {
  ref: {
    id: string;
  },
  data: {
    email: string;
    stripe_customer_id?: string;
  }
}

const subscribe = async (req: NextApiRequest, res: NextApiResponse) => {   
  const session = await getSession({ req })

  const user = await fauna.query<User>(
    q.Get(
      q.Match(
        q.Index('user_by_email'),
        q.Casefold(session.user.email)
      )
    )
  )

  let stripeCustomerId = user.data.stripe_customer_id

  if (!stripeCustomerId) {
    let stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      // metadata
    })

    await fauna.query(
      q.Update(
        q.Ref(q.Collection('users'), user.ref.id),
        {
          data: {
            stripe_customer_id: stripeCustomer.id
          }
        }
      )
    )
    stripeCustomerId = stripeCustomer.id
  }

  if (req.method === 'POST') {
    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: 'price_1KAxdyAV2ZiPZNE9x4ZYDUuf', quantity: 1 },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      success_url: process.env.STRIPE_SUCCESS_URL
    })

    return res.status(200).json({ sessionId: stripeCheckoutSession.id })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')

  }
}

export default subscribe