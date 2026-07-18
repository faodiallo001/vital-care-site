
document.addEventListener("DOMContentLoaded", () => {

    fetch("components/header.html")
    .then(response => response.text())
    .then(data => {

        document.getElementById("header").innerHTML = data;

        const menuToggle = document.getElementById("menuToggle");
        const mobileMenu = document.getElementById("mobileMenu");

        if(menuToggle && mobileMenu){

            menuToggle.addEventListener("click", () => {
                mobileMenu.classList.toggle("active");
            });

        }

    });

    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });

    const counters = document.querySelectorAll(".stat-number");

    const startCounter = (counter) => {
        const target = Number(counter.getAttribute("data-target"));
        const suffix = counter.getAttribute("data-suffix") || "";

        let current = 0;
        const speed = 40;
        const increment = target / speed;

        const update = () => {
            current += increment;

            if (current < target) {
                counter.textContent = Math.ceil(current) + suffix;
                requestAnimationFrame(update);
            } else {
                counter.textContent = target + suffix;
            }
        };

        update();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3
    });

    counters.forEach(counter => {
        observer.observe(counter);
    });

});


async function payRegistration(priceId){

    try{

        const response = await fetch("/api/create-checkout-session",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                priceId
            })

        });

        const data = await response.json();

        if(data.url){

            window.location.href = data.url;

        }else{

            alert(data.message || "Unable to start payment.");

        }

    }catch(error){

        console.error(error);

        alert("Something went wrong. Please try again.");

    }

}


/* ===================================
   REGISTRATION PAGE
=================================== */

if (window.location.pathname.includes("registration.html")) {

    const programs = {

        cna: {
            name: "Certified Nursing Assistant (CNA)",
            price: "$65",
            priceId: "price_1TuaB9K5NPnHKPxJiuOAyV2g"
        },

        hha: {
            name: "Home Health Aide (HHA)",
            price: "$49",
            priceId: "price_1TuaBeK5NPnHKPxJa9WzAEeM"
        },

        transition: {
            name: "CNA to HHA Transition",
            price: "$39",
            priceId: "price_1TuaC9K5NPnHKPxJcWZTxvFc"
        }

    };

    const params = new URLSearchParams(window.location.search);

    const selectedProgram = params.get("program") || "cna";

    const current = programs[selectedProgram];

    document.getElementById("programName").textContent = current.name;
    document.getElementById("programPrice").textContent = current.price;

    document
        .getElementById("continuePayment")
        .addEventListener("click", async function () {

            const firstName = document
                .getElementById("firstName")
                .value
                .trim();

            const lastName = document
                .getElementById("lastName")
                .value
                .trim();

            const email = document
                .getElementById("email")
                .value
                .trim();

            const phone = document
                .getElementById("phone")
                .value
                .trim();

            const confirmed = document
                .getElementById("confirmInfo")
                .checked;

            if (
                !firstName ||
                !lastName ||
                !email ||
                !phone
            ) {

                alert("Please complete all required fields.");

                return;

            }

            if (!confirmed) {

                alert("Please confirm your information before continuing.");

                return;

            }

            try {

                const response = await fetch("/api/create-checkout-session", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        firstName,
                        lastName,
                        email,
                        phone,

                        program: current.name,

                        priceId: current.priceId

                    })

                });

                const session = await response.json();

                if (session.url) {

                    window.location.href = session.url;

                } else {

                    alert("Unable to start secure payment.");

                }

            } catch (error) {

                console.error(error);

                alert("Something went wrong. Please try again.");

            }

        });

}
