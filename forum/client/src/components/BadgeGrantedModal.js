import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { BADGE_BY_SLUG } from '../utils/badgeData';

export default function BadgeGrantedModal() {
  const navigate = useNavigate();
  const newBadges = useAuthStore((state) => state.newBadges);
  const clearNewBadges = useAuthStore((state) => state.clearNewBadges);

  if (!newBadges || newBadges.length === 0) return null;

  const badgeObjects = newBadges
    .map((slug) => BADGE_BY_SLUG[slug])
    .filter(Boolean);

  const handleViewBadges = () => {
    clearNewBadges();
    navigate('/badges');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={clearNewBadges}
      />

      {/* Modal card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center">

        {/* Close button */}
        <button
          onClick={clearNewBadges}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Star burst icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          {badgeObjects.length === 1 ? 'You earned a badge!' : `You earned ${badgeObjects.length} badges!`}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Congratulations on your achievement!
        </p>

        {/* Badge list */}
        <div className="space-y-2 mb-6">
          {badgeObjects.map((badge) => {
            const resolvedColor = badge.iconColor || badge.color || 'text-amber-500';
            return (
              <div
                key={badge.slug}
                className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-600 ${resolvedColor}`}>
                  <svg
                    className="w-4.5 h-4.5 w-[18px] h-[18px]"
                    fill={badge.iconFill ? 'currentColor' : 'none'}
                    stroke={badge.iconFill ? 'none' : 'currentColor'}
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={badge.iconPath} />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{badge.name}</p>
                  {badge.desc && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug truncate">{badge.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearNewBadges}
            className="flex-1 py-2.5 rounded-full text-[13px] font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleViewBadges}
            className="flex-1 py-2.5 rounded-full text-[13px] font-semibold bg-[#50ba4b] text-white hover:bg-[#45a340] transition-colors"
          >
            View Badges
          </button>
        </div>
      </div>
    </div>
  );
}
