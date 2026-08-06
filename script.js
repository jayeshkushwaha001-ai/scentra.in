// =========================================================
// 1. GLOBAL CART COUNT FUNCTION
// =========================================================
window.updateCartCount = function () {
    try {
        const cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
        const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
        document.querySelectorAll(".cart-count").forEach(el => {
            el.innerText = totalCount;
        });
    } catch (e) {
        console.error("Cart count error:", e);
    }
};

// =========================================================
// 2. GLOBAL CATEGORY FILTER FUNCTION
// =========================================================
function filterCollectionProducts(selectedFilter) {
    const collectionCards = document.querySelectorAll('#collectionGrid .product-card');
    const filterVal = selectedFilter.toLowerCase().trim();

    collectionCards.forEach(card => {
        const rawGender = card.getAttribute('data-gender') || '';
        
       
        const genderList = rawGender.split(',').map(g => g.toLowerCase().trim());

        if (filterVal === 'all' || genderList.includes(filterVal)) {
            card.style.display = ''; // Show
        } else {
            card.style.display = 'none'; // Hide
        }
    });
}

// =========================================================
// 3. MAIN EXECUTION ENGINE
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    window.updateCartCount();
    initScrollReveal();

    const SHEET_ID = "1XKKuji-6BL14nwEtnv99MIJEppxC_ny8OPVokRKzBNY";
    const GVIZ_INSTA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Instagram`;
    const GVIZ_PRODUCTS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Products`;
    const DEFAULT_INSTA_PAGE = "https://www.instagram.com/scentra.in/";

    // ⚡ FAILSAFE PRODUCTS DATASET
    const SYSTEM_FALLBACK_PRODUCTS = [
        { id: "1", name: "Velvet Amber", category: "Bestseller Collection", price_30ml: "1299", price_50ml: "1899", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500", gender: "unisex" },
        { id: "2", name: "Oud Royale", category: "Attars Collection", price_30ml: "1499", price_50ml: "2199", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500", gender: "men" },
        { id: "3", name: "Mystic Rose", category: "New Arrival", price_30ml: "1199", price_50ml: "1699", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500", gender: "women" },
        { id: "4", name: "Luxury Gift Set", category: "Gifting Collection", price_30ml: "2499", price_50ml: "3499", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500", gender: "unisex" }
    ];

    /* --- MOBILE DRAWER NAVIGATION --- */
    const menuToggle = document.getElementById("menuToggle");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const closeDrawer = document.getElementById("closeDrawer");
    const drawerOverlay = document.querySelector(".drawer-overlay");
    const drawerLinks = document.querySelectorAll(".drawer-links a");
    let isDrawerOpen = false;

    const openMenu = () => {
        if (isDrawerOpen) return;
        isDrawerOpen = true;
        mobileDrawer?.classList.add("active");
        drawerOverlay?.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
        if (!isDrawerOpen) return;
        isDrawerOpen = false;
        mobileDrawer?.classList.remove("active");
        drawerOverlay?.classList.remove("active");
        document.body.style.overflow = "";
    };

    menuToggle?.addEventListener("click", openMenu);
    closeDrawer?.addEventListener("click", closeMenu);
    drawerOverlay?.addEventListener("click", closeMenu);
    drawerLinks.forEach((link) => link.addEventListener("click", closeMenu));

    /* --- NAVBAR SCROLL --- */
    const navbar = document.getElementById("navbar");
    if (navbar) {
        window.addEventListener("scroll", () => {
            navbar.classList.toggle("scrolled", window.scrollY > 20);
        }, { passive: true });
    }

    /* --- SCROLL REVEAL UNLOCKER --- */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll(".scroll-reveal");
        revealElements.forEach(el => el.classList.add("visible"));
    }

    /* --- CARD GENERATOR (FIXED: DATA-GENDER ATTRIBUTE ADDED) --- */
    function createProductCard(product) {
        const startPrice = product.price_30ml || product.price_50ml || "0";
        const genderVal = (product.gender || "").toString().toLowerCase().trim();

        return `
            <div class="product-card" data-gender="${genderVal}" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <div class="product-thumb">
                    <img src="${product.image || ''}" alt="${product.name || 'Product'}" loading="lazy">
                </div>
                <div class="product-info-outside">
                    <h3 class="product-title">${product.name || ''}</h3>
                    <p class="product-category">${product.category || ''}</p>
                    <p class="product-price-outside">₹${Number(startPrice).toLocaleString('en-IN')}</p>
                </div>
            </div>
        `;
    }

    /* --- STRICT CATEGORY FILTERING --- */
    function renderProducts(products) {
        if (!Array.isArray(products) || products.length === 0) return;

        const categoriesMap = {
            'collection': document.getElementById('collectionGrid'),
            'bestseller': document.getElementById('bestsellerGrid'),
            'newarrival': document.getElementById('newArrivalsGrid'),
            'attar': document.getElementById('attarsGrid'),
            'gifting': document.getElementById('giftingGrid')
        };

        Object.values(categoriesMap).forEach(grid => {
            if (grid) grid.innerHTML = '';
        });

        products.forEach(product => {
            if (!product.category) return;
            const catLower = String(product.category).toLowerCase().trim();

            if (catLower.includes('bestseller') || catLower.includes('best seller')) {
                if (categoriesMap['bestseller']) categoriesMap['bestseller'].innerHTML += createProductCard(product);
            } 
            else if (catLower.includes('attar')) {
                if (categoriesMap['attar']) categoriesMap['attar'].innerHTML += createProductCard(product);
            } 
            else if (catLower.includes('new arrival') || catLower.includes('newarrival')) {
                if (categoriesMap['newarrival']) categoriesMap['newarrival'].innerHTML += createProductCard(product);
            } 
            else if (catLower.includes('gift') || catLower.includes('gifting')) {
                if (categoriesMap['gifting']) categoriesMap['gifting'].innerHTML += createProductCard(product);
            } 
            else {
                if (categoriesMap['collection']) categoriesMap['collection'].innerHTML += createProductCard(product);
            }
        });

        // Re-apply current select filter after dynamic DOM injection
        const selectEl = document.getElementById("categorySelect");
        if (selectEl) {
            filterCollectionProducts(selectEl.value);
        }
    }

    /* --- INSTA FEED RENDERER --- */
    function renderInstaFeed(feed) {
        const instaGrid = document.getElementById("instaGrid");
        if (!instaGrid || !Array.isArray(feed)) return;

        instaGrid.innerHTML = '';

        const validItems = feed.filter(item => {
            if (!item || !item.image_url) return false;
            const str = String(item.image_url).trim();
            return str.length > 10 && str.startsWith("http");
        });

        if (validItems.length === 0) return;

        let cardsHtml = '';
        validItems.forEach(item => {
            const imgUrl = String(item.image_url).trim();
            let postUrl = item.post_url ? String(item.post_url).trim() : DEFAULT_INSTA_PAGE;

            if (postUrl && !postUrl.startsWith("http://") && !postUrl.startsWith("https://")) {
                postUrl = "https://" + postUrl;
            }

            const finalRedirectUrl = (postUrl && postUrl !== "https://") ? postUrl : DEFAULT_INSTA_PAGE;

            cardsHtml += `
                <a href="${finalRedirectUrl}" target="_blank" rel="noopener noreferrer" class="insta-item">
                    <img src="${imgUrl}" alt="Instagram Post" loading="lazy">
                    <div class="insta-overlay">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </div>
                </a>
            `;
        });

        instaGrid.innerHTML = cardsHtml;
    }

    /* --- STEP A: INSTANT LOAD FROM CACHE --- */
    const cachedCatalog = localStorage.getItem("scentra_catalog");
    if (cachedCatalog) {
        try {
            const parsed = JSON.parse(cachedCatalog);
            if (Array.isArray(parsed) && parsed.length > 0) renderProducts(parsed);
            else renderProducts(SYSTEM_FALLBACK_PRODUCTS);
        } catch (e) {
            renderProducts(SYSTEM_FALLBACK_PRODUCTS);
        }
    } else {
        renderProducts(SYSTEM_FALLBACK_PRODUCTS);
    }

    const cachedInsta = localStorage.getItem("scentra_insta_cache");
    if (cachedInsta) {
        try {
            const parsedInsta = JSON.parse(cachedInsta);
            if (Array.isArray(parsedInsta) && parsedInsta.length > 0) renderInstaFeed(parsedInsta);
        } catch (e) {}
    }

    /* --- STEP B: LIVE DIRECT GVIZ DATA FETCH --- */
    async function loadLiveData() {
        try {
            const resProd = await fetch(GVIZ_PRODUCTS_URL);
            const textProd = await resProd.text();
            if (textProd.includes("google.visualization.Query.setResponse")) {
                const jsonProd = JSON.parse(textProd.substring(47, textProd.length - 2));
                const colsProd = jsonProd.table.cols.map(c => (c.label || c.id || "").toLowerCase().trim());

                const productsData = jsonProd.table.rows.map(row => {
                    let obj = {};
                    if (row.c) {
                        row.c.forEach((cell, idx) => {
                            const header = colsProd[idx];
                            if (header) obj[header] = (cell && cell.v !== null && cell.v !== undefined) ? cell.v : "";
                        });
                    }
                    return obj;
                });

                if (productsData.length > 0) {
                    localStorage.setItem("scentra_catalog", JSON.stringify(productsData));
                    renderProducts(productsData);
                }
            }
        } catch (err) {
            console.warn("Products Fetch Warning:", err.message);
        }

        try {
            const resInsta = await fetch(GVIZ_INSTA_URL);
            const textInsta = await resInsta.text();
            if (textInsta.includes("google.visualization.Query.setResponse")) {
                const jsonInsta = JSON.parse(textInsta.substring(47, textInsta.length - 2));
                const rowsInsta = jsonInsta.table.rows || [];

                const instaData = rowsInsta
                    .map(row => {
                        const img = (row.c && row.c[0] && row.c[0].v) ? String(row.c[0].v).trim() : "";
                        const link = (row.c && row.c[1] && row.c[1].v) ? String(row.c[1].v).trim() : DEFAULT_INSTA_PAGE;
                        return { image_url: img, post_url: link };
                    })
                    .filter(item => item.image_url.length > 10 && item.image_url.startsWith("http"));

                if (instaData.length > 0) {
                    localStorage.setItem("scentra_insta_cache", JSON.stringify(instaData));
                    renderInstaFeed(instaData);
                }
            }
        } catch (err) {
            console.warn("Insta Fetch Warning:", err.message);
        }
    }

    loadLiveData();
});
