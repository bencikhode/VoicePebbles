document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, starting injection');

    const injectPartials = async () => {
        try {
            // Inject Navbar
            const navbarPlaceholder = document.getElementById('navbar-placeholder');
            if (navbarPlaceholder) {
                const navbarResponse = await fetch('header.html');
                if (!navbarResponse.ok) throw new Error(`HTTP error! status: ${navbarResponse.status}`);
                const navbarHTML = await navbarResponse.text();

                // Create a temporary div to parse the HTML and get only the <nav> element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = navbarHTML;
                const navElement = tempDiv.querySelector('.main-nav');

                if (navElement) {
                    navbarPlaceholder.appendChild(navElement);
                    console.log('Navbar injected successfully:', navElement);

                    // Initialize mobile menu toggle after injection
                    initializeMobileMenu();
                } else {
                    console.error('No .main-nav element found in header.html');
                }
            } else {
                console.error('Navbar placeholder element not found');
            }

            // Inject Footer
            const footerResponse = await fetch('footer.html');
            if (!footerResponse.ok) throw new Error(`HTTP error! status: ${footerResponse.status}`);
            const footerHTML = await footerResponse.text();

            const parser = new DOMParser();
            const footerDoc = parser.parseFromString(footerHTML, 'text/html');
            const footerElement = footerDoc.querySelector('footer');

            if (footerElement) {
                document.body.appendChild(footerElement);
                console.log('Footer injected successfully');
            } else {
                console.error('No <footer> element found in footer.html');
            }

        } catch (error) {
            console.error('Error in injection process:', error);
        }
    };

    // Function to initialize mobile menu (extracted for clarity)
    const initializeMobileMenu = () => {
        const nav = document.querySelector('.main-nav');
        if (nav) {
            console.log('Navbar found, initializing mobile menu functionality.');
            const menuToggle = nav.querySelector('.menu-toggle');
            const navList = nav.querySelector('ul'); // Get the main ul list

            if (menuToggle && navList) {
                menuToggle.addEventListener('click', () => {
                    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
                    menuToggle.setAttribute('aria-expanded', !isExpanded);
                    nav.classList.toggle('nav-collapsed');
                    // Toggle display for the main navigation list directly
                    if (nav.classList.contains('nav-collapsed')) {
                        navList.style.maxHeight = navList.scrollHeight + 'px'; // Expand to content height
                    } else {
                        navList.style.maxHeight = '0'; // Collapse
                    }
                    console.log('Navbar toggle clicked');
                });

                // Handle dropdowns on mobile
                const dropdowns = nav.querySelectorAll('.dropdown > a');
                dropdowns.forEach(dropdown => {
                    dropdown.addEventListener('click', (e) => {
                        // Prevent default link behavior if it's a dropdown trigger
                        if (window.innerWidth <= 768) { // Only apply on mobile
                            e.preventDefault();
                            const dropdownMenu = dropdown.nextElementSibling;
                            if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
                                dropdown.setAttribute('aria-expanded', dropdown.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
                            }
                        }
                    });
                });
            } else {
                console.error('Menu toggle or nav list not found after navbar injection.');
            }
        }
    };


    // Carousel functionality (Keep as is)
    const carousel = document.querySelector('.features-carousel');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    let autoScrollInterval;

    if (carousel && prevButton && nextButton) {
        const scrollNext = () => {
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;
            if (carousel.scrollLeft >= maxScroll) {
                carousel.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: 280, behavior: 'smooth' });
            }
        };

        const startAutoScroll = () => {
            autoScrollInterval = setInterval(scrollNext, 5000);
        };

        const stopAutoScroll = () => {
            clearInterval(autoScrollInterval);
        };

        prevButton.addEventListener('click', () => {
            stopAutoScroll();
            carousel.scrollBy({ left: -280, behavior: 'smooth' });
            startAutoScroll();
        });

        nextButton.addEventListener('click', () => {
            stopAutoScroll();
            scrollNext();
            startAutoScroll();
        });

        carousel.addEventListener('mouseenter', stopAutoScroll);
        carousel.addEventListener('mouseleave', startAutoScroll);

        startAutoScroll();
    }

    // Execute injection
    injectPartials();
});