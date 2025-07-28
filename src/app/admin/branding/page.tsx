"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BrandingSettings } from "@/utils/brandingService";
import {
  Palette,
  Eye,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function BrandingSettingsPage() {
  const supabase = createClient();
  const [branding, setBranding] = useState<BrandingSettings>({
    company_name: "QWERTY",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    primary_color: "#01303F",
    secondary_color: "#014a5f",
    accent_color: "#059669",
    font_family: "Arial, sans-serif",
    logo_url: "",
    footer_text: "Thank you for your business!",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch branding settings on component mount
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await fetch("/api/branding");
        const data = await response.json();

        if (data.success) {
          setBranding(data.branding);
        } else {
          console.error("Failed to fetch branding:", data.error);
        }
      } catch (error) {
        console.error("Error fetching branding:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  // Handle form field changes
  const handleChange = (field: keyof BrandingSettings, value: string) => {
    setBranding((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branding),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to save branding settings");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Color presets
  const colorPresets = [
    {
      name: "QWERTY Blue",
      primary: "#01303F",
      secondary: "#014a5f",
      accent: "#059669",
    },
    {
      name: "Professional Blue",
      primary: "#2563eb",
      secondary: "#3b82f6",
      accent: "#1d4ed8",
    },
    {
      name: "Corporate Green",
      primary: "#059669",
      secondary: "#10b981",
      accent: "#047857",
    },
    {
      name: "Modern Purple",
      primary: "#7c3aed",
      secondary: "#8b5cf6",
      accent: "#6d28d9",
    },
    {
      name: "Classic Red",
      primary: "#dc2626",
      secondary: "#ef4444",
      accent: "#b91c1c",
    },
    {
      name: "Elegant Gray",
      primary: "#374151",
      secondary: "#6b7280",
      accent: "#1f2937",
    },
  ];

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setBranding((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl mr-4">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              PDF Branding Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Customize the appearance of all PDF documents (invoices,
              quotations, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Branding settings saved successfully!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Changes will apply to all new PDF documents
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Please check your input and try again
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Company Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={branding.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={branding.logo_url}
                onChange={(e) => handleChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                value={branding.company_address}
                onChange={(e) =>
                  handleChange("company_address", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Business Street&#10;City, State 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Phone
              </label>
              <input
                type="tel"
                value={branding.company_phone}
                onChange={(e) => handleChange("company_phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Email
              </label>
              <input
                type="email"
                value={branding.company_email}
                onChange={(e) => handleChange("company_email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Website
              </label>
              <input
                type="url"
                value={branding.company_website}
                onChange={(e) =>
                  handleChange("company_website", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Color Scheme
            </h2>
          </div>

          {/* Color Presets */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Quick Color Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="group flex items-center p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50"
                >
                  <div className="flex space-x-2 mr-4">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: preset.secondary }}
                    ></div>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: preset.accent }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Color *
              </label>
              <div className="flex shadow-sm">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  className="w-14 h-12 border border-gray-300 rounded-l-lg cursor-pointer hover:border-gray-400 transition-colors"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                  placeholder="#01303F"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Secondary Color
              </label>
              <div className="flex shadow-sm">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    handleChange("secondary_color", e.target.value)
                  }
                  className="w-14 h-12 border border-gray-300 rounded-l-lg cursor-pointer hover:border-gray-400 transition-colors"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    handleChange("secondary_color", e.target.value)
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                  placeholder="#014a5f"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Accent Color
              </label>
              <div className="flex shadow-sm">
                <input
                  type="color"
                  value={branding.accent_color}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="w-14 h-12 border border-gray-300 rounded-l-lg cursor-pointer hover:border-gray-400 transition-colors"
                />
                <input
                  type="text"
                  value={branding.accent_color}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                  placeholder="#059669"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Typography</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={branding.font_family}
                onChange={(e) => handleChange("font_family", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Courier New, monospace">Courier New</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer Text
              </label>
              <input
                type="text"
                value={branding.footer_text}
                onChange={(e) => handleChange("footer_text", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Thank you for your business!"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg mr-3">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Live Preview
            </h2>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div
              className="text-center mb-4 pb-4"
              style={{ borderBottom: `2px solid ${branding.primary_color}` }}
            >
              {branding.logo_url && (
                <div className="mb-2">
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    className="h-12 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: branding.primary_color }}
              >
                {branding.company_name}
              </div>
              {(branding.company_address ||
                branding.company_phone ||
                branding.company_email ||
                branding.company_website) && (
                <div className="text-xs text-gray-600 mb-2">
                  {[
                    branding.company_address,
                    branding.company_phone,
                    branding.company_email,
                    branding.company_website,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              )}
              <div className="text-lg text-gray-600 mb-1">INVOICE</div>
              <div className="text-base font-bold text-gray-800">INV-001</div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                This preview shows how your branding will appear on PDF
                documents.
              </p>
              <p className="mt-2">Primary color: {branding.primary_color}</p>
              <p>Secondary color: {branding.secondary_color || "Not set"}</p>
              <p>Accent color: {branding.accent_color || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-md font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Branding Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
