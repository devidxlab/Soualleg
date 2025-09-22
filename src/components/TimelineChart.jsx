import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const CustomTooltip = ({ active, payload, label, showSectors }) => {
  if (active && payload && payload.length) {
    // Calcular o total para todos os tipos de entradas
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    // Agrupar entre categorias padrão e setores
    const categorias = payload.filter(entry => 
      ['Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'].includes(entry.name)
    );
    
    const setores = showSectors ? payload.filter(entry => 
      ['Compras', 'Comunicação', 'Diário', 'Financeiro', 'Projetos', 'Recepção', 'RH', 'SGQ'].includes(entry.name)
    ) : [];
    
    return (
      <div className="glass-effect rounded-lg p-4 shadow-xl border border-white/20">
        <p className="text-white/90 font-medium mb-2">
          {new Date(label).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        
        {categorias.length > 0 && (
          <div className="space-y-1.5 mb-2">
            <p className="text-white/70 text-xs font-semibold mb-1">Categorias</p>
            {categorias.map((entry, index) => (
              entry.value > 0 && (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-white/80 text-sm">{entry.name}</span>
                  </div>
                  <span className="text-white font-medium text-sm">
                    {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              )
            ))}
          </div>
        )}
        
        {setores.length > 0 && (
          <div className="space-y-1.5 mb-2">
            <p className="text-white/70 text-xs font-semibold mb-1">Setores</p>
            {setores.map((entry, index) => (
              entry.value > 0 && (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-white/80 text-sm">{entry.name}</span>
                  </div>
                  <span className="text-white font-medium text-sm">
                    {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              )
            ))}
          </div>
        )}
        
        <div className="pt-2 mt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-white/90">
            <span className="font-medium">Total</span>
            <span className="font-bold">{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, showSectors }) => {
  if (!payload || payload.length === 0) return null;
  
  // Agrupar entre categorias padrão e setores
  const categorias = payload.filter(entry => 
    ['Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'].includes(entry.value)
  );
  
      const setores = showSectors ? payload.filter(entry => 
      ['Compras', 'Comunicação', 'Diário', 'Financeiro', 'Projetos', 'Recepção', 'RH', 'SGQ'].includes(entry.value)
    ) : [];
  
  // Layout diferente baseado em se estamos mostrando setores ou não
  if (!showSectors) {
    return (
      <div className="flex justify-center mt-2">
        <div className="flex flex-wrap justify-center gap-4">
          {categorias.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/80 text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Layout original para quando temos setores
  return (
    <div className="flex gap-8 justify-center mt-2">
      <div className="flex flex-col gap-2">
        <p className="text-white/70 text-xs font-semibold mb-1">Categorias</p>
        {categorias.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/80 text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
      
      {setores.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-white/70 text-xs font-semibold mb-1">Setores</p>
          {setores.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/80 text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TimelineChart({ data = [], title = "Timeline de Eventos" }) {
  // Verificar se temos dados válidos para exibir
  const hasData = Array.isArray(data) && data.length > 0;
  
  // Determinar se devemos mostrar setores baseado no título
  const showSectors = title.includes("Setor");
  
  // Se não houver dados, exibir estado vazio
  if (!hasData) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
          <div className="h-[300px] flex items-center justify-center flex-col">
            <svg className="w-16 h-16 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-white/50 text-center">Sem dados de timeline disponíveis</p>
            <p className="text-white/30 text-sm text-center mt-2">Cadastre eventos para visualizar a timeline</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Filtrar dados para remover setores se não estivermos mostrando eles
  const filteredKeys = showSectors 
    ? Object.keys(COLORS)
    : ['Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'];
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {Object.entries(COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip showSectors={showSectors} />} />
              <Legend content={<CustomLegend showSectors={showSectors} />} />
              {filteredKeys.map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={COLORS[key]}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#color${key})`}
                  animationBegin={0}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 