 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Wallet.css';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await axios.get('/api/wallet');
      setWallet(response.data.wallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data.transactions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    
    try {
      // Create order
      const orderResponse = await axios.post('/api/wallet/deposit', {
        amount: parseFloat(amount),
        paymentMethod
      });

      const { orderId, amount: orderAmount, currency } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency,
        name: 'Traffic Control System',
        description: 'Wallet Deposit',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post('/api/wallet/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId: orderResponse.data.transactionId
            });

            alert('Payment successful! Your wallet has been credited.');
            fetchWallet();
            fetchTransactions();
            setAmount('');
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: '9999999999'
        },
        notes: {
          address: 'Wallet Deposit'
        },
        theme: {
          color: '#3399cc'
        },
        method: {
          upi: paymentMethod === 'upi',
          card: paymentMethod === 'card',
          netbanking: paymentMethod === 'netbanking',
          wallet: paymentMethod === 'wallet'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Error creating deposit order:', error);
      alert('Failed to create payment order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (wallet && parseFloat(amount) > wallet.balance) {
      alert('Insufficient balance');
      return;
    }

    setProcessing(true);

    try {
      await axios.post('/api/wallet/withdraw', {
        amount: parseFloat(amount),
        bankAccount: 'Default Bank Account' // This would be user's saved bank account
      });

      alert('Withdrawal request submitted successfully. It will be processed within 1-2 business days.');
      fetchWallet();
      fetchTransactions();
      setAmount('');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      alert('Failed to create withdrawal request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <div className="wallet-loading">Loading wallet...</div>;
  }

  return (
    <div className="wallet-container">
      <h1 className="wallet-title">My Wallet</h1>
      
      {/* Wallet Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-info">
          <h2>Available Balance</h2>
          <p className="balance-amount">
            {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
          </p>
        </div>
        <div className="wallet-status">
          <span className={`status-badge ${wallet?.isActive ? 'active' : 'inactive'}`}>
            {wallet?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Deposit
        </button>
        <button 
          className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          Withdraw
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h3>Recent Transactions</h3>
            <div className="transactions-list">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id} className="transaction-item">
                    <div className="transaction-info">
                      <span className={`transaction-type ${transaction.type}`}>
                        {transaction.type === 'deposit' ? '↓' : '↑'} {transaction.type.toUpperCase()}
                      </span>
                      <span className="transaction-amount">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    <div className="transaction-details">
                      <span className={`transaction-status ${transaction.status}`}>
                        {transaction.status}
                      </span>
                      <span className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No transactions found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="deposit-tab">
            <h3>Deposit Money</h3>
            <div className="deposit-form">
              <div className="form-group">
                <label>Amount (INR)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="upi">UPI</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <button 
                className="deposit-btn"
                onClick={handleDeposit}
                disabled={processing || !amount}
              >
                {processing ? 'Processing...' : 'Deposit Now'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="withdraw-tab">
            <h3>Withdraw Money</h3>
            <div className="withdraw-form">
              <div className="form-group">
                <label>Amount (INR)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={wallet?.balance || 0}
                />
                <small>Available balance: {formatCurrency(wallet?.balance || 0)}</small>
              </div>

              <div className="withdraw-info">
                <p>• Withdrawal will be processed to your default bank account</p>
                <p>• Processing time: 1-2 business days</p>
                <p>• Minimum withdrawal: ₹100</p>
              </div>

              <button 
                className="withdraw-btn"
                onClick={handleWithdraw}
                disabled={processing || !amount || parseFloat(amount) > (wallet?.balance || 0)}
              >
                {processing ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Load Razorpay Script */}
      {!window.Razorpay && (
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => console.log('Razorpay script loaded')}
        />
      )}
    </div>
  );
};

export default Wallet;