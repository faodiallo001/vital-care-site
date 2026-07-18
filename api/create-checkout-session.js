const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const prices = {

    cna: "price_1TuaB9K5NPnHKPxJiuOAyV2g",

    hha: "price_1TuaBeK5NPnHKPxJa9WzAEeM",

    transition: "price_1TuaC9K5NPnHKPxJcWZTxvFc"

};

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Method Not Allowed"
        });

    }

    try {

        const { program } = req.body;

        const price = prices[program];

        if (!price) {

            return res.status(400).json({
                message: "Invalid program."
            });

        }

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            payment_method_types: ["card"],

            line_items: [

                {

                    price,

                    quantity: 1

                }

            ],

            success_url:
                "https://vital-care-site.vercel.app/payment-success.html?session_id={CHECKOUT_SESSION_ID}",

            cancel_url:
                "https://vital-care-site.vercel.app/programs.html"

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

};
