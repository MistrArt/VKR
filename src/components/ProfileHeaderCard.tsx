import React from 'react';
import { User as UserIcon } from 'lucide-react';

export interface ProfileHeaderAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export interface ProfileHeaderDetail {
  label: string;
  value: string;
}

interface ProfileHeaderCardProps {
  avatarUrl?: string;
  avatarAlt?: string;
  title: string;
  subtitle?: string;
  details?: ProfileHeaderDetail[];
  roleBadge: string;
  actions: ProfileHeaderAction[];
}

export default function ProfileHeaderCard({
  avatarUrl,
  avatarAlt,
  title,
  subtitle,
  details = [],
  roleBadge,
  actions,
}: ProfileHeaderCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={avatarAlt || title} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-12 w-12" />
            )}
          </div>
          <div className="flex-1 min-w-0 w-full text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 break-words">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 text-sm font-medium mt-1 break-words">{subtitle}</p>
            )}
            <div className="mt-2 space-y-0.5 text-sm text-gray-500">
              {details.map((row) => (
                <p key={row.label} className="break-words">
                  <span className="text-gray-400">{row.label}: </span>
                  {row.value}
                </p>
              ))}
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-3">
              {roleBadge}
            </span>
          </div>
        </div>

        <div
          className={`grid gap-3 w-full ${
            actions.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : actions.length >= 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-1'
          }`}
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className={`inline-flex justify-center items-center w-full px-4 py-2.5 border shadow-sm text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                action.variant === 'danger'
                  ? 'border-transparent text-white bg-red-600 hover:bg-red-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="mr-2 shrink-0">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
