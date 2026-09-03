/* =========================================================
   GEORAKSHAK - API SERVICE LAYER
   File: js/api.js

   Purpose:
   Central communication layer between frontend and backend.

   Used by:
   - dashboard.js
   - alerts.js
   - map.js
   - reports.js

   Current modes:
   - DEMO MODE: Uses mock data
   - API MODE: Uses real backend endpoints

   IMPORTANT:
   Change CONFIG.USE_MOCK_DATA to false when the backend
   is ready.
========================================================= */


const GeoRakshakAPI = (() => {


    /* =====================================================
       1. CONFIGURATION
    ===================================================== */

    const CONFIG = {

        // Set false when backend is ready
        USE_MOCK_DATA: true,


        /*
           Change this when backend is deployed.

           Examples:

           Local backend:
           http://localhost:5000/api

           Production:
           https://your-domain.com/api
        */

        BASE_URL: "http://localhost:5000/api",


        // Request timeout in milliseconds
        TIMEOUT: 10000

    };


    /* =====================================================
       2. MOCK DATA
       Used only during frontend development/demo
    ===================================================== */

    const mockData = {

        dashboard: {
            success: true,

            data: {
                stats: {
                    monitoredZones: 148,
                    criticalZones: 3,
                    highRiskZones: 11,
                    citizenReports: 27
                },

                lastUpdated: new Date().toISOString()
            }
        },


        locations: {
            success: true,

            data: [
                {
                    id: "chamba-01",
                    name: "Chamba Mountain Corridor",
                    district: "Chamba",
                    state: "Himachal Pradesh",
                    latitude: 32.5534,
                    longitude: 76.1258,

                    riskScore: 94,
                    severity: "critical",

                    affectedPopulation: 1240,
                    roadStatus: "Restricted",
                    rainfall: 82,

                    lastUpdated:
                        new Date().toISOString()
                },

                {
                    id: "kullu-02",
                    name: "Kullu Valley Sector",
                    district: "Kullu",
                    state: "Himachal Pradesh",
                    latitude: 31.9579,
                    longitude: 77.1095,

                    riskScore: 81,
                    severity: "high",

                    affectedPopulation: 860,
                    roadStatus: "Monitoring",
                    rainfall: 67,

                    lastUpdated:
                        new Date().toISOString()
                },

                {
                    id: "mandi-03",
                    name: "Mandi Highway Zone",
                    district: "Mandi",
                    state: "Himachal Pradesh",
                    latitude: 31.5892,
                    longitude: 76.9182,

                    riskScore: 76,
                    severity: "high",

                    affectedPopulation: 2150,
                    roadStatus: "Open with caution",
                    rainfall: 54,

                    lastUpdated:
                        new Date().toISOString()
                },

                {
                    id: "shimla-04",
                    name: "Shimla Hills Region",
                    district: "Shimla",
                    state: "Himachal Pradesh",
                    latitude: 31.1048,
                    longitude: 77.1734,

                    riskScore: 58,
                    severity: "moderate",

                    affectedPopulation: 630,
                    roadStatus: "Open",
                    rainfall: 38,

                    lastUpdated:
                        new Date().toISOString()
                }
            ]
        },


        alerts: {
            success: true,

            data: [
                {
                    id: "alert-001",
                    title: "Critical Landslide Risk Detected",
                    location: "Chamba Mountain Corridor",
                    severity: "critical",
                    riskScore: 94,

                    message:
                        "Heavy rainfall and slope instability indicate a high probability of landslide activity. Immediate field assessment is recommended.",

                    status: "active",
                    createdAt:
                        new Date().toISOString()
                },

                {
                    id: "alert-002",
                    title: "High Risk Zone Under Monitoring",
                    location: "Kullu Valley Sector",
                    severity: "high",
                    riskScore: 81,

                    message:
                        "Rainfall intensity has increased and ground saturation is approaching critical thresholds.",

                    status: "active",
                    createdAt:
                        new Date(
                            Date.now() - 3600000
                        ).toISOString()
                }
            ]
        },


        reports: {
            success: true,

            data: [
                {
                    id: "report-001",
                    type: "Road Blockage",
                    location: "Mandi Highway",
                    severity: "high",

                    description:
                        "Debris and rocks reported on roadside.",

                    status: "under-review",

                    reportedAt:
                        new Date(
                            Date.now() - 7200000
                        ).toISOString()
                },

                {
                    id: "report-002",
                    type: "Slope Cracks",
                    location: "Kullu Valley",
                    severity: "moderate",

                    description:
                        "Visible cracks reported near residential area.",

                    status: "verified",

                    reportedAt:
                        new Date(
                            Date.now() - 14400000
                        ).toISOString()
                }
            ]
        },


        trend: {

            "7": {
                success: true,
                data: [22, 31, 28, 42, 48, 39, 57]
            },

            "30": {
                success: true,
                data: [
                    18, 24, 31, 28,
                    39, 46, 41, 52
                ]
            },

            "90": {
                success: true,
                data: [
                    15, 22, 18, 35,
                    29, 47, 44, 56
                ]
            }

        }

    };


    /* =====================================================
       3. GENERIC REQUEST FUNCTION

       All real backend requests go through here.
    ===================================================== */

    async function request(
        endpoint,
        options = {}
    ) {

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(
                () => controller.abort(),
                CONFIG.TIMEOUT
            );


        try {

            const response =
                await fetch(
                    `${CONFIG.BASE_URL}${endpoint}`,
                    {
                        headers: {
                            "Content-Type":
                                "application/json",

                            ...options.headers
                        },

                        ...options,

                        signal:
                            controller.signal
                    }
                );


            clearTimeout(timeoutId);


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "API request failed."
                );

            }


            return data;

        } catch (error) {

            clearTimeout(timeoutId);


            if (
                error.name === "AbortError"
            ) {

                throw new Error(
                    "Request timed out. Please try again."
                );

            }


            throw error;

        }

    }


    /* =====================================================
       4. DASHBOARD API
    ===================================================== */

    async function getDashboard() {

        if (CONFIG.USE_MOCK_DATA) {

            return Promise.resolve(
                structuredClone(mockData.dashboard)
            );

        }


        return request("/dashboard");

    }


    /* =====================================================
       5. RISK LOCATIONS API
    ===================================================== */

    async function getRiskLocations(
        filters = {}
    ) {

        if (CONFIG.USE_MOCK_DATA) {

            let locations =
                structuredClone(
                    mockData.locations
                );


            // Filter by severity
            if (filters.severity) {

                locations.data =
                    locations.data.filter(
                        location =>
                            location.severity ===
                            filters.severity
                    );

            }


            // Filter by state
            if (filters.state) {

                locations.data =
                    locations.data.filter(
                        location =>
                            location.state
                                .toLowerCase()
                                .includes(
                                    filters.state
                                        .toLowerCase()
                                )
                    );

            }


            return locations;

        }


        const queryParams =
            new URLSearchParams(filters)
                .toString();


        return request(
            `/locations${
                queryParams
                    ? `?${queryParams}`
                    : ""
            }`
        );

    }


    /* =====================================================
       6. SINGLE LOCATION API
    ===================================================== */

    async function getLocationById(id) {

        if (!id) {

            throw new Error(
                "Location ID is required."
            );

        }


        if (CONFIG.USE_MOCK_DATA) {

            const location =
                mockData.locations.data.find(
                    item => item.id === id
                );


            if (!location) {

                throw new Error(
                    "Location not found."
                );

            }


            return {
                success: true,
                data: structuredClone(location)
            };

        }


        return request(
            `/locations/${encodeURIComponent(id)}`
        );

    }


    /* =====================================================
       7. ALERTS API
    ===================================================== */

    async function getAlerts(
        filters = {}
    ) {

        if (CONFIG.USE_MOCK_DATA) {

            let alerts =
                structuredClone(
                    mockData.alerts
                );


            if (filters.severity) {

                alerts.data =
                    alerts.data.filter(
                        alert =>
                            alert.severity ===
                            filters.severity
                    );

            }


            if (filters.status) {

                alerts.data =
                    alerts.data.filter(
                        alert =>
                            alert.status ===
                            filters.status
                    );

            }


            return alerts;

        }


        const queryParams =
            new URLSearchParams(filters)
                .toString();


        return request(
            `/alerts${
                queryParams
                    ? `?${queryParams}`
                    : ""
            }`
        );

    }


    /* =====================================================
       8. ALERT BY ID
    ===================================================== */

    async function getAlertById(id) {

        if (!id) {

            throw new Error(
                "Alert ID is required."
            );

        }


        if (CONFIG.USE_MOCK_DATA) {

            const alert =
                mockData.alerts.data.find(
                    item => item.id === id
                );


            if (!alert) {

                throw new Error(
                    "Alert not found."
                );

            }


            return {
                success: true,
                data: structuredClone(alert)
            };

        }


        return request(
            `/alerts/${encodeURIComponent(id)}`
        );

    }


    /* =====================================================
       9. RISK TREND API
    ===================================================== */

    async function getRiskTrend(
        days = 7
    ) {

        if (CONFIG.USE_MOCK_DATA) {

            const trend =
                mockData.trend[String(days)] ||
                mockData.trend["7"];


            return structuredClone(trend);

        }


        return request(
            `/analytics/trend?days=${days}`
        );

    }


    /* =====================================================
       10. CITIZEN REPORTS API
    ===================================================== */

    async function getReports(
        filters = {}
    ) {

        if (CONFIG.USE_MOCK_DATA) {

            let reports =
                structuredClone(
                    mockData.reports
                );


            if (filters.status) {

                reports.data =
                    reports.data.filter(
                        report =>
                            report.status ===
                            filters.status
                    );

            }


            if (filters.severity) {

                reports.data =
                    reports.data.filter(
                        report =>
                            report.severity ===
                            filters.severity
                    );

            }


            return reports;

        }


        const queryParams =
            new URLSearchParams(filters)
                .toString();


        return request(
            `/reports${
                queryParams
                    ? `?${queryParams}`
                    : ""
            }`
        );

    }


    /* =====================================================
       11. SUBMIT CITIZEN REPORT

       reportData example:

       {
           type: "Road Blockage",
           severity: "high",
           description: "...",
           latitude: 31.58,
           longitude: 76.91
       }
    ===================================================== */

    async function submitReport(reportData) {

        if (!reportData) {

            throw new Error(
                "Report data is required."
            );

        }


        if (CONFIG.USE_MOCK_DATA) {

            const newReport = {

                id:
                    `report-${Date.now()}`,

                ...reportData,

                status: "under-review",

                reportedAt:
                    new Date().toISOString()

            };


            mockData.reports.data.unshift(
                newReport
            );


            mockData.dashboard
                .data
                .stats
                .citizenReports += 1;


            return {
                success: true,

                message:
                    "Report submitted successfully.",

                data:
                    structuredClone(newReport)
            };

        }


        return request(
            "/reports",
            {
                method: "POST",

                body:
                    JSON.stringify(reportData)
            }
        );

    }


    /* =====================================================
       12. UPDATE REPORT STATUS
       Authority/Admin functionality
    ===================================================== */

    async function updateReportStatus(
        reportId,
        status
    ) {

        if (!reportId || !status) {

            throw new Error(
                "Report ID and status are required."
            );

        }


        if (CONFIG.USE_MOCK_DATA) {

            const report =
                mockData.reports.data.find(
                    item => item.id === reportId
                );


            if (!report) {

                throw new Error(
                    "Report not found."
                );

            }


            report.status = status;


            return {
                success: true,

                message:
                    "Report status updated.",

                data:
                    structuredClone(report)
            };

        }


        return request(
            `/reports/${encodeURIComponent(
                reportId
            )}/status`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({ status })
            }
        );

    }


    /* =====================================================
       13. ACKNOWLEDGE ALERT
       Authority functionality
    ===================================================== */

    async function acknowledgeAlert(alertId) {

        if (!alertId) {

            throw new Error(
                "Alert ID is required."
            );

        }


        if (CONFIG.USE_MOCK_DATA) {

            const alert =
                mockData.alerts.data.find(
                    item => item.id === alertId
                );


            if (!alert) {

                throw new Error(
                    "Alert not found."
                );

            }


            alert.status = "acknowledged";


            return {
                success: true,

                message:
                    "Alert acknowledged.",

                data:
                    structuredClone(alert)
            };

        }


        return request(
            `/alerts/${encodeURIComponent(
                alertId
            )}/acknowledge`,
            {
                method: "PATCH"
            }
        );

    }


    /* =====================================================
       14. HEALTH CHECK
    ===================================================== */

    async function checkHealth() {

        if (CONFIG.USE_MOCK_DATA) {

            return {
                success: true,
                mode: "demo",
                status: "online",
                timestamp:
                    new Date().toISOString()
            };

        }


        return request("/health");

    }


    /* =====================================================
       15. EXPOSE PUBLIC API

       Other JavaScript files will use:

       GeoRakshakAPI.getDashboard()
       GeoRakshakAPI.getAlerts()
       GeoRakshakAPI.submitReport()
       etc.
    ===================================================== */

    return {

        CONFIG,

        getDashboard,

        getRiskLocations,
        getLocationById,

        getAlerts,
        getAlertById,

        getRiskTrend,

        getReports,
        submitReport,
        updateReportStatus,

        acknowledgeAlert,

        checkHealth

    };


})();


/* =========================================================
   OPTIONAL: MAKE CLEAR API STATUS IN CONSOLE
========================================================= */

console.log(
    `%cGeoRakshak API Layer: ${
        GeoRakshakAPI.CONFIG.USE_MOCK_DATA
            ? "DEMO MODE"
            : "LIVE API MODE"
    }`,
    "color: #1f6f50; font-weight: bold;"
);