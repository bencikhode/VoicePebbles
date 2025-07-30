// account.js - Handles Firebase Authentication and Firestore interactions for the account page

// Firebase SDKs (CDN) - These imports are now at the top of the JS file
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: YOUR ACTUAL FIREBASE CONFIGURATION IS PASTED HERE ---
    // This configuration links your JavaScript code to your "voicepebbles-aus" Firebase project.
    // This is the ONLY firebaseConfig object that will be used for initialization.
    const firebaseConfig = {
      apiKey: "AIzaSyCqr3Mr0WzU8IErNbfRG2jt-WeZIa9epAY",
      authDomain: "voicepebbles-aus.firebaseapp.com",
      projectId: "voicepebbles-aus",
      storageBucket: "voicepebbles-aus.firebasestorage.app",
      messagingSenderId: "743431508806",
      appId: "1:743431508806:web:23bdecb5ecbfcb7e958b47",
      measurementId: "G-5XS8H3X3L8" // Optional, if you use Google Analytics for Firebase
    };
    // --- END IMPORTANT SECTION ---

    // Derive appId directly from the projectId in your firebaseConfig
    // This will be used for constructing Firestore paths (e.g., artifacts/voicepebbles-aus/...)
    const appId = firebaseConfig.projectId;

    // --- DEBUGGING LOGS ---
    console.log('Firebase App ID (derived for Firestore path):', appId);
    // Using JSON.stringify to ensure the full object content is logged
    console.log('Firebase Config (used for initialization):', JSON.stringify(firebaseConfig, null, 2));
    // --- END DEBUGGING LOGS ---

    // --- NEW CHECK: Ensure firebaseConfig is valid before initializing Firebase ---
    if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('Firebase initialization failed: Missing or invalid firebaseConfig. Please ensure your firebaseConfig object is correctly populated with your project details.');
        // Display a user-friendly message on the page as well
        const authMessageElement = document.getElementById('auth-message');
        if (authMessageElement) {
            authMessageElement.textContent = 'Error: Firebase configuration missing or invalid. Please contact support.';
            authMessageElement.style.color = 'red';
        }
        return; // Stop script execution if configuration is bad
    }
    // --- END NEW CHECK ---

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let currentUserId = null; // To store the authenticated user's UID

    // DOM Elements
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');
    const authForm = document.getElementById('auth-form');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const authMessage = document.getElementById('auth-message');
    const userEmailSpan = document.getElementById('user-email');
    const userIdSpan = document.getElementById('user-id');
    const logoutButton = document.getElementById('logout-button');
    const userNameInput = document.getElementById('user-name');
    const saveProfileButton = document.getElementById('save-profile-button');
    const profileMessage = document.getElementById('profile-message');
    const loadingIndicator = document.getElementById('loading-indicator');
    const siteHeader = document.querySelector('.site-header'); // Get the main header element

    // Function to show/hide loading indicator
    const showLoading = (show) => {
        loadingIndicator.style.display = show ? 'block' : 'none';
    };

    // Function to display messages
    const displayMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
    };

    // --- Authentication Handlers ---

    // Sign Up
    signupButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        if (!email || !password) {
            displayMessage(authMessage, 'Please enter email and password.', true);
            return;
        }
        showLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            displayMessage(authMessage, 'Signed up successfully! Welcome.', false);
            // After signup, automatically create a basic profile document in Firestore
            await setDoc(doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`), {
                email: userCredential.user.email,
                name: '' // Initialize with an empty name
            });
            console.log('User profile created in Firestore.');
        } catch (error) {
            displayMessage(authMessage, `Sign up failed: ${error.message}`, true);
            console.error('Sign up error:', error);
        } finally {
            showLoading(false);
        }
    });

    // Login
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        if (!email || !password) {
            displayMessage(authMessage, 'Please enter email and password.', true);
            return;
        }
        showLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            displayMessage(authMessage, 'Logged in successfully!', false);
        } catch (error) {
            displayMessage(authMessage, `Login failed: ${error.message}`, true);
            console.error('Login error:', error);
        } finally {
            showLoading(false);
        }
    });

    // Logout
    logoutButton.addEventListener('click', async () => {
        showLoading(true);
        try {
            await signOut(auth);
            displayMessage(authMessage, 'Logged out successfully!', false);
        } catch (error) {
            displayMessage(authMessage, `Logout failed: ${error.message}`, true);
            console.error('Logout error:', error);
        } finally {
            showLoading(false);
        }
    });

    // --- Firestore Profile Management ---

    // Save User Profile Data
    saveProfileButton.addEventListener('click', async () => {
        if (!currentUserId) {
            displayMessage(profileMessage, 'Please log in to save your profile.', true);
            return;
        }
        showLoading(true);
        try {
            await updateDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`), {
                name: userNameInput.value
            });
            displayMessage(profileMessage, 'Profile updated successfully!', false);
        } catch (error) {
            displayMessage(profileMessage, `Failed to save profile: ${error.message}`, true);
            console.error('Save profile error:', error);
        } finally {
            showLoading(false);
        }
    });

    // Fetch User Profile Data
    const fetchUserProfile = async (uid) => {
        showLoading(true);
        try {
            const docRef = doc(db, `artifacts/${appId}/users/${uid}/profile/data`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                userNameInput.value = userData.name || '';
                displayMessage(profileMessage, 'Profile loaded.', false);
            } else {
                // If profile doesn't exist (e.g., old user or direct login without signup)
                // Create a basic profile document
                await setDoc(docRef, {
                    email: auth.currentUser.email,
                    name: ''
                });
                userNameInput.value = '';
                displayMessage(profileMessage, 'New profile created.', false);
            }
        } catch (error) {
            displayMessage(profileMessage, `Failed to load profile: ${error.message}`, true);
            console.error('Fetch profile error:', error);
        } finally {
            showLoading(false);
        }
    };

    // --- Authentication State Listener ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            currentUserId = user.uid;
            userEmailSpan.textContent = user.email;
            userIdSpan.textContent = user.uid; // Display full UID
            authSection.style.display = 'none';
            profileSection.style.display = 'block';
            await fetchUserProfile(user.uid); // Fetch user-specific data
        } else {
            // User is signed out
            currentUserId = null;
            authSection.style.display = 'block';
            profileSection.style.display = 'none';
            authEmailInput.value = '';
            authPasswordInput.value = '';
            userNameInput.value = '';
            displayMessage(authMessage, ''); // Clear auth message
            displayMessage(profileMessage, ''); // Clear profile message
        }
    });

    // --- Inject common partials (header and footer) ---
    const injectPartials = async () => {
        try {
            // Inject Navbar
            const navbarPlaceholder = document.getElementById('navbar-placeholder');
            if (navbarPlaceholder) {
                const navbarResponse = await fetch('header.html');
                if (!navbarResponse.ok) throw new Error(`HTTP error! status: ${navbarResponse.status}`);
                const navbarHTML = await navbarResponse.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = navbarHTML;
                const navElement = tempDiv.querySelector('.main-nav');
                if (navElement) {
                    navbarPlaceholder.appendChild(navElement);
                    console.log('Navbar injected successfully into account.html');
                    // Initialize mobile menu for account.html
                    initializeMobileMenu(navElement);
                }
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
                console.log('Footer injected successfully into account.html');
            } else {
                console.error('No <footer> element found in footer.html');
            }

        } catch (error) {
            console.error('Error injecting partials into account.html:', error);
        }
    };

    // Mobile menu initialization (copied from your main script.js)
    const initializeMobileMenu = (nav) => {
        const menuToggle = nav.querySelector('.menu-toggle');
        const navList = nav.querySelector('ul');
        // siteHeader is already defined globally in this account.js scope

        if (menuToggle && navList && siteHeader) {
            const closeMenu = () => {
                if (nav.classList.contains('nav-collapsed')) {
                    menuToggle.setAttribute('aria-expanded', 'false');
                    nav.classList.remove('nav-collapsed');
                    navList.style.maxHeight = '0';
                    setTimeout(() => {
                        navList.style.display = 'none';
                    }, 300);
                    console.log('Navbar closed');
                }
            };

            const openMenu = () => {
                menuToggle.setAttribute('aria-expanded', 'true');
                nav.classList.add('nav-collapsed');
                const headerHeight = siteHeader.offsetHeight; // Get actual header height
                navList.style.top = headerHeight + 'px';
                navList.style.display = 'flex';
                navList.style.maxHeight = navList.scrollHeight + 'px';
                console.log('Navbar opened');
            };

            const toggleMenu = () => {
                if (nav.classList.contains('nav-collapsed')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            };

            menuToggle.addEventListener('click', toggleMenu);

            document.addEventListener('click', (event) => {
                const isClickInsideNav = nav.contains(event.target);
                const isMenuOpen = nav.classList.contains('nav-collapsed');
                if (!isClickInsideNav && isMenuOpen) {
                    closeMenu();
                }
            });

            const handleResize = () => {
                if (window.innerWidth > 768) {
                    nav.classList.remove('nav-collapsed');
                    navList.style.maxHeight = '';
                    navList.style.display = '';
                    navList.style.top = ''; // Reset dynamic top for desktop
                    menuToggle.setAttribute('aria-expanded', 'false');
                } else {
                    if (!nav.classList.contains('nav-collapsed')) {
                        navList.style.display = 'none';
                    }
                    // Recalculate top on resize for mobile
                    const headerHeight = siteHeader.offsetHeight;
                    navList.style.top = headerHeight + 'px';
                }
            };

            window.addEventListener('resize', handleResize);
            handleResize(); // Initial call
        } else {
            console.error('Mobile menu elements not found for initialization in account.html');
        }
    };

    // Execute injection of common partials
    injectPartials();
});
