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

    console.log("====================================");
    console.log("✅ NEW REGISTRATION RECEIVED");
    console.log("====================================");

    console.log("Session ID:", session.id);

    console.log("Program:", session.metadata.program);

    console.log("First Name:", session.metadata.firstName);

    console.log("Last Name:", session.metadata.lastName);

    console.log("Email:", session.metadata.email);

    console.log("Phone:", session.metadata.phone);

    console.log("Amount Paid:", `$${(session.amount_total / 100).toFixed(2)}`);

    console.log("Payment Status:", session.payment_status);

    console.log("====================================");

    break;

        default:

            console.log(event.type);

    }

    return res.status(200).json({

        received: true

    });

};
