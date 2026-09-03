/* =========================================================
   GEORAKSHAK - DASHBOARD JAVASCRIPT
   File: js/dashboard.js

   Handles:
   - Simulated live intelligence updates
   - Dashboard statistics
   - Risk zone interactions
   - Priority location interactions
   - Map marker interactions
   - Time range selection
   - Trend chart updates
   - Recommended action interactions

   Requires:
   - main.js loaded before this file
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       1. DASHBOARD DATA
       Later this can be replaced with API data
    ===================================================== */

    const dashboardData = {

        stats: {
            monitoredZones: 148,
            criticalZones: 3,
            highRiskZones: 11,
            citizenReports: 27
        },

        locations: [
            {
                id: "chamba-01",
                name: "Chamba Mountain Corridor",
                severity: "critical",
                risk: 94,
                population: 1240,
                roadStatus: "Restricted",
                rainfall: "82 mm"
            },
            {
                id: "kullu-02",
                name: "Kullu Valley Sector",
                severity: "high",
                risk: 81,
                population: 860,
                roadStatus: "Monitoring",
                rainfall: "67 mm"
            },
            {
                id: "mandi-03",
                name: "Mandi Highway Zone",
                severity: "high",
                risk: 76,
                population: 2150,
                roadStatus: "Open with caution",
                rainfall: "54 mm"
            },
            {
                id: "shimla-04",
                name: "Shimla Hills Region",
                severity: "moderate",
                risk: 58,
                population: 630,
                roadStatus: "Open",
                rainfall: "38 mm"
            }
        ],

        trends: {
            "7": [22, 31, 28, 42, 48, 39, 57],
            "30": [18, 24, 31, 28, 39, 46, 41, 52],
            "90": [15, 22, 18, 35, 29, 47, 44, 56]
        }

    };


    /* =====================================================
       2. HELPER FUNCTIONS
    ===================================================== */

    function getSeverityClass(severity) {

        const severityMap = {
            critical: "critical-badge",
            high: "high-badge",
            moderate: "moderate-badge",
            low: "low-badge"
        };

        return severityMap[severity] || "low-badge";

    }


    function formatSeverity(severity) {

        return severity.charAt(0).toUpperCase() +
               severity.slice(1);

    }


    function getSeverityColor(severity) {

        const colors = {
            critical: "#d84a4a",
            high: "#e07b39",
            moderate: "#d9a441",
            low: "#3c9b6d"
        };

        return colors[severity] || "#1f6f50";

    }


    /* =====================================================
       3. STATISTICS ANIMATION
    ===================================================== */

    function animateNumber(element, target) {

        if (!element) return;

        const duration = 900;
        const startTime = performance.now();

        const startValue =
            Number(
                element.dataset.current || 0
            );


        function update(currentTime) {

            const elapsed = currentTime - startTime;

            const progress =
                Math.min(elapsed / duration, 1);

            const value =
                Math.floor(
                    startValue +
                    (target - startValue) * progress
                );

            element.textContent =
                value.toLocaleString();

            if (progress < 1) {

                requestAnimationFrame(update);

            } else {

                element.dataset.current = target;

            }

        }

        requestAnimationFrame(update);

    }


    function updateDashboardStats() {

        const statElements =
            document.querySelectorAll(
                "[data-dashboard-stat]"
            );

        statElements.forEach(element => {

            const statName =
                element.dataset.dashboardStat;

            const target =
                dashboardData.stats[statName];

            if (typeof target === "number") {

                animateNumber(element, target);

            }

        });

    }


    /* =====================================================
       4. PRIORITY LOCATION INTERACTION

       Expected priority row:
       <div
           class="priority-row"
           data-location-id="chamba-01"
       >
    ===================================================== */

    const priorityRows =
        document.querySelectorAll(".priority-row");

    priorityRows.forEach(row => {

        row.addEventListener("click", () => {

            const locationId =
                row.dataset.locationId;

            const location =
                dashboardData.locations.find(
                    item => item.id === locationId
                );

            if (!location) return;


            // Remove selection from all rows
            priorityRows.forEach(item => {
                item.classList.remove("selected");
            });


            // Highlight selected row
            row.classList.add("selected");


            showLocationDetails(location);

        });


        // Keyboard support
        row.addEventListener("keydown", event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();
                row.click();

            }

        });

    });


    function showLocationDetails(location) {

        const message =
            `${location.name}: ` +
            `${formatSeverity(location.severity)} risk ` +
            `(${location.risk}%). ` +
            `Estimated affected population: ` +
            `${location.population.toLocaleString()}.`;

        if (window.showToast) {

            window.showToast(
                message,
                location.severity === "critical"
                    ? "error"
                    : "warning",
                5000
            );

        }


        // Highlight related map marker
        const marker =
            document.querySelector(
                `[data-location-id="${location.id}"]`
            );

        if (marker) {

            document
                .querySelectorAll(".map-marker")
                .forEach(item => {
                    item.classList.remove("marker-active");
                });

            marker.classList.add("marker-active");

            setTimeout(() => {
                marker.classList.remove("marker-active");
            }, 1800);

        }

    }


    /* =====================================================
       5. MAP MARKER INTERACTION

       Add data-location-id in dashboard.html:

       <div class="map-marker"
            data-location-id="chamba-01">
    ===================================================== */

    const mapMarkers =
        document.querySelectorAll(".map-marker");

    mapMarkers.forEach(marker => {

        marker.addEventListener("click", () => {

            const locationId =
                marker.dataset.locationId;

            const location =
                dashboardData.locations.find(
                    item => item.id === locationId
                );

            if (!location) return;


            showLocationDetails(location);


            // Also highlight matching priority row
            priorityRows.forEach(row => {

                row.classList.toggle(
                    "selected",
                    row.dataset.locationId === locationId
                );

            });

        });

    });


    /* =====================================================
       6. TIME RANGE / TREND CHART

       Expected select:

       <select class="dashboard-select"
               id="trendRange">
           <option value="7">Last 7 Days</option>
           <option value="30">Last 30 Days</option>
           <option value="90">Last 90 Days</option>
       </select>
    ===================================================== */

    const trendRange =
        document.getElementById("trendRange");

    if (trendRange) {

        trendRange.addEventListener("change", () => {

            const range = trendRange.value;

            updateTrendChart(range);

            if (window.showToast) {

                window.showToast(
                    `Risk trend updated for the last ${range} days.`,
                    "info"
                );

            }

        });

    }


    function updateTrendChart(range) {

        const trendData =
            dashboardData.trends[range];

        if (!trendData) return;


        const chartPoints =
            document.querySelector(".chart-points");

        if (!chartPoints) return;


        chartPoints.innerHTML = "";


        const maxValue =
            Math.max(...trendData);


        trendData.forEach((value, index) => {

            const point =
                document.createElement("span");

            /*
               Convert value to a visual height.
               Higher risk value = higher chart point.
            */

            const height =
                (value / maxValue) * 75 + 10;

            point.style.bottom = `${height}%`;

            point.title =
                `Data Point ${index + 1}: ${value}`;

            point.setAttribute(
                "aria-label",
                `Risk index ${value}`
            );


            chartPoints.appendChild(point);

        });


        updateChartLines(trendData);

    }


    function updateChartLines(trendData) {

        const chart =
            document.querySelector(".trend-chart");

        if (!chart) return;


        /*
           This version keeps the CSS chart structure
           but updates a custom property that can be
           used for future SVG/Canvas integration.
        */

        const average =
            trendData.reduce(
                (sum, value) => sum + value,
                0
            ) / trendData.length;


        chart.dataset.averageRisk =
            Math.round(average);

        chart.setAttribute(
            "aria-label",
            `Average risk index: ${Math.round(average)}`
        );

    }


    /* =====================================================
       7. RECOMMENDED ACTION BUTTONS

       Supports buttons with:

       data-action="evacuate"
       data-action="inspect"
       data-action="monitor"
       data-action="view-map"
    ===================================================== */

    const actionButtons =
        document.querySelectorAll("[data-action]");

    actionButtons.forEach(button => {

        button.addEventListener("click", () => {

            const action =
                button.dataset.action;

            handleRecommendedAction(action);

        });

    });


    function handleRecommendedAction(action) {

        const actions = {

            evacuate: {
                message:
                    "Evacuation priority workflow initiated for critical zones.",
                type: "warning"
            },

            inspect: {
                message:
                    "Field inspection request has been added to the response queue.",
                type: "info"
            },

            monitor: {
                message:
                    "Enhanced monitoring enabled for selected high-risk zones.",
                type: "success"
            },

            "view-map": {
                message:
                    "Opening detailed risk map...",
                type: "info",
                redirect: "map.html"
            }

        };


        const selectedAction =
            actions[action];

        if (!selectedAction) return;


        if (window.showToast) {

            window.showToast(
                selectedAction.message,
                selectedAction.type
            );

        }


        if (selectedAction.redirect) {

            setTimeout(() => {

                window.location.href =
                    selectedAction.redirect;

            }, 700);

        }

    }


    /* =====================================================
       8. SIMULATED LIVE DATA UPDATES

       This is ONLY for prototype/demo purposes.
       Replace with WebSocket/API polling in production.
    ===================================================== */

    function simulateLiveUpdate() {

        /*
           Small probability of receiving
           a new citizen report.
        */

        const newReportChance =
            Math.random();

        if (newReportChance > 0.72) {

            dashboardData.stats.citizenReports += 1;

            updateDashboardStats();

            if (window.showToast) {

                window.showToast(
                    "New citizen field report received.",
                    "info"
                );

            }

        }


        /*
           Simulate small changes in risk score.
        */

        dashboardData.locations.forEach(location => {

            const change =
                Math.floor(Math.random() * 5) - 2;

            location.risk =
                Math.max(
                    0,
                    Math.min(
                        100,
                        location.risk + change
                    )
                );

        });

    }


    /*
       Demo refresh every 30 seconds.
       Remove this interval when real backend
       data integration is implemented.
    */

    const liveUpdateInterval =
        setInterval(
            simulateLiveUpdate,
            30000
        );


    /* =====================================================
       9. PAGE VISIBILITY OPTIMIZATION
       Pause unnecessary demo updates when tab is hidden
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                clearInterval(liveUpdateInterval);

            }

        }
    );


    /* =====================================================
       10. INITIAL DASHBOARD LOAD
    ===================================================== */

    updateDashboardStats();


    // Initialize trend chart based on current selection
    if (trendRange) {

        updateTrendChart(trendRange.value);

    }


    /* =====================================================
       11. INITIAL LOAD MESSAGE

       Uncomment for SIH demo if desired.

       setTimeout(() => {
           if (window.showToast) {
               window.showToast(
                   "GeoRakshak intelligence data synchronized.",
                   "success"
               );
           }
       }, 700);
    ===================================================== */

});