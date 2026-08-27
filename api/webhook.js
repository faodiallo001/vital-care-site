const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getRawBody(readable) {

    const chunks = [];

    for await (const chunk of readable) {

        chunks.push(
            Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)
        );

    }

    return Buffer.concat(chunks);
}

async function saveOrderToSupabase(session) {

    const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/orders`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "apikey":
                    process.env.SUPABASE_SERVICE_ROLE_KEY,

                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

                "Prefer":
                    "return=representation"
            },

            body: JSON.stringify({

                first_name:
                    session.metadata?.firstName,

                last_name:
                    session.metadata?.lastName,

                email:
                    session.metadata?.email,

                phone:
                    session.metadata?.phone,

                program:
                    session.metadata?.program,

                amount_cents:
                    session.amount_total,

                currency:
                    session.currency || "usd",

                payment_status:
                    session.payment_status,

                stripe_session_id:
                    session.id,

                stripe_payment_intent:
                    session.payment_intent || null

            })
        }
    );

    if (!response.ok) {

        const errorText = await response.text();

        /*
        Stripe peut renvoyer le même webhook plusieurs fois.
        Comme stripe_session_id est UNIQUE, Supabase peut
        répondre avec une erreur de duplication.
        */

        if (
            response.status === 409 ||
            errorText.includes("duplicate key")
        ) {

            console.log(
                "ℹ️ Order already exists:",
                session.id
            );

            return;
        }

        throw new Error(
            `Supabase error ${response.status}: ${errorText}`
        );
    }

    const order = await response.json();

    console.log(
        "✅ Order saved to Supabase:",
        order
    );
}

module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res
            .status(405)
            .send("Method Not Allowed");
    }

    const signature =
        req.headers["stripe-signature"];

    let event;

    try {

        const rawBody =
            await getRawBody(req);

        event =
            stripe.webhooks.constructEvent(
                rawBody,
                signature,
                process.env
                    .STRIPE_WEBHOOK_SECRET
            );

    } catch (err) {

        console.error(
            "❌ Stripe webhook verification failed:",
            err.message
        );

        return res
            .status(400)
            .send(
                `Webhook Error: ${err.message}`
            );
    }

    try {

        switch (event.type) {

            case "checkout.session.completed": {

                const session =
                    event.data.object;

                console.log(
                    "===================================="
                );

                console.log(
                    "✅ NEW REGISTRATION RECEIVED"
                );

                console.log(
                    "Session ID:",
                    session.id
                );

                console.log(
                    "Program:",
                    session.metadata?.program
                );

                console.log(
                    "First Name:",
                    session.metadata?.firstName
                );

                console.log(
                    "Last Name:",
                    session.metadata?.lastName
                );

                console.log(
                    "Email:",
                    session.metadata?.email
                );

                console.log(
                    "Phone:",
                    session.metadata?.phone
                );

                console.log(
                    "Amount Paid:",
                    `$${(
                        session.amount_total / 100
                    ).toFixed(2)}`
                );

                console.log(
                    "Payment Status:",
                    session.payment_status
                );

                /*
                On sauvegarde uniquement
                si le paiement est réellement payé.
                */

                if (
                    session.payment_status ===
                    "paid"
                ) {

                    await saveOrderToSupabase(
                        session
                    );
                }

                console.log(
                    "===================================="
                );

                break;
            }

            default:

                console.log(
                    `Unhandled event: ${event.type}`
                );
        }

        return res
            .status(200)
            .json({
                received: true
            });

    } catch (err) {

        console.error(
            "❌ Webhook processing error:",
            err
        );

        /*
        Important :
        on renvoie 500 pour que Stripe
        retente automatiquement le webhook
        si Supabase a eu un problème temporaire.
        */

        return res
            .status(500)
            .json({
                error:
                    "Webhook processing failed."
            });
    }
};
