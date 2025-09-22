import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  'Cadastros': '#60A5FA',    // blue-400
  'Elogios': '#34D399',      // emerald-400
  'Denúncias': '#F87171',    // red-400
  'Reclamações': '#FB923C',  // orange-400
  'Não conformidades': '#A78BFA',  // violet-400
  'Compras': '#8B5CF6',      // indigo-500
  'Comunicação': '#EC4899',  // pink-500
  'Diário': '#F59E0B',       // amber-500
  'Financeiro': '#10B981',   // emerald-500
  'Projetos': '#3B82F6',     // blue-500
  'Recepção': '#8B5A2B',     // brown-600
  'RH': '#059669',           // emerald-600
  'SGQ': '#7C3AED'           // violet-600
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="glass-effect rounded-lg p-4 shadow-xl border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="text-white/90 font-medium">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/80 text-sm">Quantidade</span>
            <span className="text-white font-medium">
              {data.value}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/80 text-sm">Porcentagem</span>
            <span className="text-white font-medium">
              {data.payload.percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-col gap-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/80 text-sm">{entry.value}</span>
          </div>
          <span className="text-white/90 font-medium text-sm">
            ({entry.payload.value})
          </span>
        </div>
      ))}
    </div>
  );
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  if (percent < 0.05) return null; // Don't show label for small segments
  
  return (
    <g>
      <path
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)
        }L${x},${y}`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1}
        fill="none"
      />
      <g>
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-xs font-medium"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    </g>
  );
};

export default function DistributionChart({ data = [], title = "Distribuição de Eventos" }) {
  // Calcular o total para as porcentagens
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Formatar os dados para o gráfico
  const chartData = data.map(item => ({
    name: item.category,
    value: item.count,
    percentage: ((item.count / total) * 100).toFixed(1)
  }));

  // Se não houver dados, renderizar estado vazio
  if (chartData.length === 0 || total === 0) {
    return (
      <div className="glass-card rounded-2xl h-full">
        <div className="p-4 lg:p-6 h-full flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
          <div className="flex-1 flex items-center justify-center flex-col">
            <svg className="w-16 h-16 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-white/50 text-center">Sem dados disponíveis</p>
            <p className="text-white/30 text-sm text-center mt-2">Cadastre dados para visualizar o gráfico</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl h-full">
      <div className="p-4 lg:p-6 h-full flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="45%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
                blendStroke
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                    fillOpacity={0.9}
                    strokeWidth={3}
                    stroke={COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={<CustomLegend />}
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  paddingLeft: '1rem',
                  paddingRight: '2rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 