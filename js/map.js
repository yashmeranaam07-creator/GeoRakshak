/* =========================================================
   GEORAKSHAK - MAP JAVASCRIPT
   File: js/map.js

   Handles:
   - Fetching risk locations from api.js
   - Interactive prototype GIS map
   - Severity filtering
   - Location search
   - Map markers
   - Location details panel
   - URL parameters from alerts/dashboard
   - Reset view
   - Live data refresh

   Requires:
   - main.js
   - api.js

   NOTE:
   This is a frontend prototype map.
   Replace the map rendering section with Leaflet/Mapbox
   when integrating a real GIS basemap.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    let allLocations = [];
    let filteredLocations = [];
    let selectedLocationId = null;
    let currentSeverity = "all";


    /* =====================================================
       1. DOM ELEMENTS
    ===================================================== */

    const mapCanvas =
        document.querySelector(".risk-map-canvas");

    const locationList =
        document.querySelector(".map-location-list");

    const searchInput =
        document.getElementById("mapSearch");

    const severityFilters =
        document.querySelectorAll("[data-map-filter]");

    const locationCount =
        document.querySelector("[data-map-location-count]");

    const detailsPanel =
        document.querySelector(".map-details-panel");

    const resetButton =
        document.querySelector("[data-map-reset]");

    const fullscreenButton =
        document.querySelector("[data-map-fullscreen]");


    /* =====================================================
       2. SEVERITY CONFIGURATION
    ===================================================== */

    const severityConfig = {
        critical: {
            label: "Critical",
            className: "critical",
            icon: "!"
        },

        high: {
            label: "High",
            className: "high",
            icon: "!"
        },

        moderate: {
            label: "Moderate",
            className: "moderate",
            icon: "!"
        },

        low: {
            label: "Low",
            className: "low",
            icon: "✓"
        }
    };


    /* =====================================================
       3. LOAD RISK LOCATIONS
    ===================================================== */

    async function loadLocations() {

        if (!mapCanvas) return;

        showMapLoading();

        try {

            const response =
                await GeoRakshakAPI.getRiskLocations();

            if (!response.success) {

                throw new Error(
                    "Unable to load risk locations."
                );

            }

            allLocations = response.data || [];


            /*
               Check if an alert was passed through URL.

               Example:
               map.html?alert=alert-001
            */

            await handleURLParameters();


            applyFilters();

        } catch (error) {

            console.error(
                "GeoRakshak Map Error:",
                error
            );

            showMapError(
                error.message ||
                "Unable to load map intelligence."
            );

        }

    }


    /* =====================================================
       4. URL PARAMETERS
    ===================================================== */

    async function handleURLParameters() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const alertId =
            params.get("alert");

        const locationId =
            params.get("location");


        /*
           Direct location parameter

           Example:
           map.html?location=chamba-01
        */

        if (locationId) {

            const exists =
                allLocations.some(
                    location =>
                        location.id === locationId
                );

            if (exists) {

                selectedLocationId = locationId;

            }

            return;

        }


        /*
           Alert parameter

           Example:
           map.html?alert=alert-001

           Fetch alert and match it to a location.
        */

        if (alertId) {

            try {

                const response =
                    await GeoRakshakAPI.getAlertById(
                        alertId
                    );

                if (
                    response.success &&
                    response.data
                ) {

                    const alert =
                        response.data;


                    /*
                       Match by location name.
                       Production version should use
                       a locationId directly in alert data.
                    */

                    const matchedLocation =
                        allLocations.find(
                            location =>
                                location.name ===
                                alert.location
                        );


                    if (matchedLocation) {

                        selectedLocationId =
                            matchedLocation.id;

                    }

                }

            } catch (error) {

                console.warn(
                    "Unable to resolve alert location:",
                    error
                );

            }

        }

    }


    /* =====================================================
       5. APPLY FILTERS
    ===================================================== */

    function applyFilters() {

        filteredLocations =
            [...allLocations];


        // Severity filter
        if (currentSeverity !== "all") {

            filteredLocations =
                filteredLocations.filter(
                    location =>
                        location.severity ===
                        currentSeverity
                );

        }


        // Search filter
        const searchTerm =
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : "";


        if (searchTerm) {

            filteredLocations =
                filteredLocations.filter(
                    location => {

                        const searchableText =
                            [
                                location.name,
                                location.district,
                                location.state
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                        return searchableText.includes(
                            searchTerm
                        );

                    }
                );

        }


        renderMapMarkers();
        renderLocationList();
        updateLocationCount();


        /*
           Re-select location after rendering
           if selected through URL.
        */

        if (selectedLocationId) {

            const selectedExists =
                filteredLocations.some(
                    location =>
                        location.id ===
                        selectedLocationId
                );


            if (selectedExists) {

                selectLocation(
                    selectedLocationId,
                    false
                );

            }

        }

    }


    /* =====================================================
       6. RENDER MAP MARKERS
    ===================================================== */

    function renderMapMarkers() {

        if (!mapCanvas) return;


        /*
           Preserve decorative map layers if present.
           Only remove dynamically generated markers.
        */

        mapCanvas
            .querySelectorAll(
                ".dynamic-map-marker"
            )
            .forEach(marker => marker.remove());


        if (filteredLocations.length === 0) {
            return;
        }


        filteredLocations.forEach(
            (location, index) => {

                const marker =
                    createMapMarker(
                        location,
                        index
                    );

                mapCanvas.appendChild(marker);

            }
        );

    }


    function createMapMarker(
        location,
        index
    ) {

        const marker =
            document.createElement("button");

        marker.type = "button";

        marker.className =
            `dynamic-map-marker marker-${location.severity}`;

        marker.dataset.locationId =
            location.id;

        marker.setAttribute(
            "aria-label",
            `${location.name}: ${location.riskScore}% risk`
        );


        /*
           Prototype marker positions.

           In real GIS integration:
           latitude + longitude will be converted
           into actual map coordinates automatically.
        */

        const position =
            getMarkerPosition(
                location,
                index
            );

        marker.style.left =
            `${position.left}%`;

        marker.style.top =
            `${position.top}%`;


        const config =
            severityConfig[
                location.severity
            ] ||
            severityConfig.low;


        marker.innerHTML = `
            <span class="marker-pin">
                ${config.icon}
            </span>

            <span class="marker-tooltip">
                ${escapeHTML(location.name)}
                <strong>
                    ${location.riskScore}% Risk
                </strong>
            </span>
        `;


        marker.addEventListener(
            "click",
            () => {

                selectLocation(
                    location.id
                );

            }
        );


        return marker;

    }


    /*
       Generate stable demo positions.

       IMPORTANT:
       This is only for the frontend prototype.
       It does NOT represent actual geographic
       positioning from latitude/longitude.
    */

    function getMarkerPosition(
        location,
        index
    ) {

        const presetPositions = {

            "chamba-01": {
                left: 68,
                top: 28
            },

            "kullu-02": {
                left: 42,
                top: 48
            },

            "mandi-03": {
                left: 57,
                top: 68
            },

            "shimla-04": {
                left: 76,
                top: 72
            }

        };


        if (
            presetPositions[location.id]
        ) {

            return presetPositions[
                location.id
            ];

        }


        /*
           Fallback for future API locations.
        */

        return {
            left: 15 + ((index * 17) % 70),
            top: 18 + ((index * 23) % 65)
        };

    }


    /* =====================================================
       7. RENDER LOCATION LIST
    ===================================================== */

    function renderLocationList() {

        if (!locationList) return;


        if (filteredLocations.length === 0) {

            locationList.innerHTML = `
                <div class="map-empty-state">

                    <div class="empty-map-icon">
                        ⌖
                    </div>

                    <h3>
                        No Risk Zones Found
                    </h3>

                    <p>
                        Try changing your search
                        or severity filter.
                    </p>

                </div>
            `;

            return;

        }


        const severityOrder = {
            critical: 1,
            high: 2,
            moderate: 3,
            low: 4
        };


        const sortedLocations =
            [...filteredLocations].sort(
                (a, b) => {

                    return (
                        severityOrder[a.severity] -
                        severityOrder[b.severity]
                    );

                }
            );


        locationList.innerHTML =
            sortedLocations
                .map(location => {

                    const isSelected =
                        location.id ===
                        selectedLocationId;


                    return `
                        <button
                            type="button"
                            class="
                                map-location-item
                                ${
                                    isSelected
                                        ? "selected"
                                        : ""
                                }
                            "
                            data-map-location="${escapeHTML(
                                location.id
                            )}"
                        >

                            <span
                                class="
                                    location-risk-dot
                                    dot-${location.severity}
                                "
                            ></span>


                            <span class="location-item-content">

                                <strong>
                                    ${escapeHTML(
                                        location.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        location.district
                                    )},
                                    ${escapeHTML(
                                        location.state
                                    )}
                                </small>

                            </span>


                            <span
                                class="
                                    location-risk-value
                                    value-${location.severity}
                                "
                            >
                                ${location.riskScore}%
                            </span>

                        </button>
                    `;

                })
                .join("");

    }


    /* =====================================================
       8. LOCATION LIST CLICK
    ===================================================== */

    if (locationList) {

        locationList.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        "[data-map-location]"
                    );

                if (!item) return;


                selectLocation(
                    item.dataset.mapLocation
                );

            }
        );

    }


    /* =====================================================
       9. SELECT LOCATION
    ===================================================== */

    function selectLocation(
        locationId,
        showNotification = true
    ) {

        const location =
            allLocations.find(
                item =>
                    item.id === locationId
            );

        if (!location) return;


        selectedLocationId =
            locationId;


        /*
           Update markers
        */

        document
            .querySelectorAll(
                ".dynamic-map-marker"
            )
            .forEach(marker => {

                marker.classList.toggle(
                    "active",
                    marker.dataset.locationId ===
                    locationId
                );

            });


        /*
           Update location list
        */

        document
            .querySelectorAll(
                ".map-location-item"
            )
            .forEach(item => {

                item.classList.toggle(
                    "selected",
                    item.dataset.mapLocation ===
                    locationId
                );

            });


        /*
           Update details panel
        */

        renderLocationDetails(location);


        /*
           Scroll selected list item into view.
        */

        const selectedItem =
            document.querySelector(
                `[data-map-location="${locationId}"]`
            );

        if (selectedItem) {

            selectedItem.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }


        if (
            showNotification &&
            window.showToast
        ) {

            const type =
                location.severity === "critical"
                    ? "error"
                    : location.severity === "high"
                        ? "warning"
                        : "info";


            window.showToast(
                `${location.name}: ${location.riskScore}% landslide risk.`,
                type
            );

        }

    }


    /* =====================================================
       10. LOCATION DETAILS PANEL
    ===================================================== */

    function renderLocationDetails(location) {

        if (!detailsPanel) return;


        const severity =
            severityConfig[
                location.severity
            ] ||
            severityConfig.low;


        detailsPanel.innerHTML = `

            <div
                class="
                    map-details-header
                    details-${location.severity}
                "
            >

                <div>

                    <span
                        class="
                            severity-badge
                            ${location.severity}-badge
                        "
                    >
                        ${severity.label} Risk
                    </span>

                    <h2>
                        ${escapeHTML(location.name)}
                    </h2>

                    <p>
                        ${escapeHTML(
                            location.district
                        )},
                        ${escapeHTML(
                            location.state
                        )}
                    </p>

                </div>

                <div class="details-risk-score">

                    <strong>
                        ${location.riskScore}%
                    </strong>

                    <span>
                        Risk Score
                    </span>

                </div>

            </div>


            <div class="map-details-grid">

                <div class="map-detail-card">

                    <span class="detail-label">
                        Rainfall
                    </span>

                    <strong>
                        ${location.rainfall ?? "N/A"} mm
                    </strong>

                </div>


                <div class="map-detail-card">

                    <span class="detail-label">
                        Affected Population
                    </span>

                    <strong>
                        ${Number(
                            location.affectedPopulation || 0
                        ).toLocaleString()}
                    </strong>

                </div>


                <div class="map-detail-card">

                    <span class="detail-label">
                        Road Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            location.roadStatus ||
                            "Unknown"
                        )}
                    </strong>

                </div>


                <div class="map-detail-card">

                    <span class="detail-label">
                        Coordinates
                    </span>

                    <strong>
                        ${
                            location.latitude?.toFixed?.(4)
                            ?? "N/A"
                        },
                        ${
                            location.longitude?.toFixed?.(4)
                            ?? "N/A"
                        }
                    </strong>

                </div>

            </div>


            <div class="map-details-action">

                <button
                    type="button"
                    class="btn btn-primary"
                    data-open-location-alerts
                >
                    View Related Alerts
                </button>

            </div>
        `;


        const relatedAlertsButton =
            detailsPanel.querySelector(
                "[data-open-location-alerts]"
            );


        if (relatedAlertsButton) {

            relatedAlertsButton.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `alerts.html?location=${encodeURIComponent(
                            location.name
                        )}`;

                }
            );

        }

    }


    /* =====================================================
       11. SEVERITY FILTERS
    ===================================================== */

    severityFilters.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentSeverity =
                    button.dataset.mapFilter ||
                    "all";


                severityFilters.forEach(item => {
                    item.classList.remove("active");
                });


                button.classList.add("active");


                /*
                   Clear selection if it is no longer
                   visible under the new filter.
                */

                if (
                    selectedLocationId &&
                    !filteredLocations.some(
                        location =>
                            location.id ===
                            selectedLocationId
                    )
                ) {

                    selectedLocationId = null;

                }


                applyFilters();

            }
        );

    });


    /* =====================================================
       12. MAP SEARCH
    ===================================================== */

    if (searchInput) {

        let searchTimeout;


        searchInput.addEventListener(
            "input",
            () => {

                clearTimeout(searchTimeout);


                /*
                   Small debounce to prevent excessive
                   rendering while typing.
                */

                searchTimeout =
                    setTimeout(
                        applyFilters,
                        250
                    );

            }
        );

    }


    /* =====================================================
       13. RESET MAP VIEW
    ===================================================== */

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                selectedLocationId = null;
                currentSeverity = "all";


                if (searchInput) {
                    searchInput.value = "";
                }


                severityFilters.forEach(button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.mapFilter ===
                        "all"
                    );

                });


                if (detailsPanel) {

                    detailsPanel.innerHTML = `
                        <div class="map-details-placeholder">

                            <div>
                                ⌖
                            </div>

                            <h3>
                                Select a Risk Zone
                            </h3>

                            <p>
                                Click on a map marker or
                                select a location to view
                                detailed landslide intelligence.
                            </p>

                        </div>
                    `;

                }


                applyFilters();


                if (window.showToast) {

                    window.showToast(
                        "Map view reset successfully.",
                        "info"
                    );

                }

            }
        );

    }


    /* =====================================================
       14. FULLSCREEN MAP
    ===================================================== */

    if (fullscreenButton && mapCanvas) {

        fullscreenButton.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        !document.fullscreenElement
                    ) {

                        await mapCanvas.requestFullscreen();

                    } else {

                        await document.exitFullscreen();

                    }

                } catch (error) {

                    console.warn(
                        "Fullscreen unavailable:",
                        error
                    );

                    if (window.showToast) {

                        window.showToast(
                            "Fullscreen mode is not supported on this device.",
                            "warning"
                        );

                    }

                }

            }
        );

    }


    /* =====================================================
       15. LOCATION COUNT
    ===================================================== */

    function updateLocationCount() {

        if (!locationCount) return;


        locationCount.textContent =
            `${filteredLocations.length} ${
                filteredLocations.length === 1
                    ? "Zone"
                    : "Zones"
            }`;

    }


    /* =====================================================
       16. MAP LOADING STATE
    ===================================================== */

    function showMapLoading() {

        if (!mapCanvas) return;


        const loading =
            document.createElement("div");

        loading.className =
            "map-loading-overlay";

        loading.innerHTML = `
            <div class="loading-spinner"></div>

            <p>
                Loading geospatial intelligence...
            </p>
        `;

        mapCanvas.appendChild(loading);

    }


    /* =====================================================
       17. MAP ERROR STATE
    ===================================================== */

    function showMapError(message) {

        if (!mapCanvas) return;


        mapCanvas.innerHTML = `
            <div class="map-error-state">

                <div class="error-icon">
                    !
                </div>

                <h3>
                    Map Data Unavailable
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    data-map-retry
                >
                    Retry
                </button>

            </div>
        `;


        const retryButton =
            mapCanvas.querySelector(
                "[data-map-retry]"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadLocations
            );

        }

    }


    /* =====================================================
       18. ESCAPE HTML
       Protect API text before rendering.
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

        div.textContent =
            String(value);

        return div.innerHTML;

    }


    /* =====================================================
       19. AUTO REFRESH

       Refresh every 60 seconds.

       In production:
       - WebSocket for instant critical updates
       - API polling as fallback
    ===================================================== */

    let refreshInterval =
        setInterval(
            loadLocations,
            60000
        );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                clearInterval(refreshInterval);

            } else {

                loadLocations();

                refreshInterval =
                    setInterval(
                        loadLocations,
                        60000
                    );

            }

        }
    );


    /* =====================================================
       20. INITIALIZE MAP
    ===================================================== */

    loadLocations();


    console.log(
        "%cGeoRakshak GIS Module Ready",
        "color: #1f6f50; font-weight: bold;"
    );

});