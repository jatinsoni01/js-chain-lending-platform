document.addEventListener('DOMContentLoaded', function() {
    // Form steps handling
    const form = document.getElementById('kycForm');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-bar .step');
    let currentStep = 1;

    // Navigation buttons
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');

    // Document verification status
    const documentStatus = {
        aadharFront: false,
        aadharBack: false,
        panCard: false
    };

    // Add this verification status tracking object
    const verificationStatus = {
        personalInfo: false,
        documents: false,
        photo: false,
        device: false,
        location: false
    };

    // Handle next button clicks
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep === 2 && !validateDocuments()) {
                return;
            }
            if (validateStep(currentStep)) {
                currentStep++;
                updateFormSteps();
                updateProgressBar();
            }
        });
    });

    // Handle previous button clicks
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            updateFormSteps();
            updateProgressBar();
        });
    });

    // Validate each step
    function validateStep(step) {
        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        // Clear existing errors
        const existingErrors = currentStepElement.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        inputs.forEach(input => {
            input.classList.remove('error');
            removeError(input);

            if (!input.value) {
                isValid = false;
                input.classList.add('error');
                showError(input, 'This field is required');
            } else if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
                isValid = false;
                input.classList.add('error');
                showError(input, getErrorMessage(input));
            }
        });

        // Update verification status based on step
        if (isValid) {
            switch(step) {
                case 1:
                    verificationStatus.personalInfo = true;
                    break;
                case 2:
                    if (validateDocuments()) {
                        verificationStatus.documents = true;
                    } else {
                        isValid = false;
                    }
                    break;
                case 3:
                    if (document.querySelector('#photoPreview img')) {
                        verificationStatus.photo = true;
                    }
                    break;
            }
            updateVerificationStatus();
        }

        return isValid;
    }

    // Update form steps visibility
    function updateFormSteps() {
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });
    }

    // Update progress bar
    function updateProgressBar() {
        progressSteps.forEach((step, index) => {
            if (index + 1 <= currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // Camera functionality
    const videoElement = document.getElementById('videoElement');
    const photoCanvas = document.getElementById('photoCanvas');
    const startCameraBtn = document.getElementById('startCamera');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const photoPreview = document.getElementById('photoPreview');
    const startBiometricBtn = document.getElementById('startBiometric');
    const biometricStatus = document.getElementById('biometricStatus');
    let stream = null;

    startCameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            videoElement.srcObject = stream;
            startCameraBtn.disabled = true;
            capturePhotoBtn.disabled = false;
        } catch (err) {
            showError(startCameraBtn, 'Unable to access camera. Please ensure you have given camera permissions.');
        }
    });

    capturePhotoBtn.addEventListener('click', () => {
        photoCanvas.width = videoElement.videoWidth;
        photoCanvas.height = videoElement.videoHeight;
        const context = photoCanvas.getContext('2d');
        context.drawImage(videoElement, 0, 0);
        
        const photoData = photoCanvas.toDataURL('image/jpeg');
        photoPreview.innerHTML = `
            <img src="${photoData}" alt="Captured photo">
            <p class="success-message">
                <i class="fas fa-check-circle"></i> 
                Photo captured successfully!
            </p>
        `;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            startCameraBtn.disabled = false;
            capturePhotoBtn.disabled = true;
        }

        // Update verification status
        verificationStatus.photo = true;
        updateVerificationStatus();
        showNotification('Photo verification completed successfully!', 'success');
    });

    // Biometric Simulation
    startBiometricBtn.addEventListener('click', () => {
        biometricStatus.innerHTML = 'Scanning fingerprint...';
        biometricStatus.className = 'status-message';
        
        // Simulate fingerprint scanning
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            if (success) {
                biometricStatus.innerHTML = 'Fingerprint captured successfully!';
                biometricStatus.className = 'status-message success';
                startBiometricBtn.disabled = true;
            } else {
                biometricStatus.innerHTML = 'Failed to capture fingerprint. Please try again.';
                biometricStatus.className = 'status-message error';
            }
        }, 2000);
    });

    // Handle file upload with validation and preview
    function handleFileUpload(inputId, previewId, documentType) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const uploadBox = input.closest('.upload-box');
        const uploadActions = uploadBox.querySelector('.upload-actions');

        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Validate file
                if (!validateFile(file)) {
                    input.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update document status
                    updateDocumentStatus(inputId, true);
                    
                    // Show upload success message
                    showUploadSuccess(documentType, file.name);
                    
                    // Update preview
                    preview.innerHTML = `
                        <div class="preview-card">
                            <div class="preview-header">
                                <i class="fas fa-check-circle"></i>
                                <span>${documentType} Uploaded Successfully</span>
                            </div>
                            <div class="preview-content">
                                <img src="${e.target.result}" alt="${documentType}" class="thumbnail">
                                <div class="preview-info">
                                    <p class="file-name">
                                        <i class="fas fa-file-image"></i>
                                        ${file.name}
                                    </p>
                                    <p class="file-size">
                                        <i class="fas fa-hdd"></i>
                                        ${(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                    <div class="upload-success-message">
                                        <i class="fas fa-check-circle"></i>
                                        Upload Successful
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Show view button
                    uploadActions.style.display = 'block';
                    const viewButton = uploadActions.querySelector('.view-document-btn');
                    viewButton.onclick = () => showFullImage(e.target.result, documentType);

                    // Check if all documents are uploaded
                    checkDocumentsCompletion();
                };
                reader.readAsDataURL(file);

            } catch (error) {
                input.value = '';
                showError(input, 'Error uploading file. Please try again.');
            }
        });
    }

    // Validate uploaded file
    function validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

        if (!allowedTypes.includes(file.type)) {
            showNotification('Please upload a valid image file (JPG, PNG)', 'error');
            return false;
        }

        if (file.size > maxSize) {
            showNotification('File size should not exceed 5MB', 'error');
            return false;
        }

        return true;
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `upload-toast ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Update document verification status
    function updateDocumentStatus(inputId, status) {
        switch(inputId) {
            case 'aadharFront':
                documentStatus.aadharFront = status;
                break;
            case 'aadharBack':
                documentStatus.aadharBack = status;
                break;
            case 'panCardPhoto':
                documentStatus.panCard = status;
                break;
        }
        updateStepValidation();
    }

    // Validate documents before proceeding
    function validateDocuments() {
        const aadharNumber = document.getElementById('aadharNumber').value;
        const panNumber = document.getElementById('panNumber').value;
        
        if (!aadharNumber || !panNumber) {
            showNotification('Please fill in all document numbers', 'error');
            return false;
        }

        if (!documentStatus.aadharFront || !documentStatus.aadharBack) {
            showNotification('Please upload both sides of Aadhar card', 'error');
            return false;
        }

        if (!documentStatus.panCard) {
            showNotification('Please upload PAN card', 'error');
            return false;
        }

        return true;
    }

    // Initialize document upload handlers
    handleFileUpload('aadharFront', 'aadharFrontPreview', 'Aadhar Front');
    handleFileUpload('aadharBack', 'aadharBackPreview', 'Aadhar Back');
    handleFileUpload('panCardPhoto', 'panCardPreview', 'PAN Card');

    // Format input fields
    formatAadharInput();
    formatPANInput();

    // Format Aadhar number input
    const aadharInput = document.getElementById('aadharNumber');
    aadharInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 12) value = value.slice(0, 12);
        const parts = [];
        for (let i = 0; i < value.length; i += 4) {
            parts.push(value.slice(i, i + 4));
        }
        e.target.value = parts.join(' ');
    });

    // Format PAN number input
    const panInput = document.getElementById('panNumber');
    panInput.addEventListener('input', function(e) {
        let value = e.target.value.toUpperCase();
        e.target.value = value;
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            try {
                const formData = new FormData(form);
                // Here you would normally send the data to your server
                // For demo purposes, we'll just show a success message
                alert('KYC verification submitted successfully!');
                window.location.href = 'afterlogin.html';
            } catch (error) {
                alert('Error submitting form. Please try again.');
            }
        }
    });

    // Helper functions
    function showError(element, message) {
        removeError(element);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle" aria-hidden="true"></i> ${message}`;
        
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-errormessage', message);
        
        if (element.parentNode.classList.contains('phone-input')) {
            element.parentNode.after(errorDiv);
        } else {
            element.after(errorDiv);
        }

        announce(message);
    }

    function removeError(element) {
        // Find the closest error message and remove it
        const parent = element.parentNode;
        const errorDiv = parent.querySelector('.error-message') || 
                        parent.nextElementSibling?.classList.contains('error-message') ? 
                        parent.nextElementSibling : null;
        
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Function to get specific error messages based on input type
    function getErrorMessage(input) {
        switch(input.id) {
            case 'fullName':
                return 'Please enter a valid name (letters only)';
            case 'email':
                return 'Please enter a valid email address';
            case 'phone':
                return 'Please enter a valid 10-digit phone number';
            case 'aadharNumber':
                return 'Please enter a valid 12-digit Aadhar number';
            case 'panNumber':
                return 'Please enter a valid PAN number (ABCDE1234F format)';
            case 'pincode':
                return 'Please enter a valid 6-digit PIN code';
            default:
                return input.title || 'Invalid format';
        }
    }

    // Add input event listeners to clear errors on typing
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                removeError(this);
            }
        });
    });

    // Image preview modal
    window.showFullImage = function(imageSrc, title) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="this.closest('.image-preview-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <img src="${imageSrc}" alt="${title}">
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    // File Upload Preview
    document.getElementById('idDocument').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || 'No file chosen';
        e.target.nextElementSibling.querySelector('i').nextSibling.textContent = ` ${fileName}`;
    });

    // Face Recognition
    let faceStream = null;

    async function initFaceRecognition() {
        const faceVideo = document.getElementById('faceVideo');
        const startFaceScan = document.getElementById('startFaceScan');
        const faceScanStatus = document.getElementById('faceScanStatus');

        startFaceScan.addEventListener('click', async () => {
            try {
                faceStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                faceVideo.srcObject = faceStream;
                startFaceScan.disabled = true;
                
                // Simulate face recognition process
                faceScanStatus.innerHTML = 'Scanning face...';
                faceScanStatus.className = 'status-message';
                
                setTimeout(() => {
                    if (faceStream) {
                        faceStream.getTracks().forEach(track => track.stop());
                        faceVideo.srcObject = null;
                    }
                    faceScanStatus.innerHTML = 'Face verification successful!';
                    faceScanStatus.className = 'status-message success';
                }, 3000);
            } catch (err) {
                console.error('Error:', err);
                faceScanStatus.innerHTML = 'Face scan failed. Please try again.';
                faceScanStatus.className = 'status-message error';
            }
        });
    }

    // Device Verification
    function initializeSecurityVerification() {
        const deviceType = document.getElementById('deviceType');
        const browserInfo = document.getElementById('browserInfo');
        const connectionInfo = document.getElementById('connectionInfo');
        const locationInfo = document.getElementById('locationInfo');
        const addressInfo = document.getElementById('addressInfo');
        const cityInfo = document.getElementById('cityInfo');
        const verifyDevice = document.getElementById('verifyDevice');
        const verifyLocation = document.getElementById('verifyLocation');
        const deviceStatus = document.getElementById('deviceStatus');
        const locationStatus = document.getElementById('locationStatus');
        let map = null;
        let marker = null;

        // Enhanced Device Detection
        function detectDevice() {
            const ua = navigator.userAgent;
            let deviceInfo = {
                type: 'Unknown Device',
                os: 'Unknown OS',
                screen: `${window.screen.width}x${window.screen.height}`
            };

            // Device Type Detection
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                deviceInfo.type = 'Tablet';
            } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                deviceInfo.type = 'Mobile';
            } else {
                deviceInfo.type = 'Desktop';
            }

            // OS Detection
            if (/Windows/i.test(ua)) deviceInfo.os = 'Windows';
            else if (/Mac/i.test(ua)) deviceInfo.os = 'MacOS';
            else if (/Linux/i.test(ua)) deviceInfo.os = 'Linux';
            else if (/Android/i.test(ua)) deviceInfo.os = 'Android';
            else if (/iOS/i.test(ua)) deviceInfo.os = 'iOS';

            return `${deviceInfo.type} (${deviceInfo.os}) - ${deviceInfo.screen}`;
        }

        // Enhanced Browser Detection
        function detectBrowser() {
            const ua = navigator.userAgent;
            let browserInfo = {
                name: 'Unknown Browser',
                version: 'Unknown Version',
                language: navigator.language || 'Unknown'
            };

            if (ua.match(/chrome|chromium|crios/i)) {
                browserInfo.name = "Chrome";
            } else if (ua.match(/firefox|fxios/i)) {
                browserInfo.name = "Firefox";
            } else if (ua.match(/safari/i)) {
                browserInfo.name = "Safari";
            } else if (ua.match(/opr\//i)) {
                browserInfo.name = "Opera";
            } else if (ua.match(/edg/i)) {
                browserInfo.name = "Edge";
            }

            const version = ua.match(/(version|chrome|firefox|safari|opr|edge|rv)[\s\/: ]([\d.]+)/i);
            if (version) browserInfo.version = version[2];

            return `${browserInfo.name} ${browserInfo.version} (${browserInfo.language})`;
        }

        // Enhanced Connection Detection
        function detectConnection() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            let connectionInfo = {
                type: 'Unknown',
                speed: 'Unknown'
            };

            if (connection) {
                connectionInfo.type = connection.effectiveType || connection.type || 'Unknown';
                connectionInfo.speed = connection.downlink ? `${connection.downlink} Mbps` : 'Unknown';
            }

            return `${connectionInfo.type} - ${connectionInfo.speed}`;
        }

        // Initialize Map
        function initMap(position) {
            const { latitude, longitude } = position.coords;
            const mapOptions = {
                center: { lat: latitude, lng: longitude },
                zoom: 15,
                styles: [/* Add custom map styles here */]
            };

            map = new google.maps.Map(document.getElementById('map'), mapOptions);
            marker = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: map,
                title: 'Your Location'
            });

            // Get address details
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const address = results[0];
                    addressInfo.textContent = address.formatted_address;
                    
                    // Extract city information
                    const cityComponent = address.address_components.find(component => 
                        component.types.includes('locality') || 
                        component.types.includes('administrative_area_level_1')
                    );
                    cityInfo.textContent = cityComponent ? cityComponent.long_name : 'Unknown City';
                }
            });
        }

        // Device Verification
        verifyDevice.addEventListener('click', async () => {
            verifyDevice.classList.add('verifying');
            verifyDevice.disabled = true;
            deviceStatus.className = 'status-message';
            deviceStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying device...';

            try {
                // Get device information immediately
                const deviceChecks = {
                    device: detectDevice(),
                    browser: detectBrowser(),
                    connection: detectConnection(),
                    webGL: !!window.WebGLRenderingContext,
                    localStorage: !!window.localStorage,
                    cookies: navigator.cookieEnabled,
                    touchscreen: 'ontouchstart' in window,
                    battery: 'getBattery' in navigator,
                    ram: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
                    cores: navigator.hardwareConcurrency || 'Unknown'
                };

                // Quick verification (500ms)
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update device info with more details
                deviceType.textContent = `${deviceChecks.device} (${deviceChecks.cores} cores, ${deviceChecks.ram} RAM)`;
                browserInfo.textContent = deviceChecks.browser;
                connectionInfo.textContent = deviceChecks.connection;

                deviceStatus.className = 'status-message success';
                deviceStatus.innerHTML = '<i class="fas fa-check-circle"></i> Device verified successfully!';
                verificationStatus.device = true;
                updateVerificationStatus();
                
                // Show detailed info in console
                console.table(deviceChecks);
            } catch (error) {
                deviceStatus.className = 'status-message error';
                deviceStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Verification failed. Please try again.';
            } finally {
                verifyDevice.classList.remove('verifying');
                verifyDevice.disabled = false;
            }
        });

        // Location Verification with Enhanced Error Handling
        verifyLocation.addEventListener('click', () => {
            verifyLocation.classList.add('verifying');
            verifyLocation.disabled = true;
            locationStatus.className = 'status-message';
            locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying location...';

            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 5000, // Reduced timeout to 5 seconds
                    maximumAge: 0
                };

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude, accuracy } = position.coords;
                            
                            // Update location info immediately
                            locationInfo.textContent = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)} (Accuracy: ${accuracy.toFixed(1)}m)`;

                            // Initialize map with custom styling
                            const mapOptions = {
                                center: { lat: latitude, lng: longitude },
                                zoom: 15,
                                styles: [
                                    {
                                        featureType: "all",
                                        elementType: "labels.text.fill",
                                        stylers: [{ color: "#2c3e50" }]
                                    },
                                    {
                                        featureType: "water",
                                        elementType: "geometry",
                                        stylers: [{ color: "#3498db" }]
                                    }
                                ],
                                disableDefaultUI: true,
                                zoomControl: true
                            };

                            map = new google.maps.Map(document.getElementById('map'), mapOptions);
                            
                            // Add custom marker
                            marker = new google.maps.Marker({
                                position: { lat: latitude, lng: longitude },
                                map: map,
                                title: 'Your Location',
                                animation: google.maps.Animation.DROP,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 10,
                                    fillColor: "#3498db",
                                    fillOpacity: 1,
                                    strokeColor: "#fff",
                                    strokeWeight: 2
                                }
                            });

                            // Quick reverse geocoding
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                                if (status === 'OK' && results[0]) {
                                    const address = results[0];
                                    addressInfo.textContent = address.formatted_address;
                                    
                                    const cityComponent = address.address_components.find(component => 
                                        component.types.includes('locality') || 
                                        component.types.includes('administrative_area_level_1')
                                    );
                                    cityInfo.textContent = cityComponent ? cityComponent.long_name : 'Unknown City';
                                }
                            });

                            // Quick verification (500ms)
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            locationStatus.className = 'status-message success';
                            locationStatus.innerHTML = '<i class="fas fa-check-circle"></i> Location verified successfully!';
                            verificationStatus.location = true;
                            updateVerificationStatus();

                        } catch (error) {
                            locationStatus.className = 'status-message error';
                            locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
                        } finally {
                            verifyLocation.classList.remove('verifying');
                            verifyLocation.disabled = false;
                        }
                    },
                    (error) => {
                        let errorMessage = 'Location access denied';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Please enable location services';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location unavailable';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Request timed out';
                                break;
                        }
                        locationStatus.className = 'status-message error';
                        locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
                        verifyLocation.classList.remove('verifying');
                        verifyLocation.disabled = false;
                    },
                    options
                );
            } else {
                locationStatus.className = 'status-message error';
                locationStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Geolocation not supported';
                verifyLocation.classList.remove('verifying');
                verifyLocation.disabled = false;
            }
        });

        // Update initial device information
        deviceType.textContent = detectDevice();
        browserInfo.textContent = detectBrowser();
        connectionInfo.textContent = detectConnection();

        // Update connection information when it changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                connectionInfo.textContent = detectConnection();
            });
        }
    }

    // Initialize security verification
    initializeSecurityVerification();

    // Add this function to update verification status
    function updateVerificationStatus() {
        const checkItems = document.querySelectorAll('.check-item');
        
        // Update Personal Information status
        if (verificationStatus.personalInfo) {
            checkItems[0].classList.add('verified');
        }

        // Update Document Upload status
        if (verificationStatus.documents) {
            checkItems[1].classList.add('verified');
        }

        // Update Photo Verification status
        if (verificationStatus.photo) {
            checkItems[2].classList.add('verified');
        }

        // Update Device Verification status
        if (verificationStatus.device) {
            checkItems[3].classList.add('verified');
        }

        // Update Location Verification status
        if (verificationStatus.location) {
            checkItems[4].classList.add('verified');
        }
    }

    // Add this function to show upload success message
    function showUploadSuccess(documentType, fileName) {
        // Create and show the success toast
        const toast = document.createElement('div');
        toast.className = 'upload-toast success';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <div class="toast-message">
                    <h4>${documentType} Uploaded!</h4>
                    <p>${fileName}</p>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        // Remove toast after animation
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add this function to check documents completion
    function checkDocumentsCompletion() {
        const allDocsUploaded = documentStatus.aadharFront && 
                               documentStatus.aadharBack && 
                               documentStatus.panCard;
        
        if (allDocsUploaded) {
            verificationStatus.documents = true;
            updateVerificationStatus();
        }
    }

    // Add this function to remove file
    window.removeFile = function(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const uploadBox = input.closest('.upload-box');
        const uploadActions = uploadBox.querySelector('.upload-actions');

        input.value = '';
        preview.innerHTML = '';
        uploadActions.style.display = 'none';
        
        // Update document status
        updateDocumentStatus(inputId, false);
        verificationStatus.documents = false;
        updateVerificationStatus();
    };

    // Add these functions for bank verification
    function initBankVerification() {
        const accountNumber = document.getElementById('accountNumber');
        const confirmAccountNumber = document.getElementById('confirmAccountNumber');
        const ifscCode = document.getElementById('ifscCode');
        const verifyIFSC = document.getElementById('verifyIFSC');
        const bankDetails = document.getElementById('bankDetails');

        // Format account number
        accountNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 18) value = value.slice(0, 18);
            e.target.value = value;
        });

        // Confirm account number validation
        confirmAccountNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 18) value = value.slice(0, 18);
            e.target.value = value;

            if (value !== accountNumber.value) {
                this.setCustomValidity('Account numbers do not match');
            } else {
                this.setCustomValidity('');
            }
        });

        // Format IFSC code
        ifscCode.addEventListener('input', function(e) {
            let value = e.target.value.toUpperCase();
            e.target.value = value;
        });

        // Verify IFSC code
        verifyIFSC.addEventListener('click', async function() {
            const ifscValue = ifscCode.value;
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscValue)) {
                showNotification('Please enter a valid IFSC code', 'error');
                return;
            }

            try {
                verifyIFSC.disabled = true;
                verifyIFSC.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

                const response = await fetch(`https://ifsc.razorpay.com/${ifscValue}`);
                const data = await response.json();

                if (data.BANK) {
                    bankDetails.querySelector('.bank-name').textContent = `Bank: ${data.BANK}`;
                    bankDetails.querySelector('.branch-name').textContent = `Branch: ${data.BRANCH}`;
                    bankDetails.querySelector('.branch-address').textContent = `Address: ${data.ADDRESS}`;
                    bankDetails.style.display = 'block';
                    showNotification('IFSC code verified successfully', 'success');
                } else {
                    throw new Error('Invalid IFSC code');
                }
            } catch (error) {
                showNotification('Could not verify IFSC code. Please check and try again', 'error');
            } finally {
                verifyIFSC.disabled = false;
                verifyIFSC.innerHTML = '<i class="fas fa-search"></i> Verify IFSC';
            }
        });
    }

    // Add this to your DOMContentLoaded event listener
    initBankVerification();

    // Add CSRF protection
    const csrfToken = generateCSRFToken();
    document.querySelectorAll('form').forEach(form => {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);
    });

    // Enhanced input validation
    function validateInput(input) {
        const value = input.value.trim();
        const type = input.dataset.validationType || input.type;
        
        const validations = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                pattern: /^\+?[\d\s-]{10,}$/,
                message: 'Please enter a valid phone number'
            },
            aadhar: {
                pattern: /^\d{4}\s\d{4}\s\d{4}$/,
                message: 'Please enter a valid 12-digit Aadhar number'
            },
            pan: {
                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: 'Please enter a valid PAN number'
            }
        };

        if (validations[type]) {
            if (!validations[type].pattern.test(value)) {
                showError(input, validations[type].message);
                return false;
            }
        }

        // XSS Prevention
        if (/<[^>]*>/.test(value)) {
            showError(input, 'HTML tags are not allowed');
            return false;
        }

        return true;
    }

    // Add rate limiting for file uploads
    const uploadRateLimit = {
        lastUpload: 0,
        minInterval: 1000, // 1 second between uploads
    };

    function checkUploadRateLimit() {
        const now = Date.now();
        if (now - uploadRateLimit.lastUpload < uploadRateLimit.minInterval) {
            showNotification('Please wait before uploading another file', 'error');
            return false;
        }
        uploadRateLimit.lastUpload = now;
        return true;
    }

    // Accessibility improvements
    function improveAccessibility() {
        // Add ARIA labels
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (!element.getAttribute('aria-label')) {
                const label = element.closest('.form-group').querySelector('label');
                if (label) {
                    element.setAttribute('aria-label', label.textContent);
                }
            }
        });

        // Add keyboard navigation
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Add status announcements for screen readers
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);

        window.announce = (message) => {
            announcer.textContent = message;
        };
    }

    // Performance optimizations
    function optimizePerformance() {
        // Debounce input validation
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Optimize file upload preview
        function optimizeImagePreview(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Lazy load images
        const lazyLoadImages = () => {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        };

        // Initialize optimizations
        lazyLoadImages();
    }

    // Error tracking and analytics
    const analytics = {
        trackEvent(category, action, label) {
            try {
                // Replace with your analytics implementation
                console.log(`Analytics: ${category} - ${action} - ${label}`);
            } catch (error) {
                console.error('Analytics error:', error);
            }
        },

        trackError(error, context) {
            try {
                console.error('Error:', error, 'Context:', context);
                // Send to error tracking service
            } catch (e) {
                console.error('Error tracking failed:', e);
            }
        }
    };

    // Global error handler
    window.addEventListener('error', (event) => {
        analytics.trackError(event.error, {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    // Initialize all improvements
    improveAccessibility();
    optimizePerformance();

    // Header functionality
    function initializeHeader() {
        const header = document.querySelector('.header');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mainNav = document.querySelector('.main-nav');
        let lastScroll = 0;

        // Scroll effect
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add/remove scrolled class
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide/show header on scroll
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });

        // Mobile menu toggle
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mainNav.classList.toggle('active');
            
            // Accessibility
            const isExpanded = mainNav.classList.contains('active');
            mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
            
            // Announce menu state to screen readers
            announce(isExpanded ? 'Menu opened' : 'Menu closed');
        });

        // Close mobile menu on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });

        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target) && mainNav.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });

        // Add active state to current page link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelector(`.nav-link[href="${currentPage}"]`)?.classList.add('active');
    }

    // Initialize header
    initializeHeader();

    // Profile section functionality
    const profileSection = document.getElementById('profileSection');
    const profileDropdown = document.getElementById('profileDropdown');

    // Profile click handler
    profileSection.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Get the position of the profile card
        const rect = this.getBoundingClientRect();
        
        // Position the dropdown
        profileDropdown.style.top = rect.top + window.scrollY + 'px';
        profileDropdown.style.left = rect.left + 'px';
        profileDropdown.style.width = rect.width + 'px';
        
        // Toggle the dropdown
        profileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileSection.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Prevent dropdown from closing when clicking inside it
    profileDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Update dropdown position on scroll and resize
    window.addEventListener('scroll', updateDropdownPosition);
    window.addEventListener('resize', updateDropdownPosition);

    function updateDropdownPosition() {
        if (profileDropdown.classList.contains('active')) {
            const rect = profileSection.getBoundingClientRect();
            profileDropdown.style.top = rect.top + window.scrollY + 'px';
            profileDropdown.style.left = rect.left + 'px';
            profileDropdown.style.width = rect.width + 'px';
        }
    }

    // Add these styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .dropdown-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
