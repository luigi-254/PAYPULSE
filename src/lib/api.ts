import axios from 'axios';

export interface StkPushParams {
  phoneNumber: string;
  amount: number;
  transactionId: string;
  description?: string;
}

export const initiateStkPush = async (params: StkPushParams) => {
  try {
    const response = await axios.post('/api/mpesa/stkpush', params);
    return response.data;
  } catch (error: any) {
    console.error('STK Push API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const queryTransactionStatus = async (checkoutRequestId: string) => {
  try {
    const response = await axios.post('/api/mpesa/query', { checkoutRequestId });
    return response.data;
  } catch (error: any) {
    console.error('Query API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
