import AgendaCalendario from '@/components/agenda/AgendaCalendario'

export default function AgendaPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800">Agenda</h1>
        <p className="text-sm text-gray-400 mt-0.5">Visualização de agendamentos por dia e semana</p>
      </div>
      <AgendaCalendario />
    </div>
  )
}
