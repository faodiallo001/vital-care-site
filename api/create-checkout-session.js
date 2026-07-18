const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Method Not Allowed"
        });

    }

    try {

        const {

            priceId,
            firstName,
            lastName,
            email,
            phone,
            program

        } = req.body;

        if (
            !priceId ||
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !program
        ) {

            return res.status(400).json({
                message: "Missing required information."
            });

        }

        const session = await stripe.checkout.sessions.create({

            mode: "payment",

            allow_promotion_codes: true,

            payment_method_types: ["card"],

            customer_email: email,

            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],

            metadata: {

                firstName,
                lastName,
                email,
                phone,
                program

            },

            success_url:
                "https://www.vitalcareah.com/success.html?session_id={CHECKOUT_SESSION_ID}",

            cancel_url:
                "https://www.vitalcareah.com/cancel.html"

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
