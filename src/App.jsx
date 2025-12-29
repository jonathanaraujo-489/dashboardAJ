import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Wallet } from 'lucide-react';

function App() {
  const [dados, setDados] = useState([]);
  const [saldoCofre, setSaldoCofre] = useState(0);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data inicial fixa em 2025-01-01 para garantir que os dados antigos apareçam
  const [dataInicio, setDataInicio] = useState('2025-01-01');
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

  const carregarDados = async () => {
    setLoading(true);
    // 1. Saldo do Cofre (Ignora datas para ser o Saldo Real)
    const { data: s } = await supabase.rpc('get_saldo_absoluto_cofre');
    setSaldoCofre(s || 0);

    // 2. Auditoria Operadores (Respeita o filtro de data)
    const { data: o } = await supabase.rpc('get_auditoria_completa', {
      data_inicio: `${dataInicio} 00:00:00`,
      data_fim: `${dataFim} 23:59:59`
    });
    if (o) setDados(o);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
    const sub = supabase.channel('estoque').on('postgres_changes', 
      { event: '*', schema: 'directus', table: 'controle_estoque' }, carregarDados).subscribe();
    return () => supabase.removeChannel(sub);
  }, [dataInicio, dataFim]);

  const consolidado = dados.reduce((acc, item) => {
    const id = item.dep_id;
    if (!acc[id]) acc[id] = { nome: item.dep_nome, setor: item.setor_nome, metal: { ent: 0, ret: 0, que: 0 }, pedras: { ent: 0, ret: 0, que: 0 } };
    
    const cat = item.cat_nome?.toLowerCase() || '';
    if (cat.includes('metal') || cat.includes('ouro')) {
      acc[id].metal.ent += item.ent; acc[id].metal.ret += item.ret; acc[id].metal.que += item.quebra;
    } else {
      acc[id].pedras.ent += item.ent; acc[id].pedras.ret += item.ret; acc[id].pedras.que += item.quebra;
    }
    return acc;
  }, {});

  const lista = Object.values(consolidado).filter(op => op.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <header className="bg-[#1a3a34] text-white p-6 rounded-t-[40px] flex justify-between items-center shadow-xl">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">ALISSON <span className="text-xs opacity-30">Industrial</span></h1>
        <div className="flex gap-4">
          <input type="date" className="bg-white/10 p-2 rounded-lg text-xs outline-none" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" className="bg-white/10 p-2 rounded-lg text-xs outline-none" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </header>

      <div className="bg-white p-8 rounded-b-[40px] shadow-2xl">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* CARD SALDO REAL (COFRE) */}
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-800 p-6 rounded-[35px] flex-1 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-green-800/40 uppercase italic">Saldo Real Ouro (Cofre)</span>
              <div className="text-5xl font-black text-green-900">{Number(saldoCofre).toFixed(3)}g</div>
            </div>
            <Wallet className="text-green-800" size={40} />
          </div>
          
          {/* BUSCA OPERADOR */}
          <div className="flex-1 bg-gray-50 rounded-[35px] p-6 border flex items-center gap-4">
            <Search className="text-gray-300" size={30} />
            <input type="text" placeholder="PESQUISAR OPERADOR..." className="bg-transparent w-full text-2xl font-black text-gray-800 uppercase outline-none" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-center italic">
                <th className="p-5 border-r text-left">Operador / Setor</th>
                {/* COLUNAS RESTAURADAS */}
                <th className="p-5 bg-yellow-50/20 text-yellow-700">Metal (Ent)</th>
                <th className="p-5 bg-yellow-50/20 text-yellow-700">Metal (Ret)</th>
                <th className="p-5 bg-red-50 text-red-700 border-r">Quebra Metal</th>
                <th className="p-5 bg-blue-50/20 text-blue-700">Pedras (Ent)</th>
                <th className="p-5 bg-blue-50/20 text-blue-700">Pedras (Ret)</th>
                <th className="p-5 bg-red-50 text-red-700">Quebra Pedras</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((op, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-all text-center">
                  <td className="p-5 border-r text-left">
                    <div className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">{op.nome}</div>
                    <span className="text-[9px] font-bold text-gray-300 uppercase block tracking-widest">{op.setor}</span>
                  </td>
                  {/* METAL COM 3 CASAS DECIMAIS */}
                  <td className="p-4 text-gray-400 font-bold">{op.metal.ent.toFixed(3)}g</td>
                  <td className="p-4 text-gray-400 italic">{op.metal.ret.toFixed(3)}g</td>
                  <td className={`p-4 border-r font-black text-3xl ${op.metal.que > 0 ? 'text-red-600' : 'text-gray-200'}`}>
                    {op.metal.que.toFixed(3)}g
                  </td>
                  {/* PEDRAS COM 2 CASAS */}
                  <td className="p-4 text-gray-400 font-bold">{op.pedras.ent.toFixed(2)}</td>
                  <td className="p-4 text-gray-400 italic">{op.pedras.ret.toFixed(2)}</td>
                  <td className={`p-4 font-black text-3xl ${op.pedras.que > 0 ? 'text-red-600' : 'text-gray-200'}`}>
                    {op.pedras.que.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;