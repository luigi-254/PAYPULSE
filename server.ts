import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0970421283',
});

// Use the specific database ID if provided
const db = admin.firestore();
if (process.env.FIRESTORE_DATABASE_ID) {
  // @ts-ignore - databaseId exists in newer versions but might not be in types yet
  db.databaseId = process.env.FIRESTORE_DATABASE_ID;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development or if it interferes with iframe
  }));
  app.use(cors());
  app.use(express.json());

  // M-Pesa Token Generation
  const getMpesaToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const env = process.env.MPESA_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'api';
    const url = `https://${env}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa token:', error);
      throw error;
    }
  };

  // API Routes
  app.post('/api/mpesa/stkpush', async (req, res) => {
    const { phoneNumber, amount, transactionId, description } = req.body;

    // Validate inputs
    if (!phoneNumber || !amount || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const token = await getMpesaToken();
      const env = process.env.MPESA_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'api';
      const url = `https://${env}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`;
      
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const shortCode = process.env.MPESA_SHORTCODE;
      const passkey = process.env.MPESA_PASSKEY;
      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
      
      const callbackUrl = `${process.env.APP_URL}/api/mpesa/callback`;

      const response = await axios.post(url, {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber.replace('+', ''),
        PartyB: shortCode,
        PhoneNumber: phoneNumber.replace('+', ''),
        CallBackURL: callbackUrl,
        AccountReference: transactionId,
        TransactionDesc: description || 'Payment for services',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update transaction with checkout request ID
      await db.collection('transactions').doc(transactionId).update({
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('STK Push Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to initiate STK push', details: error.response?.data });
    }
  });

  // Callback URL for M-Pesa
  app.post('/api/mpesa/callback', async (req, res) => {
    const body = req.body.Body?.stkCallback;
    if (!body) {
      console.error('Invalid callback body:', JSON.stringify(req.body));
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid request' });
    }
    console.log('M-Pesa Callback:', JSON.stringify(body));

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    try {
      // Find transaction by CheckoutRequestID
      const querySnapshot = await db.collection('transactions')
        .where('checkoutRequestId', '==', CheckoutRequestID)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.warn('Transaction not found for callback:', CheckoutRequestID);
        return res.json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      const doc = querySnapshot.docs[0];
      const transactionId = doc.id;

      let status = ResultCode === 0 ? 'completed' : 'failed';
      let mpesaReceiptNumber = '';

      if (ResultCode === 0 && CallbackMetadata) {
        const items = CallbackMetadata.Item;
        const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
        if (receiptItem) mpesaReceiptNumber = receiptItem.Value;
      }

      await db.collection('transactions').doc(transactionId).update({
        status,
        mpesaReceiptNumber,
        customerMessage: ResultDesc,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log action in audit logs
      await db.collection('auditLogs').add({
        action: 'mpesa_callback_processed',
        userId: 'system',
        details: `Transaction ${transactionId} status updated to ${status}. M-Pesa Ref: ${mpesaReceiptNumber}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      console.error('Error processing callback:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Server Error' });
    }
  });

  // Query M-Pesa Transaction Status
  app.post('/api/mpesa/query', async (req, res) => {
    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Missing checkoutRequestId' });
    }

    try {
      const token = await getMpesaToken();
      const env = process.env.MPESA_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'api';
      const url = `https://${env}.safaricom.co.ke/mpesa/stkpushquery/v1/query`;
      
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const shortCode = process.env.MPESA_SHORTCODE;
      const passkey = process.env.MPESA_PASSKEY;
      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

      const response = await axios.post(url, {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Query Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to query status', details: error.response?.data });
    }
  });

  // Setup Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
