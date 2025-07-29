'use client'
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Calendar, Clock, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your actual URL and anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      setSubscriptions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load subscriptions on component mount and set up auto-update
  useEffect(() => {
    fetchSubscriptions();
    
    // Check for payment date updates every hour
    const interval = setInterval(updatePaymentDates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Update payment dates when subscriptions change
  useEffect(() => {
    if (subscriptions.length > 0) {
      updatePaymentDates();
    }
  }, [subscriptions.length]);

  // Calculate monthly cost for a subscription
  const calculateMonthlyCost = (price: number, billingPeriod: 'monthly' | 'annually', recurringEvery: number) => {
    if (billingPeriod === 'monthly') {
      return price / recurringEvery;
    } else if (billingPeriod === 'annually') {
      return (price / recurringEvery) / 12;
    }
    return 0;
  };

  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions.reduce((total, sub: Subscription) => {
    return total + calculateMonthlyCost(
      sub.price,
      sub.billing_period,
      sub.recurring_every
    );
  }, 0);

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
    setLoading(true);
    await updatePaymentDates();
    setLoading(false);
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

  if (loading && subscriptions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Tracker</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefreshPaymentDates}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Refresh payment dates"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Monthly Cost</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalMonthlyCost)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-xl font-semibold text-gray-900">{subscriptions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalMonthlyCost)}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Annual Cost</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalMonthlyCost * 12)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Button */}
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Subscription</span>
          </button>
        )}

        {/* Add/Edit Form */}
        {isAddingNew && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional details about this subscription..."
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update Subscription' : 'Add Subscription')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="bg-white rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Your Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No subscriptions added yet.</p>
              <p>Click "Add New Subscription" to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Billing</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Monthly Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Next Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {subscription.subscription_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {subscription.details || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(subscription.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Every {subscription.recurring_every} {subscription.billing_period === 'monthly' ? 'month(s)' : 'year(s)'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatCurrency(calculateMonthlyCost(subscription.price, subscription.billing_period, subscription.recurring_every))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className={`${isPaymentDueSoon(subscription.payment_date) ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                          {formatDate(subscription.payment_date)}
                          {isPaymentDueSoon(subscription.payment_date) && (
                            <span className="block text-xs text-orange-500">Due soon</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(subscription)}
                            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                            aria-label={`Edit ${subscription.subscription_name}`}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subscription.id)}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                            aria-label={`Delete ${subscription.subscription_name}`}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTracker;