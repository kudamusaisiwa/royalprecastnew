import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useActivityStore } from '../../store/activityStore';
import ActivityIcon from '../activities/ActivityIcon';

export default function ActivitiesCard() {
  const { activities } = useActivityStore();
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activities</h2>
        <Link
          to="/activities"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {recentActivities.map((activity, idx) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {idx !== recentActivities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700">
                      <ActivityIcon type={activity.type} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.createdAt.toLocaleString()} by {activity.userName}
                      </p>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}