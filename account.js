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
    console.log('Firebase Config (used for initialization):', JSON.stringify(firebaseConfig, null, 2));
    // --- END DEBUGGING LOGS ---

    // --- NEW CHECK: Ensure firebaseConfig is valid before initializing Firebase ---
    if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('Firebase initialization failed: Missing or invalid firebaseConfig. Please ensure your firebaseConfig object is correctly populated with your project details.');
        const authMessageElement = document.getElementById('auth-message');
        if (authMessageElement) {
            authMessageElement.textContent = 'Error: Firebase configuration missing or invalid. Please contact support.';
            authMessageElement.style.color = 'red';
        }
        document.getElementById('loading-indicator').style.display = 'none'; // Hide loading if config is bad
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
    const siteHeader = document.querySelector('.site-header');
    const profilePicture = document.getElementById('profile-picture');

    // Modal elements
    const customModal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalOkButton = document.getElementById('modal-ok-button');
    const closeModalButton = customModal.querySelector('.close-button');


    // Function to show/hide loading indicator
    const showLoading = (show) => {
        loadingIndicator.style.display = show ? 'block' : 'none';
    };

    // Function to display messages using the custom modal
    const showCustomModal = (title, message, isError = false) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalTitle.style.color = isError ? '#dc3545' : 'var(--primary-color)';
        modalMessage.style.color = isError ? '#dc3545' : 'var(--text-color)';
        customModal.classList.add('show');
    };

    // Function to hide the custom modal
    const hideCustomModal = () => {
        customModal.classList.remove('show');
        modalTitle.textContent = '';
        modalMessage.textContent = '';
    };

    // Add event listeners for modal close actions
    modalOkButton.addEventListener('click', hideCustomModal);
    closeModalButton.addEventListener('click', hideCustomModal);
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) {
            hideCustomModal();
        }
    });


    // --- Authentication Handlers ---

    // Sign Up
    signupButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        if (!email || !password) {
            showCustomModal('Sign Up Error', 'Please enter email and password.', true);
            return;
        }
        showLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            showCustomModal('Success!', 'Signed up successfully! Welcome.', false);
            await setDoc(doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`), {
                email: userCredential.user.email,
                name: '',
                profilePicUrl: ''
            });
            console.log('User profile created in Firestore.');
            window.location.href = 'dashboard.html';
        } catch (error) {
            let title = 'Sign Up Failed';
            let message = `An unexpected error occurred: ${error.message}`;
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already in use. Please try logging in or use a different email.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your internet connection.';
            }
            showCustomModal(title, message, true);
            console.error('Sign up error:', error);
        } finally {
            showLoading(false);
        }
    });

    // Login
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        if (!email || !password) {
            showCustomModal('Login Error', 'Please enter email and password.', true);
            return;
        }
        showLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showCustomModal('Success!', 'Logged in successfully!', false);
            window.location.href = 'dashboard.html';
        } catch (error) {
            let title = 'Login Failed';
            let message = `An unexpected error occurred: ${error.message}`;
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = 'Please check your email and password.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your internet connection.';
            }
            showCustomModal(title, message, true);
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
            console.log('Logged out successfully!');
            // After logout, the onAuthStateChanged listener will handle UI update
            // No explicit redirect here, as the listener will show auth section
        } catch (error) {
            showCustomModal('Logout Failed', `An error occurred during logout: ${error.message}`, true);
            console.error('Logout error:', error);
        } finally {
            showLoading(false);
        }
    });

    // --- Firestore Profile Management ---

    // Save User Profile Data
    saveProfileButton.addEventListener('click', async () => {
        if (!currentUserId) {
            showCustomModal('Profile Error', 'Please log in to save your profile.', true);
            return;
        }
        showLoading(true);
        try {
            await updateDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`), {
                name: userNameInput.value
                // profilePicUrl: profilePicture.src // If you add an upload feature later
            });
            showCustomModal('Profile Updated', 'Your profile has been updated successfully!', false);
        } catch (error) {
            showCustomModal('Profile Update Failed', `Failed to save profile: ${error.message}`, true);
            console.error('Save profile error:', error);
        } finally {
            showLoading(false);
        }
    });

    // Fetch User Profile Data
    const fetchUserProfileData = async (uid) => {
        const docRef = doc(db, `artifacts/${appId}/users/${uid}/profile/data`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            const defaultProfile = {
                email: auth.currentUser.email, // Use the stored email
                name: '',
                profilePicUrl: ''
            };
            await setDoc(docRef, defaultProfile);
            return defaultProfile;
        }
    };

    // --- Authentication State Listener ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // User is signed out, show the authentication section
            currentUserId = null;
            authSection.style.display = 'block';
            profileSection.style.display = 'none';
            authEmailInput.value = '';
            authPasswordInput.value = '';
            userNameInput.value = '';
            profilePicture.src = 'https://placehold.co/100x100/e0e0e0/ffffff?text=User';
        }
        showLoading(false); // Hide loading indicator once auth state is determined and UI is updated
    });

    // --- Inject common partials (header and footer) ---
    const injectPartials = async () => {
        try {
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
                    initializeMobileMenu(navElement);
                }
            }

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
        const siteHeader = document.querySelector('.site-header');

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
                const headerHeight = siteHeader.offsetHeight;
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
                    navList.style.top = '';
                    menuToggle.setAttribute('aria-expanded', 'false');
                } else {
                    if (!nav.classList.contains('nav-collapsed')) {
                        navList.style.display = 'none';
                    }
                    const headerHeight = siteHeader.offsetHeight;
                    navList.style.top = headerHeight + 'px';
                }
            };

            window.addEventListener('resize', handleResize);
            handleResize();
        } else {
            console.error('Mobile menu elements not found for initialization in account.html');
        }
    };

    injectPartials();
});
