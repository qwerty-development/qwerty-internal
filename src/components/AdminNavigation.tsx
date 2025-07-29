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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-lg mr-3">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-[#01303F]">
          Navigation
        </h2>
      </div>
      
      <div className="space-y-2">
        {menuGroups.map((group) => {
          const isOpen = openGroups.has(group.name.toLowerCase().replace(/\s+/g, '-'));
          
          return (
            <div key={group.name} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(group.name.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-[#01303F] to-[#014a5f] rounded-lg mr-2">
                    <group.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-[#01303F] text-sm">{group.name}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {isOpen && (
                <div className="bg-white">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center p-2.5 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="p-1 bg-gray-100 rounded-lg mr-2">
                        <item.icon className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
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