document.addEventListener("DOMContentLoaded", () => {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbznVZc-9hPN_u4gESjMXdrG28vHksopTU1fnSbwy5z6nR06cHA7Ufwk-70Zj7VwKE3l/exec";
    const CLIENT_UPI_ID = "sezanhusain-2@oksbi"; 

    const cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
    const orderSummary = JSON.parse(localStorage.getItem("scentra_order_summary")) || {};

    if (cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }

    // 1. RENDER SUMMARY
    const itemsList = document.getElementById("checkoutItemsList");
    if (itemsList) {
        itemsList.innerHTML = cart.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.9rem;">
                <div>
                    <strong>${item.name}</strong> (${item.size}) × ${item.quantity}
                </div>
                <div>₹${(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}</div>
            </div>
        `).join("");
    }

    const subtotal = orderSummary.subtotal || cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const shipping = orderSummary.shipping !== undefined ? orderSummary.shipping : (subtotal < 999 ? 99 : 0);
    const discount = orderSummary.discount || 0;
    const grandTotal = Math.max(0, subtotal + shipping - discount);

    document.getElementById("summarySubtotal").innerText = `₹${subtotal.toLocaleString("en-IN")}`;
    document.getElementById("summaryShipping").innerText = shipping === 0 ? "FREE" : `₹${shipping}`;
    document.getElementById("summaryGrandTotal").innerText = `₹${Math.round(grandTotal).toLocaleString("en-IN")}`;

    if (discount > 0) {
        document.getElementById("summaryDiscountRow").style.display = "flex";
        document.getElementById("summaryDiscount").innerText = `-₹${Math.round(discount).toLocaleString("en-IN")}`;
    }

    // 2. FORM PROCEED TO PAYMENT
    const checkoutForm = document.getElementById("checkoutForm");
    const paymentModal = document.getElementById("paymentModal");

    checkoutForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        // Generate UPI QR Code URL
        const upiString = `upi://pay?pa=${CLIENT_UPI_ID}&pn=SCENTRA%20Fragrances&am=${grandTotal}&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

        document.getElementById("upiQrCode").src = qrUrl;
        document.getElementById("qrPayAmount").innerText = `₹${Math.round(grandTotal).toLocaleString("en-IN")}`;
        paymentModal.classList.add("active");
    });

    document.getElementById("closeModal")?.addEventListener("click", () => {
        paymentModal.classList.remove("active");
    });

    // 3. UTR PAYMENT SUBMISSION
    const paymentVerifyForm = document.getElementById("paymentVerifyForm");
    const submitOrderBtn = document.getElementById("submitOrderBtn");
    const uploadStatus = document.getElementById("uploadStatus");

    paymentVerifyForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const utrVal = document.getElementById("utrNumber").value.trim();
        if (utrVal.length !== 12 || isNaN(utrVal)) {
            alert("Please enter a valid 12-digit UTR/Ref number.");
            return;
        }

        submitOrderBtn.disabled = true;
        uploadStatus.style.color = "var(--text-main)";
        uploadStatus.innerText = "Verifying details & placing order...";

        const itemsSummary = cart.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(", ");

        const payload = {
            name: document.getElementById("custName").value.trim(),
            email: document.getElementById("custEmail").value.trim(),
            phone: document.getElementById("custPhone").value.trim(),
            address: document.getElementById("custAddress").value.trim(),
            city: document.getElementById("custCity").value.trim(),
            state: document.getElementById("custState").value.trim(),
            pincode: document.getElementById("custPincode").value.trim(),
            itemsSummary: itemsSummary,
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            grandTotal: grandTotal,
            utrNumber: utrVal
        };

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.status === "SUCCESS") {
                localStorage.removeItem("scentra_cart");
                localStorage.removeItem("scentra_order_summary");
                sessionStorage.removeItem("scentra_applied_coupon");

                if (typeof window.updateCartCount === "function") window.updateCartCount();

                paymentModal.classList.remove("active");
                document.getElementById("confirmedOrderId").innerText = data.orderId;
                document.getElementById("thankYouScreen").classList.add("active");
            } else {
                throw new Error(data.message || "Order submission failed");
            }
        } catch (err) {
            console.error("Submission error:", err);
            uploadStatus.style.color = "#B03A2E";
            uploadStatus.innerText = "Error submitting order. Please try again.";
            submitOrderBtn.disabled = false;
        }
    });
});