document.querySelector('.menu-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('header nav ul').classList.toggle('active');
}); 

// Add shooting stars effect
function createShootingStar() {
    const header = document.querySelector('header');
    const star = document.createElement('div');
    star.className = 'shooting-star';
    
    // Random starting position
    star.style.top = Math.random() * 100 + '%';
    star.style.left = Math.random() * 100 + '%';
    
    header.appendChild(star);
    
    // Remove the star after animation
    setTimeout(() => {
        star.remove();
    }, 2000);
}

// Create shooting stars periodically
setInterval(createShootingStar, 4000); 

// Enhanced Space Dust Effect
function createSpaceDust() {
    const header = document.querySelector('header');
    const dust = document.createElement('div');
    dust.className = 'space-dust';
    
    // Random starting position
    dust.style.top = Math.random() * 100 + '%';
    dust.style.left = Math.random() * 100 + '%';
    
    // Random size
    const size = Math.random() * 4 + 2;
    dust.style.width = size + 'px';
    dust.style.height = size + 'px';
    
    header.appendChild(dust);
    
    setTimeout(() => dust.remove(), 4000);
}

// Create more frequent space dust
setInterval(createSpaceDust, 50);

// Create Warp Speed Effect
function createWarpSpeed() {
    const header = document.querySelector('header');
    const warp = document.createElement('div');
    warp.className = 'warp-speed';
    header.appendChild(warp);
}

// Initialize warp speed effect
createWarpSpeed();

// Enhanced Dynamic Stars
function createDynamicStars() {
    const stars = document.querySelectorAll('#stars, #stars2, #stars3');
    stars.forEach((starLayer, index) => {
        const numberOfStars = 100; // Increased number of stars
        let shadowString = '';
        
        for(let i = 0; i < numberOfStars; i++) {
            const x = Math.floor(Math.random() * 2000);
            const y = Math.floor(Math.random() * 2000);
            const size = (Math.random() * 2 + 1).toFixed(1);
            const opacity = (Math.random() * 0.5 + 0.5).toFixed(2);
            const color = Math.random() > 0.5 ? 
                `rgba(147, 77, 255, ${opacity})` : 
                `rgba(255, 255, 255, ${opacity})`;
            
            shadowString += `${x}px ${y}px ${size}px ${color}`;
            if(i < numberOfStars - 1) shadowString += ',';
        }
        
        starLayer.style.boxShadow = shadowString;
    });
}

// Enhanced Parallax Effect
document.addEventListener('mousemove', (e) => {
    const stars = document.querySelectorAll('#stars, #stars2, #stars3');
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    stars.forEach((starLayer, index) => {
        const speed = (index + 1) * 30; // Increased parallax effect
        const scale = 1 + (index * 0.1);
        starLayer.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px) scale(${scale})`;
    });
});

// Recreate stars periodically for continuous effect
setInterval(createDynamicStars, 10000);

// Add this to your header HTML
document.querySelector('header').innerHTML += `
    <div class="stars-container">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
    </div>
`;

// Dynamic space background for about section
function createAboutSpaceEffect() {
    const about = document.querySelector('.about');
    
    // Create floating particles
    for(let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'space-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3}px;
            height: ${Math.random() * 3}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
        `;
        about.appendChild(particle);
    }
}

// Add keyframes for floating particles
const style = document.createElement('style');
style.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            transform: translateY(-1000%) translateX(${Math.random() * 200 - 100}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the space effect
document.addEventListener('DOMContentLoaded', createAboutSpaceEffect);

// Scroll reveal animation
function revealOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .step, .testimonial-card');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);

// Add this CSS for the reveal animation
const revealStyle = document.createElement('style');
revealStyle.textContent = `
    .feature-card, .step, .testimonial-card {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .feature-card.active, .step.active, .testimonial-card.active {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(revealStyle);

// Back to Top Button
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}); 