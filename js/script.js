fetch("components/header.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("header").innerHTML = data;
    });

fetch("components/footer.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("footer").innerHTML = data;
    });
document.addEventListener("DOMContentLoaded", () => {

    fetch("components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
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
