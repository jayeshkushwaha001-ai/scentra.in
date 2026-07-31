document.addEventListener("DOMContentLoaded", () => {
    /* =========================================================
       1. MOBILE DRAWER NAVIGATION & BACKDROP OVERLAY
       ========================================================= */
    const menuToggle = document.getElementById("menuToggle");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const closeDrawer = document.getElementById("closeDrawer");
    const drawerOverlay = document.getElementById("drawerOverlay") || document.querySelector(".drawer-overlay");
    const drawerLinks = document.querySelectorAll(".drawer-links a");

    let isDrawerOpen = false;

    const openMenu = () => {
        if (isDrawerOpen) return;
        isDrawerOpen = true;

        if (mobileDrawer) mobileDrawer.classList.add("active");
        if (drawerOverlay) drawerOverlay.classList.add("active");
        document.body.style.overflow = "hidden"; // Stop background scroll
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");

        // Push a state into browser history so back button closes drawer
        history.pushState({ drawerOpen: true }, "");
    };

    const closeMenu = (fromPopState = false) => {
        if (!isDrawerOpen) return;
        isDrawerOpen = false;

        if (mobileDrawer) mobileDrawer.classList.remove("active");
        if (drawerOverlay) drawerOverlay.classList.remove("active");
        document.body.style.overflow = ""; // Restore background scroll
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");

        // If closed manually (x button, backdrop, link click), remove the pushed state from history
        if (!fromPopState && history.state && history.state.drawerOpen) {
            history.back();
        }
    };

    if (menuToggle) menuToggle.addEventListener("click", openMenu);
    if (closeDrawer) closeDrawer.addEventListener("click", () => closeMenu(false));
    if (drawerOverlay) drawerOverlay.addEventListener("click", () => closeMenu(false));

    drawerLinks.forEach((link) => {
        link.addEventListener("click", () => closeMenu(false));
    });

    // Handle Phone/Browser Hardware Back Button Press
    window.addEventListener("popstate", (e) => {
        if (isDrawerOpen) {
            closeMenu(true);
        }
    });

    // Close mobile drawer on pressing Keyboard Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isDrawerOpen) {
            closeMenu(false);
        }
    });

    /* =========================================================
       2. NAVBAR SCROLL BEHAVIOR
       ========================================================= */
    const navbar = document.getElementById("navbar");

    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
    }

    /* =========================================================
       3. SCROLL REVEAL ANIMATIONS
       ========================================================= */
    const revealElements = document.querySelectorAll(".scroll-reveal");

    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        revealElements.forEach((el) => revealObserver.observe(el));
    }

    /* =========================================================
       4. AMBIENT RAIN CANVAS ANIMATION
       ========================================================= */
    const canvas = document.getElementById("rainCanvas");

    if (canvas) {
        const ctx = canvas.getContext("2d");
        let width = 0;
        let height = 0;

        const resizeCanvas = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas, { passive: true });

        const rainDropCount = 80;
        const drops = [];

        for (let i = 0; i < rainDropCount; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 3.5 + 2,
                opacity: Math.random() * 0.3 + 0.1,
            });
        }

        function drawRain() {
            ctx.clearRect(0, 0, width, height);

            drops.forEach((drop) => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.strokeStyle = `rgba(223, 184, 108, ${drop.opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                drop.y += drop.speed;

                if (drop.y > height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * width;
                }
            });

            requestAnimationFrame(drawRain);
        }

        drawRain();
    }
});
