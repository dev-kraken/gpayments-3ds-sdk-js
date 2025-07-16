# GPayments 3DS SDK - JavaScript

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dev-kraken/gpayments-3ds-sdk-js)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-orange.svg)](https://cdn.jsdelivr.net/npm/@dev-kraken/3ds-sdk)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Production-ready 3D Secure authentication SDK for GPayments, optimized for CDN distribution.

## 🚀 Quick Start

### CDN Installation (Recommended)

```html
<!-- Production (Minified) -->
<script src="https://cdn.jsdelivr.net/npm/@dev-kraken/3ds-sdk@1.0.0/devkraken-3ds-sdk.min.js"></script>

<!-- Development (Unminified) -->
<script src="https://cdn.jsdelivr.net/npm/@dev-kraken/3ds-sdk@1.0.0/devkraken-3ds-sdk.js"></script>
```

### Alternative CDNs

```html
<!-- unpkg -->
<script src="https://unpkg.com/@dev-kraken/3ds-sdk@1.0.0/devkraken-3ds-sdk.min.js"></script>

<!-- cdnjs -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dev-kraken-3ds-sdk/1.0.0/devkraken-3ds-sdk.min.js"></script>
```

### NPM Installation

```bash
npm install @dev-kraken/3ds-sdk
```

## 💻 Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>GPayments 3DS Integration</title>
</head>
<body>
    <div id="challenge-container"></div>
    <div id="iframe-container" style="display: none;"></div>

    <script src="https://cdn.jsdelivr.net/npm/@dev-kraken/3ds-sdk@1.0.0/devkraken-3ds-sdk.min.js"></script>
    <script>
        // Initialize SDK
        const sdk = new GPayments3DS({
            apiEndpoint: '/api/3ds.php',
            debug: false,
            onSuccess: (result) => {
                console.log('Authentication successful:', result);
                // Process payment
            },
            onError: (error) => {
                console.error('Authentication failed:', error);
                // Handle error
            },
            onChallenge: (data) => {
                console.log('Challenge required');
                // Challenge iframe displayed automatically
            }
        });

        // Authenticate payment
        sdk.authenticate({
            cardNumber: '4100000000005000',
            expiryDate: '12/25',
            amount: '10.00'
        }, {
            cardholderName: 'John Doe',
            purchaseCurrency: 'USD'
        });
    </script>
</body>
</html>
```

## 🔧 Configuration Options

```javascript
const sdk = new GPayments3DS({
    // Required
    apiEndpoint: '/api/3ds.php',           // Your GPayments 3DS API endpoint
    
    // Optional
    challengeContainer: 'challenge-container', // Challenge iframe container ID
    iframeContainer: 'iframe-container',       // Hidden iframe container ID
    debug: false,                              // Enable debug logging
    timeout: 30000,                            // Request timeout (ms)
    
    // Callbacks
    onSuccess: (result) => {},                 // Success callback
    onError: (error) => {},                    // Error callback
    onChallenge: (data) => {}                  // Challenge callback
});
```

## 📋 API Reference

### Methods

#### `authenticate(cardData, additionalData)`
Start 3DS authentication process.

**Parameters:**
- `cardData` (Object) - Required card information
- `additionalData` (Object) - Optional additional data

**Card Data Format:**
```javascript
{
    cardNumber: '4100000000005000',  // Required: Card number
    expiryDate: '12/25',             // Required: MM/YY format
    amount: '10.00'                  // Required: Transaction amount
}
```

**Additional Data Format:**
```javascript
{
    cardholderName: 'John Doe',
    purchaseCurrency: 'USD',
    merchantName: 'Your Store',
    billingAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
    }
}
```

#### `destroy()`
Clean up resources and event listeners.

```javascript
sdk.destroy();
```

#### `getPerformanceMetrics()`
Get performance and usage metrics.

```javascript
const metrics = sdk.getPerformanceMetrics();
console.log('Request ID:', metrics.requestId);
console.log('Transaction State:', metrics.transactionState);
console.log('Iframe Count:', metrics.iframeCount);
```

### Events

#### `onSuccess(result)`
Called when authentication is successful.

**Result Object:**
```javascript
{
    status: 'success',                    // Status type
    message: 'Payment Authenticated Successfully',
    transStatus: 'Y',                     // 3DS transaction status
    details: { /* 3DS response data */ },
    requestId: 'req_123456789'            // Unique request ID
}
```

#### `onError(error)`
Called when authentication fails or error occurs.

**Error Object:**
```javascript
{
    status: 'failed',                     // Error type
    message: 'Authentication Failed',
    transStatus: 'N',                     // 3DS transaction status
    details: { /* Error details */ },
    requestId: 'req_123456789'            // Unique request ID
}
```

#### `onChallenge(data)`
Called when challenge is required. Challenge iframe is displayed automatically.

**Challenge Data:**
```javascript
{
    transStatus: 'C',                     // Challenge required
    challengeUrl: 'https://...',          // Challenge URL
    threeDSServerTransID: 'uuid-123'      // Transaction ID
}
```

## 🔄 Transaction Status Values

| Status | Description |
|--------|-------------|
| `Y` | Authentication successful |
| `N` | Authentication failed |
| `U` | Authentication unavailable |
| `A` | Attempts processing (issuer liability shift) |
| `C` | Challenge required |
| `R` | Rejected (do not attempt again) |
| `D` | Decoupled authentication |

## 🚨 Error Handling

```javascript
const sdk = new GPayments3DS({
    apiEndpoint: '/api/3ds.php',
    onError: (error) => {
        switch (error.status) {
            case 'failed':
                // Authentication failed - card declined
                showMessage('Payment authentication failed');
                break;
            case 'rejected':
                // Rejected by issuer - do not retry
                showMessage('Payment rejected by bank');
                break;
            case 'error':
                // Technical error - can retry
                showMessage('Technical error, please try again');
                break;
            default:
                showMessage('An error occurred');
                break;
        }
    }
});
```

## 🔒 Security Features

- ✅ **Sandboxed Iframes** - Restricted permissions for security
- ✅ **Data Sanitization** - Automatic masking of sensitive data in logs
- ✅ **CSP Compatible** - Works with Content Security Policy
- ✅ **XSS Protection** - Input sanitization and validation
- ✅ **Secure Communication** - Encrypted iframe communication

## ⚡ Performance

- **Size**: ~25KB minified, ~8KB gzipped
- **Zero Dependencies**: Works standalone in any browser
- **Memory Management**: Automatic cleanup and garbage collection
- **Lazy Loading**: Iframes load on demand
- **Caching**: Browser fingerprint cached for optimal performance

## 📱 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| iOS Safari | 12+ |
| Android Chrome | 60+ |
| Internet Explorer | 11+ (with polyfills) |

## 🛠️ Development

### Debug Mode

Enable detailed console logging for development:

```javascript
const sdk = new GPayments3DS({
    apiEndpoint: '/api/3ds.php',
    debug: true // Enable debug logging
});
```

Debug output includes:
- Iframe creation and management
- Event handling and communication
- API requests and responses
- Performance metrics
- Error details

### Performance Monitoring

```javascript
// Get performance metrics
const metrics = sdk.getPerformanceMetrics();

console.log('Transaction State:', metrics.transactionState);
console.log('Active Iframes:', metrics.iframeCount);
console.log('Challenge Visible:', metrics.challengeVisible);
console.log('Request ID:', metrics.requestId);
```

### Memory Management

```javascript
// Automatic cleanup on page unload
window.addEventListener('beforeunload', () => {
    sdk.destroy();
});

// Manual cleanup when done
sdk.destroy();
```

## 🔗 Integration Examples

### Basic Integration

```javascript
// Simple integration
const sdk = new GPayments3DS({
    apiEndpoint: '/api/3ds.php',
    onSuccess: (result) => {
        if (result.transStatus === 'Y') {
            // Proceed with payment
            processPayment(result);
        }
    },
    onError: (error) => {
        // Handle authentication failure
        handleAuthError(error);
    }
});

// Start authentication
sdk.authenticate({
    cardNumber: document.getElementById('cardNumber').value,
    expiryDate: document.getElementById('expiryDate').value,
    amount: document.getElementById('amount').value
});
```

### Advanced Integration with Form

```html
<form id="payment-form">
    <input type="text" id="cardNumber" placeholder="Card Number" />
    <input type="text" id="expiryDate" placeholder="MM/YY" />
    <input type="text" id="amount" placeholder="Amount" />
    <input type="text" id="cardholderName" placeholder="Cardholder Name" />
    <button type="submit">Pay Now</button>
</form>

<div id="challenge-container"></div>

<script>
document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sdk = new GPayments3DS({
        apiEndpoint: '/api/3ds.php',
        debug: true,
        onSuccess: (result) => {
            console.log('Success:', result);
            // Process payment
        },
        onError: (error) => {
            console.error('Error:', error);
            // Show error message
        },
        onChallenge: (data) => {
            console.log('Challenge required');
            // Challenge iframe shown automatically
        }
    });
    
    try {
        await sdk.authenticate({
            cardNumber: document.getElementById('cardNumber').value,
            expiryDate: document.getElementById('expiryDate').value,
            amount: document.getElementById('amount').value
        }, {
            cardholderName: document.getElementById('cardholderName').value,
            purchaseCurrency: 'USD'
        });
    } catch (error) {
        console.error('Authentication failed:', error);
    }
});
</script>
```

## 📦 Files

- `devkraken-3ds-sdk.js` - Unminified version (development)
- `devkraken-3ds-sdk.min.js` - Minified version (production)
- `package.json` - NPM package configuration
- `.npmignore` - NPM ignore file

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete 3DS 2.x implementation
- CDN optimization
- Production-ready security features
- Comprehensive browser support
- Performance optimizations

## 📄 License

MIT License - see [LICENSE](https://github.com/dev-kraken/gpayments-3ds-sdk-js/blob/main/LICENSE) file for details.

## 👨‍💻 Author

**DevKraken**  
Email: soman@devkraken.com  
GitHub: [@dev-kraken](https://github.com/dev-kraken)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/dev-kraken/gpayments-3ds-sdk-js/issues)
- **Email**: soman@devkraken.com
- **Documentation**: [Full Documentation](https://github.com/dev-kraken/gpayments-3ds-sdk-js)

## 🔗 Related Projects

- **PHP SDK**: [gpayments-3ds-sdk-php](https://github.com/dev-kraken/gpayments-3ds-sdk-php)
- **Examples**: See repository examples folder

---

Made with ❤️ by [DevKraken](mailto:soman@devkraken.com) for GPayments 3DS integration.