// dashboard.js - Handles authentication check, content loading, and user settings for the dashboard page

// Firebase SDKs (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, getDocs, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js"; // Added uploadBytesResumable

document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: YOUR ACTUAL FIREBASE CONFIGURATION IS PASTED HERE ---
    // This configuration links your JavaScript code to your "voicepebbles-aus" Firebase project.
    const firebaseConfig = {
      apiKey: "AIzaSyCqr3Mr0WzU8IErNbfRG2jt-WeZIa9epAY",
      authDomain: "voicepebbles-aus.firebaseapp.com",
      projectId: "voicepebbles-aus",
      storageBucket: "voicepebbles-aus.firebasestorage.app",
      messagingSenderId: "743431508806",
      appId: "1:743431508806:web:23bdecb5ecbfcb7e958b47",
      measurementId: "G-5XS8H3X3L8" // Optional
    };
    // --- END IMPORTANT SECTION ---

    // Derive appId directly from the projectId in your firebaseConfig
    const appId = firebaseConfig.projectId;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    let currentUserId = null; // To store the authenticated user's UID
    let currentUserEmail = null; // To store the authenticated user's email

    // DOM Elements
    const loadingIndicator = document.getElementById('loading-indicator');
    const dashboardUserNameSpan = document.getElementById('dashboard-user-name');
    const welcomeBackgroundImage = document.getElementById('welcome-background-image'); // Reference to the background image div
    const subscriptionPlanSpan = document.getElementById('subscription-plan');
    const subscriptionMessageP = document.getElementById('subscription-message');
    const subscribedContentGrid = document.getElementById('subscribed-content-grid');
    const allContentGrid = document.getElementById('all-content-grid');
    const noSubscribedContentMsg = document.getElementById('no-subscribed-content');
    const noAvailableContentMsg = document.getElementById('no-available-content');
    const siteHeader = document.querySelector('.site-header');

    // Settings Sidebar Elements
    const settingsSidebar = document.getElementById('settings-sidebar');
    const closeSidebarButton = settingsSidebar.querySelector('.close-sidebar-button');
    const mySettingsButton = document.getElementById('my-settings-button');
    const settingsProfilePicture = document.getElementById('settings-profile-picture');
    const profilePictureUpload = document.getElementById('profile-picture-upload');
    const removeProfilePictureButton = document.getElementById('remove-profile-picture');
    const settingsUserNameInput = document.getElementById('settings-user-name');
    const settingsUserIdSpan = document.getElementById('settings-user-id');
    const copyUserIdButton = document.getElementById('copy-user-id-button');
    const settingsLogoutButton = document.getElementById('settings-logout-button');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const settingsMessage = document.getElementById('settings-message');

    // Custom Alert/Confirmation Modal Elements (reused for general messages)
    const customModal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalOkButton = document.getElementById('modal-ok-button');
    const closeModalButton = customModal.querySelector('.close-button');


    // Function to show/hide loading indicator
    const showLoading = (show) => {
        loadingIndicator.style.display = show ? 'block' : 'none';
    };

    // Function to display messages using the custom modal (for subscription, etc.)
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

    // Add event listeners for custom modal close actions
    modalOkButton.addEventListener('click', hideCustomModal);
    closeModalButton.addEventListener('click', hideCustomModal);
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) {
            hideCustomModal();
        }
    });

    // --- Settings Sidebar Functions ---
    const toggleSettingsSidebar = async () => {
        console.log('toggleSettingsSidebar called.');
        if (!currentUserId) {
            console.log('No currentUserId, showing error modal.');
            showCustomModal('Error', 'You must be logged in to access settings.', true);
            return;
        }

        if (settingsSidebar.classList.contains('open')) {
            closeSettingsSidebar();
            return;
        }

        showLoading(true);
        settingsMessage.textContent = 'Loading settings...';
        settingsMessage.style.color = 'var(--primary-color)';
        console.log('Loading indicator shown.');

        try {
            console.log('Attempting to fetch user profile data...');
            const userProfile = await fetchUserProfileData(currentUserId);
            console.log('User profile data fetched:', userProfile);

            settingsUserNameInput.value = userProfile.name || '';
            settingsProfilePicture.src = userProfile.profilePicUrl || 'https://placehold.co/100x100/e0e0e0/ffffff?text=User';
            settingsUserIdSpan.textContent = currentUserId;

            removeProfilePictureButton.style.display = userProfile.profilePicUrl ? 'inline-flex' : 'none';

            settingsMessage.textContent = '';
            console.log('Adding "open" class to settings sidebar.');
            settingsSidebar.classList.add('open');
            const overlay = document.createElement('div');
            overlay.classList.add('sidebar-overlay');
            overlay.classList.add('open');
            document.body.appendChild(overlay);

            overlay.addEventListener('click', closeSettingsSidebar);
            console.log('Settings sidebar should now be visible.');
        } catch (error) {
            console.error('Error opening settings:', error);
            showCustomModal('Error', 'Failed to load settings. Please try again.', true);
            settingsMessage.textContent = `Failed to load settings: ${error.message}`;
            settingsMessage.style.color = 'red';
        } finally {
            showLoading(false);
            console.log('Loading indicator hidden.');
        }
    };

    const closeSettingsSidebar = () => {
        settingsSidebar.classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        }
        console.log('Settings sidebar closed.');
    };

    // --- Event Listeners for Settings Sidebar ---
    mySettingsButton.addEventListener('click', toggleSettingsSidebar);
    closeSidebarButton.addEventListener('click', closeSettingsSidebar);

    copyUserIdButton.addEventListener('click', () => {
        copyToClipboard(settingsUserIdSpan.textContent);
    });

    // Profile Picture Upload
    profilePictureUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected for upload.');
            return;
        }

        console.log(`Attempting to upload file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

        showLoading(true);
        settingsMessage.textContent = 'Uploading photo... 0%'; // Initial message with 0%
        settingsMessage.style.color = 'var(--primary-color)';

        try {
            const storageRef = ref(storage, `profilePictures/${currentUserId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file); // Use uploadBytesResumable for progress

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Observe state change events such as progress, pause, and resume
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${Math.round(progress)}%`);
                    settingsMessage.textContent = `Uploading photo... ${Math.round(progress)}%`;
                    settingsMessage.style.color = 'var(--primary-color)';
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error('Firebase Storage Upload Error:', error);
                    let errorMessage = `Failed to upload photo: ${error.message}`;
                    if (error.code === 'storage/unauthorized') {
                        errorMessage = 'Permission denied. Check Firebase Storage Rules.';
                    } else if (error.code === 'storage/canceled') {
                        errorMessage = 'Upload cancelled.';
                    } else if (error.code === 'storage/quota-exceeded') {
                        errorMessage = 'Storage quota exceeded.';
                    }
                    settingsMessage.textContent = errorMessage;
                    settingsMessage.style.color = 'red';
                    showLoading(false);
                },
                async () => {
                    // Handle successful uploads on complete
                    console.log('Upload complete. Getting download URL...');
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('Download URL:', downloadURL);

                    // Update user profile in Firestore with new URL
                    console.log('Updating Firestore with new profile picture URL...');
                    await updateDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`), {
                        profilePicUrl: downloadURL
                    });
                    console.log('Firestore updated successfully.');

                    settingsProfilePicture.src = downloadURL; // Update sidebar preview
                    welcomeBackgroundImage.style.backgroundImage = `url('${downloadURL}')`; // Update dashboard background image
                    removeProfilePictureButton.style.display = 'inline-flex';
                    settingsMessage.textContent = 'Profile picture updated successfully!';
                    settingsMessage.style.color = 'green';
                    showLoading(false);
                }
            );
        } catch (error) {
            console.error('Error initiating upload (catch block):', error);
            settingsMessage.textContent = `Failed to initiate upload: ${error.message}`;
            settingsMessage.style.color = 'red';
            showLoading(false);
        }
    });

    // Remove Profile Picture
    removeProfilePictureButton.addEventListener('click', async () => {
        const confirmRemove = confirm('Are you sure you want to remove your profile picture?');
        if (!confirmRemove) return;

        showLoading(true);
        settingsMessage.textContent = 'Removing photo...';
        settingsMessage.style.color = 'var(--primary-color)';

        try {
            const userProfile = await fetchUserProfileData(currentUserId);
            const currentPicUrl = userProfile.profilePicUrl;

            if (currentPicUrl) {
                const picRef = ref(storage, currentPicUrl);
                await deleteObject(picRef); // Delete from Storage

                // Update Firestore to remove the URL
                await updateDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`), {
                    profilePicUrl: ''
                });

                settingsProfilePicture.src = 'https://placehold.co/100x100/e0e0e0/ffffff?text=User'; // Reset sidebar preview
                welcomeBackgroundImage.style.backgroundImage = `url('https://placehold.co/600x400/e0e0e0/ffffff?text=User+Profile')`; // Reset dashboard background image
                removeProfilePictureButton.style.display = 'none';
                settingsMessage.textContent = 'Profile picture removed successfully!';
                settingsMessage.style.color = 'green';
            } else {
                settingsMessage.textContent = 'No profile picture to remove.';
                settingsMessage.style.color = 'orange';
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            settingsMessage.textContent = `Failed to remove photo: ${error.message}`;
            settingsMessage.style.color = 'red';
        } finally {
            showLoading(false);
        }
    });


    // Save Settings (Display Name)
    saveSettingsButton.addEventListener('click', async () => {
        if (!currentUserId) {
            showCustomModal('Error', 'You must be logged in to save settings.', true);
            return;
        }
        showLoading(true);
        settingsMessage.textContent = 'Saving changes...';
        settingsMessage.style.color = 'var(--primary-color)';

        try {
            const newName = settingsUserNameInput.value;
            await updateDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`), {
                name: newName
            });
            dashboardUserNameSpan.textContent = newName || currentUserEmail; // Update dashboard user name
            settingsMessage.textContent = 'Settings saved successfully!';
            settingsMessage.style.color = 'green';
        } catch (error) {
            console.error('Error saving settings:', error);
            settingsMessage.textContent = `Failed to save settings: ${error.message}`;
            settingsMessage.style.color = 'red';
        } finally {
            showLoading(false);
        }
    });

    // --- Logout Handler (moved inside settings sidebar) ---
    settingsLogoutButton.addEventListener('click', async () => {
        showLoading(true);
        try {
            await signOut(auth);
            console.log('User logged out from dashboard.');
            window.location.href = 'account.html'; // Redirect to login page
        } catch (error) {
            console.error('Logout error:', error);
            showCustomModal('Logout Failed', `An error occurred during logout: ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    });

    // --- Content Fetching and Display ---
    const fetchAndDisplayContent = async (userId) => {
        showLoading(true); // Show loading indicator at the start
        try {
            // Use Promise.all to fetch courses and subscriptions concurrently
            const [coursesSnapshot, subscriptionsSnapshot] = await Promise.all([
                getDocs(collection(db, 'courses')),
                getDocs(collection(db, `artifacts/${appId}/users/${userId}/subscriptions`))
            ]);

            const allContent = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const userSubscriptions = subscriptionsSnapshot.docs.map(doc => doc.data().contentId);

            // Clear existing content
            subscribedContentGrid.innerHTML = '';
            allContentGrid.innerHTML = '';

            let hasSubscribedContent = false;
            let hasAvailableContent = false;

            // Render content
            allContent.forEach(content => {
                const isSubscribed = userSubscriptions.includes(content.id);
                const contentItem = createContentCard(content, isSubscribed, userId);

                if (isSubscribed) {
                    subscribedContentGrid.appendChild(contentItem);
                    hasSubscribedContent = true;
                } else {
                    allContentGrid.appendChild(contentItem);
                    hasAvailableContent = true;
                }
            });

            // Show/hide no content messages
            noSubscribedContentMsg.style.display = hasSubscribedContent ? 'none' : 'block';
            noAvailableContentMsg.style.display = hasAvailableContent ? 'none' : 'block';

            // Update subscription plan message (basic example, can be expanded)
            if (userSubscriptions.length > 0) {
                subscriptionPlanSpan.textContent = 'Active (Custom)'; // Or derive from a plan
                subscriptionMessageP.textContent = `You are subscribed to ${userSubscriptions.length} items.`;
                subscriptionMessageP.style.color = 'var(--text-color)';
            } else {
                subscriptionPlanSpan.textContent = 'None';
                subscriptionMessageP.textContent = 'You are not currently subscribed to any content. Explore our library below!';
                subscriptionMessageP.style.color = 'var(--text-color)';
            }

        } catch (error) {
            console.error('Error fetching and displaying content:', error);
            subscribedContentGrid.innerHTML = '<p style="color:red; text-align:center;">Failed to load content. Please try again later.</p>';
            allContentGrid.innerHTML = '<p style="color:red; text-align:center;">Failed to load content. Please try again later.</p>';
        } finally {
            showLoading(false); // Hide loading indicator after content is loaded or if an error occurs
        }
    };

    // --- Fetch User Profile Data (reused for settings sidebar) ---
    const fetchUserProfileData = async (uid) => {
        const docRef = doc(db, `artifacts/${appId}/users/${uid}/profile/data`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // If profile doesn't exist, create a basic one
            const defaultProfile = {
                email: currentUserEmail, // Use the stored email
                name: '',
                profilePicUrl: ''
            };
            await setDoc(docRef, defaultProfile);
            return defaultProfile;
        }
    };

    // --- Create Content Card HTML ---
    const createContentCard = (content, isSubscribed, userId) => {
        const contentItem = document.createElement('div');
        contentItem.classList.add('content-item');

        if (isSubscribed && content.contentUrl) {
            contentItem.innerHTML = `
                <img src="${content.thumbnail || 'https://placehold.co/300x180/e7f5ff/1366a5?text=Content'}" onerror="this.onerror=null;this.src='https://placehold.co/300x180/e7f5ff/1366a5?text=Content';" alt="${content.title}" class="content-item-image">
                <div class="content-item-info">
                    <h4>${content.title}</h4>
                    <p>${content.description}</p>
                    <div class="content-item-actions">
                        <span class="subscribed-tag">Subscribed</span>
                        <a href="${content.contentUrl}" target="_blank" class="button access-button">Access</a>
                    </div>
                </div>
            `;
        } else {
            // If not subscribed, show price and subscribe button
            contentItem.innerHTML = `
                <img src="${content.thumbnail || 'https://placehold.co/300x180/e7f5ff/1366a5?text=Content'}" onerror="this.onerror=null;this.src='https://placehold.co/300x180/e7f5ff/1366a5?text=Content';" alt="${content.title}" class="content-item-image">
                <div class="content-item-info">
                    <h4>${content.title}</h4>
                    <p>${content.description}</p>
                    <div class="content-item-actions">
                        <span class="content-item-price">${content.price === 0 ? 'Free' : `$${content.price}`}</span>
                        <button class="button subscribe-button" data-content-id="${content.id}">Subscribe</button>
                    </div>
                </div>
            `;
        }

        // Add event listener for the subscribe button
        if (!isSubscribed) {
            const subscribeButton = contentItem.querySelector('.subscribe-button');
            if (subscribeButton) {
                subscribeButton.addEventListener('click', (e) => handleSubscribe(e, userId, content.id, content.title));
            }
        }
        return contentItem;
    };

    // --- Handle Subscription ---
    const handleSubscribe = async (event, userId, contentId, contentTitle) => {
        // In a real application, this would involve a payment gateway.
        // For now, we'll simulate a successful subscription.
        const confirmSubscribe = confirm(`Do you want to subscribe to "${contentTitle}"? (This is a simulated subscription)`);
        if (!confirmSubscribe) {
            return;
        }

        showLoading(true);
        try {
            const subscriptionDocRef = doc(db, `artifacts/${appId}/users/${userId}/subscriptions/${contentId}`);
            await setDoc(subscriptionDocRef, {
                contentId: contentId,
                subscribedAt: new Date(),
                status: 'active'
            });
            showCustomModal('Subscription Success!', `You have successfully subscribed to "${contentTitle}"!`, false);
            // Re-fetch and display content to update UI
            await fetchAndDisplayContent(userId);
        } catch (error) {
            console.error('Error subscribing to content:', error);
            showCustomModal('Subscription Failed', `Failed to subscribe to "${contentTitle}": ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    };

    // NEW: Function to copy text to clipboard
    const copyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            // Use custom modal instead of alert
            showCustomModal('Copied!', 'User ID copied to clipboard.', false);
        } catch (err) {
            console.error('Failed to copy text:', err);
            showCustomModal('Copy Failed', 'Failed to copy User ID. Please copy manually.', true);
        }
        document.body.removeChild(textarea);
    };


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
                    console.log('Navbar injected successfully into dashboard.html');
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
                console.log('Footer injected successfully into dashboard.html');
            } else {
                console.error('No <footer> element found in footer.html');
            }

        } catch (error) {
            console.error('Error injecting partials into dashboard.html:', error);
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
            console.error('Mobile menu elements not found for initialization in dashboard.html');
        }
    };

    injectPartials();

    // --- Authentication State Listener for Dashboard ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            currentUserEmail = user.email; // Store the email

            // Fetch user profile data immediately upon auth state change
            const userProfile = await fetchUserProfileData(currentUserId);

            // Update dashboard welcome message with name or email
            dashboardUserNameSpan.textContent = userProfile.name || user.email;
            // Update dashboard background image
            welcomeBackgroundImage.style.backgroundImage = `url('${userProfile.profilePicUrl || 'https://placehold.co/600x400/e0e0e0/ffffff?text=User+Profile'}')`;


            // Fetch and display content only after user is authenticated
            await fetchAndDisplayContent(currentUserId);
        } else {
            // User is not logged in, redirect to account.html
            console.log('No user logged in, redirecting to account page.');
            window.location.href = 'account.html';
        }
    });
});
