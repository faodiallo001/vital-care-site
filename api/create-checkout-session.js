const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Method Not Allowed"
        });

    }

    try {

        const { priceId } = req.body;

        if (!priceId) {

            return res.status(400).json({
                message: "Missing Price ID."
            });

        }

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            payment_method_types: ["card"],

            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],

            success_url:
                "https://TON-DOMAINE.com/payment-success.html?session_id={CHECKOUT_SESSION_ID}",

            cancel_url:
                "https://TON-DOMAINE.com/book-online.html"

        });

        return res.status(200).json({

            url: session.url

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            message: err.message

        });

    }

}
