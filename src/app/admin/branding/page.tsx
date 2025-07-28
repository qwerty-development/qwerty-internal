"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BrandingSettings } from "@/utils/brandingService";

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          PDF Branding Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Customize the appearance of all PDF documents (invoices, quotations,
          etc.)
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Branding settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
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
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Color Scheme
          </h2>

          {/* Color Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Color Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex space-x-2 mr-3">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: preset.secondary }}
                    ></div>
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: preset.accent }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color *
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  className="w-12 h-10 border border-gray-300 rounded-l-md"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) =>
                    handleChange("primary_color", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#01303F"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    handleChange("secondary_color", e.target.value)
                  }
                  className="w-12 h-10 border border-gray-300 rounded-l-md"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    handleChange("secondary_color", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#014a5f"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={branding.accent_color}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-l-md"
                />
                <input
                  type="text"
                  value={branding.accent_color}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#059669"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Typography
          </h2>
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
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
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
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Save Branding Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
