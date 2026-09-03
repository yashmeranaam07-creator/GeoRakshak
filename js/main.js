/* =========================================================
   GEORAKSHAK - MAIN JAVASCRIPT
   File: js/main.js

   Shared functionality for:
   - index.html
   - dashboard.html
   - alerts.html
   - map.html
   - reports.html
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. MOBILE NAVIGATION
    ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", () => {

            const isOpen = navLinks.classList.toggle("show");

            menuToggle.classList.toggle("active", isOpen);
            menuToggle.setAttribute("aria-expanded", isOpen);

        });


        // Close mobile menu when a navigation link is clicked
        navLinks.querySelectorAll(".nav-link").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("show");
                menuToggle.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");

            });

        });


        // Close mobile menu when clicking outside it
        document.addEventListener("click", (event) => {

            const clickedInsideNav = navLinks.contains(event.target);
            const clickedMenuButton = menuToggle.contains(event.target);

            if (!clickedInsideNav && !clickedMenuButton) {

                navLinks.classList.remove("show");
                menuToggle.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");

            }

        });


        // Close mobile menu when screen becomes desktop size
        window.addEventListener("resize", () => {

            if (window.innerWidth > 900) {

                navLinks.classList.remove("show");
                menuToggle.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");

            }

        });

    }


    /* =====================================================
       2. ACTIVE NAVIGATION LINK
    ===================================================== */

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-link").forEach(link => {

        const linkPage = link.getAttribute("href");

        if (
            linkPage === currentPage ||
            (currentPage === "index.html" && linkPage === "./") ||
            (currentPage === "" && linkPage === "index.html")
        ) {

            document.querySelectorAll(".nav-link").forEach(navLink => {
                navLink.classList.remove("active");
            });

            link.classList.add("active");

        }

    });


    /* =====================================================
       3. SMOOTH SCROLLING
       For links pointing to sections on the same page
    ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                event.preventDefault();

                const navbar = document.querySelector(".navbar");
                const navbarHeight = navbar
                    ? navbar.offsetHeight
                    : 0;

                const targetPosition =
                    targetElement.getBoundingClientRect().top +
                    window.pageYOffset -
                    navbarHeight -
                    15;

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });

            }

        });

    });


    /* =====================================================
       4. FAQ ACCORDION
       Expected structure:

       .faq-item
           .faq-question
           .faq-answer
    ===================================================== */

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {

        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");

        if (!question || !answer) {
            return;
        }


        question.addEventListener("click", () => {

            const isActive = item.classList.contains("active");


            // Close all other FAQs
            faqItems.forEach(otherItem => {

                if (otherItem !== item) {

                    otherItem.classList.remove("active");

                    const otherQuestion =
                        otherItem.querySelector(".faq-question");

                    if (otherQuestion) {
                        otherQuestion.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }

                }

            });


            // Toggle clicked FAQ
            item.classList.toggle("active", !isActive);

            question.setAttribute(
                "aria-expanded",
                String(!isActive)
            );

        });


        // Keyboard accessibility
        question.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();
                question.click();

            }

        });

    });


    /* =====================================================
       5. BUTTON RIPPLE EFFECT
       Automatically applies to all .btn elements
    ===================================================== */

    document.querySelectorAll(".btn").forEach(button => {

        button.addEventListener("click", function (event) {

            const ripple = document.createElement("span");

            const rect = this.getBoundingClientRect();

            const size = Math.max(
                rect.width,
                rect.height
            );

            ripple.className = "btn-ripple";

            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;

            ripple.style.left =
                `${event.clientX - rect.left - size / 2}px`;

            ripple.style.top =
                `${event.clientY - rect.top - size / 2}px`;


            // Remove old ripple if it exists
            const existingRipple =
                this.querySelector(".btn-ripple");

            if (existingRipple) {
                existingRipple.remove();
            }


            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 650);

        });

    });


    /* =====================================================
       6. SCROLL REVEAL ANIMATION
       Add class="reveal" to any element you want animated
    ===================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");

    if (
        revealElements.length > 0 &&
        "IntersectionObserver" in window
    ) {

        const revealObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add("visible");

                            observer.unobserve(entry.target);

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );


        revealElements.forEach(element => {
            revealObserver.observe(element);
        });

    } else {

        // Fallback for old browsers
        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    }


    /* =====================================================
       7. HEADER SHADOW ON SCROLL
    ===================================================== */

    const navbar = document.querySelector(".navbar");

    if (navbar) {

        const handleNavbarScroll = () => {

            if (window.scrollY > 10) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }

        };

        handleNavbarScroll();

        window.addEventListener(
            "scroll",
            handleNavbarScroll,
            { passive: true }
        );

    }


    /* =====================================================
       8. GENERIC TOAST NOTIFICATION SYSTEM

       Usage from any other JS file:

       showToast(
           "Report submitted successfully",
           "success"
       );

       Types:
       - success
       - error
       - warning
       - info
    ===================================================== */

    window.showToast = function (
        message,
        type = "info",
        duration = 3500
    ) {

        let toastContainer =
            document.querySelector(".toast-container");


        // Create container if it doesn't exist
        if (!toastContainer) {

            toastContainer =
                document.createElement("div");

            toastContainer.className =
                "toast-container";

            document.body.appendChild(toastContainer);

        }


        const icons = {
            success: "✓",
            error: "✕",
            warning: "!",
            info: "i"
        };


        const toast =
            document.createElement("div");

        toast.className =
            `toast toast-${type}`;


        toast.innerHTML = `
            <div class="toast-icon">
                ${icons[type] || icons.info}
            </div>

            <p>${message}</p>

            <button
                class="toast-close"
                type="button"
                aria-label="Close notification"
            >
                ×
            </button>
        `;


        toastContainer.appendChild(toast);


        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });


        const closeToast = () => {

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();

                if (
                    toastContainer.children.length === 0
                ) {
                    toastContainer.remove();
                }

            }, 300);

        };


        const timeout = setTimeout(
            closeToast,
            duration
        );


        toast.querySelector(".toast-close")
            .addEventListener("click", () => {

                clearTimeout(timeout);
                closeToast();

            });

    };


    /* =====================================================
       9. PREVENT DOUBLE FORM SUBMISSIONS

       Any form with:
       class="prevent-double-submit"
    ===================================================== */

    document
        .querySelectorAll(".prevent-double-submit")
        .forEach(form => {

            form.addEventListener("submit", event => {

                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (!submitButton) {
                    return;
                }


                if (
                    submitButton.dataset.submitting === "true"
                ) {

                    event.preventDefault();
                    return;

                }


                submitButton.dataset.submitting = "true";


                setTimeout(() => {

                    submitButton.dataset.submitting = "false";

                }, 2500);

            });

        });


    /* =====================================================
       10. EXTERNAL LINK SAFETY
    ===================================================== */

    document
        .querySelectorAll(
            'a[target="_blank"]'
        )
        .forEach(link => {

            if (!link.rel.includes("noopener")) {

                link.rel =
                    `${link.rel} noopener noreferrer`.trim();

            }

        });


    /* =====================================================
       MAIN.JS READY
    ===================================================== */

    console.log(
        "%cGeoRakshak System Ready",
        "color: #1f6f50; font-weight: bold; font-size: 13px;"
    );

});