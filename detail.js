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
    const buyNowBtn = document.getElementById("buyNowBtn");

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
            } catch (e) { }
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
        if (!currentProduct) return; // Guard clause: Agar currentProduct null hai toh aage code execute nahi hoga

        if (detailImg) detailImg.src = currentProduct.image || "";
        if (detailName) detailName.innerText = currentProduct.name || "Fragrance";
        if (detailCategory) detailCategory.innerText = currentProduct.category || "Perfume";
        if (detailDesc) detailDesc.innerText = currentProduct.description || "";
        if (topNotes) topNotes.innerText = currentProduct.top_notes || "N/A";
        if (heartNotes) heartNotes.innerText = currentProduct.heart_notes || "N/A";
        if (baseNotes) baseNotes.innerText = currentProduct.base_notes || "N/A";

        // Setup Dynamic Size Buttons based on Category and Available Prices
        setupSizeSelector();
        updateDynamicPrice();

        // SAFE OUT OF STOCK CHECK
        const stockStatus = String((currentProduct && (currentProduct.status || currentProduct.stock)) || '').toLowerCase().trim();
        
        if (stockStatus.includes('out of stock') || stockStatus === 'out' || stockStatus === 'false' || stockStatus === '0') {
            if (addToCartBtn) {
                addToCartBtn.innerText = "OUT OF STOCK";
                addToCartBtn.disabled = true;
                addToCartBtn.style.opacity = "0.6";
                addToCartBtn.style.cursor = "not-allowed";
                addToCartBtn.style.pointerEvents = "none";
            }
            if (buyNowBtn) {
                buyNowBtn.innerText = "OUT OF STOCK";
                buyNowBtn.disabled = true;
                buyNowBtn.style.opacity = "0.6";
                buyNowBtn.style.cursor = "not-allowed";
                buyNowBtn.style.pointerEvents = "none";
            }
        } else {
            if (addToCartBtn) {
                addToCartBtn.innerText = "ADD TO CART";
                addToCartBtn.disabled = false;
                addToCartBtn.style.opacity = "1";
                addToCartBtn.style.cursor = "pointer";
                addToCartBtn.style.pointerEvents = "auto";
            }
            if (buyNowBtn) {
                buyNowBtn.innerText = "BUY NOW";
                buyNowBtn.disabled = false;
                buyNowBtn.style.opacity = "1";
                buyNowBtn.style.cursor = "pointer";
                buyNowBtn.style.pointerEvents = "auto";
            }
        }
    }

    /* --- DYNAMIC SIZE SELECTOR LOGIC --- */
    function setupSizeSelector() {
        if (!currentProduct) return;

        const catLower = String(currentProduct.category || "").toLowerCase().trim();
        const isAttar = catLower.includes("attar");
        const isGifting = catLower.includes("gift") || catLower.includes("gifting") || catLower.includes("combo");

        // Dhoondho size buttons container
        let sizesContainer = document.querySelector(".product-sizes") ||
            document.querySelector(".sizes-container") ||
            document.querySelector(".size-options") ||
            document.querySelectorAll(".size-btn")[0]?.parentElement;

        // Size Label (e.g. "Select Size:")
        const sizeLabel = sizesContainer?.previousElementSibling?.tagName === "LABEL" ||
            sizesContainer?.previousElementSibling?.classList?.contains("size-label")
            ? sizesContainer.previousElementSibling
            : null;

        // 1. COMBOS & GIFTING: Hide size buttons completely
        if (isGifting) {
            if (sizesContainer) sizesContainer.style.display = "none";
            if (sizeLabel) sizeLabel.style.display = "none";
            selectedSize = "Combo Pack";
            return;
        }

        if (sizesContainer) sizesContainer.style.display = "flex";
        if (sizeLabel) sizeLabel.style.display = "block";

        let availableSizes = [];

        // 2. ATTARS: 6 ML and 15 ML
        if (isAttar) {
            // Check prices in sheet (Mapping: price_6ml -> price_30ml column, price_15ml -> price_50ml column)
            const p6 = currentProduct.price_6ml || currentProduct.price_30ml;
            const p15 = currentProduct.price_15ml || currentProduct.price_50ml;

            if (p6 && parseFloat(p6) > 0) availableSizes.push({ key: "6ml", label: "6 ML" });
            if (p15 && parseFloat(p15) > 0) availableSizes.push({ key: "15ml", label: "15 ML" });

            // Fallback agar sheet me values blank hon
            if (availableSizes.length === 0) {
                availableSizes = [{ key: "6ml", label: "6 ML" }, { key: "15ml", label: "15 ML" }];
            }
        }
        // 3. PERFUMES: Only show sizes that have a valid price
        else {
            if (currentProduct.price_30ml && parseFloat(currentProduct.price_30ml) > 0) {
                availableSizes.push({ key: "30ml", label: "30 ML" });
            }
            if (currentProduct.price_50ml && parseFloat(currentProduct.price_50ml) > 0) {
                availableSizes.push({ key: "50ml", label: "50 ML" });
            }
            if (currentProduct.price_100ml && parseFloat(currentProduct.price_100ml) > 0) {
                availableSizes.push({ key: "100ml", label: "100 ML" });
            }

            // Fallback agar sab blank/zero ho
            if (availableSizes.length === 0) {
                availableSizes = [{ key: "30ml", label: "30 ML" }];
            }
        }

        // Selected size by default to first available
        selectedSize = availableSizes[0].key;

        // Render HTML for size buttons
        if (sizesContainer) {
            sizesContainer.innerHTML = availableSizes.map((size, idx) => `
                <button class="size-btn ${idx === 0 ? 'active' : ''}" data-size="${size.key}">
                    ${size.label}
                </button>
            `).join('');

            // Attach Click Listeners
            sizesContainer.querySelectorAll(".size-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    sizesContainer.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
                    e.currentTarget.classList.add("active");
                    selectedSize = e.currentTarget.getAttribute("data-size");
                    updateDynamicPrice();
                });
            });
        }
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
            const startPrice = p.price_30ml || p.price_50ml || p.price_100ml || p.price || "0";
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

    function getUnitPrice() {
        if (!currentProduct) return 0;
        const catLower = String(currentProduct.category || "").toLowerCase().trim();

        if (catLower.includes("gift") || catLower.includes("gifting") || catLower.includes("combo")) {
            return parseFloat(currentProduct.price_100ml || currentProduct.price_50ml || currentProduct.price_30ml || currentProduct.price || 0);
        }

        if (catLower.includes("attar")) {
            if (selectedSize === "6ml") return parseFloat(currentProduct.price_6ml || currentProduct.price_30ml || 0);
            if (selectedSize === "15ml") return parseFloat(currentProduct.price_15ml || currentProduct.price_50ml || 0);
        }

        const priceKey = `price_${selectedSize}`;
        return parseFloat(currentProduct[priceKey]) || parseFloat(currentProduct.price_30ml || currentProduct.price_50ml || currentProduct.price_100ml || 0);
    }

    function updateDynamicPrice() {
        if (!currentProduct) return;
        const unitPrice = getUnitPrice();
        if (detailPrice) detailPrice.innerText = `₹${(unitPrice * quantity).toLocaleString("en-IN")}`;
    }

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

        const unitPrice = getUnitPrice();

        // Format nice label for cart size display
        let sizeDisplay = selectedSize;
        if (selectedSize === "6ml") sizeDisplay = "6 ML";
        else if (selectedSize === "15ml") sizeDisplay = "15 ML";
        else if (selectedSize === "30ml") sizeDisplay = "30 ML";
        else if (selectedSize === "50ml") sizeDisplay = "50 ML";
        else if (selectedSize === "100ml") sizeDisplay = "100 ML";

        let cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
        const existingIndex = cart.findIndex(item => String(item.id).trim() === String(currentProduct.id).trim() && item.size === sizeDisplay);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                size: sizeDisplay,
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

    // BUY NOW BUTTON CLICK
    buyNowBtn?.addEventListener("click", () => {
        executeAddToCart();
        window.location.href = "cart.html";
    });

    initProductDetail();
});
