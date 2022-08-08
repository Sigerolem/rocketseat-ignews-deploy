import { query as q } from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

type User = {
   ref: {
      id: string;
   }
}

export async function saveSubscription(
   subscriptionId: string,
   customerId: string,
   createAction = false
) {
   const user = await fauna.query<User>(
      q.Get(
         q.Match(
            q.Index('user_by_stripe_customer_id'),
            customerId
         )
      )
   )

   const subscription = await stripe.subscriptions.retrieve(subscriptionId)

   const subscriptionData = {
      id: subscriptionId,
      userId: user.ref,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      stripeCustomerId: customerId
   }
   console.log(subscriptionData);


   if (createAction) {
      await fauna.query(
         q.Create(
            q.Collection('subscriptions'),
            {
               data: subscriptionData
            }
         )
      )
   } else {
      await fauna.query(
         q.Replace(
            q.Select(
               "ref",
               q.Get(
                  q.Match(
                     q.Index('subscription_by_id'),
                     subscriptionId
                  )
               )
            ),
            {
               data: subscriptionData
            }
         )
      )


   }


}