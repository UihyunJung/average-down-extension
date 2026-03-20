# Privacy Policy — Stock Average Down Calculator

**Last updated**: March 20, 2026

## Data Collection

This extension collects minimal data required for the premium subscription service:

- **Installation ID**: A randomly generated UUID stored locally. Sent to our backend server to verify subscription status. This is not linked to any personal information.
- **Email address**: Only when you voluntarily provide it to restore a purchase on a new device. Used solely for purchase verification via Paddle.

## Local Storage

The extension uses Chrome's `chrome.storage.local` API to save:
- Input values (average price, current price, shares owned)
- Preferences (language, currency)
- Subscription status (cached locally for offline use)

This data is stored on your device and is not transmitted except as described above.

## Third-Party Services

- **Paddle** (paddle.com): Payment processing as Merchant of Record. When you purchase a subscription, Paddle handles all payment data (credit card, billing address) directly. We do not receive or store your payment details. See [Paddle's Privacy Policy](https://www.paddle.com/legal/privacy).
- **Backend Server** (paddle-extensions-backend.vercel.app): Our server communicates with Paddle to verify subscription status. It receives only your Installation ID and, during purchase restoration, your email address.

This extension does not use any analytics, tracking, or advertising services.

## Contact

If you have questions about this privacy policy, please contact: uihyun.jung@gmail.com
