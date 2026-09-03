/* =========================================================
   GEORAKSHAK - ALERTS JAVASCRIPT
   File: js/alerts.js

   Handles:
   - Fetching alerts from GeoRakshakAPI
   - Alert filtering
   - Searching alerts
   - Alert acknowledgement
   - Alert details modal
   - Dynamic alert rendering
   - Auto refresh

   Requires:
   - main.js
   - api.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    let allAlerts = [];
    let currentSeverity = "all";
    let currentSearch = "";


    /* =====================================================
       1. DOM ELEMENTS
    ===================================================== */

    const alertsContainer =
        document.querySelector(".alerts-list");

    const searchInput =
        document.getElementById("alertSearch");

    const severityFilters =
        document.querySelectorAll(
            "[data-alert-filter]"
        );

    const alertCount =
        document.querySelector(
            "[data-alert-count]"
        );


    /* =====================================================
       2. FETCH ALERTS
    ===================================================== */

    async function loadAlerts() {

        if (!alertsContainer) return;

        showLoading();

        try {

            const response =
                await GeoRakshakAPI.getAlerts();

            if (!response.success) {
                throw new Error(
                    "Unable to load alerts."
                );
            }

            allAlerts = response.data || [];

            applyFilters();

        } catch (error) {

            console.error(
                "GeoRakshak Alerts Error:",
                error
            );

            showError(
                error.message ||
                "Failed to load alerts."
            );

        }

    }


    /* =====================================================
       3. FILTER ALERTS
    ===================================================== */

    function applyFilters() {

        let filteredAlerts = [...allAlerts];


        // Severity filter
        if (currentSeverity !== "all") {

            filteredAlerts =
                filteredAlerts.filter(
                    alert =>
                        alert.severity ===
                        currentSeverity
                );

        }


        // Search filter
        if (currentSearch.trim()) {

            const searchTerm =
                currentSearch.toLowerCase().trim();

            filteredAlerts =
                filteredAlerts.filter(alert => {

                    return (
                        alert.title
                            .toLowerCase()
                            .includes(searchTerm) ||

                        alert.location
                            .toLowerCase()
                            .includes(searchTerm) ||

                        alert.message
                            .toLowerCase()
                            .includes(searchTerm)
                    );

                });

        }


        // Sort:
        // Critical → High → Moderate → Low
        const severityOrder = {
            critical: 1,
            high: 2,
            moderate: 3,
            low: 4
        };

        filteredAlerts.sort((a, b) => {

            return (
                severityOrder[a.severity] -
                severityOrder[b.severity]
            );

        });


        renderAlerts(filteredAlerts);
        updateAlertCount(filteredAlerts.length);

    }


    /* =====================================================
       4. RENDER ALERTS
    ===================================================== */

    function renderAlerts(alerts) {

        if (!alertsContainer) return;


        if (alerts.length === 0) {

            alertsContainer.innerHTML = `
                <div class="alerts-empty-state">
                    <div class="empty-icon">✓</div>

                    <h3>No Alerts Found</h3>

                    <p>
                        No alerts match your current
                        search or filter criteria.
                    </p>
                </div>
            `;

            return;

        }


        alertsContainer.innerHTML =
            alerts
                .map(alert => createAlertCard(alert))
                .join("");

    }


    function createAlertCard(alert) {

        const severity =
            alert.severity || "low";

        const severityText =
            severity.charAt(0).toUpperCase() +
            severity.slice(1);

        const timeAgo =
            getTimeAgo(alert.createdAt);

        const isAcknowledged =
            alert.status === "acknowledged";


        return `
            <article
                class="alert-card alert-${severity}"
                data-alert-id="${escapeHTML(alert.id)}"
            >

                <div class="alert-card-indicator"></div>

                <div class="alert-card-main">

                    <div class="alert-card-top">

                        <div>

                            <span
                                class="
                                    severity-badge
                                    ${severity}-badge
                                "
                            >
                                ${severityText} Risk
                            </span>

                            <span class="alert-time">
                                ${timeAgo}
                            </span>

                        </div>

                        <span
                            class="
                                alert-status
                                ${
                                    isAcknowledged
                                        ? "acknowledged"
                                        : "active"
                                }
                            "
                        >
                            ${
                                isAcknowledged
                                    ? "Acknowledged"
                                    : "Active"
                            }
                        </span>

                    </div>


                    <h2>
                        ${escapeHTML(alert.title)}
                    </h2>


                    <div class="alert-location">
                        <span>⌖</span>

                        <strong>
                            ${escapeHTML(alert.location)}
                        </strong>
                    </div>


                    <p class="alert-message">
                        ${escapeHTML(alert.message)}
                    </p>


                    <div class="alert-risk-score">

                        <span>Risk Score</span>

                        <div class="risk-progress">
                            <div
                                class="risk-progress-fill"
                                style="
                                    width:
                                    ${Math.min(
                                        Math.max(
                                            Number(
                                                alert.riskScore
                                            ) || 0,
                                            0
                                        ),
                                        100
                                    )}%
                                "
                            ></div>
                        </div>

                        <strong>
                            ${alert.riskScore || 0}%
                        </strong>

                    </div>


                    <div class="alert-card-actions">

                        <button
                            type="button"
                            class="btn btn-secondary alert-details-btn"
                            data-alert-details="${escapeHTML(
                                alert.id
                            )}"
                        >
                            View Details
                        </button>


                        ${
                            !isAcknowledged
                                ? `
                                    <button
                                        type="button"
                                        class="
                                            btn btn-primary
                                            acknowledge-alert-btn
                                        "
                                        data-acknowledge-alert="${escapeHTML(
                                            alert.id
                                        )}"
                                    >
                                        Acknowledge
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="
                                            btn btn-disabled
                                        "
                                        disabled
                                    >
                                        Acknowledged
                                    </button>
                                `
                        }

                    </div>

                </div>

            </article>
        `;

    }


    /* =====================================================
       5. SEARCH
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                currentSearch =
                    searchInput.value;

                applyFilters();

            }
        );

    }


    /* =====================================================
       6. SEVERITY FILTER BUTTONS

       Example HTML:

       <button
           data-alert-filter="all"
           class="active"
       >
           All
       </button>
    ===================================================== */

    severityFilters.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentSeverity =
                    button.dataset.alertFilter ||
                    "all";


                severityFilters.forEach(item => {
                    item.classList.remove("active");
                });


                button.classList.add("active");

                applyFilters();

            }
        );

    });


    /* =====================================================
       7. ALERT CARD EVENT DELEGATION
    ===================================================== */

    if (alertsContainer) {

        alertsContainer.addEventListener(
            "click",
            async event => {

                const detailsButton =
                    event.target.closest(
                        "[data-alert-details]"
                    );

                const acknowledgeButton =
                    event.target.closest(
                        "[data-acknowledge-alert]"
                    );


                // View Details
                if (detailsButton) {

                    const alertId =
                        detailsButton.dataset
                            .alertDetails;

                    showAlertDetails(alertId);

                    return;

                }


                // Acknowledge
                if (acknowledgeButton) {

                    const alertId =
                        acknowledgeButton.dataset
                            .acknowledgeAlert;

                    await acknowledgeAlert(
                        alertId,
                        acknowledgeButton
                    );

                }

            }
        );

    }


    /* =====================================================
       8. ACKNOWLEDGE ALERT
    ===================================================== */

    async function acknowledgeAlert(
        alertId,
        button
    ) {

        if (!alertId) return;


        const originalText =
            button.textContent;

        button.disabled = true;
        button.textContent = "Processing...";


        try {

            const response =
                await GeoRakshakAPI
                    .acknowledgeAlert(alertId);


            if (!response.success) {

                throw new Error(
                    response.message ||
                    "Unable to acknowledge alert."
                );

            }


            // Update local data
            const alertIndex =
                allAlerts.findIndex(
                    alert => alert.id === alertId
                );


            if (alertIndex !== -1) {

                allAlerts[alertIndex].status =
                    "acknowledged";

            }


            applyFilters();


            if (window.showToast) {

                window.showToast(
                    "Alert acknowledged successfully.",
                    "success"
                );

            }

        } catch (error) {

            console.error(
                "Acknowledge Error:",
                error
            );

            button.disabled = false;
            button.textContent = originalText;


            if (window.showToast) {

                window.showToast(
                    error.message ||
                    "Unable to acknowledge alert.",
                    "error"
                );

            }

        }

    }


    /* =====================================================
       9. ALERT DETAILS MODAL
    ===================================================== */

    function showAlertDetails(alertId) {

        const alert =
            allAlerts.find(
                item => item.id === alertId
            );

        if (!alert) return;


        let modal =
            document.getElementById(
                "alertDetailsModal"
            );


        // Create modal if it doesn't exist
        if (!modal) {

            modal =
                document.createElement("div");

            modal.id = "alertDetailsModal";
            modal.className = "alert-modal";

            document.body.appendChild(modal);

        }


        const severity =
            alert.severity || "low";

        const severityText =
            severity.charAt(0).toUpperCase() +
            severity.slice(1);


        modal.innerHTML = `
            <div class="alert-modal-overlay"></div>

            <div
                class="alert-modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="alertModalTitle"
            >

                <button
                    type="button"
                    class="alert-modal-close"
                    aria-label="Close alert details"
                >
                    ×
                </button>


                <span
                    class="
                        severity-badge
                        ${severity}-badge
                    "
                >
                    ${severityText} Risk
                </span>


                <h2 id="alertModalTitle">
                    ${escapeHTML(alert.title)}
                </h2>


                <div class="modal-detail-grid">

                    <div class="modal-detail">
                        <span>Location</span>

                        <strong>
                            ${escapeHTML(alert.location)}
                        </strong>
                    </div>


                    <div class="modal-detail">
                        <span>Risk Score</span>

                        <strong>
                            ${alert.riskScore}%
                        </strong>
                    </div>


                    <div class="modal-detail">
                        <span>Status</span>

                        <strong>
                            ${formatStatus(alert.status)}
                        </strong>
                    </div>


                    <div class="modal-detail">
                        <span>Generated</span>

                        <strong>
                            ${formatDate(
                                alert.createdAt
                            )}
                        </strong>
                    </div>

                </div>


                <div class="modal-message">

                    <span>Situation Assessment</span>

                    <p>
                        ${escapeHTML(alert.message)}
                    </p>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="
                            btn btn-secondary
                            close-modal-btn
                        "
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="
                            btn btn-primary
                            modal-view-map-btn
                        "
                    >
                        View on Map
                    </button>

                </div>

            </div>
        `;


        document.body.style.overflow = "hidden";


        requestAnimationFrame(() => {
            modal.classList.add("show");
        });


        const closeModal = () => {

            modal.classList.remove("show");

            document.body.style.overflow = "";


            setTimeout(() => {
                modal.remove();
            }, 250);

        };


        modal
            .querySelector(".alert-modal-overlay")
            .addEventListener(
                "click",
                closeModal
            );


        modal
            .querySelector(".alert-modal-close")
            .addEventListener(
                "click",
                closeModal
            );


        modal
            .querySelector(".close-modal-btn")
            .addEventListener(
                "click",
                closeModal
            );


        modal
            .querySelector(".modal-view-map-btn")
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        `map.html?alert=${encodeURIComponent(
                            alert.id
                        )}`;

                }
            );


        // Escape key closes modal
        const escapeHandler = event => {

            if (event.key === "Escape") {

                closeModal();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );

            }

        };

        document.addEventListener(
            "keydown",
            escapeHandler
        );

    }


    /* =====================================================
       10. LOADING STATE
    ===================================================== */

    function showLoading() {

        if (!alertsContainer) return;

        alertsContainer.innerHTML = `
            <div class="alerts-loading">

                <div class="loading-spinner"></div>

                <p>
                    Synchronizing landslide intelligence...
                </p>

            </div>
        `;

    }


    /* =====================================================
       11. ERROR STATE
    ===================================================== */

    function showError(message) {

        if (!alertsContainer) return;

        alertsContainer.innerHTML = `
            <div class="alerts-error-state">

                <div class="error-icon">
                    !
                </div>

                <h3>
                    Unable to Load Alerts
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="btn btn-primary retry-alerts-btn"
                >
                    Retry
                </button>

            </div>
        `;


        const retryButton =
            alertsContainer.querySelector(
                ".retry-alerts-btn"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadAlerts
            );

        }

    }


    /* =====================================================
       12. ALERT COUNT
    ===================================================== */

    function updateAlertCount(count) {

        if (!alertCount) return;

        alertCount.textContent =
            `${count} ${
                count === 1
                    ? "Alert"
                    : "Alerts"
            }`;

    }


    /* =====================================================
       13. DATE / TIME HELPERS
    ===================================================== */

    function getTimeAgo(dateString) {

        if (!dateString) {
            return "Unknown";
        }


        const date =
            new Date(dateString);

        const seconds =
            Math.floor(
                (Date.now() - date.getTime()) /
                1000
            );


        if (seconds < 60) {
            return "Just now";
        }


        const minutes =
            Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes}m ago`;
        }


        const hours =
            Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours}h ago`;
        }


        const days =
            Math.floor(hours / 24);

        return `${days}d ago`;

    }


    function formatDate(dateString) {

        if (!dateString) {
            return "Not available";
        }


        const date =
            new Date(dateString);


        return date.toLocaleString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }


    function formatStatus(status) {

        if (!status) {
            return "Unknown";
        }


        return status
            .split("-")
            .map(word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
            )
            .join(" ");

    }


    /* =====================================================
       14. BASIC XSS PROTECTION
       Escape text received from API before rendering.
    ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }


        const div =
            document.createElement("div");

        div.textContent = String(value);

        return div.innerHTML;

    }


    /* =====================================================
       15. AUTO REFRESH

       Refresh every 60 seconds in demo/prototype mode.

       Later, replace this with:
       - WebSocket
       - Server-Sent Events
       - Push notifications
    ===================================================== */

    let refreshInterval =
        setInterval(
            loadAlerts,
            60000
        );


    /*
       Stop unnecessary refreshes when page is hidden.
       Start again when user returns.
    */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                clearInterval(refreshInterval);

            } else {

                loadAlerts();

                refreshInterval =
                    setInterval(
                        loadAlerts,
                        60000
                    );

            }

        }
    );


    /* =====================================================
       16. INITIALIZE
    ===================================================== */

    loadAlerts();


    console.log(
        "%cGeoRakshak Alerts Module Ready",
        "color: #d84a4a; font-weight: bold;"
    );

});