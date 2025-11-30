// Web3 instance and contract interfaces
let web3;
let userContract;
let kycContract;

// DOM Elements
const userAvatar = document.getElementById('userAvatar');
const username = document.getElementById('username');
const walletAddress = document.getElementById('walletAddress');
const joinDate = document.getElementById('joinDate');
const kycBadge = document.getElementById('kycBadge');
const kycLevel = document.getElementById('kycLevel');
const totalBalance = document.getElementById('totalBalance');
const collateralValue = document.getElementById('collateralValue');
const borrowedAmount = document.getElementById('borrowedAmount');
const mfaToggle = document.getElementById('mfaToggle');
const notificationsToggle = document.getElementById('notificationsToggle');

// DOM Elements for avatar
const avatarInput = document.getElementById('avatarInput');
const avatarFallback = document.querySelector('.avatar-fallback');

// Add these at the top with other DOM elements
const galleryInput = document.getElementById('galleryInput');
const imageGallery = document.getElementById('imageGallery');

// Initialize Web3 and load user data
async function initializeProfile() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Initialize Web3
            web3 = new Web3(window.ethereum);
            
            // Update UI with account
            updateWalletInfo(account);
            
            // Initialize contracts
            initializeContracts();
            
            // Load user data
            await loadUserData();
            
            // Load gallery images
            await loadGalleryImages();
            
            // Setup event listeners
            setupEventListeners();
            
            showSuccess('Connected to MetaMask');
        } catch (error) {
            console.error('Error initializing profile:', error);
            showError('Failed to connect to MetaMask');
        }
    } else {
        showError('Please install MetaMask to use this platform');
    }
}

// Initialize smart contract instances
function initializeContracts() {
    // Add your contract ABIs and addresses here
    userContract = new web3.eth.Contract(USER_ABI, USER_CONTRACT_ADDRESS);
    kycContract = new web3.eth.Contract(KYC_ABI, KYC_CONTRACT_ADDRESS);
}

// Load user data from blockchain
async function loadUserData() {
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];
    
    // Update wallet address
    walletAddress.textContent = formatAddress(userAddress);
    
    // Fetch user profile data
    const userData = await userContract.methods.getUserProfile(userAddress).call();
    username.textContent = userData.username || 'Anonymous';
    joinDate.textContent = formatDate(userData.joinDate);
    
    // Fetch KYC status
    const kycStatus = await kycContract.methods.getKYCStatus(userAddress).call();
    updateKYCStatus(kycStatus);
    
    // Fetch balances
    await updateBalances(userAddress);
}

// Update user balances
async function updateBalances(address) {
    try {
        const balances = await userContract.methods.getUserBalances(address).call();
        totalBalance.textContent = formatCurrency(balances.total);
        collateralValue.textContent = formatCurrency(balances.collateral);
        borrowedAmount.textContent = formatCurrency(balances.borrowed);
    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Avatar upload
    document.querySelector('.edit-avatar').addEventListener('click', (e) => {
        e.preventDefault();
        avatarInput.click();
    });
    
    // Copy wallet address
    document.querySelector('.copy-address').addEventListener('click', copyWalletAddress);
    
    // Toggle switches
    mfaToggle.addEventListener('change', handleMFAToggle);
    notificationsToggle.addEventListener('change', handleNotificationsToggle);
    
    // Logout
    document.querySelector('.logout-btn').addEventListener('click', handleLogout);

    avatarInput.addEventListener('change', handleImageUpload);
    
    galleryInput.addEventListener('change', handleGalleryUpload);
    
    // MetaMask account change listener
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
            updateWalletInfo(accounts[0]);
            loadUserData();
            loadGalleryImages();
        } else {
            showError('Please connect to MetaMask');
        }
    });
}

// Handle avatar upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('Image size should be less than 5MB');
            return;
        }

        try {
            // Show loading state
            userAvatar.style.opacity = '0.5';
            
            // Read and preview the image
            const reader = new FileReader();
            
            reader.onload = function(e) {
                userAvatar.src = e.target.result;
                userAvatar.style.display = 'block';
                userAvatar.style.opacity = '1';
                avatarFallback.style.display = 'none';
            };

            reader.onerror = function() {
                showError('Error reading file');
                resetAvatarToFallback();
            };

            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            
            // Update the avatar URL in blockchain if needed
            if (web3 && userContract) {
                await userContract.methods.updateAvatar(data.imageUrl)
                    .send({ from: ethereum.selectedAddress });
            }

            showSuccess('Profile picture updated successfully');

        } catch (error) {
            console.error('Error uploading image:', error);
            showError('Failed to update profile picture');
            resetAvatarToFallback();
        }
    }
}

function resetAvatarToFallback() {
    userAvatar.style.display = 'none';
    userAvatar.src = 'default-avatar.png';
    avatarFallback.style.display = 'flex';
}

// Handle avatar load errors
userAvatar.addEventListener('error', () => {
    resetAvatarToFallback();
});

// Copy wallet address to clipboard
function copyWalletAddress() {
    const address = walletAddress.textContent;
    navigator.clipboard.writeText(address)
        .then(() => showSuccess('Address copied to clipboard'))
        .catch(() => showError('Failed to copy address'));
}

// Handle MFA toggle
async function handleMFAToggle(e) {
    try {
        await userContract.methods.setMFAEnabled(e.target.checked)
            .send({ from: ethereum.selectedAddress });
        showSuccess('MFA settings updated');
    } catch (error) {
        console.error('Error updating MFA:', error);
        e.target.checked = !e.target.checked;
        showError('Failed to update MFA settings');
    }
}

// Handle notifications toggle
async function handleNotificationsToggle(e) {
    try {
        await userContract.methods.setNotificationsEnabled(e.target.checked)
            .send({ from: ethereum.selectedAddress });
        showSuccess('Notification settings updated');
    } catch (error) {
        console.error('Error updating notifications:', error);
        e.target.checked = !e.target.checked;
        showError('Failed to update notification settings');
    }
}

// Handle logout
function handleLogout() {
    // Clear local storage
    localStorage.clear();
    // Redirect to login page
    window.location.href = '/login';
}

// Utility functions
function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfile);

// Listen for network changes
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => window.location.reload());
    window.ethereum.on('accountsChanged', () => window.location.reload());
}

// Check if user has an existing avatar
function checkExistingAvatar() {
    if (userAvatar.src && userAvatar.src !== 'default-avatar.png') {
        userAvatar.style.display = 'block';
        avatarFallback.style.display = 'none';
    }
}

// Call this when page loads
document.addEventListener('DOMContentLoaded', checkExistingAvatar);

// Add these new functions for gallery handling
async function loadGalleryImages() {
    try {
        // Fetch images from your backend/blockchain
        const images = await userContract.methods.getUserGallery(ethereum.selectedAddress).call();
        
        // Clear existing gallery
        imageGallery.innerHTML = '';
        
        // Add images to gallery
        images.forEach(imageUrl => addImageToGallery(imageUrl));
    } catch (error) {
        console.error('Error loading gallery:', error);
        showError('Failed to load gallery images');
    }
}

function addImageToGallery(imageUrl) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="Gallery Image">
        <button class="delete-image" onclick="deleteImage('${imageUrl}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    imageGallery.appendChild(galleryItem);
}

async function handleGalleryUpload(event) {
    const files = event.target.files;
    
    if (files.length > 0) {
        try {
            for (let file of files) {
                // Validate file
                if (!file.type.startsWith('image/')) {
                    showError(`${file.name} is not an image file`);
                    continue;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    showError(`${file.name} is too large (max 5MB)`);
                    continue;
                }
                
                // Create FormData
                const formData = new FormData();
                formData.append('image', file);
                
                // Upload to server
                const response = await fetch('/api/upload-gallery', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Upload failed');
                
                const { imageUrl } = await response.json();
                
                // Store in blockchain
                await userContract.methods.addGalleryImage(imageUrl)
                    .send({ from: ethereum.selectedAddress });
                
                // Add to gallery
                addImageToGallery(imageUrl);
                showSuccess('Image uploaded successfully');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            showError('Failed to upload images');
        }
    }
}

async function deleteImage(imageUrl) {
    try {
        // Delete from blockchain
        await userContract.methods.removeGalleryImage(imageUrl)
            .send({ from: ethereum.selectedAddress });
        
        // Remove from UI
        const galleryItem = Array.from(imageGallery.children)
            .find(item => item.querySelector('img').src === imageUrl);
        
        if (galleryItem) {
            galleryItem.remove();
            showSuccess('Image deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        showError('Failed to delete image');
    }
}

// Update wallet info
function updateWalletInfo(account) {
    const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    walletAddress.textContent = shortAddress;
}
