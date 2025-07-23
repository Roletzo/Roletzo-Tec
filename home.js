document.addEventListener('DOMContentLoaded', function () {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDikaZOvMYWWqjju_Izzlt_w-s7vsaW3Ag",
        authDomain: "rgt-technical-support.firebaseapp.com",
        projectId: "rgt-technical-support",
        storageBucket: "rgt-technical-support.appspot.com",
        messagingSenderId: "717513573179",
        appId: "1:717513573179:web:2522958965e5166585ed1e",
        measurementId: "G-0RCYY15LHD"
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // DOM Elements
    const sections = document.querySelectorAll('.content-section');
    const navbarLinks = document.querySelectorAll('.navbar a');
    const navbarB = document.getElementById('navbar-b');
    const header = document.querySelector('.header');
    const cartElement = document.querySelector('.cart p');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const overlay = document.querySelector('.overlay');
    const proceedToCheckoutButton = document.querySelector('.proceed-to-checkout');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    updateCartCount();

    // Function to hide all sections
    function hideAllSections() {
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Function to load content dynamically
    function loadContent(url, sectionId) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.innerHTML = data;
                    section.style.display = 'block';

                    // Execute scripts after the content is loaded
                    if (sectionId === 'content-home') {
                        const script = document.createElement('script');
                        script.textContent = `
                            async function fetchProducts() {
                                const productGrid = document.querySelector(".product-grid");
                                productGrid.innerHTML = "<div class='loading-spinner'></div>"; // Show loading spinner

                                try {
                                    const snapshot = await db.collection("Products").get();
                                    console.log("Fetched products:", snapshot.docs);

                                    if (snapshot.empty) {
                                        productGrid.innerHTML = "<p>No products available.</p>";
                                        return;
                                    }

                                    productGrid.innerHTML = ""; // Clear the loading spinner

                                    snapshot.forEach(doc => {
                                        const product = doc.data();
                                        const productCard = \`
                                            <div class="product-card">
                                                <div class="product-image-container">
                                                    <img src="\${product.imageUrl}" alt="\${product.name}" class="product-image" loading="lazy">
                                                </div>
                                                <div class="product-info">
                                                    <div class="product-name">\${product.name}</div>
                                                    <div class="product-price">R \${Number(product.price).toFixed(2)}</div>
                                                    <button class="add-to-cart" 
                                                        data-id="\${doc.id}" 
                                                        data-name="\${product.name}" 
                                                        data-price="\${Number(product.price).toFixed(2)}"
                                                        data-image="\${product.imageUrl}">
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        \`;
                                        productGrid.innerHTML += productCard;
                                    });

                                    // Add event listeners to "Add to Cart" buttons
                                    const addToCartButtons = document.querySelectorAll('.add-to-cart');
                                    addToCartButtons.forEach(button => {
                                        button.addEventListener('click', function () {
                                            const productId = this.getAttribute('data-id');
                                            const productName = this.getAttribute('data-name');
                                            const productPrice = parseFloat(this.getAttribute('data-price'));
                                            const productImage = this.getAttribute('data-image');
                                            addToCart(productId, productName, productPrice, productImage);
                                        });
                                    });
                                } catch (error) {
                                    console.error("Error fetching products:", error);
                                    productGrid.innerHTML = "<p>Error loading products. Please try again later.</p>";
                                }
                            }

                            // Execute fetchProducts after the content is loaded
                            fetchProducts();
                        `;
                        section.appendChild(script);
                    }
                }
            })
            .catch(error => console.error(`Error loading \${url}:`, error));
    }
    // Function to initialize sell section
    function initializeSellSection() {
        const sellForm = document.getElementById('sell-form');
        if (sellForm) {
            sellForm.addEventListener('submit', function (e) {
                e.preventDefault();
                alert('Sell form submitted');
            });
        }
    }

    // Function to show a specific section
    function showSection(sectionId) {
        hideAllSections();

        if (sectionId === 'content-home') {
            loadContent('home.html', sectionId);
        } else if (sectionId === 'content-sell') {
            loadContent('sell.html', sectionId);
        } else if (sectionId === 'content-contact') {
            loadContent('contact.html', sectionId);
        } else {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        }

        // Update active class for navigation links
        navbarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });

        // Update the URL hash
        const hash = `#${sectionId.replace('content-', '')}`;
        history.pushState(null, null, hash);

        // Header shrink logic
        if (['content-sell', 'content-contact'].includes(sectionId)) {
            navbarB.classList.add('hidden');
            header.classList.add('shrink');
        } else {
            navbarB.classList.remove('hidden');
            header.classList.remove('shrink');
        }
    }

    // Add click event listeners to navigation links
    navbarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-target');
            showSection(targetSection);
        });
    });

    // Handle hash change (e.g., when the user navigates back/forward)
    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        const sectionId = `content-${hash}`;
        if (document.getElementById(sectionId)) {
            showSection(sectionId);
        } else {
            showSection('content-home'); // Default to home if the section doesn't exist
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Initial load based on the current hash
    handleHashChange();

    // Cart functionality
    // Open/close cart drawer with Firebase auth check
    document.querySelector('.cart').addEventListener('click', function () {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is logged in, open cart drawer
                cartDrawer.classList.toggle('open');
                overlay.classList.toggle('active');
                renderCartItems();
            } else {
                // Redirect to login page if not logged in
                window.location.href = 'login-register.html';
            }
        });
    });

    // Close cart drawer when close button is clicked
    document.querySelector('.cart-drawer .close-btn').addEventListener('click', function () {
        cartDrawer.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Close cart drawer when clicking outside
    overlay.addEventListener('click', function () {
        cartDrawer.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Add to cart functionality
    // Add to cart functionality
        window.addToCart = function(productId, productName, productPrice, productImage) {
            const existingItem = cart.find(item => item.id === productId);

            // if (existingItem) {
            //     existingItem.quantity += 1;
            // } else {
            //     cart.push({
            //         id: productId,
            //         name: productName,
            //         price: productPrice,
            //         image: productImage, // Ensure this is passed correctly
            //         quantity: 1
            //     });
            // } 
            
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1 // Each new addition starts with a quantity of 1
            });

            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            renderCartItems();
        };

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartElement.textContent = totalItems;
    }


    // Render cart items in the drawer
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
    
        if (cart.length === 0) {
            document.querySelector('.empty-cart').style.display = 'block';
            document.querySelector('.proceed-to-checkout').style.display = 'none';
            document.querySelector('.cart-total').style.display = 'none';
        } else {
            document.querySelector('.empty-cart').style.display = 'none';
            document.querySelector('.proceed-to-checkout').style.display = 'block';
            document.querySelector('.cart-total').style.display = 'block';
    
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
    
                // Render the product image at the top, followed by name, price, and quantity
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">Quantity: ${item.quantity}</div>
                    </div>
                    <button class="delete-item" data-index="${index}">Delete</button>
                `;
                cartItemsContainer.appendChild(cartItem);
                total += item.price * item.quantity;
            });
        }
    
        // Update the total price
        cartTotalElement.textContent = `${total.toFixed(2)}`;
    
        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll('.delete-item');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const itemIndex = this.getAttribute('data-index');
                deleteCartItem(itemIndex);
            });
        });
    }

    // Delete item from cart
    function deleteCartItem(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }

    // Proceed to checkout
    proceedToCheckoutButton.addEventListener('click', function () {
        window.location.href = 'checkout-details.html';
    });
});