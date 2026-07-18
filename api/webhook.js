const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const signature = req.headers["stripe-signature"];

    let event;

    try {

        event = stripe.webhooks.constructEvent(

            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET

        );

    } catch (err) {

        console.error("❌ Webhook signature verification failed.", err.message);

        return res.status(400).send(`Webhook Error: ${err.message}`);

    }

    if (event.type === "checkout.session.completed") {

        const session = event.data.object;

        console.log("✅ Payment received!");

        console.log(session.id);
        console.log(session.amount_total);
        console.log(session.customer_details?.email);

        /*
            Ici nous ajouterons ensuite :

            - envoyer un e-mail au client
            - envoyer un e-mail à Mr. Singh
            - enregistrer l'inscription
            - générer un numéro d'inscription
        */

    }

    return res.status(200).json({
        received: true
    });

};
