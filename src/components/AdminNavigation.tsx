'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Quote, 
  Bell, 
  Palette, 
  CreditCard, 
  Settings, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Receipt,
  Calendar,
  DollarSign
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface MenuGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const AdminNavigation = () => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['clients', 'financial', 'system']));

  const toggleGroup = (groupName: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName);
    } else {
      newOpenGroups.add(groupName);
    }
    setOpenGroups(newOpenGroups);
  };

  const menuGroups: MenuGroup[] = [
    {
      name: 'Clients & Relationships',
      icon: Users,
      items: [
        {
          name: 'All Clients',
          href: '/admin/clients',
          icon: Users,
          description: 'Manage client relationships'
        },
        {
          name: 'New Client',
          href: '/admin/clients/new',
          icon: Users,
          description: 'Add a new client'
        },
        {
          name: 'Updates',
          href: '/admin/updates',
          icon: Bell,
          description: 'Client updates and notifications'
        }
      ]
    },
    {
      name: 'Financial Management',
      icon: DollarSign,
      items: [
        {
          name: 'Invoices',
          href: '/admin/invoices',
          icon: FileText,
          description: 'Manage invoices and payments'
        },
        {
          name: 'New Invoice',
          href: '/admin/invoices/new',
          icon: FileText,
          description: 'Create a new invoice'
        },
        {
          name: 'Receipts',
          href: '/admin/receipts',
          icon: Receipt,
          description: 'View payment receipts'
        },
        {
          name: 'Quotations',
          href: '/admin/quotations',
          icon: Quote,
          description: 'Manage quotations'
        },
        {
          name: 'New Quotation',
          href: '/admin/quotations/new',
          icon: Quote,
          description: 'Create a new quotation'
        },
        {
          name: 'Subscriptions',
          href: '/admin/subscriptions',
          icon: CreditCard,
          description: 'Track recurring subscriptions'
        }
      ]
    },
    {
      name: 'System & Settings',
      icon: Settings,
      items: [
        {
          name: 'Branding Settings',
          href: '/admin/branding',
          icon: Palette,
          description: 'Customize PDF branding'
        },
        {
          name: 'Tickets',
          href: '/admin/tickets',
          icon: FileText,
          description: 'Manage support tickets'
        },
        {
          name: 'Debug',
          href: '/admin/debug',
          icon: BarChart3,
          description: 'System debugging tools'
        }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-lg mr-3">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#01303F]">
          Navigation Menu
        </h2>
      </div>
      
      <div className="space-y-4">
        {menuGroups.map((group) => {
          const isOpen = openGroups.has(group.name.toLowerCase().replace(/\s+/g, '-'));
          
          return (
            <div key={group.name} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(group.name.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-lg mr-3">
                    <group.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-[#01303F]">{group.name}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              {isOpen && (
                <div className="bg-white">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <item.icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavigation; 