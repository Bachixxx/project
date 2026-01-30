import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChartData {
    date: string;
    [key: string]: any;
}

export interface MetricConfig {
    id: string;
    label: string;
    color: string;
    unit: string;
}

interface BiometricTrendChartProps {
    data: ChartData[];
    metrics: MetricConfig[];
}

export function BiometricTrendChart({ data, metrics }: BiometricTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] w-full bg-white/5 rounded-3xl border border-white/10 text-gray-500">
                Pas assez de données pour afficher le graphique
            </div>
        );
    }

    // Sort data by date just in case
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/10 w-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-4 flex-wrap">
                {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }}></span>
                        <span className="text-sm">{metric.label}</span>
                    </div>
                ))}
            </h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={sortedData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            {metrics.map((metric) => (
                                <linearGradient key={metric.id} id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(str) => {
                                try {
                                    return format(new Date(str), 'd MMM', { locale: fr });
                                } catch (e) {
                                    return str;
                                }
                            }}
                            minTickGap={30}
                        />
                        {metrics.map((metric) => (
                            <YAxis
                                key={metric.id}
                                yAxisId={metric.id}
                                orientation="left"
                                stroke="#9ca3af"
                                tick={{ fill: metrics.length === 1 ? '#9ca3af' : metric.color, fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 'auto']}
                                tickFormatter={(value) => `${Math.round(value)}`}
                                width={30}
                                hide={metrics.length > 1}
                            />
                        ))}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '0.25rem' }}
                            formatter={(value: any, name: any) => {
                                // Find the metric config to get the unit
                                const metric = metrics.find(m => m.label === name);
                                return [`${value} ${metric?.unit || ''}`, name];
                            }}
                            labelFormatter={(label) => {
                                try {
                                    return format(new Date(label), 'd MMMM yyyy', { locale: fr });
                                } catch (e) {
                                    return label;
                                }
                            }}
                        />
                        {metrics.map((metric) => (
                            <Area
                                key={metric.id}
                                type="monotone"
                                dataKey={metric.id}
                                yAxisId={metric.id}
                                name={metric.label}
                                stroke={metric.color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#color-${metric.id})`}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
