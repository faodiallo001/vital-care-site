const counters = document.querySelectorAll(".stat-number");

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            const counter = entry.target;
            const target = +counter.dataset.target;

            let current = 0;

            const increment = target / 50;

            const updateCounter = () => {

                current += increment;

                if(current < target){

                    counter.textContent = Math.ceil(current);

                    requestAnimationFrame(updateCounter);

                }else{

                    if(target === 60){
                        counter.textContent = "60+";
                    }

                    else if(target === 100){
                        counter.textContent = "100%";
                    }

                    else{
                        counter.textContent = target;
                    }

                }

            };

            updateCounter();

            observer.unobserve(counter);

        }

    });

},{
    threshold:0.5
});

counters.forEach(counter => {
    observer.observe(counter);
});
