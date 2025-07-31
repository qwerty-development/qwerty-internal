'use client'
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  Eye,
  CreditCard,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Building2,
  Users,
  type LucideIcon
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Define a type for a single subscription object
interface Subscription {
  id: string;
  subscription_name: string;
  details?: string;
  price: number;
  billing_period: 'monthly' | 'annually';
  recurring_every: number;
  payment_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define a type for the form data state
interface FormDataState {
  subscription_name: string;
  details: string;
  price: string;
  billing_period: 'monthly' | 'annually';
  recurring_every: string;
  payment_date: string;
}

const SubscriptionTracker = () => {
  const supabase = createClient();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [billingFilter, setBillingFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("payment_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalMonthlyCost: 0,
    totalAnnualCost: 0,
    dueSoon: 0,
  });

  const [formData, setFormData] = useState<FormDataState>({
    subscription_name: '',
    details: '',
    price: '',
    billing_period: 'monthly',
    recurring_every: '1',
    payment_date: ''
  });

  // Calculate next payment date based on current date and subscription details
  const calculateNextPaymentDate = (
    lastPaymentDate: string,
    billingPeriod: 'monthly' | 'annually',
    recurringEvery: number
  ): string => {
    const today = new Date();
    const lastPayment = new Date(`${lastPaymentDate}T00:00:00`);
    
    let nextPayment = new Date(lastPayment);
    
    // Keep adding the billing period until we get a future date
    while (nextPayment <= today) {
      if (billingPeriod === 'monthly') {
        nextPayment.setMonth(nextPayment.getMonth() + recurringEvery);
      } else if (billingPeriod === 'annually') {
        nextPayment.setFullYear(nextPayment.getFullYear() + recurringEvery);
      }
    }
    
    return nextPayment.toISOString().split('T')[0];
  };

  // Update payment dates for all subscriptions  
  const updatePaymentDates = async () => {
    try {
      const today = new Date();
      const subscriptionsToUpdate: Subscription[] = [];

      for (const sub of subscriptions) {
        const paymentDate = new Date(`${sub.payment_date}T00:00:00`);
        
        // If payment date has passed, calculate next payment date
        if (paymentDate <= today) {
          const nextPaymentDate = calculateNextPaymentDate(
            sub.payment_date,
            sub.billing_period,
            sub.recurring_every
          );
          
          subscriptionsToUpdate.push({
            ...sub,
            payment_date: nextPaymentDate
          });
        }
      }

      // Update subscriptions in Supabase if there are any to update
      if (subscriptionsToUpdate.length > 0) {
        for (const sub of subscriptionsToUpdate) {
          await supabase
            .from('subscriptions')
            .update({ payment_date: sub.payment_date })
            .eq('id', sub.id);
        }
        
        // Refresh the list
        fetchSubscriptions();
      }
    } catch (err) {
      console.error('Error updating payment dates:', err);
    }
  };

  // Fetch subscriptions from Supabase
  const fetchSubscriptions = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) throw error;

      const subscriptionsData = data || [];
      setSubscriptions(subscriptionsData);

      // Calculate statistics
      const total = subscriptionsData.length;
      const totalMonthlyCost = subscriptionsData.reduce((total, sub) => {
        return total + calculateMonthlyCost(sub.price, sub.billing_period, sub.recurring_every);
      }, 0);
      const totalAnnualCost = totalMonthlyCost * 12;
      const dueSoon = subscriptionsData.filter(sub => isPaymentDueSoon(sub.payment_date)).length;

      setStats({ total, totalMonthlyCost, totalAnnualCost, dueSoon });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load subscriptions on component mount and set up auto-update
  useEffect(() => {
    fetchSubscriptions();
    
    // Check for payment date updates every hour
    const interval = setInterval(updatePaymentDates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sortField, sortDirection]);

  // Calculate monthly cost for a subscription
  const calculateMonthlyCost = (price: number, billingPeriod: 'monthly' | 'annually', recurringEvery: number) => {
    if (billingPeriod === 'monthly') {
      return price / recurringEvery;
    } else if (billingPeriod === 'annually') {
      return (price / recurringEvery) / 12;
    }
    return 0;
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get header style for sorting
  const getHeaderStyle = (field: string) => {
    const baseStyle =
      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200";
    return sortField === field ? `${baseStyle} text-blue-600 bg-blue-50` : `${baseStyle} text-gray-500`;
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      searchTerm === "" ||
      sub.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.details && sub.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBilling =
      billingFilter === "all" ||
      sub.billing_period === billingFilter;

    return matchesSearch && matchesBilling;
  });

  // Sort filtered subscriptions
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add or update subscription
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.subscription_name || !formData.price || !formData.payment_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const subscriptionData = {
        subscription_name: formData.subscription_name,
        details: formData.details || null,
        price: parseFloat(formData.price),
        billing_period: formData.billing_period,
        recurring_every: parseInt(formData.recurring_every) || 1,
        payment_date: calculateNextPaymentDate(
          formData.payment_date,
          formData.billing_period,
          parseInt(formData.recurring_every) || 1
        ),
        is_active: true
      };

      if (editingId) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        // Add new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert([subscriptionData]);
        
        if (error) throw error;
      }

      // Reset form
      setFormData({
        subscription_name: '',
        details: '',
        price: '',
        billing_period: 'monthly',
        recurring_every: '1',
        payment_date: ''
      });
      setIsAddingNew(false);
      
      // Refresh the list
      fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Edit subscription
  const handleEdit = (subscription: Subscription) => {
    setFormData({
      subscription_name: subscription.subscription_name,
      details: subscription.details || '',
      price: subscription.price.toString(),
      billing_period: subscription.billing_period,
      recurring_every: subscription.recurring_every.toString(),
      payment_date: subscription.payment_date
    });
    setEditingId(subscription.id);
    setIsAddingNew(true);
  };

  // Delete subscription (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh the list
        fetchSubscriptions();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      subscription_name: '',
      details: '',
      price: '',
      billing_period: 'monthly',
      recurring_every: '1',
      payment_date: ''
    });
    setIsAddingNew(false);
    setEditingId(null);
  };

  // Manually refresh payment dates
  const handleRefreshPaymentDates = async () => {
    setRefreshing(true);
    await updatePaymentDates();
    setRefreshing(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if payment is due soon (within next 7 days)
  const isPaymentDueSoon = (paymentDate: string) => {
    const today = new Date();
    const payment = new Date(`${paymentDate}T00:00:00`);
    const diffTime = payment.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  // Get billing period badge
  const getBillingPeriodBadge = (period: string, recurringEvery: number) => {
    const config = {
      monthly: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Calendar,
        label: `Every ${recurringEvery} month${recurringEvery > 1 ? 's' : ''}`
      },
      annually: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: TrendingUp,
        label: `Every ${recurringEvery} year${recurringEvery > 1 ? 's' : ''}`
      }
    };

    const periodConfig = config[period as keyof typeof config] || config.monthly;
    const IconComponent = periodConfig.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${periodConfig.bg} ${periodConfig.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {periodConfig.label}
      </span>
    );
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Error Loading Subscriptions
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Tracker</h1>
              <p className="text-gray-600 mt-2">
                Manage your recurring subscriptions and payments
                {!loading && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({subscriptions.length} {subscriptions.length === 1 ? "subscription" : "subscriptions"})
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefreshPaymentDates}
                disabled={refreshing}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalMonthlyCost)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Annual Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalAnnualCost)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dueSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search subscriptions or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Billing Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={billingFilter}
                  onChange={(e) => setBillingFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Billing Periods</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Button */}
        {!isAddingNew && (
          <div className="mb-6">
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Subscription
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {isAddingNew && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Subscription' : 'Add New Subscription'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subscription_name">
                    Subscription Name *
                  </label>
                  <input
                    type="text"
                    id="subscription_name"
                    name="subscription_name"
                    value={formData.subscription_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                    Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_period">
                    Billing Period
                  </label>
                  <select
                    id="billing_period"
                    name="billing_period"
                    value={formData.billing_period}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recurring_every">
                    Recurring Every
                  </label>
                  <input
                    type="number"
                    id="recurring_every"
                    min="1"
                    name="recurring_every"
                    value={formData.recurring_every}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payment_date">
                    Last Payment Date *
                  </label>
                  <input
                    type="date"
                    id="payment_date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the last payment date or preferred day of month. Next payment will be calculated automatically.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="details">
                    Details
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional details about this subscription..."
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update Subscription' : 'Add Subscription')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Content */}
        {viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className={getHeaderStyle("subscription_name")}
                      onClick={() => handleSort("subscription_name")}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon("subscription_name")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th
                      className={getHeaderStyle("price")}
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center">
                        Price
                        {getSortIcon("price")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Cost
                    </th>
                    <th
                      className={getHeaderStyle("payment_date")}
                      onClick={() => handleSort("payment_date")}
                    >
                      <div className="flex items-center">
                        Next Payment
                        {getSortIcon("payment_date")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm || billingFilter !== "all" ? "No matching subscriptions" : "No subscriptions found"}
                        </h3>
                        <p className="text-sm">
                          {searchTerm || billingFilter !== "all" 
                            ? "Try adjusting your search or filter criteria."
                            : "Click 'Add New Subscription' to get started!"
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sortedSubscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.subscription_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {subscription.details || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                            {formatCurrency(subscription.price)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getBillingPeriodBadge(subscription.billing_period, subscription.recurring_every)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-green-600">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            {formatCurrency(calculateMonthlyCost(subscription.price, subscription.billing_period, subscription.recurring_every))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className={`flex items-center ${isPaymentDueSoon(subscription.payment_date) ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(subscription.payment_date)}
                            {isPaymentDueSoon(subscription.payment_date) && (
                              <span className="ml-2 text-xs text-orange-500">Due soon</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(subscription)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              disabled={loading}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subscription.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                              disabled={loading}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSubscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subscription.subscription_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(subscription.payment_date)}
                      </p>
                    </div>
                  </div>
                  {getBillingPeriodBadge(subscription.billing_period, subscription.recurring_every)}
                </div>

                <div className="space-y-3 mb-6">
                  {subscription.details && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {subscription.details}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(subscription.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Cost:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(calculateMonthlyCost(subscription.price, subscription.billing_period, subscription.recurring_every))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next Payment:</span>
                    <div className={`text-sm font-medium ${isPaymentDueSoon(subscription.payment_date) ? 'text-orange-600' : 'text-gray-900'}`}>
                      {formatDate(subscription.payment_date)}
                      {isPaymentDueSoon(subscription.payment_date) && (
                        <span className="block text-xs text-orange-500">Due soon</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(subscription)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subscription.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {sortedSubscriptions.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <CreditCard className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || billingFilter !== "all" ? "No matching subscriptions" : "No subscriptions found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || billingFilter !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Click 'Add New Subscription' to get started!"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {sortedSubscriptions.length} of {subscriptions.length} subscriptions
          {searchTerm && ` matching "${searchTerm}"`}
          {billingFilter !== "all" && ` with billing period "${billingFilter}"`}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTracker;