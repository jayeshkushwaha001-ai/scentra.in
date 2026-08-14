// 1. GLOBAL FUNCTION FOR PAYMENT MODE CHANGE (Fixes HTML onchange error)
window.handlePaymentModeChange = function(input) {
    const utrBox = document.getElementById("utrSection") || document.getElementById("upiBox") || document.getElementById("onlineDetails");
    if (utrBox) {
        utrBox.style.display = (input.value === "online" || input.value === "upi") ? "block" : "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx26sjPMx5Jo8zIMcH03_ZLwUQK3znHRddBfHnJcErimX3yCqp79odSh92j_8Bpmvoc/exec";
    const CLIENT_UPI_ID = "sezanhusain-2@oksbi"; 

    const cart = JSON.parse(localStorage.getItem("scentra_cart")) || [];
    const orderSummary = JSON.parse(localStorage.getItem("scentra_order_summary")) || {};

    if (cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }

    // 1. RENDER SUMMARY ITEMS
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

    // BASE BILL CALCULATION
    const subtotal = orderSummary.subtotal || cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const shipping = orderSummary.shipping !== undefined ? orderSummary.shipping : (subtotal < 999 ? 50 : 0);
    const discount = orderSummary.discount || 0;

    let selectedPaymentMode = "online";
    let codFee = 0;
    let grandTotal = 0;

    function updateTotals() {
        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        selectedPaymentMode = paymentRadio ? paymentRadio.value : "online";

        codFee = (selectedPaymentMode === "cod") ? 50 : 0;
        grandTotal = Math.max(0, subtotal + shipping + codFee - discount);

        const subtotalEl = document.getElementById("summarySubtotal");
        if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString("en-IN")}`;
        
        const shippingEl = document.getElementById("summaryShipping");
        if (shippingEl) shippingEl.innerText = shipping === 0 ? "FREE" : `₹${shipping}`;
        
        const codRow = document.getElementById("summaryCodRow");
        if (codRow) {
            codRow.style.display = selectedPaymentMode === "cod" ? "flex" : "none";
        }

        if (discount > 0) {
            const discRow = document.getElementById("summaryDiscountRow");
            if (discRow) discRow.style.display = "flex";
            const discEl = document.getElementById("summaryDiscount");
            if (discEl) discEl.innerText = `-₹${Math.round(discount).toLocaleString("en-IN")}`;
        }

        const grandEl = document.getElementById("summaryGrandTotal");
        if (grandEl) grandEl.innerText = `₹${Math.round(grandTotal).toLocaleString("en-IN")}`;
    }

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener("change", updateTotals);
    });

    updateTotals();

    // 2. FORM PROCEED TO PAYMENT MODAL
    const checkoutForm = document.getElementById("checkoutForm");
    const paymentModal = document.getElementById("paymentModal");

    checkoutForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const payNowAmount = (selectedPaymentMode === "cod") ? 100 : grandTotal;
        const balanceDue = (selectedPaymentMode === "cod") ? Math.max(0, grandTotal - 100) : 0;

        const upiString = `upi://pay?pa=${CLIENT_UPI_ID}&pn=SCENTRA%20Fragrances&am=${payNowAmount}&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

        const qrImg = document.getElementById("upiQrCode");
        if (qrImg) qrImg.src = qrUrl;

        const codNoticeBox = document.getElementById("codNoticeBox");
        const modalHeading = document.getElementById("modalPaymentHeading");
        const qrPayAmount = document.getElementById("qrPayAmount");

        if (selectedPaymentMode === "cod") {
            if (codNoticeBox) codNoticeBox.style.display = "block";
            if (modalHeading) modalHeading.innerText = "Advance Payment (COD)";
            if (qrPayAmount) qrPayAmount.innerText = `₹100 Advance (Balance ₹${Math.round(balanceDue).toLocaleString("en-IN")} on Delivery)`;
        } else {
            if (codNoticeBox) codNoticeBox.style.display = "none";
            if (modalHeading) modalHeading.innerText = "Scan & Pay via UPI";
            if (qrPayAmount) qrPayAmount.innerText = `₹${Math.round(grandTotal).toLocaleString("en-IN")}`;
        }

        paymentModal?.classList.add("active");
    });

    document.getElementById("closeModal")?.addEventListener("click", () => {
        paymentModal?.classList.remove("active");
    });

    // 3. UTR PAYMENT SUBMISSION
    const paymentVerifyForm = document.getElementById("paymentVerifyForm");
    const submitOrderBtn = document.getElementById("submitOrderBtn");
    const uploadStatus = document.getElementById("uploadStatus");

    paymentVerifyForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const utrVal = document.getElementById("utrNumber").value.trim();
        if (utrVal.length !== 12 || isNaN(utrVal)) {
            alert("Please enter a valid 12-digit UTR or Reference number.");
            return;
        }

        if (submitOrderBtn) submitOrderBtn.disabled = true;
        if (uploadStatus) {
            uploadStatus.style.color = "var(--text-main, #333)";
            uploadStatus.innerText = "Verifying transaction & placing order...";
        }

        const itemsSummary = cart.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(", ");
        const payNowAmount = (selectedPaymentMode === "cod") ? 100 : grandTotal;
        const balanceDue = (selectedPaymentMode === "cod") ? Math.max(0, grandTotal - 100) : 0;

        const payload = {
            name: document.getElementById("custName")?.value.trim() || "",
            email: document.getElementById("custEmail")?.value.trim() || "",
            phone: document.getElementById("custPhone")?.value.trim() || "",
            address: document.getElementById("custAddress")?.value.trim() || "",
            city: document.getElementById("custCity")?.value.trim() || "",
            state: document.getElementById("custState")?.value.trim() || "",
            pincode: document.getElementById("custPincode")?.value.trim() || "",
            itemsSummary: itemsSummary,
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            codFee: codFee,
            grandTotal: grandTotal,
            paymentMode: selectedPaymentMode.toUpperCase(),
            advancePaid: payNowAmount,
            balanceDue: balanceDue,
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

                paymentModal?.classList.remove("active");
                const orderIdEl = document.getElementById("confirmedOrderId");
                if (orderIdEl) orderIdEl.innerText = data.orderId;
                document.getElementById("thankYouScreen")?.classList.add("active");
            } else {
                throw new Error(data.message || "Order processing failed.");
            }
        } catch (err) {
            console.error("Submission error:", err);
            if (uploadStatus) {
                uploadStatus.style.color = "#B03A2E";
                uploadStatus.innerText = "Transaction submission failed. Please try again.";
            }
            if (submitOrderBtn) submitOrderBtn.disabled = false;
        }
    });
});
