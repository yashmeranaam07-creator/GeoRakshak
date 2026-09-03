/* =========================================================
   GEORAKSHAK - INTERACTIVE RISK MAP
   File: js/map.js
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. CHECK LEAFLET
    ===================================================== */

    if (typeof L === "undefined") {
        console.error("Leaflet failed to load.");
        return;
    }

    const mapElement = document.getElementById("landslideMap");

    if (!mapElement) {
        console.error("Map container #landslideMap not found.");
        return;
    }


    /* =====================================================
       2. INITIAL MAP
       
       Default location: Uttarakhand, India
    ===================================================== */

    const defaultCenter = [30.3165, 78.0322];
    const defaultZoom = 9;

    const map = L.map("landslideMap", {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true
    });


    /* =====================================================
       3. REAL OPENSTREETMAP TILES
    ===================================================== */

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ).addTo(map);


    /* =====================================================
       4. LAYER GROUPS
    ===================================================== */

    const riskZonesGroup = L.layerGroup().addTo(map);
    const roadsGroup = L.layerGroup().addTo(map);
    const populationGroup = L.layerGroup().addTo(map);
    const infrastructureGroup = L.layerGroup().addTo(map);
    const reportsGroup = L.layerGroup().addTo(map);


    /* =====================================================
       5. RISK DATA
    ===================================================== */

    const zones = [

        {
            id: "zone-a17",
            name: "Zone A-17",
            location: "Mussoorie - Dehradun Corridor",
            lat: 30.4595,
            lng: 78.0669,
            risk: "critical",
            score: 82,
            population: "1,250",
            roads: "2",
            villages: "3",
            action: "Alert & Field Verification"
        },

        {
            id: "zone-b12",
            name: "Zone B-12",
            location: "Tehri Garhwal Region",
            lat: 30.3782,
            lng: 78.4800,
            risk: "critical",
            score: 88,
            population: "980",
            roads: "1",
            villages: "2",
            action: "Immediate Field Assessment"
        },

        {
            id: "zone-c08",
            name: "Zone C-08",
            location: "Rishikesh Hills",
            lat: 30.0869,
            lng: 78.2676,
            risk: "high",
            score: 71,
            population: "760",
            roads: "1",
            villages: "2",
            action: "Enhanced Monitoring"
        },

        {
            id: "zone-d21",
            name: "Zone D-21",
            location: "Pauri Garhwal",
            lat: 30.1460,
            lng: 78.7775,
            risk: "high",
            score: 68,
            population: "640",
            roads: "1",
            villages: "2",
            action: "Field Verification Recommended"
        },

        {
            id: "zone-e14",
            name: "Zone E-14",
            location: "Narendranagar Area",
            lat: 30.1610,
            lng: 78.2870,
            risk: "high",
            score: 65,
            population: "650",
            roads: "1",
            villages: "1",
            action: "Monitor Rainfall Conditions"
        },

        {
            id: "zone-f09",
            name: "Zone F-09",
            location: "Dhanaulti Region",
            lat: 30.4445,
            lng: 78.2430,
            risk: "moderate",
            score: 52,
            population: "520",
            roads: "1",
            villages: "2",
            action: "Routine Monitoring"
        },

        {
            id: "zone-g05",
            name: "Zone G-05",
            location: "Chamba Region",
            lat: 30.3380,
            lng: 78.2380,
            risk: "moderate",
            score: 48,
            population: "410",
            roads: "0",
            villages: "1",
            action: "Observe Terrain Conditions"
        },

        {
            id: "zone-h19",
            name: "Zone H-19",
            location: "Rajpur Hills",
            lat: 30.3790,
            lng: 78.0900,
            risk: "moderate",
            score: 44,
            population: "380",
            roads: "0",
            villages: "1",
            action: "Routine Monitoring"
        }

    ];


    /* =====================================================
       6. RISK COLORS
    ===================================================== */

    const riskColors = {
        critical: "#d64545",
        high: "#e67e22",
        moderate: "#d9a441",
        low: "#2f8a62"
    };


    /* =====================================================
       7. ACTIVE FILTERS
    ===================================================== */

    const activeRisks = {
        critical: true,
        high: true,
        moderate: true,
        low: true
    };


    /* =====================================================
       8. UPDATE SELECTED LOCATION PANEL
    ===================================================== */

    function updateSelectedZone(zone) {

        const severity = document.getElementById(
            "selectedZoneSeverity"
        );

        const name = document.getElementById(
            "selectedZoneName"
        );

        const location = document.getElementById(
            "selectedZoneLocation"
        );

        const risk = document.getElementById(
            "selectedZoneRisk"
        );

        const progress = document.getElementById(
            "selectedZoneProgress"
        );

        const population = document.getElementById(
            "selectedPopulation"
        );

        const roads = document.getElementById(
            "selectedRoads"
        );

        const villages = document.getElementById(
            "selectedVillages"
        );

        const action = document.getElementById(
            "selectedAction"
        );


        if (severity) {

            severity.textContent = zone.risk.toUpperCase();

            severity.className =
                "severity-badge " +
                zone.risk +
                "-badge";

        }


        if (name) {
            name.textContent = zone.name;
        }

        if (location) {
            location.textContent = zone.location;
        }

        if (risk) {
            risk.textContent = zone.score + "%";
        }

        if (progress) {

            progress.style.width =
                zone.score + "%";

            progress.style.background =
                riskColors[zone.risk];

        }

        if (population) {
            population.textContent = zone.population;
        }

        if (roads) {
            roads.textContent = zone.roads;
        }

        if (villages) {
            villages.textContent = zone.villages;
        }

        if (action) {
            action.textContent = zone.action;
        }

    }


    /* =====================================================
       9. DRAW RISK ZONES
    ===================================================== */

    function drawRiskZones() {

        riskZonesGroup.clearLayers();


        zones.forEach(function (zone) {

            if (!activeRisks[zone.risk]) {
                return;
            }


            const color = riskColors[zone.risk];


            const circle = L.circle(
                [zone.lat, zone.lng],
                {
                    radius:
                        zone.risk === "critical"
                            ? 4500
                            : zone.risk === "high"
                            ? 3500
                            : 2800,

                    color: color,

                    fillColor: color,

                    fillOpacity: 0.25,

                    weight: 2
                }
            );


            circle.bindPopup(`
                <div class="georakshak-popup">
                    <strong>${zone.name}</strong>
                    <br>
                    <small>${zone.location}</small>
                    <hr>
                    <b>Risk Level:</b>
                    ${zone.risk.toUpperCase()}
                    <br>
                    <b>Risk Score:</b>
                    ${zone.score}%
                    <br>
                    <b>Population:</b>
                    ${zone.population}
                    <br>
                    <b>Roads at Risk:</b>
                    ${zone.roads}
                    <br>
                    <br>
                    <b>Action:</b>
                    ${zone.action}
                </div>
            `);


            circle.on("click", function () {

                updateSelectedZone(zone);

                map.setView(
                    [zone.lat, zone.lng],
                    12
                );

            });


            circle.addTo(riskZonesGroup);

        });

    }


    /* =====================================================
       10. ROAD NETWORK
    ===================================================== */

    const roads = [

        [
            [30.3165, 78.0322],
            [30.3800, 78.0800],
            [30.4595, 78.0669]
        ],

        [
            [30.0869, 78.2676],
            [30.1610, 78.2870],
            [30.3380, 78.2380]
        ],

        [
            [30.3380, 78.2380],
            [30.3782, 78.4800]
        ]

    ];


    roads.forEach(function (road, index) {

        const polyline = L.polyline(
            road,
            {
                color:
                    index === 0
                        ? "#d64545"
                        : "#e67e22",

                weight: 5,

                opacity: 0.75,

                dashArray:
                    index === 0
                        ? "10, 8"
                        : null
            }
        );


        polyline.bindPopup(`
            <strong>Road Segment R-${index + 1}</strong>
            <br>
            Connectivity monitoring active
            <br>
            Status: At Risk
        `);


        polyline.addTo(roadsGroup);

    });


    /* =====================================================
       11. POPULATION EXPOSURE
    ===================================================== */

    const populationPoints = [

        {
            name: "Population Cluster A",
            coords: [30.4510, 78.0740],
            people: "1,250 people potentially exposed"
        },

        {
            name: "Population Cluster B",
            coords: [30.3700, 78.4700],
            people: "980 people potentially exposed"
        },

        {
            name: "Population Cluster C",
            coords: [30.0950, 78.2750],
            people: "760 people potentially exposed"
        }

    ];


    populationPoints.forEach(function (point) {

        const marker = L.marker(
            point.coords,
            {
                icon: L.divIcon({
                    className: "population-marker",
                    html: "👥",
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }
        );


        marker.bindPopup(`
            <strong>${point.name}</strong>
            <br>
            ${point.people}
        `);


        marker.addTo(populationGroup);

    });


    /* =====================================================
       12. INFRASTRUCTURE
    ===================================================== */

    const infrastructure = [

        {
            name: "District Hospital",
            type: "Critical Infrastructure",
            coords: [30.3250, 78.0500],
            icon: "🏥"
        },

        {
            name: "Emergency Response Centre",
            type: "Emergency Infrastructure",
            coords: [30.4300, 78.1000],
            icon: "🚑"
        },

        {
            name: "Bridge Monitoring Point",
            type: "Road Infrastructure",
            coords: [30.2000, 78.2800],
            icon: "🌉"
        }

    ];


    infrastructure.forEach(function (place) {

        const marker = L.marker(
            place.coords,
            {
                icon: L.divIcon({
                    className: "infrastructure-marker",
                    html: place.icon,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                })
            }
        );


        marker.bindPopup(`
            <strong>${place.name}</strong>
            <br>
            ${place.type}
        `);


        marker.addTo(infrastructureGroup);

    });


    /* =====================================================
       13. GROUND REPORTS
    ===================================================== */

    const reports = [

        {
            title: "Fresh Soil Movement Reported",
            coords: [30.4700, 78.0500],
            time: "10 minutes ago"
        },

        {
            title: "Road Crack Observation",
            coords: [30.3500, 78.2200],
            time: "25 minutes ago"
        },

        {
            title: "Heavy Debris Near Road",
            coords: [30.1400, 78.3000],
            time: "42 minutes ago"
        },

        {
            title: "Slope Instability Report",
            coords: [30.1000, 78.2600],
            time: "1 hour ago"
        }

    ];


    reports.forEach(function (report) {

        const marker = L.marker(
            report.coords,
            {
                icon: L.divIcon({
                    className: "report-marker",
                    html: "⚑",
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }
        );


        marker.bindPopup(`
            <strong>Ground Report</strong>
            <br>
            ${report.title}
            <br>
            <small>${report.time}</small>
        `);


        marker.addTo(reportsGroup);

    });


    /* =====================================================
       14. INITIAL DRAW
    ===================================================== */

    drawRiskZones();

    updateSelectedZone(zones[0]);


    /* =====================================================
       15. RISK FILTER BUTTONS
    ===================================================== */

    const riskButtons = document.querySelectorAll(
        ".map-risk-item"
    );


    riskButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const risk =
                    button.dataset.risk;


                activeRisks[risk] =
                    !activeRisks[risk];


                button.classList.toggle(
                    "active",
                    activeRisks[risk]
                );


                drawRiskZones();

            }
        );

    });


    /* =====================================================
       16. LAYER TOGGLES
    ===================================================== */

    function toggleLayer(
        checkboxId,
        layerGroup
    ) {

        const checkbox =
            document.getElementById(checkboxId);


        if (!checkbox) {
            return;
        }


        checkbox.addEventListener(
            "change",
            function () {

                if (this.checked) {

                    if (!map.hasLayer(layerGroup)) {
                        map.addLayer(layerGroup);
                    }

                } else {

                    if (map.hasLayer(layerGroup)) {
                        map.removeLayer(layerGroup);
                    }

                }

            }
        );

    }


    toggleLayer(
        "riskZonesLayer",
        riskZonesGroup
    );

    toggleLayer(
        "roadsLayer",
        roadsGroup
    );

    toggleLayer(
        "populationLayer",
        populationGroup
    );

    toggleLayer(
        "infrastructureLayer",
        infrastructureGroup
    );

    toggleLayer(
        "reportsLayer",
        reportsGroup
    );


    /* =====================================================
       17. LOCATION SEARCH
       
       Searches existing GeoRakshak zones
    ===================================================== */

    const searchInput =
        document.getElementById("locationSearch");

    const searchButton =
        document.getElementById("locationSearchBtn");


    function searchLocation() {

        if (!searchInput) {
            return;
        }


        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {
            return;
        }


        const foundZone =
            zones.find(function (zone) {

                return (
                    zone.name
                        .toLowerCase()
                        .includes(query)

                    ||

                    zone.location
                        .toLowerCase()
                        .includes(query)
                );

            });


        if (foundZone) {

            map.setView(
                [
                    foundZone.lat,
                    foundZone.lng
                ],
                13
            );


            updateSelectedZone(foundZone);

            L.popup()
                .setLatLng(
                    [
                        foundZone.lat,
                        foundZone.lng
                    ]
                )
                .setContent(`
                    <strong>${foundZone.name}</strong>
                    <br>
                    ${foundZone.location}
                    <br>
                    Risk: ${foundZone.risk.toUpperCase()}
                `)
                .openOn(map);


        } else {

            alert(
                "No monitored location found for: " +
                searchInput.value
            );

        }

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchLocation
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    searchLocation();
                }

            }
        );

    }


    /* =====================================================
       18. DISTRICT SELECT
    ===================================================== */

    const districtSelect =
        document.getElementById("districtSelect");


    if (districtSelect) {

        districtSelect.addEventListener(
            "change",
            function () {

                const value = this.value;


                if (value === "all") {

                    map.setView(
                        defaultCenter,
                        defaultZoom
                    );

                }


                if (value === "district-a") {

                    map.setView(
                        [30.4200, 78.0800],
                        11
                    );

                }


                if (value === "district-b") {

                    map.setView(
                        [30.2500, 78.3500],
                        10
                    );

                }

            }
        );

    }


    /* =====================================================
       19. RESET MAP
    ===================================================== */

    function resetMapView() {

        map.setView(
            defaultCenter,
            defaultZoom
        );

    }


    const resetButton =
        document.getElementById("resetMapBtn");


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetMapView
        );

    }


    /* =====================================================
       20. LOCATE USER
    ===================================================== */

    const locateButton =
        document.getElementById("locateUserBtn");


    if (locateButton) {

        locateButton.addEventListener(
            "click",
            function () {

                if (!navigator.geolocation) {

                    alert(
                        "Geolocation is not supported by your browser."
                    );

                    return;
                }


                locateButton.disabled = true;

                locateButton.textContent = "...";


                navigator.geolocation.getCurrentPosition(

                    function (position) {

                        const lat =
                            position.coords.latitude;

                        const lng =
                            position.coords.longitude;


                        map.setView(
                            [lat, lng],
                            14
                        );


                        L.marker([lat, lng])
                            .addTo(map)
                            .bindPopup(
                                "<strong>Your Current Location</strong>"
                            )
                            .openPopup();


                        locateButton.disabled = false;

                        locateButton.textContent = "⌖";

                    },


                    function () {

                        alert(
                            "Unable to access your location. Please allow location permission."
                        );

                        locateButton.disabled = false;

                        locateButton.textContent = "⌖";

                    },

                    {
                        enableHighAccuracy: true,
                        timeout: 10000
                    }

                );

            }
        );

    }


    /* =====================================================
       21. REFRESH MAP
    ===================================================== */

    const refreshButton =
        document.getElementById("mapRefreshBtn");


    const updatedText =
        document.getElementById("mapLastUpdated");


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Updating...";


                setTimeout(function () {

                    drawRiskZones();


                    if (updatedText) {

                        const now =
                            new Date();


                        updatedText.textContent =
                            now.toLocaleTimeString(
                                [],
                                {
                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"
                                }
                            );

                    }


                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";

                }, 700);

            }
        );

    }


    /* =====================================================
       22. HANDLE MAP RESIZE
    ===================================================== */

    setTimeout(function () {
        map.invalidateSize();
    }, 300);


    window.addEventListener(
        "resize",
        function () {
            map.invalidateSize();
        }
    );

});
