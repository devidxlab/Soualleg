const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300'
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-300'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300'
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300'
  }
};

export default function StatusCard({ icon: Icon, title, value, subtitle, percentage, color = 'emerald' }) {
  const classes = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="glass-card rounded-xl">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${classes.bg} rounded-lg backdrop-blur-lg`}>
            <Icon className={`w-5 h-5 ${classes.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-white/70 truncate">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white truncate">{value}</span>
              {percentage !== undefined && (
                <span className={`text-xs ${classes.text} flex-shrink-0`}>
                  {percentage > 0 ? '+' : ''}{percentage}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 