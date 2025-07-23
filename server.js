const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Serve static files (CSS, JS, etc.)
app.use(express.static('public'));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Route to handle form submission
app.post('/submit-form', upload.single('productImage'), (req, res) => {
  const { productName, productDescription, price, condition, contactEmail } = req.body;
  const productImage = req.file ? req.file.path : null; // Path to the uploaded image

  // Render sell-details.html with pre-filled data
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* Your existing CSS styles */
      </style>
    </head>
    <body>
      <main>
        <div class="steps">
          <h2>Steps to Submit</h2>
          <ol>
            <li>Review your product details.</li>
            <li>Edit if necessary.</li>
            <li>Click "Submit to Admin".</li>
          </ol>
        </div>

        <div class="form-section">
          <h2>Review and Edit Your Product</h2>
          <form id="reviewForm" action="/final-submission" method="POST">
            <!-- Product Name -->
            <input type="text" id="productName" name="productName" value="${productName}" required>
          
            <!-- Product Description -->
            <textarea id="productDescription" name="productDescription" rows="4" required>${productDescription}</textarea>
          
            <!-- Price -->
            <input type="number" id="price" name="price" value="${price}" required>
          
            <!-- Condition: New or Pre-owned -->
            <select id="condition" name="condition" required>
              <option value="New" ${condition === 'New' ? 'selected' : ''}>New</option>
              <option value="Pre-owned" ${condition === 'Pre-owned' ? 'selected' : ''}>Pre-owned</option>
            </select>
          
            <!-- Upload Image -->
            <input type="file" id="productImage" name="productImage" accept="image/*">
            ${productImage ? `<img src="${productImage}" alt="Product Image" style="max-width: 100%; margin-top: 10px;">` : ''}
          
            <!-- Contact Information -->
            <input type="email" id="contactEmail" name="contactEmail" value="${contactEmail}" required>
          
            <!-- Submit Button -->
            <button type="submit">Submit to Admin</button>
          </form>
        </div>
      </main>
    </body>
    </html>
  `);
});

// Route to handle final submission
app.post('/final-submission', (req, res) => {
  const { productName, productDescription, price, condition, contactEmail } = req.body;

  // Process the final submission (e.g., save to database)
  console.log('Final Submission:', {
    productName,
    productDescription,
    price,
    condition,
    contactEmail,
  });

  // Redirect to a confirmation page
  res.send('Your product has been submitted successfully!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});