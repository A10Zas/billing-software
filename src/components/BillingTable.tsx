/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Search, Filter, Printer } from 'lucide-react';
import supabase from '../lib/supabase';

// Mock supabase for demo - replace with your actual supabase import

export default function BillingTable() {
  const [data, setData] = useState<
    {
      mobile_no: string;
      transaction_type: string;
      transaction_status: string;
      transaction_date: string;
      transaction_time: string;
      rrn_utr_number: string;
      account_id: string;
      total: number;
      billing_plan: string;
    }[]
  >([]);
  const [filteredData, setFilteredData] = useState<
    {
      mobile_no: string;
      transaction_type: string;
      transaction_status: string;
      transaction_date: string;
      transaction_time: string;
      rrn_utr_number: string;
      account_id: string;
      total: number;
      billing_plan: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  // Initialize with today's data
  useEffect(() => {
    fetchBillData();
  }, []);

  // Filter data when search term or date range changes
  useEffect(() => {
    filterData();
  }, [data, searchTerm, dateFrom, dateTo]);

  const fetchBillData = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(
        new Date(dateFrom).setHours(0, 0, 0, 0),
      ).toISOString();
      const endOfDay = new Date(
        new Date(dateTo).setHours(24, 0, 0, 0),
      ).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.mobile_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rrn_utr_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.billing_plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.transaction_type
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by date range
    // const fromDate = new Date(dateFrom);
    // const toDate = new Date(dateTo);
    // toDate.setHours(23, 59, 59, 999); // Include the entire day

    // filtered = filtered.filter((item) => {
    //   const itemDate = new Date(item.transaction_date);
    //   return itemDate >= fromDate && itemDate <= toDate;
    // });

    setFilteredData(filtered);
  };

  const handleDateFilter = () => {
    fetchBillData();
  };

  // Print function for individual transactions
  const handlePrintTransaction = (transactionData: any) => {
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
    <div style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; width: 58mm; margin: 0; padding: 10px; position: relative; z-index: 2;  font-size: 1em;">
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
        <img src="logo.png" />
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">TRANSACTION RECEIPT </div>
        <div>Date: ${formatDate(
          transactionData.created_at || transactionData.transaction_date,
        )} </div>
        [<span>${transactionData.from_month.toUpperCase()} - ${transactionData.to_month.toUpperCase()}</span>]
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

  // Print all visible transactions
  // Replace the existing handlePrintAll function with this updated version

  const handlePrintAll = () => {
    if (filteredData.length === 0) {
      alert('No transactions to print');
      return;
    }

    const formatDate = (dateString: any) => {
      return new Date(dateString).toLocaleDateString('en-IN');
    };

    // const formatTime = (timeString: any) => {
    //   return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     hour12: true,
    //   });
    // };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };

    const getStatusText = (status: string) => {
      return status.toUpperCase();
    };

    // Calculate total amount
    const totalAmount = filteredData.reduce(
      (sum, t: any) => sum + t.total_amount,
      0,
    );

    const printContent = `
    <html>
      <head>
        <title>Transaction Report - ${formatDate(
          new Date().toISOString(),
        )}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            color: #333;
            font-weight: 600;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #333;
            padding: 6px 4px;
            text-align: left;
            font-size: 10px;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          .mobile-col { width: 8%; }
          .account-col { width: 10%; }
          .utr-col { width: 12%; }
          .type-col { width: 8%; }
          .plan-col { width: 8%; }
          .amount-col { width: 8%; text-align: right; }
          .from-col { width: 6%; }
          .to-col { width: 6%; }
          .status-col { width: 6%; text-align: center; }
          .date-col { width: 10%; }
          .footer {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer-summary {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 13px;
          }
          .status-success { color: #008000; font-weight: bold; }
          .status-pending { color: #ff8c00; font-weight: bold; }
          .status-failed { color: #dc3545; font-weight: bold; }
          .amount-cell { font-weight: bold; }
          @media print {
            body { margin: 10px; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TRANSACTION REPORT</h1>
          <p>Generated on: ${formatDate(
            new Date().toISOString(),
          )} at ${new Date().toLocaleTimeString('en-IN')}</p>
          <p>Total Records: ${filteredData.length}</p>
          <p>Date Range: ${formatDate(dateFrom)} to ${formatDate(dateTo)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="mobile-col">Mobile No</th>
              <th class="account-col">Consumer ID</th>
              <th class="utr-col">RRN/UTR Number</th>
              <th class="type-col">Type</th>
              <th class="plan-col">Plan</th>
              <th class="amount-col">Amount</th>
              <th class="from-col">From</th>
              <th class="to-col">To</th>
              <th class="status-col">Status</th>
              <th class="date-col">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
              .map(
                (item: any) => `
              <tr>
                <td class="mobile-col">${item.mobile_no}</td>
                <td class="account-col">${item.account_id}</td>
                <td class="utr-col">${item.rrn_utr_number}</td>
                <td class="type-col">${item.transaction_type}</td>
                <td class="plan-col">${item.billing_plan}</td>
                <td class="amount-col amount-cell">${formatCurrency(
                  item.total_amount,
                )}</td>
                <td class="from-col">${item.from_month}</td>
                <td class="to-col">${item.to_month}</td>
                <td class="status-col status-${item.transaction_status.toLowerCase()}">${getStatusText(
                  item.transaction_status,
                )}</td>
                <td class="date-col">
                  ${formatDate(item.transaction_date)}<br>
                  <small>${item.transaction_time}</small>
                </td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="footer-summary">
            <span>Total Records: ${filteredData.length}</span>
            <span>TOTAL AMOUNT: ${formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
    printWindow?.close();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    let statusClasses = '';

    switch (status.toLowerCase()) {
      case 'success':
        statusClasses =
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        break;
      case 'pending':
        statusClasses =
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        break;
      case 'failed':
        statusClasses =
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      default:
        statusClasses =
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }

    return <span className={`${baseClasses} ${statusClasses}`}>{status}</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto bg-gray-900 text-gray-100 p-6 rounded-2xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">
                Transaction Management
              </h1>
            </div>
            {/* Print All Button */}
            <button
              onClick={handlePrintAll}
              disabled={filteredData.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print All ({filteredData.length})
            </button>
          </div>
          <p className="text-gray-400">
            Manage and view transaction records with advanced filtering and
            printing
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
          {/* Filters Section */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by mobile, account ID, UTR, plan, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 font-medium">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleDateFilter}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {loading ? 'Loading...' : 'Apply Filter'}
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Mobile No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Consumer ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    RRN/UTR Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="text-gray-400">
                          Loading transaction data...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No transaction records found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">
                        {item.mobile_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">
                        {item.account_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                        {item.rrn_utr_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {item.billing_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">
                        {formatCurrency(item.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">
                        {item.from_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">
                        {item.to_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.transaction_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div>{item.transaction_date}</div>
                        <div className="text-xs text-gray-500">
                          {item.transaction_time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handlePrintTransaction(item)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors duration-200"
                          title="Print Receipt"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredData.length > 0 && (
            <div className="px-6 py-4 bg-gray-750 border-t border-gray-700">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Showing {filteredData.length} records</span>
                <span>
                  Total Amount:{' '}
                  {formatCurrency(
                    filteredData.reduce(
                      (sum, item: any) => sum + item.total_amount,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
