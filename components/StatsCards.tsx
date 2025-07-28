'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Globe, 
  Phone, 
  Star, 
  TrendingUp,
  Users
} from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    withWebsite: number;
    withPhone: number;
    avgRating: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Businesses',
      value: stats.total.toLocaleString(),
      icon: Building,
      color: 'primary',
      description: 'Businesses found'
    },
    {
      title: 'With Websites',
      value: stats.withWebsite.toLocaleString(),
      percentage: stats.total > 0 ? Math.round((stats.withWebsite / stats.total) * 100) : 0,
      icon: Globe,
      color: 'success',
      description: `${stats.total > 0 ? Math.round((stats.withWebsite / stats.total) * 100) : 0}% have websites`
    },
    {
      title: 'With Phone Numbers',
      value: stats.withPhone.toLocaleString(),
      percentage: stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0,
      icon: Phone,
      color: 'warning',
      description: `${stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}% have phone numbers`
    },
    {
      title: 'Average Rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A',
      icon: Star,
      color: 'secondary',
      description: stats.avgRating > 0 ? 'Out of 5 stars' : 'No ratings available'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      primary: {
        bg: 'bg-primary-50',
        icon: 'text-primary-600',
        text: 'text-primary-900',
        border: 'border-primary-200'
      },
      success: {
        bg: 'bg-success-50',
        icon: 'text-success-600',
        text: 'text-success-900',
        border: 'border-success-200'
      },
      warning: {
        bg: 'bg-warning-50',
        icon: 'text-warning-600',
        text: 'text-warning-900',
        border: 'border-warning-200'
      },
      secondary: {
        bg: 'bg-secondary-50',
        icon: 'text-secondary-600',
        text: 'text-secondary-900',
        border: 'border-secondary-200'
      }
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const colorClasses = getColorClasses(card.color);
        const Icon = card.icon;
        
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card ${colorClasses.border} ${colorClasses.bg} hover:shadow-medium transition-all duration-200`}
          >
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                  <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
                </div>
                {card.percentage !== undefined && (
                  <div className="text-right">
                    <div className={`text-sm font-medium ${colorClasses.text}`}>
                      {card.percentage}%
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-secondary-600 uppercase tracking-wide">
                  {card.title}
                </h3>
                <div className={`text-2xl font-bold ${colorClasses.text}`}>
                  {card.value}
                </div>
                <p className="text-sm text-secondary-500">
                  {card.description}
                </p>
              </div>

              {/* Progress bar for percentage stats */}
              {card.percentage !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                      className={`h-2 rounded-full ${
                        card.color === 'success' 
                          ? 'bg-success-600' 
                          : card.color === 'warning'
                          ? 'bg-warning-600'
                          : 'bg-primary-600'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Special indicator for rating */}
              {card.title === 'Average Rating' && stats.avgRating > 0 && (
                <div className="mt-4 flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.avgRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-secondary-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
} 