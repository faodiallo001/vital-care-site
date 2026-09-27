const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


/* ==========================================
   GET RAW BODY FOR STRIPE WEBHOOK
========================================== */

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


/* ==========================================
   SAVE ORDER TO SUPABASE
========================================== */

async function saveOrderToSupabase(session) {

    const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/orders`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "apikey":
                    process.env.SUPABASE_SERVICE_ROLE_KEY,

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

        const errorText =
            await response.text();

        /*
        Stripe may send the same webhook again.
        stripe_session_id is UNIQUE in Supabase.
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

    const order =
        await response.json();

    console.log(
        "✅ Order saved to Supabase:",
        order
    );
}


/* ==========================================
   SEND REGISTRATION EMAILS
========================================== */

async function sendRegistrationEmails(session) {

    const firstName =
        session.metadata?.firstName;

    const lastName =
        session.metadata?.lastName;

    const email =
        session.metadata?.email;

    const phone =
        session.metadata?.phone;

    const program =
        session.metadata?.program;

    const amount =
        `$${(session.amount_total / 100).toFixed(2)}`;


    /* ======================================
       EMAIL TO VITAL CARE
    ====================================== */

    const schoolResponse = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",

            headers: {

                "Authorization":
                    `Bearer ${process.env.RESEND_API_KEY}`,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                from:
                    "Vital Care Admissions <admissions@vitalcareah.com>",

                to: [
                    "faodiallo001@gmail.com"
                ],

                reply_to:
                    email,

                subject:
                    `New Student Registration – ${program}`,

                html: `
                <div style="
                    background:#f4f4f4;
                    padding:40px 20px;
                    font-family:Arial,sans-serif;
                    color:#222;
                ">

                    <div style="
                        max-width:600px;
                        margin:auto;
                        background:#ffffff;
                        padding:40px;
                        border-radius:12px;
                    ">

                        <h1 style="
                            font-size:24px;
                            margin-top:0;
                        ">
                            New Student Registration
                        </h1>

                        <p>
                            A student has successfully
                            completed their registration
                            payment.
                        </p>

                        <hr style="
                            border:none;
                            border-top:1px solid #eee;
                            margin:30px 0;
                        ">

                        <p>
                            <strong>Student Name</strong><br>
                            ${firstName} ${lastName}
                        </p>

                        <p>
                            <strong>Program</strong><br>
                            ${program}
                        </p>

                        <p>
                            <strong>Email</strong><br>
                            <a href="mailto:${email}">
                                ${email}
                            </a>
                        </p>

                        <p>
                            <strong>Phone Number</strong><br>
                            ${phone}
                        </p>

                        <p>
                            <strong>Registration Fee</strong><br>
                            ${amount}
                        </p>

                        <p>
                            <strong>Payment Status</strong><br>
                            Paid
                        </p>

                        <hr style="
                            border:none;
                            border-top:1px solid #eee;
                            margin:30px 0;
                        ">

                        <p style="
                            color:#777;
                            font-size:12px;
                        ">
                            Payment reference:<br>
                            ${session.id}
                        </p>

                    </div>

                </div>
                `
            })
        }
    );

    if (!schoolResponse.ok) {

        const error =
            await schoolResponse.text();

        throw new Error(
            `Resend school email error: ${error}`
        );
    }

    console.log(
        "✅ Admission notification sent to Vital Care"
    );


    /* ======================================
       CONFIRMATION EMAIL TO STUDENT
    ====================================== */

    const studentResponse = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",

            headers: {

                "Authorization":
                    `Bearer ${process.env.RESEND_API_KEY}`,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                from:
                    "Vital Care Admissions <admissions@vitalcareah.com>",

                to: [
                    email
                ],

                reply_to:
                    "faodiallo001@gmail.com",

                subject:
                    "Registration Confirmation – Vital Care Allied Health Training Institute",

                html: `
                <div style="
                    background:#f4f4f4;
                    padding:40px 20px;
                    font-family:Arial,sans-serif;
                    color:#222;
                ">

                    <div style="
                        max-width:600px;
                        margin:auto;
                        background:#ffffff;
                        padding:40px;
                        border-radius:12px;
                    ">

                        <h1 style="
                            font-size:26px;
                            margin-top:0;
                        ">
                            Registration Confirmed
                        </h1>

                        <p>
                            Dear ${firstName},
                        </p>

                        <p>
                            Thank you for registering with
                            <strong>
                                Vital Care Allied Health
                                Training Institute.
                            </strong>
                        </p>

                        <p>
                            Your registration fee has been
                            successfully received.
                        </p>

                        <div style="
                            background:#f8f6f0;
                            padding:22px;
                            border-radius:10px;
                            margin:25px 0;
                        ">

                            <p style="
                                margin-top:0;
                            ">
                                <strong>
                                    Program
                                </strong>
                            </p>

                            <p>
                                ${program}
                            </p>

                            <p>
                                <strong>
                                    Registration Fee
                                </strong>
                            </p>

                            <p style="
                                margin-bottom:0;
                            ">
                                ${amount}
                            </p>

                        </div>

                        <p>
                            Our admissions team will contact
                            you regarding class availability,
                            required documents, and your
                            preferred start date.
                        </p>

                        <p>
                            If you have any questions,
                            please contact our office at
                            <strong>
                                (631) 748-7598
                            </strong>.
                        </p>

                        <p style="
                            margin-top:35px;
                        ">
                            Thank you,<br><br>

                            <strong>
                                Vital Care Allied Health
                                Training Institute
                            </strong>
                        </p>

                    </div>

                </div>
                `
            })
        }
    );

    if (!studentResponse.ok) {

        const error =
            await studentResponse.text();

        throw new Error(
            `Resend student email error: ${error}`
        );
    }

    console.log(
        "✅ Confirmation email sent to student:",
        email
    );
}


/* ==========================================
   STRIPE WEBHOOK
========================================== */

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
                process.env.STRIPE_WEBHOOK_SECRET
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
                    "Student:",
                    `${session.metadata?.firstName} ${session.metadata?.lastName}`
                );

                console.log(
                    "Program:",
                    session.metadata?.program
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
                    "Amount:",
                    `$${(
                        session.amount_total / 100
                    ).toFixed(2)}`
                );


                if (
                    session.payment_status === "paid"
                ) {

                    /*
                    1. Save registration
                    */

                    await saveOrderToSupabase(
                        session
                    );


                    /*
                    2. Send both emails
                    */

                    await sendRegistrationEmails(
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
        Returning 500 tells Stripe that
        processing failed so it can retry.
        */

        return res
            .status(500)
            .json({
                error:
                    "Webhook processing failed."
            });
    }
};
