document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    const SHEET_ID = "1XKKuji-6BL14nwEtnv99MIJEppxC_ny8OPVokRKzBNY";
    const GVIZ_PRODUCTS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Products`;

    let currentProduct = null;
    let allProductsList = [];
    let selectedSize = "30ml";
    let quantity = 1;

    // DOM Elements
    const detailImg = document.getElementById("detailImg");
    const detailName = document.getElementById("detailName");
    const detailCategory = document.getElementById("detailCategory");
    const detailPrice = document.getElementById("detailPrice");
    const detailDesc = document.getElementById("detailShortDesc");
    const topNotes = document.getElementById("topNotes");
    const heartNotes = document.getElementById("heartNotes");
    const baseNotes = document.getElementById("baseNotes");
    const qtyVal = document.getElementById("qtyVal");
    const addToCartBtn = document.getElementById("addToCartBtn");
    const buyNowBtn = document.getElementById("buyNowBtn"); // BUY NOW BUTTON ADDED

    if (typeof window.updateCartCount === "function") {
        window.updateCartCount();
    }

    async function initProductDetail() {
        // Cache Load First
        const cachedCatalog = localStorage.getItem("scentra_catalog");
        if (cachedCatalog) {
            try {
                allProductsList = JSON.parse(cachedCatalog);
                setupProductData();
            } catch (e) {}
        }

        // Live GViz Fetch
        try {
            const res = await fetch(GVIZ_PRODUCTS_URL);
            const text = await res.text();
            const jsonData = JSON.parse(text.substring(47, text.length - 2));
            const cols = jsonData.table.cols.map(c => (c.label || c.id || "").toLowerCase().trim());

            allProductsList = jsonData.table.rows.map(row => {
                let obj = {};
                if (row.c) {
                    row.c.forEach((cell, idx) => {
                        const header = cols[idx];
                        if (header) obj[header] = (cell && cell.v !== null && cell.v !== undefined) ? cell.v : "";
                    });
                }
                return obj;
            });

            localStorage.setItem("scentra_catalog", JSON.stringify(allProductsList));
            setupProductData();
        } catch (err) {
            console.error("Detail Fetch Error:", err);
        }
    }

    function setupProductData() {
        if (!allProductsList || allProductsList.length === 0) return;

        if (productId) {
            currentProduct = allProductsList.find(p => String(p.id).trim() === String(productId).trim());
        }

        if (!currentProduct) {
            currentProduct = allProductsList[0];
        }

        renderProduct();
        renderRelatedProducts();
    }

    function renderProduct() {
        if (!currentProduct) return;

        if (detailImg) detailImg.src = currentProduct.image || "";
        if (detailName) detailName.innerText = currentProduct.name || "Fragrance";
        if (detailCategory) detailCategory.innerText = currentProduct.category || "Perfume";
        if (detailDesc) detailDesc.innerText = currentProduct.description || "";
        if (topNotes) topNotes.innerText = currentProduct.top_notes || "N/A";
        if (heartNotes) heartNotes.innerText = currentProduct.heart_notes || "N/A";
        if (baseNotes) baseNotes.innerText = currentProduct.base_notes || "N/A";

        updateDynamicPrice();
    }

    function renderRelatedProducts() {
        const relatedGrid = document.getElementById("relatedProductsGrid");
        if (!relatedGrid || !currentProduct) return;

        let related = allProductsList.filter(p =>
            String(p.id).trim() !== String(currentProduct.id).trim() &&
            String(p.category).trim().toLowerCase() === String(currentProduct.category).trim().toLowerCase()
        );

        if (related.length === 0) {
            related = allProductsList.filter(p => String(p.id).trim() !== String(currentProduct.id).trim());
        }

        relatedGrid.innerHTML = related.map(p => {
            const startPrice = p.price_30ml || p.price_50ml || "0";
            return `
                <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                    <div class="product-thumb">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="product-info-outside">
                        <h3 class="product-title">${p.name}</h3>
                        <p class="product-category">${p.category}</p>
                        <p class="product-price-outside">₹${Number(startPrice).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateDynamicPrice() {
        if (!currentProduct) return;
        const priceKey = `price_${selectedSize}`;
        const unitPrice = parseFloat(currentProduct[priceKey]) || parseFloat(currentProduct.price_30ml) || 0;
        if (detailPrice) detailPrice.innerText = `₹${(unitPrice * quantity).toLocaleString("en-IN")}`;
    }

    document.querySelectorAll(".size-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            selectedSize = e.currentTarget.getAttribute("data-size") || "30ml";
            updateDynamicPrice();
        });
    });

    document.getElementById("qtyMinus")?.addEventListener("click", () => {
        if (quantity > 1) {
            quantity--;
            if (qtyVal) qtyVal.innerText = quantity;
            updateDynamicPrice();
        }
    });

    document.getElementById("qtyPlus")?.addEventListener("click", () => {
        quantity++;
        if (qtyVal) qtyVal.innerText = quantity;
        updateDynamicPrice();
    });

    // Helper function for adding item to cart
    function executeAddToCart() {
        if (!currentProduct) return;

        const priceKey = `price_${selectedSize}`;
        const unitPrice = parseFloat(currentProduct[priceKey]) || parseFloat(currentProduct.price_30ml) || 0;

        let cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
        const existingIndex = cart.findIndex(item => String(item.id).trim() === String(currentProduct.id).trim() && item.size === selectedSize);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                size: selectedSize,
                price: unitPrice,
                quantity: quantity,
                image: currentProduct.image
            });
        }

        localStorage.setItem("scentra_cart", JSON.stringify(cart));
        if (typeof window.updateCartCount === "function") window.updateCartCount();
    }

    // ADD TO CART BUTTON CLICK
    addToCartBtn?.addEventListener("click", () => {
        executeAddToCart();

        const originalText = addToCartBtn.innerText;
        addToCartBtn.innerText = "ADDED TO CART ✓";
        addToCartBtn.style.pointerEvents = "none";
        setTimeout(() => {
            addToCartBtn.innerText = originalText;
            addToCartBtn.style.pointerEvents = "auto";
        }, 1500);
    });

    // BUY NOW BUTTON CLICK (ADDED)
    buyNowBtn?.addEventListener("click", () => {
        executeAddToCart();
        window.location.href = "cart.html";
    });

    initProductDetail();
});