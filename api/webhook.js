const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getRawBody(readable) {

    const chunks = [];

    for await (const chunk of readable) {

        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

    }

    return Buffer.concat(chunks);

}

module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).send("Method Not Allowed");

    }

    const signature = req.headers["stripe-signature"];

    let event;

    try {

        const rawBody = await getRawBody(req);

        event = stripe.webhooks.constructEvent(

            rawBody,

            signature,

            process.env.STRIPE_WEBHOOK_SECRET

        );

    } catch (err) {

        console.error(err);

        return res.status(400).send(`Webhook Error: ${err.message}`);

    }

    switch (event.type) {

        case "checkout.session.completed":

            const session = event.data.object;

            console.log("✅ PAYMENT SUCCESS");

            console.log(session.id);

            console.log(session.amount_total);

            console.log(session.customer_details?.email);

            break;

        default:

            console.log(event.type);

    }

    return res.status(200).json({

        received: true

    });

};
