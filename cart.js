document.addEventListener("DOMContentLoaded", () => {
    // 1. EXACT CONFIGURATION & DOM SELECTORS
    const SHEET_ID = "1XKKuji-6BL14nwEtnv99MIJEppxC_ny8OPVokRKzBNY";
    const COUPONS_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Coupons`;
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHcuijESHsZqXVso2hWGiVwr5QvAZY_DXz0q2cPERidbZPvle_3MIA8hf6fY6VdzjL/exec";

    // HARDCODED EMERGENCY FALLBACK (Agar Sheet down ho)
    const FALLBACK_COUPONS = [
        { code: "JAYESH0", discount_type: "percent", discount_value: 10, min_order: 999 },
        { code: "KUSHWAHA100", discount_type: "flat", discount_value: 60, min_order: 499 }
    ];

    const cartItemsList = document.getElementById("cartItemsList");
    const subtotalEl = document.getElementById("subtotalPrice");
    const shippingEl = document.getElementById("shippingPrice");
    const discountRow = document.getElementById("discountRow");
    const discountEl = document.getElementById("discountPrice");
    const totalEl = document.getElementById("totalPrice");
    const couponInput = document.getElementById("couponInput");
    const applyCouponBtn = document.getElementById("applyCouponBtn");
    const couponMsg = document.getElementById("couponMsg");
    const checkoutBtn = document.getElementById("checkoutBtn");

    let cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
    let appliedCoupon = JSON.parse(sessionStorage.getItem("scentra_applied_coupon")) || null;

    if (typeof window.updateCartCount === "function") {
        window.updateCartCount();
    }

    // 2. RENDER CART ITEMS (Fully Matched with detail.js structure)
    function renderCart() {
        if (!cartItemsList) return;

        // Sync fresh local storage data
        cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<p class="empty-cart-msg" style="text-align:center; padding: 40px 0;">Your cart is empty. <a href="index.html" style="text-decoration:underline;">Shop Now</a></p>`;
            sessionStorage.removeItem("scentra_applied_coupon");
            appliedCoupon = null;
            if (checkoutBtn) checkoutBtn.disabled = true;
            calculateTotals(0);
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;

        cartItemsList.innerHTML = cart.map((item, index) => {
            const priceNum = Number(item.price || 0);
            const qtyNum = Number(item.quantity || 1);
            
            return `
                <div class="cart-item">
                    <img src="${item.image || ''}" alt="${item.name || 'Product'}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.name || 'Perfume'}</h4>
                        <span class="cart-item-variant">Size: ${item.size || '30ml'}</span>
                        <p class="cart-item-price">₹${priceNum.toLocaleString("en-IN")}</p>
                    </div>
                    <div class="cart-qty-controls">
                        <button onclick="updateQty(${index}, -1)">-</button>
                        <span>${qtyNum}</span>
                        <button onclick="updateQty(${index}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index})">✕</button>
                </div>
            `;
        }).join("");

        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        calculateTotals(subtotal);
    }

    // 3. QUANTITY & REMOVE ACTIONS
    window.updateQty = (index, change) => {
        if (!cart[index]) return;
        cart[index].quantity = Number(cart[index].quantity || 1) + change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveAndReload();
    };

    window.removeItem = (index) => {
        cart.splice(index, 1);
        saveAndReload();
    };

    function saveAndReload() {
        localStorage.setItem("scentra_cart", JSON.stringify(cart));
        if (typeof window.updateCartCount === "function") {
            window.updateCartCount();
        }
        renderCart();
    }

    // 4. DYNAMIC CALCULATION ENGINE (SAFE & ACCURATE)
    function calculateTotals(subtotal) {
        // Shipping Rule: < 999 -> ₹50, >= 999 -> FREE
        const shipping = (subtotal > 0 && subtotal < 999) ? 50 : 0;
        let discount = 0;

        if (appliedCoupon) {
            const minOrder = Number(appliedCoupon.min_order || 0);
            if (subtotal >= minOrder) {
                if (String(appliedCoupon.discount_type).toLowerCase() === "percent") {
                    discount = (subtotal * Number(appliedCoupon.discount_value)) / 100;
                } else {
                    discount = Number(appliedCoupon.discount_value);
                }
                if (couponMsg) {
                    couponMsg.style.color = "green";
                    couponMsg.innerText = `Coupon '${appliedCoupon.code}' Applied!`;
                }
            } else {
                if (couponMsg) {
                    couponMsg.style.color = "#d9534f";
                    couponMsg.innerText = `Coupon removed (Minimum order ₹${minOrder} required)`;
                }
                appliedCoupon = null;
                sessionStorage.removeItem("scentra_applied_coupon");
            }
        }

        const grandTotal = Math.max(0, subtotal + shipping - discount);

        if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString("en-IN")}`;
        if (shippingEl) shippingEl.innerText = shipping === 0 ? "FREE" : `₹${shipping}`;
        
        if (discountEl && discountRow) {
            if (discount > 0) {
                discountRow.style.display = "flex";
                discountEl.innerText = `-₹${Math.round(discount).toLocaleString("en-IN")}`;
            } else {
                discountRow.style.display = "none";
            }
        }

        if (totalEl) totalEl.innerText = `₹${Math.round(grandTotal).toLocaleString("en-IN")}`;

        // Checkout Sync
        localStorage.setItem("scentra_order_summary", JSON.stringify({
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            grandTotal: grandTotal,
            appliedCoupon: appliedCoupon ? appliedCoupon.code : null
        }));
    }

    // 5. COUPON VERIFICATION VIA GOOGLE SHEET (WITH TRIPLE FALLBACK)
    applyCouponBtn?.addEventListener("click", async () => {
        const inputCode = couponInput ? couponInput.value.trim().toUpperCase() : "";
        if (!inputCode) return;

        if (couponMsg) {
            couponMsg.style.color = "#555";
            couponMsg.innerText = "Checking coupon...";
        }

        let couponsList = [];

        // Attempt 1: Fetch via GViz
        try {
            const res = await fetch(COUPONS_GVIZ_URL);
            if (res.ok) {
                const text = await res.text();
                const jsonData = JSON.parse(text.substring(47, text.length - 2));
                const cols = jsonData.table.cols.map(c => (c.label || c.id || "").toLowerCase().trim());
                
                couponsList = jsonData.table.rows.map(row => {
                    let obj = {};
                    if (row.c) {
                        row.c.forEach((cell, idx) => {
                            if (cols[idx]) obj[cols[idx]] = cell ? cell.v : "";
                        });
                    }
                    return obj;
                });
            }
        } catch (e) {
            console.warn("GViz Coupon Fetch Failed, switching to Web App API...", e);
        }

        // Attempt 2: Fetch via Web App API if GViz failed
        if (couponsList.length === 0) {
            try {
                const res = await fetch(APPS_SCRIPT_URL);
                const data = await res.json();
                if (data.coupons && Array.isArray(data.coupons)) {
                    couponsList = data.coupons;
                }
            } catch (err) {
                console.warn("Web App API Coupons Fetch Failed, using fallback coupons.");
            }
        }

        // Attempt 3: Local Fallback
        if (couponsList.length === 0) {
            couponsList = FALLBACK_COUPONS;
        }

        // Match Coupon Code
        const matchedCoupon = couponsList.find(c => String(c.code || "").trim().toUpperCase() === inputCode);
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

        if (!matchedCoupon) {
            if (couponMsg) {
                couponMsg.style.color = "#d9534f";
                couponMsg.innerText = "Invalid Coupon Code!";
            }
        } else {
            const minOrder = parseFloat(matchedCoupon.min_order || 0);
            if (subtotal < minOrder) {
                if (couponMsg) {
                    couponMsg.style.color = "#d9534f";
                    couponMsg.innerText = `Minimum order ₹${minOrder} required for this coupon!`;
                }
            } else {
                appliedCoupon = {
                    code: String(matchedCoupon.code).trim().toUpperCase(),
                    discount_type: String(matchedCoupon.discount_type || "flat").toLowerCase(),
                    discount_value: parseFloat(matchedCoupon.discount_value || 0),
                    min_order: minOrder
                };
                
                sessionStorage.setItem("scentra_applied_coupon", JSON.stringify(appliedCoupon));

                if (couponMsg) {
                    couponMsg.style.color = "green";
                    couponMsg.innerText = `Coupon '${appliedCoupon.code}' Applied Successfully!`;
                }
                calculateTotals(subtotal);
            }
        }
    });

    // 6. INITIAL RENDER
    renderCart();
});
