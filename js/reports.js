/* =========================================================
   GEORAKSHAK - REPORTS JAVASCRIPT
   File: js/reports.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    const reportForm =
        document.getElementById("reportForm");

    const incidentType =
        document.getElementById("incidentType");

    const locationName =
        document.getElementById("locationName");

    const latitudeInput =
        document.getElementById("latitude");

    const longitudeInput =
        document.getElementById("longitude");

    const getLocationBtn =
        document.getElementById("getLocationBtn");

    const photoInput =
        document.getElementById("incidentPhotos");

    const fileUploadArea =
        document.getElementById("fileUploadArea");

    const browseFilesBtn =
        document.getElementById("browseFilesBtn");

    const imagePreviewGrid =
        document.getElementById("imagePreviewGrid");

    const formMessage =
        document.getElementById("reportFormMessage");

    const pendingReportsCount =
        document.getElementById("pendingReportsCount");

    const verifiedReportsCount =
        document.getElementById("verifiedReportsCount");


    /* =====================================================
       PHOTO STORAGE
    ===================================================== */

    let selectedPhotos = [];


    const MAX_PHOTOS = 5;

    const MAX_FILE_SIZE =
        10 * 1024 * 1024;


    /* =====================================================
       1. OPEN FILE PICKER
    ===================================================== */

    if (browseFilesBtn && photoInput) {

        browseFilesBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                photoInput.click();

            }
        );

    }


    /* =====================================================
       2. CLICK UPLOAD AREA
    ===================================================== */

    if (fileUploadArea && photoInput) {

        fileUploadArea.addEventListener(
            "click",
            event => {

                /*
                   Don't trigger twice when
                   clicking the Choose Photos button
                */

                if (
                    event.target.closest(
                        "#browseFilesBtn"
                    )
                ) {
                    return;
                }


                photoInput.click();

            }
        );

    }


    /* =====================================================
       3. FILE INPUT CHANGE
    ===================================================== */

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            event => {

                addPhotos(
                    event.target.files
                );

            }
        );

    }


    /* =====================================================
       4. DRAG AND DROP
    ===================================================== */

    if (fileUploadArea) {

        [
            "dragenter",
            "dragover"
        ].forEach(eventName => {

            fileUploadArea.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    fileUploadArea.classList.add(
                        "drag-active"
                    );

                }
            );

        });


        [
            "dragleave",
            "dragend",
            "drop"
        ].forEach(eventName => {

            fileUploadArea.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    fileUploadArea.classList.remove(
                        "drag-active"
                    );

                }
            );

        });


        fileUploadArea.addEventListener(
            "drop",
            event => {

                const files =
                    event.dataTransfer.files;


                if (
                    files &&
                    files.length > 0
                ) {

                    addPhotos(files);

                }

            }
        );

    }


    /* =====================================================
       5. ADD PHOTOS
    ===================================================== */

    function addPhotos(files) {

        if (
            !files ||
            files.length === 0
        ) {
            return;
        }


        const filesArray =
            Array.from(files);


        let addedCount = 0;


        filesArray.forEach(file => {


            /* Check image */

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showMessage(
                    `${file.name} is not a valid image.`,
                    "error"
                );

                return;

            }


            /* Check maximum photos */

            if (
                selectedPhotos.length >=
                MAX_PHOTOS
            ) {

                showMessage(
                    `Maximum ${MAX_PHOTOS} photos allowed.`,
                    "error"
                );

                return;

            }


            /* Check file size */

            if (
                file.size >
                MAX_FILE_SIZE
            ) {

                showMessage(
                    `${file.name} is larger than 10 MB.`,
                    "error"
                );

                return;

            }


            /* Prevent duplicates */

            const duplicate =
                selectedPhotos.some(
                    photo => {

                        return (
                            photo.name ===
                                file.name &&
                            photo.size ===
                                file.size &&
                            photo.lastModified ===
                                file.lastModified
                        );

                    }
                );


            if (duplicate) {
                return;
            }


            selectedPhotos.push(file);

            addedCount++;

        });


        syncPhotoInput();

        renderPhotoPreviews();


        if (addedCount > 0) {

            showMessage(
                `${addedCount} photo${
                    addedCount > 1
                        ? "s"
                        : ""
                } added successfully.`,
                "success"
            );

        }

    }


    /* =====================================================
       6. SYNC FILE INPUT
    ===================================================== */

    function syncPhotoInput() {

        if (!photoInput) return;


        const dataTransfer =
            new DataTransfer();


        selectedPhotos.forEach(file => {

            dataTransfer.items.add(file);

        });


        photoInput.files =
            dataTransfer.files;

    }


    /* =====================================================
       7. RENDER PHOTO PREVIEWS
    ===================================================== */

    function renderPhotoPreviews() {

        if (!imagePreviewGrid) return;


        /*
           Clear existing previews
        */

        imagePreviewGrid.innerHTML = "";


        selectedPhotos.forEach(
            (file, index) => {

                const previewItem =
                    document.createElement("div");

                previewItem.className =
                    "image-preview-item";


                const image =
                    document.createElement("img");

                image.alt =
                    `Incident photo ${index + 1}`;


                const objectURL =
                    URL.createObjectURL(file);

                image.src =
                    objectURL;


                /*
                   Free memory after image loads
                */

                image.addEventListener(
                    "load",
                    () => {

                        URL.revokeObjectURL(
                            objectURL
                        );

                    }
                );


                const removeButton =
                    document.createElement("button");

                removeButton.type =
                    "button";

                removeButton.className =
                    "remove-image-btn";

                removeButton.innerHTML =
                    "×";

                removeButton.setAttribute(
                    "aria-label",
                    `Remove photo ${index + 1}`
                );


                removeButton.addEventListener(
                    "click",
                    () => {

                        selectedPhotos.splice(
                            index,
                            1
                        );

                        syncPhotoInput();

                        renderPhotoPreviews();

                    }
                );


                previewItem.appendChild(image);

                previewItem.appendChild(
                    removeButton
                );


                imagePreviewGrid.appendChild(
                    previewItem
                );

            }
        );

    }


    /* =====================================================
       8. GET CURRENT LOCATION BUTTON
    ===================================================== */

    if (getLocationBtn) {

        getLocationBtn.addEventListener(
            "click",
            () => {

                const originalText =
                    getLocationBtn.textContent;


                getLocationBtn.disabled = true;

                getLocationBtn.textContent =
                    "Getting Location...";


                getCoordinates()
                    .then(coordinates => {

                        if (!coordinates) {

                            showMessage(
                                "Unable to get your current location. Please allow location permission.",
                                "error"
                            );

                            return;

                        }


                        if (latitudeInput) {

                            latitudeInput.value =
                                coordinates.latitude.toFixed(
                                    6
                                );

                        }


                        if (longitudeInput) {

                            longitudeInput.value =
                                coordinates.longitude.toFixed(
                                    6
                                );

                        }


                        showMessage(
                            "GPS location added successfully.",
                            "success"
                        );

                    })
                    .finally(() => {

                        getLocationBtn.disabled =
                            false;

                        getLocationBtn.textContent =
                            originalText;

                    });

            }
        );

    }


    /* =====================================================
       9. GET COORDINATES
    ===================================================== */

    function getCoordinates() {

        return new Promise(resolve => {


            /*
               Browser does not support GPS
            */

            if (
                !navigator.geolocation
            ) {

                resolve(null);

                return;

            }


            navigator.geolocation.getCurrentPosition(


                position => {

                    resolve({

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude

                    });

                },


                error => {

                    console.warn(
                        "Location Error:",
                        error.message
                    );

                    resolve(null);

                },


                {

                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 60000

                }

            );

        });

    }


    /* =====================================================
       10. FORM SUBMISSION
    ===================================================== */

    if (reportForm) {

        reportForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                clearMessage();


                /*
                   Native HTML validation
                */

                if (
                    !reportForm.checkValidity()
                ) {

                    reportForm.reportValidity();

                    showMessage(
                        "Please complete all required fields.",
                        "error"
                    );

                    return;

                }


                /*
                   Collect form data
                */

                const data =
                    new FormData(reportForm);


                const reportData = {

                    id:
                        `GR-${Date.now()}`,

                    type:
                        data.get("type"),

                    severity:
                        data.get("severity"),

                    description:
                        data.get("description"),

                    location:
                        data.get("location"),

                    locationType:
                        data.get("locationType"),

                    latitude:
                        data.get("latitude") || "",

                    longitude:
                        data.get("longitude") || "",

                    reporterName:
                        data.get("reporterName") || "",

                    reporterRole:
                        data.get("reporterRole") || "Citizen",

                    reportedAt:
                        new Date().toISOString(),

                    status:
                        "under-review",

                    photoCount:
                        selectedPhotos.length

                };


                /*
                   Get submit button
                */

                const submitButton =
                    reportForm.querySelector(
                        ".report-submit-btn"
                    );


                const originalText =
                    submitButton
                        ? submitButton.textContent
                        : "";


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Submitting Report...";

                }


                try {


                    /* =====================================
                       API SUBMISSION
                    ====================================== */


                    let response = null;


                    /*
                       If API exists, use it.
                       Otherwise run in demo mode.
                    */

                    if (
                        window.GeoRakshakAPI &&
                        typeof
                            window.GeoRakshakAPI
                                .submitReport ===
                            "function"
                    ) {

                        /*
                           Send normal report data.
                           selectedPhotos can later be
                           handled by backend separately.
                        */

                        response =
                            await window.GeoRakshakAPI
                                .submitReport(
                                    reportData
                                );


                        if (
                            response &&
                            response.success === false
                        ) {

                            throw new Error(
                                response.message ||
                                "Unable to submit report."
                            );

                        }

                    } else {

                        /*
                           Demo mode delay
                        */

                        await new Promise(
                            resolve =>
                                setTimeout(
                                    resolve,
                                    800
                                )
                        );


                        response = {

                            success: true,

                            data: reportData

                        };

                    }


                    /* =====================================
                       SAVE LOCALLY
                    ====================================== */

                    saveReportLocally(
                        response &&
                        response.data
                            ? response.data
                            : reportData
                    );


                    /* =====================================
                       UPDATE UI
                    ====================================== */

                    updateReportCounters();


                    /*
                       Reset form
                    */

                    reportForm.reset();


                    /*
                       Clear photos
                    */

                    selectedPhotos = [];


                    if (photoInput) {

                        photoInput.value = "";

                    }


                    if (imagePreviewGrid) {

                        imagePreviewGrid.innerHTML =
                            "";

                    }


                    showMessage(
                        "Incident report submitted successfully. It is now under review.",
                        "success"
                    );


                    /*
                       Scroll message into view
                    */

                    formMessage?.scrollIntoView({

                        behavior: "smooth",

                        block: "nearest"

                    });


                } catch (error) {

                    console.error(
                        "Report Submission Error:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Unable to submit the report. Please try again.",
                        "error"
                    );

                } finally {


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            originalText;

                    }

                }

            }
        );

    }


    /* =====================================================
       11. LOCAL STORAGE
    ===================================================== */

    function saveReportLocally(report) {

        try {

            const existingReports =
                JSON.parse(
                    localStorage.getItem(
                        "geoRakshakReports"
                    )
                ) || [];


            existingReports.unshift(report);


            localStorage.setItem(
                "geoRakshakReports",
                JSON.stringify(existingReports)
            );


        } catch (error) {

            console.warn(
                "Unable to save report locally:",
                error
            );

        }

    }


    /* =====================================================
       12. UPDATE COUNTERS
    ===================================================== */

    function updateReportCounters() {

        try {

            const reports =
                JSON.parse(
                    localStorage.getItem(
                        "geoRakshakReports"
                    )
                ) || [];


            const pendingCount =
                reports.filter(
                    report =>
                        report.status ===
                        "under-review"
                ).length;


            const verifiedCount =
                reports.filter(
                    report =>
                        report.status ===
                        "verified"
                ).length;


            if (pendingReportsCount) {

                /*
                   Add base demo count
                */

                pendingReportsCount.textContent =
                    12 + pendingCount;

            }


            if (verifiedReportsCount) {

                verifiedReportsCount.textContent =
                    38 + verifiedCount;

            }


        } catch (error) {

            console.warn(
                "Unable to update counters:",
                error
            );

        }

    }


    /* =====================================================
       13. FORM MESSAGE
    ===================================================== */

    function showMessage(
        message,
        type = "info"
    ) {

        /*
           Show global toast if main.js
           provides it
        */

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                type
            );

        }


        /*
           Also show message below form
        */

        if (!formMessage) return;


        formMessage.textContent =
            message;


        formMessage.className =
            `form-message ${type}`;


        /*
           Auto hide success message
        */

        if (type === "success") {

            setTimeout(
                () => {

                    if (
                        formMessage.textContent ===
                        message
                    ) {

                        clearMessage();

                    }

                },
                6000
            );

        }

    }


    function clearMessage() {

        if (!formMessage) return;


        formMessage.textContent = "";

        formMessage.className =
            "form-message";

    }


    /* =====================================================
       14. INITIALIZE
    ===================================================== */

    updateReportCounters();


    console.log(
        "%cGeoRakshak Reports Module Ready",
        "color: #1f6f50; font-weight: bold;"
    );


});