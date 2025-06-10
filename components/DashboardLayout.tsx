'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Upload, 
  BarChart3, 
  MessageSquare, 
  Calendar, 
  User, 
  LogOut,
  Brain,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  FileText,
  Users,
  TrendingUp,
  Briefcase,
  Target,
  FormInput
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  { 
    href: '/forms', 
    label: 'Application Forms', 
    icon: FormInput,
    description: 'Create custom forms'
  },
  { 
    href: '/upload', 
    label: 'Screen Resumes', 
    icon: Upload,
    description: 'Add new candidates'
  },
  { 
    href: '/resume-list', 
    label: 'Resume Database', 
    icon: FileText,
    description: 'View all resumes'
  },
  { 
    href: '/candidates', 
    label: 'Track Applications', 
    icon: Users,
    description: 'Track applications'
  },
  { 
    href: '/dashboard/interviews', 
    label: 'Interview Results', 
    icon: Calendar,
    description: 'AI interview outcomes'
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Using a static user for demo mode as authentication is not required now
  const currentUser = {
    email: 'demo@hireez.com',
    user_metadata: { full_name: 'Demo User' }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 z-50 w-72 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-xl">Hire EZ</span>
                </div>
                <p className="text-xs text-gray-500">
                  Demo Mode
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`
                      group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      w-5 h-5 mr-3 transition-colors
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                    `} />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`
                        text-xs mt-0.5
                        ${isActive ? 'text-blue-100' : 'text-gray-500'}
                      `}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 truncate max-w-[140px]">
                      {currentUser.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      Demo User
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="#" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="#" className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out (Demo)</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 z-40 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search candidates, skills, or interviews..."
              className="pl-10 w-80"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              3
            </Badge>
          </Button>
          <div className="hidden sm:flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full bg-yellow-500`}></div>
            <span className="text-gray-600">
              Demo Mode Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="h-full pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}