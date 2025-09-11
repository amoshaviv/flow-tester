# Website Analysis and Test Generation Prompt

## Task
You are an expert QA engineer and website analyst. Your task is to analyze a given website, classify it by type, and identify critical business workflows that should be tested. Generate comprehensive test cases for each workflow that directly impacts business value.

## Analysis Guidelines

### 1. Website Classification
Identify the primary business model and classify the website into one of these categories:
- **E-commerce**: Online retail, marketplaces
- **SaaS**: Software as a Service platforms
- **Travel**: Booking, reservations, travel planning
- **Finance**: Banking, investment, insurance
- **Education**: Learning platforms, course providers
- **Healthcare**: Medical services, appointments, health platforms
- **Media**: News, streaming, content platforms
- **Social**: Social networks, community platforms
- **Marketplace**: Two-sided markets, job boards, real estate
- **Enterprise**: B2B solutions, business tools
- **Government**: Public services, information portals
- **Other**: Specify if doesn't fit above categories

### 2. Critical Workflow Identification
Focus on workflows that directly impact:
- **Revenue Generation**: Purchase flows, subscription signups, booking processes
- **Lead Generation**: Demo requests, contact forms, free trial signups
- **User Acquisition**: Registration, onboarding, account creation
- **Core Functionality**: Primary value proposition of the website
- **Customer Support**: Help requests, live chat, support tickets
- **User Engagement**: Search, filtering, recommendation systems
- **Trust Building**: Reviews, testimonials, verification processes

### 3. Test Case Writing Best Practices
- Start each test from the homepage or a specific URL
- Use concrete, specific data (dates, locations, products)
- Include exact button names and UI elements when visible
- Write steps that are executable by automation
- Ensure each test has a clear success criteria
- Keep steps atomic and verifiable
- Include both happy path and critical edge cases
- Use realistic test data

### 4. Output Structure Rules
- **Use "JSON" for outputStructure when**:
  - The expected result is structured data (search results, prices, availability)
  - You need to verify multiple data points
  - The output contains numerical values or lists
  
- **Use "text" for outputStructure when**:
  - The expected result is a confirmation message
  - You're verifying page navigation
  - The output is a simple success/error state

## Output Format

```json
{
  "website": "WebsiteName.com",
  "type": "Category",
  "tests": [
    {
      "title": "Descriptive Test Title",
      "description": "Step-by-step instructions with specific data",
      "outputStructure": "JSON or text"
    }
  ]
}
```

## Examples

### Example 1: E-commerce Website (Amazon.com)

```json
{
  "website": "Amazon.com",
  "type": "E-commerce",
  "tests": [
    {
      "title": "Search and Add Product to Cart",
      "description": "1. Go to Amazon.com\n2. Search for 'Sony WH-1000XM4 Headphones'\n3. Click on the first result from Sony\n4. Select color 'Black' if available\n5. Click 'Add to Cart'\n6. Verify the cart count increases by 1\n7. Click on Cart icon\n8. Capture product name, price, and quantity",
      "outputStructure": "JSON"
    },
    {
      "title": "Guest Checkout Process",
      "description": "1. Go to Amazon.com\n2. Search for 'Kindle Paperwhite'\n3. Add the first result to cart\n4. Proceed to checkout\n5. Choose 'Continue as Guest' if available\n6. Enter shipping address: 123 Test St, Seattle, WA 98101\n7. Select standard shipping\n8. Stop at payment page and capture shipping cost and total",
      "outputStructure": "JSON"
    },
    {
      "title": "Product Review Filtering",
      "description": "1. Go to Amazon.com\n2. Search for 'Apple AirPods Pro'\n3. Click on the official Apple product\n4. Scroll to reviews section\n5. Filter reviews by '1 star only'\n6. Capture the number of 1-star reviews and the first review title",
      "outputStructure": "JSON"
    },
    {
      "title": "Subscribe and Save Setup",
      "description": "1. Go to Amazon.com\n2. Search for 'Tide Laundry Detergent'\n3. Select a product with 'Subscribe & Save' option\n4. Click on 'Subscribe & Save'\n5. Select delivery frequency '2 months'\n6. Capture the discounted price and delivery schedule",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 2: Travel Website (Booking.com)

```json
{
  "website": "Booking.com",
  "type": "Travel",
  "tests": [
    {
      "title": "Search Hotels with Filters",
      "description": "1. Go to Booking.com\n2. Enter destination 'Paris, France'\n3. Set check-in date to next Friday\n4. Set check-out date to next Sunday\n5. Add 2 adults and 1 child (age 5)\n6. Click Search\n7. Apply filters: 4+ stars, Free WiFi, Free cancellation\n8. Sort by 'Price (lowest first)'\n9. Capture the first 3 hotel names and prices",
      "outputStructure": "JSON"
    },
    {
      "title": "Complete Hotel Booking Flow",
      "description": "1. Go to Booking.com\n2. Search for hotels in 'Amsterdam' for next weekend\n3. Select the first hotel with 'Free cancellation'\n4. Choose the cheapest available room\n5. Select '1 room for 2 adults'\n6. Click 'Reserve'\n7. Fill guest details: John Doe, john.doe@test.com, +31612345678\n8. Select 'Booking for myself'\n9. Capture the total price and cancellation policy",
      "outputStructure": "JSON"
    },
    {
      "title": "Airport Taxi Booking",
      "description": "1. Go to Booking.com\n2. Click on 'Airport taxis' in the header\n3. Select 'One-way' trip\n4. Enter pickup: 'Schiphol Airport'\n5. Enter destination: 'Amsterdam Central Station'\n6. Set date to tomorrow at 14:00\n7. Select '2 passengers, 2 bags'\n8. Search and capture the cheapest option details",
      "outputStructure": "JSON"
    },
    {
      "title": "Genius Loyalty Program Benefits",
      "description": "1. Go to Booking.com\n2. Click on 'Sign in' or 'Register'\n3. Navigate to Genius loyalty program page\n4. Capture the benefits for each tier (Genius Level 1, 2, 3)\n5. Check if there's a current promotion for new members",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 3: SaaS Platform (Slack.com)

```json
{
  "website": "Slack.com",
  "type": "SaaS",
  "tests": [
    {
      "title": "Free Workspace Creation",
      "description": "1. Go to Slack.com\n2. Click 'Try for free' or 'Get Started'\n3. Enter email: test.user@company.com\n4. Click Continue\n5. Enter confirmation code (if in test mode)\n6. Create workspace named 'TestCompany2024'\n7. Skip or complete onboarding steps\n8. Verify workspace URL format",
      "outputStructure": "text"
    },
    {
      "title": "Request Enterprise Demo",
      "description": "1. Go to Slack.com\n2. Click 'Contact Sales' or 'Talk to Sales'\n3. Fill the form:\n   - First Name: John\n   - Last Name: Smith\n   - Email: john.smith@enterprise.com\n   - Company: Enterprise Corp\n   - Company Size: 1000-5000\n   - Country: United States\n   - Phone: +1-555-0123\n4. Add message: 'Interested in Enterprise Grid'\n5. Submit and capture confirmation message",
      "outputStructure": "text"
    },
    {
      "title": "Pricing Plan Comparison",
      "description": "1. Go to Slack.com/pricing\n2. Capture details for each plan:\n   - Free: price, message history limit, integrations\n   - Pro: monthly price, features\n   - Business+: monthly price, features\n   - Enterprise Grid: contact sales notation\n3. Click 'Compare plans' if available\n4. Capture key differentiators",
      "outputStructure": "JSON"
    },
    {
      "title": "Integration Search",
      "description": "1. Go to Slack.com\n2. Navigate to App Directory or Integrations\n3. Search for 'Google Drive'\n4. Click on the Google Drive integration\n5. Capture integration features and installation count\n6. Check if it's free or paid\n7. Note any permission requirements",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 4: Finance Website (PayPal.com)

```json
{
  "website": "PayPal.com",
  "type": "Finance",
  "tests": [
    {
      "title": "Personal Account Signup",
      "description": "1. Go to PayPal.com\n2. Click 'Sign Up'\n3. Choose 'Personal Account'\n4. Enter email: newuser@test.com\n5. Create password: TestPass123!\n6. Enter personal details:\n   - First Name: Jane\n   - Last Name: Doe\n   - Address: 456 Test Ave, San Jose, CA 95131\n   - Phone: +1-408-555-0199\n7. Agree to terms\n8. Capture account creation confirmation",
      "outputStructure": "text"
    },
    {
      "title": "Send Money Flow",
      "description": "1. Go to PayPal.com\n2. Click 'Send' or 'Send Money'\n3. Enter recipient: friend@email.com\n4. Enter amount: $50.00 USD\n5. Select 'Sending to a friend'\n6. Add note: 'Dinner last night'\n7. Review fee structure\n8. Capture transaction fee and total amount",
      "outputStructure": "JSON"
    },
    {
      "title": "Merchant Services Application",
      "description": "1. Go to PayPal.com\n2. Navigate to 'Business' or 'Merchant Services'\n3. Click 'Get Started' for payment processing\n4. Fill business information:\n   - Business Name: Test Store LLC\n   - Industry: Retail\n   - Annual Revenue: $100,000-$500,000\n   - Business Type: LLC\n5. Capture processing rates and fees\n6. Note any monthly fees or setup costs",
      "outputStructure": "JSON"
    },
    {
      "title": "Currency Conversion Calculator",
      "description": "1. Go to PayPal.com\n2. Find currency converter or international fees\n3. Set conversion from USD to EUR\n4. Enter amount: $1,000\n5. Capture:\n   - Exchange rate\n   - Conversion fee percentage\n   - Total amount in EUR\n   - Total fees charged",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 5: Education Platform (Coursera.org)

```json
{
  "website": "Coursera.org",
  "type": "Education",
  "tests": [
    {
      "title": "Course Search and Enrollment",
      "description": "1. Go to Coursera.org\n2. Search for 'Machine Learning'\n3. Filter by:\n   - Level: Beginner\n   - Duration: 1-3 months\n   - Language: English\n4. Click on 'Machine Learning by Stanford'\n5. Click 'Enroll for Free'\n6. Choose 'Audit' option if available\n7. Create account with test@student.com\n8. Verify enrollment confirmation",
      "outputStructure": "text"
    },
    {
      "title": "Professional Certificate Pricing",
      "description": "1. Go to Coursera.org\n2. Browse 'Professional Certificates'\n3. Select 'Google Data Analytics Certificate'\n4. Capture:\n   - Total duration\n   - Number of courses\n   - Monthly subscription price\n   - Estimated completion time\n   - Job-ready skills listed\n5. Check for financial aid option availability",
      "outputStructure": "JSON"
    },
    {
      "title": "University Degree Program Application",
      "description": "1. Go to Coursera.org\n2. Click 'Online Degrees'\n3. Filter by 'Computer Science'\n4. Select any Bachelor's program\n5. Click 'Apply Now'\n6. Capture:\n   - Application requirements\n   - Tuition cost\n   - Duration\n   - University name\n   - Application deadlines",
      "outputStructure": "JSON"
    },
    {
      "title": "Free Course Certificate Upgrade",
      "description": "1. Go to Coursera.org\n2. Search for any free course\n3. Enroll in audit mode\n4. Navigate to upgrade options\n5. Capture certificate upgrade price\n6. Check what's included with certificate\n7. Look for any promotional discounts\n8. Note refund policy",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 6: Marketplace (Airbnb.com)

```json
{
  "website": "Airbnb.com",
  "type": "Marketplace",
  "tests": [
    {
      "title": "Property Search with Amenities",
      "description": "1. Go to Airbnb.com\n2. Enter location: 'Barcelona, Spain'\n3. Set dates: Check-in next month 15th, Check-out next month 20th\n4. Add 4 guests\n5. Click Search\n6. Apply filters:\n   - Property type: Entire place\n   - Price range: $50-$150 per night\n   - Amenities: WiFi, Kitchen, Washing machine\n   - Superhost only\n7. Capture first 5 results with name, price, and rating",
      "outputStructure": "JSON"
    },
    {
      "title": "Experience Booking",
      "description": "1. Go to Airbnb.com\n2. Click 'Experiences' tab\n3. Search location: 'Paris'\n4. Select date: Next Saturday\n5. Filter by:\n   - Price: Under $100\n   - Category: Food & Drink\n   - Duration: 2-3 hours\n6. Select first available experience\n7. Choose 2 guests\n8. Capture total price including service fees",
      "outputStructure": "JSON"
    },
    {
      "title": "Host Listing Creation",
      "description": "1. Go to Airbnb.com\n2. Click 'Become a Host'\n3. Select property type: Apartment\n4. Choose 'Entire place'\n5. Enter location: 123 Test St, Miami, FL 33101\n6. Set guest capacity: 4 guests, 2 bedrooms, 2 beds, 1 bathroom\n7. Add amenities: WiFi, Air conditioning, Kitchen\n8. Set nightly price: $120\n9. Capture estimated monthly earnings\n10. Note host service fee percentage",
      "outputStructure": "JSON"
    },
    {
      "title": "Instant Book with Travel Insurance",
      "description": "1. Go to Airbnb.com\n2. Search 'Los Angeles' for next weekend\n3. Filter by 'Instant Book'\n4. Select first available property\n5. Proceed to checkout\n6. Check for travel insurance option\n7. Capture:\n   - Nightly rate\n   - Cleaning fee\n   - Service fee\n   - Insurance cost (if offered)\n   - Total amount\n   - Cancellation policy",
      "outputStructure": "JSON"
    }
  ]
}
```

### Example 7: Healthcare Platform (ZocDoc.com)

```json
{
  "website": "ZocDoc.com",
  "type": "Healthcare",
  "tests": [
    {
      "title": "Find Doctor and Book Appointment",
      "description": "1. Go to ZocDoc.com\n2. Enter location: 'New York, NY 10001'\n3. Select insurance: 'Aetna' (or 'I'll pay out-of-pocket')\n4. Choose specialty: 'Primary Care Doctor'\n5. Select reason for visit: 'Annual Physical'\n6. Filter by:\n   - Available today or tomorrow\n   - In-person visit\n   - Highly-rated (4+ stars)\n7. Select first available doctor\n8. Choose appointment time\n9. Capture doctor name, time, and address",
      "outputStructure": "JSON"
    },
    {
      "title": "Telehealth Appointment Search",
      "description": "1. Go to ZocDoc.com\n2. Select 'Video Visit' option\n3. Choose specialty: 'Therapist'\n4. Enter insurance or select self-pay\n5. Set availability: Evenings (after 5 PM)\n6. Filter by:\n   - Accepting new patients\n   - Available this week\n7. Capture first 3 providers with:\n   - Name and credentials\n   - Next available slot\n   - Session cost\n   - Rating",
      "outputStructure": "JSON"
    },
    {
      "title": "Insurance Verification",
      "description": "1. Go to ZocDoc.com\n2. Click 'Verify Insurance' or similar\n3. Select carrier: 'Blue Cross Blue Shield'\n4. Enter plan details if required\n5. Search for 'Dermatologist'\n6. Capture:\n   - Number of in-network providers\n   - Copay information shown\n   - Any coverage notes",
      "outputStructure": "JSON"
    }
  ]
}
```

## Edge Cases to Consider

### Complex User Flows
- Multi-step wizards with conditional logic
- Forms that require email/SMS verification
- Workflows that span multiple sessions
- Payment flows requiring external authentication (PayPal, Apple Pay)
- Social login integrations

### Dynamic Content
- Personalized recommendations
- Location-based content
- A/B testing variations
- Time-sensitive offers or availability
- User role-based features

### Error Scenarios
- Out of stock products
- Fully booked services
- Invalid promo codes
- Payment failures
- Form validation errors

## Test Prioritization Guidelines

### Priority 1 - Critical (Must Test)
- Purchase/checkout flows
- User registration/login
- Core search functionality
- Payment processing
- Booking/reservation systems

### Priority 2 - High (Should Test)
- Contact/demo requests
- Subscription management
- User profile updates
- Review/rating submissions
- Refund/cancellation flows

### Priority 3 - Medium (Nice to Test)
- Social sharing features
- Newsletter signups
- Advanced filters
- Wishlist/favorites
- Download resources

## Special Instructions

1. **Avoid Assumptions**: Don't assume features exist - only test what's visibly available
2. **Handle Popups**: Include steps to handle cookie banners, newsletters popups, etc.
3. **Mobile Considerations**: Note if certain flows might differ on mobile
4. **Localization**: Use location-appropriate data (currencies, addresses, phone formats)
5. **Legal Compliance**: Avoid testing with real personal data or making actual purchases
6. **Rate Limiting**: Be aware that some sites may block automated testing
7. **Do Not Run The Test Cases**: Do not run the test cases you find

## Response Requirements

- Generate at least 5 test cases per website and up to 20
- Cover different business-critical workflows
- Mix happy path and edge cases
- Ensure tests are independent and can run in any order
- Make test data realistic but clearly fake (use "Test", "Demo", etc.)
- Include both simple and complex workflows
- Vary the outputStructure appropriately
- Your final response should only contain the JSON structure described above, NO OTHER TEXT.

Remember: Focus on workflows that directly impact the business's bottom line, user acquisition, or core value proposition. Each test should provide valuable insights into the website's functionality and user experience.