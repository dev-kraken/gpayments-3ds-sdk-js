/**
 * DevKraken 3DS SDK v1.0.0 - CDN Ready
 * (c) 2025 DevKraken <soman@devkraken.com>
 * 
 * A production-ready 3D Secure authentication SDK
 * Optimized for CDN distribution with zero dependencies
 * 
 * @author DevKraken <soman@devkraken.com>
 * @version 1.0.0
 * @license MIT
 */

(function(global, factory) {
    'use strict';
    
    // Universal Module Definition (UMD)
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define('GPayments3DS', factory);
    } else {
        global.GPayments3DS = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : 
   typeof window !== 'undefined' ? window : 
   typeof global !== 'undefined' ? global : 
   typeof self !== 'undefined' ? self : this, function() {
    
    'use strict';

    /**
     * Card Validator
     */
    class CardValidator {
        validateCardNumber(cardNumber) {
            if (!cardNumber || cardNumber.length < 13) return false;
            
            const cleaned = cardNumber.replace(/\D/g, '');
            if (!/^\d{13,19}$/.test(cleaned)) return false;
            
            return this.luhnCheck(cleaned);
        }

        luhnCheck(number) {
            let sum = 0;
            let alternate = false;
            
            for (let i = number.length - 1; i >= 0; i--) {
                let digit = parseInt(number[i], 10);
                
                if (alternate) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }
                
                sum += digit;
                alternate = !alternate;
            }
            
            return (sum % 10) === 0;
        }

        validateExpiryDate(expiryDate) {
            if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) return false;
            
            const parts = expiryDate.split('/');
            const month = parseInt(parts[0], 10);
            const year = parseInt('20' + parts[1], 10);
            
            if (month < 1 || month > 12) return false;
            
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            
            return !(year < currentYear || (year === currentYear && month < currentMonth));
        }

        formatExpiryDate(expiryDateMMYY) {
            const parts = expiryDateMMYY.split('/');
            return parts.length === 2 ? parts[1].trim() + parts[0].trim() : '';
        }

        maskCardNumber(cardNumber) {
            const cleaned = cardNumber.replace(/\D/g, '');
            if (cleaned.length <= 6) return '*'.repeat(cleaned.length);
            return cleaned.substring(0, 6) + '*'.repeat(cleaned.length - 10) + cleaned.substring(cleaned.length - 4);
        }
    }

    /**
     * Browser Collector
     */
    class BrowserCollector {
        collectAndEncode() {
            const browserInfo = this.collectBrowserInfo();
            return btoa(JSON.stringify(browserInfo));
        }

        collectBrowserInfo() {
            const nav = navigator;
            const screen = window.screen;

            return {
                browserUserAgent: nav.userAgent || '',
                browserLanguage: nav.language || nav.browserLanguage || '',
                browserScreenWidth: (screen.width || 0).toString(),
                browserScreenHeight: (screen.height || 0).toString(),
                browserColorDepth: (screen.colorDepth || 24).toString(),
                browserTZ: new Date().getTimezoneOffset().toString(),
                browserAcceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                browserJavaEnabled: this.isJavaEnabled(),
                browserJavascriptEnabled: true,
                browserIP: ''
            };
        }

        isJavaEnabled() {
            try {
                return navigator.javaEnabled && navigator.javaEnabled();
            } catch (e) {
                return false;
            }
        }
    }

    /**
     * Iframe Manager - Fixed for proper iframe handling
     */
    class IframeManager {
        constructor(containerId) {
            this.containerId = containerId;
            this.iframes = new Map();
        }

        createIframe(id, src) {
            try {
                // Remove existing iframe with same ID
                this.removeIframe(id);

                const iframe = document.createElement('iframe');
                iframe.id = id;
                iframe.src = src;
                
                // Set iframe attributes for 3DS compatibility
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
                iframe.setAttribute('loading', 'eager'); // Changed from lazy to eager for 3DS
                iframe.setAttribute('importance', 'high'); // High importance for 3DS iframes
                
                // Styles for hidden monitoring iframes
                iframe.style.cssText = `
                    width: 0px;
                    height: 0px;
                    border: none;
                    position: absolute;
                    top: -9999px;
                    left: -9999px;
                    visibility: hidden;
                    opacity: 0;
                `;

                // Add to container or body
                const container = document.getElementById(this.containerId) || document.body;
                container.appendChild(iframe);
                
                // Store reference
                this.iframes.set(id, {
                    element: iframe,
                    created: Date.now(),
                    src: src
                });

                console.log(`[DevKraken3DS] Created iframe: ${id} -> ${src}`);
                return iframe;
            } catch (error) {
                console.error('[DevKraken3DS] Failed to create iframe:', error);
                return null;
            }
        }

        removeIframe(id) {
            const iframeData = this.iframes.get(id);
            if (iframeData) {
                const iframe = iframeData.element;
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
                this.iframes.delete(id);
                console.log(`[DevKraken3DS] Removed iframe: ${id}`);
            }
        }

        cleanup() {
            console.log(`[DevKraken3DS] Cleaning up ${this.iframes.size} iframes`);
            this.iframes.forEach((iframeData, id) => {
                const iframe = iframeData.element;
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            });
            this.iframes.clear();
        }

        getIframeCount() {
            return this.iframes.size;
        }
    }

    /**
     * Challenge Handler - Fixed for proper challenge display
     */
    class ChallengeHandler {
        constructor(containerId) {
            this.containerId = containerId;
            this.challengeIframe = null;
            this.isVisible = false;
        }

        showChallenge(challengeUrl) {
            try {
                console.log('[DevKraken3DS] Showing challenge:', challengeUrl);
                
                const container = document.getElementById(this.containerId);
                if (!container) {
                    console.error('[DevKraken3DS] Challenge container not found:', this.containerId);
                    return false;
                }

                // Clear existing content
                container.innerHTML = '';

                // Create challenge iframe
                this.challengeIframe = document.createElement('iframe');
                this.challengeIframe.src = challengeUrl;
                this.challengeIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-top-navigation');
                this.challengeIframe.setAttribute('allow', 'payment');
                
                // Styles for visible challenge iframe
                this.challengeIframe.style.cssText = `
                    width: 100%;
                    height: 400px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: #fff;
                `;

                container.appendChild(this.challengeIframe);
                this.isVisible = true;

                console.log('[DevKraken3DS] Challenge iframe created and displayed');
                return true;
            } catch (error) {
                console.error('[DevKraken3DS] Failed to show challenge:', error);
                return false;
            }
        }

        hide() {
            if (this.challengeIframe) {
                this.challengeIframe.remove();
                this.challengeIframe = null;
            }

            this.isVisible = false;

            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }

            console.log('[DevKraken3DS] Challenge hidden');
        }

        isDisplayed() {
            return this.isVisible;
        }
    }

    /**
     * Main 3DS SDK Class - Fixed for proper iframe communication
     */
    class GPayments3DS {
        constructor(options = {}) {
            if (!options.apiEndpoint) {
                throw new Error('apiEndpoint is required');
            }

            this.options = {
                apiEndpoint: options.apiEndpoint,
                onSuccess: options.onSuccess || (() => {}),
                onError: options.onError || (() => {}),
                onChallenge: options.onChallenge || (() => {}),
                challengeContainer: options.challengeContainer || 'challenge-container',
                iframeContainer: options.iframeContainer || 'iframe-container',
                debug: options.debug || false,
                timeout: options.timeout || 30000,
                ...options
            };

            // Initialize state
            this.transactionData = {
                threeDSServerTransID: null,
                threeDSRequestorTransID: null,
                threeDSServerCallbackUrl: null,
                monUrl: null,
                resultMonUrl: null,
                authUrl: null,
                browserInfo: null,
                eventReceived: false,
                challengeCompleted: false,
                cardNumber: null,
                amount: null,
                additionalData: null
            };

            this.requestId = this.generateRequestId();
            
            // Initialize components
            this.cardValidator = new CardValidator();
            this.browserCollector = new BrowserCollector();
            this.iframeManager = new IframeManager(this.options.iframeContainer);
            this.challengeHandler = new ChallengeHandler(this.options.challengeContainer);

            // Bind event handlers
            this.handleFrameEvent = this.handleFrameEvent.bind(this);

            // Setup event listeners
            window.addEventListener('message', this.handleFrameEvent, false);

            this.log('DevKraken 3DS SDK initialized', {
                version: '1.0.0',
                requestId: this.requestId,
                debug: this.options.debug
            });
        }

        async authenticate(cardData, additionalData = {}) {
            try {
                this.log('Starting 3DS authentication', {
                    cardMask: this.cardValidator.maskCardNumber(cardData.cardNumber || ''),
                    amount: cardData.amount
                });

                // Validate inputs
                if (!this.cardValidator.validateCardNumber(cardData.cardNumber)) {
                    throw new Error('Please enter a valid card number');
                }

                if (cardData.expiryDate && !this.cardValidator.validateExpiryDate(cardData.expiryDate)) {
                    throw new Error('Please enter a valid expiry date (MM/YY) that has not expired');
                }

                if (!cardData.amount || isNaN(parseFloat(cardData.amount)) || parseFloat(cardData.amount) <= 0) {
                    throw new Error('Please enter a valid amount');
                }

                // Initialize 3DS transaction
                await this.initialize3DS(
                    cardData.cardNumber.replace(/\s/g, ''), 
                    cardData.amount, 
                    { ...additionalData, expiryDate: cardData.expiryDate }
                );

                return true;

            } catch (error) {
                this.log('Authentication error:', error);
                this.options.onError(error.message || 'Authentication failed');
                throw error;
            }
        }

        async initialize3DS(cardNumber, amount, additionalData = {}) {
            try {
                this.transactionData.threeDSRequestorTransID = this.generateUUID();
                this.transactionData.cardNumber = cardNumber;
                this.transactionData.amount = amount;
                this.transactionData.additionalData = additionalData;

                const initData = {
                    operation: 'init',
                    cardNumber: cardNumber,
                    requestId: this.requestId,
                    ...additionalData
                };

                this.log('Sending init request');

                const response = await this.makeApiCall(initData);
                
                if (!response.data.threeDSServerTransID || !response.data.iframeUrls?.callback) {
                    throw new Error('Invalid response: missing required fields');
                }

                // Store response data
                this.transactionData.threeDSServerTransID = response.data.threeDSServerTransID;
                this.transactionData.threeDSRequestorTransID = response.data.threeDSRequestorTransID;
                this.transactionData.threeDSServerCallbackUrl = response.data.iframeUrls.callback;
                this.transactionData.monUrl = response.data.iframeUrls.monitor;
                this.transactionData.authUrl = response.data.authUrl;

                this.log('Init response received', {
                    threeDSServerTransID: this.transactionData.threeDSServerTransID,
                    monUrl: this.transactionData.monUrl,
                    callbackUrl: this.transactionData.threeDSServerCallbackUrl
                });

                // Setup monitoring iframes
                this.setupMonitoringIframes();

                // Set timeout for browser info collection
                this.browserInfoTimeout = setTimeout(() => {
                    if (!this.transactionData.eventReceived) {
                        this.log('Browser info timeout - proceeding with fallback');
                        this.processAuthentication(cardNumber, amount, additionalData);
                    }
                }, 6000);

                return true;

            } catch (error) {
                this.log('Initialization error:', error);
                throw error;
            }
        }

        setupMonitoringIframes() {
            this.log('Setting up monitoring iframes');
            
            if (this.transactionData.monUrl) {
                this.log('Creating monitoring iframe:', this.transactionData.monUrl);
                this.iframeManager.createIframe('monitoringIframe', this.transactionData.monUrl);
            }

            if (this.transactionData.threeDSServerCallbackUrl) {
                this.log('Creating callback iframe:', this.transactionData.threeDSServerCallbackUrl);
                this.iframeManager.createIframe('callbackIframe', this.transactionData.threeDSServerCallbackUrl);
            }
        }

        async processAuthentication(cardNumber, amount, additionalData = {}) {
            try {
                this.log('Processing authentication');

                // Get or create browser info
                if (!this.transactionData.browserInfo) {
                    this.log('Creating fallback browser info');
                    this.transactionData.browserInfo = this.browserCollector.collectAndEncode();
                }

                const expiryDate = additionalData.expiryDate ? 
                    this.cardValidator.formatExpiryDate(additionalData.expiryDate) : null;

                const authData = {
                    operation: 'auth',
                    acctNumber: cardNumber,
                    cardNumber: cardNumber,
                    browserInfo: this.transactionData.browserInfo,
                    cardExpiryDate: expiryDate,
                    purchaseAmount: this.formatAmount(amount),
                    threeDSServerTransID: this.transactionData.threeDSServerTransID,
                    threeDSRequestorTransID: this.transactionData.threeDSRequestorTransID,
                    authUrl: this.transactionData.authUrl,
                    requestId: this.requestId,
                    ...additionalData
                };

                this.log('Sending auth request');

                const response = await this.makeApiCall(authData);

                // Handle result monitoring URL
                if (response.resultMonUrl) {
                    this.transactionData.resultMonUrl = response.resultMonUrl;
                    this.iframeManager.createIframe('resultMonitoringIframe', response.resultMonUrl);
                }

                this.handleAuthResponse(response.data || response);
                return true;

            } catch (error) {
                this.log('Authentication processing error:', error);
                throw error;
            }
        }

        handleAuthResponse(data) {
            const transStatus = data.transStatus;
            this.log('Auth response received', { transStatus });

            if (transStatus === 'C' && data.challengeUrl) {
                // Challenge required
                this.log('Challenge required');
                this.challengeHandler.showChallenge(data.challengeUrl);
                this.options.onChallenge(data);
            } else if (transStatus === 'D') {
                // Decoupled Authentication
                this.options.onSuccess({
                    status: 'decoupled',
                    message: 'Decoupled Authentication Required - Please verify on your device',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else if (transStatus === 'Y') {
                // Authentication successful
                this.options.onSuccess({
                    status: 'success',
                    message: 'Payment Authenticated Successfully',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else if (transStatus === 'N') {
                // Not authenticated
                this.options.onError({
                    status: 'failed',
                    message: 'Authentication Failed - Not Authenticated',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else if (transStatus === 'U') {
                // Technical issue
                this.options.onError({
                    status: 'error',
                    message: 'Authentication Error - Technical Issue',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else if (transStatus === 'A') {
                // Attempted but not verified
                this.options.onSuccess({
                    status: 'partial',
                    message: 'Authentication Attempted but Not Verified',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else if (transStatus === 'R') {
                // Rejected by issuer
                this.options.onError({
                    status: 'rejected',
                    message: 'Authentication Rejected by Issuer',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            } else {
                // Other status
                this.options.onSuccess({
                    status: 'complete',
                    message: 'Authentication Completed',
                    transStatus: transStatus,
                    details: data,
                    requestId: this.requestId
                });
            }
        }

        async handleFrameEvent(event) {
            try {
                this.log('Frame event received', { 
                    origin: event.origin, 
                    data: typeof event.data === 'object' ? event.data.event : event.data 
                });

                if (typeof event.data === 'object' && event.data.event) {
                    await this.processObjectEvent(event.data);
                } else if (event.data?.type === '3ds-notification') {
                    await this.processNotificationEvent(event.data);
                } else if (typeof event.data === 'string') {
                    await this.processStringEvent(event.data);
                }

            } catch (error) {
                this.log('Error handling frame event:', error);
                this.options.onError('Error processing 3DS response: ' + error.message);
            }
        }

        async processObjectEvent(eventData) {
            const eventType = eventData.event;

            if (eventData.param) {
                this.transactionData.browserInfo = eventData.param;
                this.log('Browser info received from 3DS Server');
            }

            if (['3DSMethodSkipped', '3DSMethodFinished'].includes(eventType)) {
                this.transactionData.eventReceived = true;
                if (this.browserInfoTimeout) {
                    clearTimeout(this.browserInfoTimeout);
                }

                if (this.transactionData.browserInfo) {
                    await this.processAuthentication(
                        this.transactionData.cardNumber,
                        this.transactionData.amount,
                        this.transactionData.additionalData
                    );
                } else {
                    this.options.onError('Authentication failed: No browser info received from 3DS server');
                }
            } else if (eventType === 'InitAuthTimedOut') {
                this.transactionData.eventReceived = true;
                await this.processAuthentication(
                    this.transactionData.cardNumber,
                    this.transactionData.amount,
                    this.transactionData.additionalData
                );
            } else if (['Challenge:Completed', 'AuthResultReady'].includes(eventType)) {
                if (!this.transactionData.challengeCompleted) {
                    this.transactionData.challengeCompleted = true;
                    await this.updateChallengeStatusAndGetResult();
                }
            }
        }

        async processNotificationEvent(eventData) {
            if (eventData.event === 'AuthResultReady' && !this.transactionData.challengeCompleted) {
                this.transactionData.challengeCompleted = true;
                await this.updateChallengeStatusAndGetResult();
            } else if (['3DSMethodSkipped', '3DSMethodFinished'].includes(eventData.event)) {
                this.transactionData.eventReceived = true;
                if (eventData.param) {
                    this.transactionData.browserInfo = eventData.param;
                }
                await this.processAuthentication(
                    this.transactionData.cardNumber,
                    this.transactionData.amount,
                    this.transactionData.additionalData
                );
            }
        }

        async processStringEvent(eventData) {
            if (['3DSMethodSkipped', '3DSMethodFinished'].includes(eventData)) {
                this.transactionData.eventReceived = true;
                await this.processAuthentication(
                    this.transactionData.cardNumber,
                    this.transactionData.amount,
                    this.transactionData.additionalData
                );
            } else if (['Challenge:Completed', 'AuthResultReady'].includes(eventData)) {
                if (!this.transactionData.challengeCompleted) {
                    this.transactionData.challengeCompleted = true;
                    await this.updateChallengeStatusAndGetResult();
                }
            }
        }

        async updateChallengeStatusAndGetResult() {
            try {
                if (!this.transactionData.threeDSServerTransID) {
                    throw new Error('Missing transaction ID');
                }

                this.log('Updating challenge status');

                // Update challenge status
                await this.makeApiCall({
                    operation: 'updateChallengeStatus',
                    threeDSServerTransID: this.transactionData.threeDSServerTransID,
                    status: '01',
                    requestId: this.requestId
                });

                // Get authentication result
                await this.getAuthenticationResult();
                return true;

            } catch (error) {
                this.log('Error updating challenge status:', error);
                this.options.onError('Error updating challenge status: ' + error.message);
                return false;
            }
        }

        async getAuthenticationResult() {
            try {
                if (!this.transactionData.threeDSServerTransID) {
                    throw new Error('Missing transaction ID');
                }

                this.log('Getting auth result');

                const url = new URL(this.options.apiEndpoint, window.location.origin);
                url.searchParams.set('operation', 'getAuthResult');
                url.searchParams.set('threeDSServerTransID', this.transactionData.threeDSServerTransID);
                url.searchParams.set('requestId', this.requestId);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': this.requestId
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                // Cleanup
                this.cleanup();

                // Process final result
                const responseData = data.data || data;
                const transStatus = responseData.transStatus || 'Unknown';

                this.options.onSuccess({
                    status: responseData.status || 'completed',
                    message: responseData.message || 'Authentication Completed',
                    transStatus: transStatus,
                    details: responseData,
                    requestId: this.requestId
                });

                return true;

            } catch (error) {
                this.log('Get auth result error:', error);
                this.options.onError('Error getting authentication result: ' + error.message);
                return false;
            }
        }

        async makeApiCall(data) {
            try {
                const response = await fetch(this.options.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': this.requestId,
                        'X-SDK-Version': '1.0.0'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseData = await response.json();

                if (responseData.error) {
                    throw new Error(responseData.error);
                }

                return responseData;

            } catch (error) {
                this.log('API call error:', error);
                throw error;
            }
        }

        cleanup() {
            this.log('Cleaning up resources');
            this.iframeManager.cleanup();
            this.challengeHandler.hide();
            
            if (this.browserInfoTimeout) {
                clearTimeout(this.browserInfoTimeout);
                this.browserInfoTimeout = null;
            }
        }

        destroy() {
            this.log('Destroying SDK instance');
            
            this.cleanup();
            window.removeEventListener('message', this.handleFrameEvent, false);
            
            // Clear transaction data
            this.transactionData = {
                threeDSServerTransID: null,
                threeDSRequestorTransID: null,
                threeDSServerCallbackUrl: null,
                monUrl: null,
                resultMonUrl: null,
                authUrl: null,
                browserInfo: null,
                eventReceived: false,
                challengeCompleted: false,
                cardNumber: null,
                amount: null,
                additionalData: null
            };
        }

        // Utility methods
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        generateRequestId() {
            return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        formatAmount(amount) {
            return Math.round(parseFloat(amount) * 100).toString();
        }

        getPerformanceMetrics() {
            return {
                transactionState: this.transactionData,
                iframeCount: this.iframeManager.getIframeCount(),
                challengeVisible: this.challengeHandler.isDisplayed(),
                requestId: this.requestId
            };
        }

        log(...args) {
            if (this.options.debug) {
                console.log(`[DevKraken3DS:${this.requestId}]`, ...args);
            }
        }

        // Static methods
        static get version() {
            return '1.0.0';
        }

        static get author() {
            return 'DevKraken <soman@devkraken.com>';
        }
    }

    // Export the class
    return GPayments3DS;
});