document.addEventListener('DOMContentLoaded', function() {
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdown = document.getElementById('profile-dropdown');

    // Navigate to new-index.html when clicking the avatar
    profileAvatar.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'new-index.html';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !profileAvatar.contains(e.target)) {
            dropdown.style.display = 'none';
            profileAvatar.classList.remove('active');
        }
    });

    // Handle button clicks in dropdown
    dropdown.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-account')) {
            window.location.href = 'signup.html';
        } else if (e.target.classList.contains('logout')) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            window.location.href = 'index.html';
        }
    });

    // Set user info
    const userEmail = localStorage.getItem('userEmail') || 'jatin@gmail.com';
    const userName = 'JATIN SONI';
    const initials = userName.split(' ').map(name => name[0]).join('');
    
    // Update displays
    profileAvatar.textContent = initials;
    document.querySelector('.profile-image-avatar span').textContent = initials;
    document.querySelector('.profile-name').textContent = userName;
    document.querySelector('.email-text').textContent = userEmail;

    // Liquid cursor effect
    const header = document.getElementById('main-header');
    const liquidCursor = document.querySelector('.liquid-cursor');
    const trails = [];
    const maxTrails = 10;

    function createTrail() {
        const trail = document.createElement('div');
        trail.className = 'liquid-trail';
        header.appendChild(trail);
        return trail;
    }

    // Initialize trails
    for (let i = 0; i < maxTrails; i++) {
        trails.push(createTrail());
    }

    let trailIndex = 0;
    let lastX = 0;
    let lastY = 0;

    header.addEventListener('mousemove', (e) => {
        const rect = header.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update main cursor
        liquidCursor.style.left = `${x}px`;
        liquidCursor.style.top = `${y}px`;
        liquidCursor.style.opacity = '1';

        // Update trails
        const trail = trails[trailIndex];
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        trail.style.opacity = '1';

        // Calculate velocity for size variation
        const velocity = Math.hypot(x - lastX, y - lastY);
        const size = Math.min(10 + velocity * 0.5, 20);
        trail.style.width = `${size}px`;
        trail.style.height = `${size}px`;

        lastX = x;
        lastY = y;
        trailIndex = (trailIndex + 1) % maxTrails;
    });

    header.addEventListener('mouseleave', () => {
        liquidCursor.style.opacity = '0';
        trails.forEach(trail => {
            trail.style.opacity = '0';
        });
    });

    // Fade out trails gradually
    function fadeTrails() {
        trails.forEach(trail => {
            const currentOpacity = parseFloat(trail.style.opacity) || 0;
            if (currentOpacity > 0) {
                trail.style.opacity = Math.max(0, currentOpacity - 0.02);
            }
        });
        requestAnimationFrame(fadeTrails);
    }

    fadeTrails();
});
