/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { CheckCircle, Printer, X } from 'lucide-react';
import { Button } from './ui/button';

const BillingForm = () => {
  const [formData, setFormData] = useState({
    mobileNo: '9933414729',
    transactionType: 'WBSEDCLQOB',
    transactionStatus: 'success',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5), // Auto-fill current time
    rrnUtrNumber: `AT${new Date().getTime().toString().slice(0, 11)}`,
    accountId: '',
    total: '',
    filterOption: 'd1',
    fromMonth: '',
    toMonth: '',
  });

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    totalVolume: 0,
  });

  console.log(transactions);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTransaction, setSubmittedTransaction] = useState<{
    mobile_no: string;
    transaction_type: string;
    transaction_status: string;
    transaction_date: string;
    transaction_time: string;
    billing_plan: string;
    from_month: string;
    to_month: string;
    rrn_utr_number: string;
    account_id: string;
    total_amount: number;
  }>();

  // Fetch transactions and update summary
  const fetchTransactions = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(24, 0, 0, 0)).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '42501') {
          setAuthError('Database access denied. Please check RLS policies.');
        }
        throw error;
      }

      console.log('Transactions:', data);

      setTransactions(data || []);
      updateSummary(data || []);
      setAuthError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Show mock data if database fails (for development)
      const mockData = [
        { transaction_status: 'completed', total_amount: 1000 },
        { transaction_status: 'completed', total_amount: 2000 },
        { transaction_status: 'pending', total_amount: 500 },
        { transaction_status: 'failed', total_amount: 0 },
      ];
      setTransactions(mockData);
      updateSummary(mockData);
    }
  };

  // Update summary statistics
  const updateSummary = (data: any) => {
    const completed = data.filter(
      (t: any) => t.transaction_status === 'success',
    ).length;
    const pending = data.filter(
      (t: any) => t.transaction_status === 'pending',
    ).length;
    const failed = data.filter(
      (t: any) => t.transaction_status === 'failed',
    ).length;
    const totalVolume = data
      .filter((t: any) => t.transaction_status === 'success')
      .reduce(
        (sum: number, t: any) => sum + parseFloat(t.total_amount || 0),
        0,
      );

    setSummary({
      completed,
      pending,
      failed,
      totalVolume,
    });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      mobileNo: '9933414729',
      transactionType: 'WBSEDCLQOB',
      transactionStatus: 'success',
      date: new Date().toISOString().split('T')[0],
      time: new Date()
        .toLocaleTimeString('en-GB', { hour12: false })
        .slice(0, 5), // Auto-fill current time
      rrnUtrNumber: `AT${new Date().getTime().toString().slice(0, 11)}`,
      accountId: '',
      total: '',
      filterOption: 'd1',
      fromMonth: '',
      toMonth: '',
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.mobileNo ||
        !formData.transactionType ||
        !formData.total ||
        !formData.fromMonth ||
        !formData.toMonth ||
        !formData.date ||
        !formData.time ||
        !formData.rrnUtrNumber ||
        !formData.accountId ||
        !formData.filterOption ||
        !formData.transactionStatus
      ) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare data for database
      const transactionData = {
        mobile_no: formData.mobileNo,
        transaction_type: formData.transactionType,
        transaction_status: formData.transactionStatus,
        transaction_date: formData.date,
        transaction_time: formData.time,
        rrn_utr_number: formData.rrnUtrNumber,
        account_id: formData.accountId,
        total_amount: parseFloat(formData.total),
        billing_plan: formData.filterOption.toUpperCase(),
        created_at: new Date().toISOString(),
        from_month: formData.fromMonth.toUpperCase(),
        to_month: formData.toMonth.toUpperCase(),
      };

      // Uncomment when you have supabase setup
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === '42501') {
          alert(
            'Database access denied. Please check your RLS policies or disable RLS for development.',
          );
        }
        throw error;
      }

      console.log('Transaction saved:', data);

      // Store the transaction data and show success dialog
      setSubmittedTransaction(data[0] || transactionData);
      setShowSuccessDialog(true);

      resetForm();

      // Refresh the transactions list
      await fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handlePrint = (transactionData: any) => {
    const formatDate = (dateString: any) => {
      return new Date(dateString).toLocaleDateString('en-IN');
    };

    const formatTime = (timeString: any) => {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const printContent = `
    <div style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; width: 58mm; margin: 0; padding: 10px; position: relative; z-index: 2;">
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
        <img src="logo.png" />
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">TRANSACTION RECEIPT</div>
        <div>Date: ${formatDate(
          transactionData.created_at || transactionData.transaction_date,
        )} [<span>${transactionData.from_month.toUpperCase()} - ${transactionData.to_month.toUpperCase()}</span>]</div>
      </div>
     
      <div style="font-weight: bold;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Consumer ID:</span>
          <span>${transactionData.account_id}</span>
        </div>  
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Mobile No:</span>
          <span>${transactionData.mobile_no}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Type:</span>
          <span>${transactionData.transaction_type}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Status:</span>
          <span>${transactionData.transaction_status.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">Time:</span>
          <span>${formatTime(transactionData.transaction_time)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="font-weight: bold;">RRN/UTR:</span>
          <span>${transactionData.rrn_utr_number}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; font-size: 14px;">
          <span>Total Amount:</span>
          <span>₹${transactionData.total_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
    <html>
      <head>
        <title>Transaction Receipt - ${transactionData.rrn_utr_number}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            position: relative;
            font-weight: bold;
          }

          img {
            top: 10px;
            right: 10px;
            width: 100%;
            height: 90px;
          }
          
          @media print {
            body {
              margin: 0;
              font-weight: bold;
            }

            img {
              top: 10px;
              right: 10px;
              width: 100%;
              height: 90px;
            }
            
            @page { 
              size: 58mm auto; 
              margin: 0; 
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);

    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
    printWindow?.close();
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Transaction Details
        </h1>

        {authError && (
          <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded-xl text-red-200">
            <strong>Database Error:</strong> {authError}
          </div>
        )}
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Input Fields (2 columns) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Transaction Type *
                </label>
                <input
                  type="text"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter Transaction Type"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Transaction Status
                </label>
                <select
                  name="transactionStatus"
                  value={formData.transactionStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  RRN/UTR Number
                </label>
                <input
                  type="text"
                  name="rrnUtrNumber"
                  value={formData.rrnUtrNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter RRN/UTR number"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Account ID
                </label>
                <input
                  type="text"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter account ID"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Total Amount *
                </label>
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  From Month
                </label>
                <select
                  name="fromMonth"
                  value={formData.fromMonth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Month</option>
                  <option value="jan">January</option>
                  <option value="feb">February</option>
                  <option value="mar">March</option>
                  <option value="apr">April</option>
                  <option value="may">May</option>
                  <option value="jun">June</option>
                  <option value="jul">July</option>
                  <option value="aug">August</option>
                  <option value="sep">September</option>
                  <option value="oct">October</option>
                  <option value="nov">November</option>
                  <option value="dec">December</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  To Month
                </label>
                <select
                  name="toMonth"
                  value={formData.toMonth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Month</option>
                  <option value="jan">January</option>
                  <option value="feb">February</option>
                  <option value="mar">March</option>
                  <option value="apr">April</option>
                  <option value="may">May</option>
                  <option value="jun">June</option>
                  <option value="jul">July</option>
                  <option value="aug">August</option>
                  <option value="sep">September</option>
                  <option value="oct">October</option>
                  <option value="nov">November</option>
                  <option value="dec">December</option>
                </select>
              </div>
            </div>

            {/* Right Side - Radio Button Group */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 h-fit">
                <h3 className="text-white font-semibold text-lg mb-6">
                  Billing Plans
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      value: 'd1',
                      label: 'D1 Standard',
                      desc: 'Monthly standard billing cycle',
                    },
                    {
                      value: 'd1-com',
                      label: 'D1 Complete',
                      desc: 'Comprehensive monthly billing with all services',
                    },
                    {
                      value: 'd2',
                      label: 'D2 Standard',
                      desc: 'Bi-monthly standard billing cycle',
                    },
                    {
                      value: 'd2-com',
                      label: 'D2 Complete',
                      desc: 'Comprehensive bi-monthly billing with all services',
                    },
                    {
                      value: 'all',
                      label: 'All Services',
                      desc: 'Universal billing for all available services',
                    },
                    {
                      value: 'all-com',
                      label: 'All Complete',
                      desc: 'Premium comprehensive billing for all services',
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start cursor-pointer group p-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="filterOption"
                        value={option.value}
                        checked={formData.filterOption === option.value}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2 mt-0.5"
                      />
                      <div className="ml-3">
                        <span className="text-white font-medium block">
                          {option.label}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {option.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-12 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                loading
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transform hover:scale-105'
              }`}
            >
              {loading ? 'Saving...' : 'Save Transaction Data'}
            </button>
          </div>

          {/* Summary Section */}
          <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-600">
            <h3 className="text-white font-semibold text-lg mb-4">
              Transaction Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {summary.completed}
                </div>
                <div className="text-gray-400 text-sm">Completed</div>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {summary.pending}
                </div>
                <div className="text-gray-400 text-sm">Pending</div>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {summary.failed}
                </div>
                <div className="text-gray-400 text-sm">Failed</div>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(summary.totalVolume)}
                </div>
                <div className="text-gray-400 text-sm">Total Volume</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Transaction Successful
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Mobile Number</td>
                    <td className="p-2">{submittedTransaction?.mobile_no}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Transaction Type</td>
                    <td className="p-2">
                      {submittedTransaction?.transaction_type}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Status</td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {submittedTransaction?.transaction_status}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Time</td>
                    <td className="p-2">
                      {new Date(
                        `2000-01-01T${submittedTransaction?.transaction_time}`,
                      ).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">RRN/UTR Number</td>
                    <td className="p-2 font-mono text-sm">
                      {submittedTransaction?.rrn_utr_number}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Consumer ID</td>
                    <td className="p-2">{submittedTransaction?.account_id}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Billing Plan</td>
                    <td className="p-2">
                      {submittedTransaction?.billing_plan}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Billing Period</td>
                    <td className="p-2">
                      {submittedTransaction?.from_month} -{' '}
                      {submittedTransaction?.to_month}
                    </td>
                  </tr>
                  <tr className="">
                    <td className="p-2 font-bold">Total Amount</td>
                    <td className="p-2 font-bold text-lg ">
                      ₹{submittedTransaction?.total_amount?.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={() => handlePrint(submittedTransaction)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingForm;
