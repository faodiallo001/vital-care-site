
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
