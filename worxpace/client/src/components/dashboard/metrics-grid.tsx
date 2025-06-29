import { useQuery } from "@tanstack/react-query";
import { 
  MapPin, 
  Users, 
  CheckCircle, 
  Database, 
  Zap, 
  Heart 
} from "lucide-react";

const metricIcons = [
  { Icon: MapPin, color: "text-glow-cyan", shadowClass: "glow-cyan" },
  { Icon: Users, color: "text-glow-green", shadowClass: "glow-green" },
  { Icon: CheckCircle, color: "text-glow-purple", shadowClass: "glow-purple" },
  { Icon: Database, color: "text-glow-teal", shadowClass: "glow-teal" },
  { Icon: Zap, color: "text-glow-blue", shadowClass: "glow-blue" },
  { Icon: Heart, color: "text-glow-coral", shadowClass: "glow-coral" },
];

interface Metric {
  label: string;
  value: string;
  change?: string;
}

export default function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const displayMetrics: Metric[] = Array.isArray(metrics) ? metrics : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cornered-card p-3 sm:p-4 animate-pulse">
            <div className="h-3 sm:h-4 bg-white/10 mb-2"></div>
            <div className="h-6 sm:h-8 bg-white/10 mb-1"></div>
            <div className="h-2 sm:h-3 bg-white/10 w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {displayMetrics.map((metric, index) => {
        const { Icon, color, shadowClass } = metricIcons[index] || metricIcons[0];
        
        return (
          <div key={metric.label} className={`metric-card cornered-card p-3 sm:p-4 ${shadowClass}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-light text-gray-400 truncate">{metric.label}</h3>
              <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${color} flex-shrink-0`} />
            </div>
            <div className="text-lg sm:text-2xl font-light text-white">{metric.value}</div>
            <div className={`text-xs ${color} truncate`}>{metric.change}</div>
          </div>
        );
      })}
    </div>
  );
}
