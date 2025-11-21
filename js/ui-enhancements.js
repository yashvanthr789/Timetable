/* ======================================================
   UI Enhancements (SAFE, OPTIMIZED VERSION)
   No infinite loops, no heavy observers
   ====================================================== */

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {

    initDarkModeToggle();
    initFAB();
    initBreadcrumbs();
    initContentAnimations();
    initProfileDropdown();

});

/* ======================================================
   A) DARK MODE TOGGLE
   ====================================================== */

function initDarkModeToggle() {
    const toggleBtn = document.getElementById("darkModeToggle");
    if (!toggleBtn) return;

    // Load saved mode
    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark-mode");
        toggleBtn.classList.add("active");
    }

    toggleBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");

        if (document.documentElement.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
            toggleBtn.classList.add("active");
        } else {
            localStorage.setItem("theme", "light");
            toggleBtn.classList.remove("active");
        }
    });
}

/* ======================================================
   B) FLOATING ACTION BUTTON (FAB)
   ====================================================== */

function initFAB() {
    const fab = document.getElementById("mainFAB");
    const fabMenu = document.getElementById("fabMenu");

    if (!fab || !fabMenu) return;

    fab.addEventListener("click", () => {
        fabMenu.classList.toggle("active");
    });

    // Auto-close FAB when clicking outside
    document.addEventListener("click", (e) => {
        if (!fab.contains(e.target) && !fabMenu.contains(e.target)) {
            fabMenu.classList.remove("active");
        }
    });

    // Show options based on user role
    const role = localStorage.getItem("user_role");

    document.querySelectorAll("[data-role]").forEach(item => {
        const roles = item.dataset.role.split(",");
        item.style.display = roles.includes(role) ? "flex" : "none";
    });
}

/* ======================================================
   C) BREADCRUMB BAR (SAFE OBSERVER VERSION)
   ====================================================== */

function initBreadcrumbs() {
    const breadcrumb = document.getElementById("breadcrumb");
    if (!breadcrumb) return;

    const sections = document.querySelectorAll(".content-section");

    function updateBreadcrumb() {
        sections.forEach(section => {
            if (section.classList.contains("active")) {
                breadcrumb.textContent = section.dataset.title || "Home";
            }
        });
    }

    // Run once at start
    updateBreadcrumb();

    // SAFE MutationObserver
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.target.classList.contains("content-section")) {
                updateBreadcrumb();
                break;
            }
        }
    });

    // Observe ONLY real content sections (not whole page!)
    sections.forEach(section => {
        observer.observe(section, {
            attributes: true,
            attributeFilter: ["class"]
        });
    });
}

/* ======================================================
   D) CONTENT ANIMATIONS (NO LOOPS)
   ====================================================== */

function initContentAnimations() {
    const sections = document.querySelectorAll(".content-section");
    if (!sections.length) return;

    sections.forEach(section => {
        // Add animation only when section becomes active
        let isAnimating = false;
        const observer = new MutationObserver((mutations) => {
            if (section.classList.contains("active") && !isAnimating) {
                isAnimating = true;
                section.classList.add("fade-in");
                setTimeout(() => {
                    section.classList.remove("fade-in");
                    isAnimating = false;
                }, 400);
            }
        });

        // Observe ONLY this section — not full DOM
        observer.observe(section, {
            attributes: true,
            attributeFilter: ["class"]
        });
    });
}

/* ======================================================
   E) PROFILE DROPDOWN
   ====================================================== */

function initProfileDropdown() {
    const profileTrigger = document.getElementById("profileTrigger");
    const profileMenu = document.getElementById("profileMenu");
    
    if (!profileTrigger || !profileMenu) return;

    // Toggle on click
    profileTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("active");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!profileTrigger.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });

    // Close on ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            profileMenu.classList.remove("active");
        }
    });

    // Handle profile logout button
    const profileLogout = document.getElementById("profileLogout");
    if (profileLogout) {
        profileLogout.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }
}

/* ======================================================
   F) MICRO-INTERACTIONS (Lightweight, No Loops)
   ====================================================== */

document.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("card")) {
        e.target.classList.add("hover-card");
    }
});

document.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("card")) {
        e.target.classList.remove("hover-card");
    }
});

// Ripple effect for buttons
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const ripple = document.createElement("span");
    ripple.classList.add("ripple");

    const rect = btn.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;

    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 500);
});
