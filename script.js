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
window.filterCollectionProducts = function (selectedFilter) {
    const mainGrid = document.getElementById('collectionGrid') || document.getElementById('productsGrid') || document.getElementById('productGrid');
    if (!mainGrid) return;
    const collectionCards = mainGrid.querySelectorAll('.product-card');
    if (!collectionCards.length) return;

    const filterVal = (selectedFilter || 'all').toLowerCase().trim();

    collectionCards.forEach(card => {
        const rawGender = card.getAttribute('data-gender') || '';
        const genderList = rawGender.split(',').map(g => g.toLowerCase().trim());

        if (filterVal === 'all' || genderList.includes(filterVal)) {
            card.style.display = ''; // Show
        } else {
            card.style.display = 'none'; // Hide
        }
    });
};

// =========================================================
// 3. MAIN EXECUTION ENGINE
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Initial setup
    window.updateCartCount();
    initScrollReveal();

    const SHEET_ID = "1XKKuji-6BL14nwEtnv99MIJEppxC_ny8OPVokRKzBNY";
    const GVIZ_INSTA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Instagram`;
    const GVIZ_PRODUCTS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Products`;
    const DEFAULT_INSTA_PAGE = "https://www.instagram.com/scentra.in/";

    // ⚡ FAILSAFE PRODUCTS DATASET (Includes Solid Perfume)
    const SYSTEM_FALLBACK_PRODUCTS = [
        { id: "1", name: "Velvet Amber", category: "Bestseller Collection", price_30ml: "1299", price_50ml: "1899", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500", gender: "unisex" },
        { id: "2", name: "Oud Royale", category: "Attars Collection", price_30ml: "1499", price_50ml: "2199", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500", gender: "men" },
        { id: "3", name: "Mystic Rose", category: "New Arrival", price_30ml: "1199", price_50ml: "1699", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500", gender: "women" },
        { id: "4", name: "Luxury Gift Set", category: "Gifting Collection", price_30ml: "2499", price_50ml: "3499", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500", gender: "unisex" },
        { id: "5", name: "Solid Musk Balm", category: "Solid Perfumes", price_30ml: "899", price_50ml: "1299", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500", gender: "unisex" }
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

    /* --- PRICE FORMATTER HELPER --- */
    function formatPrice(val) {
        const num = Number(val);
        return isNaN(num) ? (val || "0") : num.toLocaleString('en-IN');
    }

    /* --- SAFE GVIZ JSON PARSER --- */
    function parseGVizResponse(text) {
        try {
            const start = text.indexOf("(");
            const end = text.lastIndexOf(")");
            if (start !== -1 && end !== -1 && end > start) {
                const jsonString = text.substring(start + 1, end);
                return JSON.parse(jsonString);
            }
        } catch (e) {
            console.error("GViz parse error:", e);
        }
        return null;
    }

    /* --- EXTRACT AND NORMALIZE GOOGLE SHEETS DATA --- */
    function extractSheetProducts(json) {
        if (!json || !json.table) return [];

        let cols = json.table.cols.map(c => (c.label || c.id || "").toLowerCase().trim());
        let rows = json.table.rows || [];

        // Check if cols are generic (like 'a', 'b', 'c') and row 0 contains actual headers
        const isGenericCols = cols.every(c => !c || c.length <= 2);
        if (isGenericCols && rows.length > 0) {
            const firstRowCells = rows[0].c || [];
            const possibleHeaders = firstRowCells.map(cell => (cell && cell.v !== null) ? String(cell.v).toLowerCase().trim() : "");
            if (possibleHeaders.some(h => h.includes("name") || h.includes("title") || h.includes("price") || h.includes("category"))) {
                cols = possibleHeaders;
                rows = rows.slice(1);
            }
        }

        return rows.map((row, rowIndex) => {
            let obj = {};
            if (row.c) {
                row.c.forEach((cell, idx) => {
                    const header = cols[idx] || `col_${idx}`;
                    obj[header] = (cell && cell.v !== null && cell.v !== undefined) ? cell.v : "";
                });
            }

            // Key Normalization Helper
            const getVal = (...keys) => {
                for (let k of keys) {
                    for (let objKey in obj) {
                        const cleanObjKey = objKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const cleanTarget = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (cleanObjKey === cleanTarget && obj[objKey] !== undefined && obj[objKey] !== "") {
                            return obj[objKey];
                        }
                    }
                }
                return "";
            };

            return {
                id: String(getVal("id", "product_id", "productid") || (rowIndex + 1)),
                name: String(getVal("name", "product_name", "productname", "title", "item_name")),
                category: String(getVal("category", "cat", "collection")),
                price_30ml: getVal("price_30ml", "price30ml", "30ml", "price_30_ml"),
                price_50ml: getVal("price_50ml", "price50ml", "50ml", "price_50_ml"),
                price_100ml: getVal("price_100ml", "price100ml", "100ml", "price_100_ml"),
                price: getVal("price", "mrp", "rate", "cost"),
                image: String(getVal("image", "image_url", "imageurl", "img", "photo", "thumb")),
                gender: String(getVal("gender", "type", "for")),
                status: String(getVal("status", "stock", "stock_status", "availability")),
                description: String(getVal("description", "desc", "details"))
            };
        }).filter(p => p.name || p.image); // filter empty rows
    }

    /* --- CARD GENERATOR (WITH OUT OF STOCK BADGE) --- */
    function createProductCard(product) {
        const startPrice = product.price_30ml || product.price_50ml || product.price_100ml || product.price || "0";
        const genderVal = (product.gender || "").toString().toLowerCase().trim();

        // Check Stock Status
        const stockStatus = String(product.status || product.stock || '').toLowerCase().trim();
        const isOutOfStock = stockStatus.includes('out of stock') || stockStatus === 'out' || stockStatus === 'false' || stockStatus === '0';

        const stockBadge = isOutOfStock ? `<span class="out-of-stock-badge">Out of Stock</span>` : ``;

        return `
        <div class="product-card ${isOutOfStock ? 'card-out-of-stock' : ''}" data-gender="${genderVal}" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <div class="product-thumb">
                ${stockBadge}
                <img src="${product.image || ''}" alt="${product.name || 'Product'}" loading="lazy">
            </div>
            <div class="product-info-outside">
                <h3 class="product-title">${product.name || ''}</h3>
                <p class="product-category">${product.category || ''}</p>
                <p class="product-price-outside">₹${formatPrice(startPrice)}</p>
            </div>
        </div>
    `;
    }

    /* --- STRICT CATEGORY FILTERING & RENDERING --- */
    function renderProducts(products) {
        if (!Array.isArray(products) || products.length === 0) return;

        const categoriesMap = {
            'collection': document.getElementById('collectionGrid') || document.getElementById('productsGrid') || document.getElementById('productGrid'),
            'bestseller': document.getElementById('bestsellerGrid'),
            'newarrival': document.getElementById('newArrivalsGrid'),
            'attar': document.getElementById('attarsGrid'),
            'gifting': document.getElementById('giftingGrid'),
            'solidperfume': document.getElementById('solidPerfumesGrid') || document.getElementById('solidPerfumeGrid')
        };

        // Clear existing grid contents
        Object.values(categoriesMap).forEach(grid => {
            if (grid) grid.innerHTML = '';
        });

        products.forEach(product => {
            const cardHtml = createProductCard(product);

            // Populate main collection grid
            if (categoriesMap['collection']) {
                categoriesMap['collection'].innerHTML += cardHtml;
            }

            if (!product.category) return;
            const catLower = String(product.category).toLowerCase().trim();

            if (catLower.includes('bestseller') || catLower.includes('best seller')) {
                if (categoriesMap['bestseller']) categoriesMap['bestseller'].innerHTML += cardHtml;
            }
            if (catLower.includes('attar')) {
                if (categoriesMap['attar']) categoriesMap['attar'].innerHTML += cardHtml;
            }
            if (catLower.includes('solid perfume') || catLower.includes('solidperfume') || catLower.includes('solid')) {
                if (categoriesMap['solidperfume']) categoriesMap['solidperfume'].innerHTML += cardHtml;
            }
            if (catLower.includes('new arrival') || catLower.includes('newarrival') || catLower.includes('new')) {
                if (categoriesMap['newarrival']) categoriesMap['newarrival'].innerHTML += cardHtml;
            }
            if (catLower.includes('gift') || catLower.includes('gifting')) {
                if (categoriesMap['gifting']) categoriesMap['gifting'].innerHTML += cardHtml;
            }
        });

        // Re-apply current select filter if categorySelect dropdown exists
        const selectEl = document.getElementById("categorySelect");
        if (selectEl) {
            window.filterCollectionProducts(selectEl.value);
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

    /* --- STEP A: INSTANT LOAD FROM CACHE OR FALLBACK --- */
    const cachedCatalog = localStorage.getItem("scentra_catalog");
    let isCatalogLoaded = false;
    if (cachedCatalog) {
        try {
            const parsed = JSON.parse(cachedCatalog);
            if (Array.isArray(parsed) && parsed.length > 0) {
                renderProducts(parsed);
                isCatalogLoaded = true;
            }
        } catch (e) { }
    }

    if (!isCatalogLoaded) {
        renderProducts(SYSTEM_FALLBACK_PRODUCTS);
    }

    const cachedInsta = localStorage.getItem("scentra_insta_cache");
    if (cachedInsta) {
        try {
            const parsedInsta = JSON.parse(cachedInsta);
            if (Array.isArray(parsedInsta) && parsedInsta.length > 0) renderInstaFeed(parsedInsta);
        } catch (e) { }
    }

    /* --- STEP B: LIVE DIRECT GVIZ DATA FETCH --- */
    async function loadLiveData() {
        try {
            const resProd = await fetch(GVIZ_PRODUCTS_URL);
            const textProd = await resProd.text();
            const jsonProd = parseGVizResponse(textProd);

            if (jsonProd) {
                const productsData = extractSheetProducts(jsonProd);
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
            const jsonInsta = parseGVizResponse(textInsta);

            if (jsonInsta && jsonInsta.table) {
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

    /* ==========================================
       LIVE SEARCH FUNCTIONALITY
       ========================================== */
    const searchBtn = document.getElementById("searchBtn");
    const searchModal = document.getElementById("searchModal");
    const closeSearchBtn = document.getElementById("closeSearchBtn");
    const searchInput = document.getElementById("searchInput");
    const searchResultsGrid = document.getElementById("searchResultsGrid");

    // Open Modal
    searchBtn?.addEventListener("click", () => {
        searchModal?.classList.add("active");
        setTimeout(() => searchInput?.focus(), 100);
    });

    // Close Modal Function
    function closeSearch() {
        searchModal?.classList.remove("active");
        if (searchInput) searchInput.value = "";
        if (searchResultsGrid) searchResultsGrid.innerHTML = '<p class="search-placeholder-text">Type to search fragrances...</p>';
    }

    closeSearchBtn?.addEventListener("click", closeSearch);

    // Close on Outside Click / ESC key
    searchModal?.addEventListener("click", (e) => {
        if (e.target === searchModal) closeSearch();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && searchModal?.classList.contains("active")) {
            closeSearch();
        }
    });

    // Real-time Search Input Listener
    searchInput?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            if (searchResultsGrid) searchResultsGrid.innerHTML = '<p class="search-placeholder-text">Type to search fragrances...</p>';
            return;
        }

        const storedCatalog = localStorage.getItem("scentra_catalog");
        let catalog = SYSTEM_FALLBACK_PRODUCTS;
        if (storedCatalog) {
            try {
                const parsed = JSON.parse(storedCatalog);
                if (Array.isArray(parsed) && parsed.length > 0) catalog = parsed;
            } catch (e) { }
        }

        const matches = catalog.filter(product => {
            const name = String(product.name || '').toLowerCase();
            const category = String(product.category || '').toLowerCase();
            const desc = String(product.description || '').toLowerCase();
            return name.includes(query) || category.includes(query) || desc.includes(query);
        });

        if (matches.length === 0) {
            if (searchResultsGrid) searchResultsGrid.innerHTML = '<p class="search-placeholder-text">No matching fragrances found.</p>';
            return;
        }

        if (searchResultsGrid) {
            searchResultsGrid.innerHTML = matches.map(product => {
                const price = product.price_30ml || product.price_50ml || product.price_100ml || product.price || "0";
                return `
                    <div class="search-item-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
                        <img class="search-item-img" src="${product.image || ''}" alt="${product.name || 'Product'}">
                        <div class="search-item-info">
                            <h4>${product.name || ''}</h4>
                            <p>${product.category || ''} • ₹${formatPrice(price)}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    });
});
