import React, { useState } from 'react';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { SessionSelector } from '../components/SessionSelector';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  Target,
  Users
} from 'lucide-react';
import { ShareProgramModal } from '../components/ShareProgramModal';

import { useSubscription } from '../hooks/useSubscription';
import { useCoachPrograms, Program, ProgramSession } from '../hooks/useCoachPrograms';

// --- Main Page Component ---

function ProgramsPage() {
  const { subscriptionInfo } = useSubscription();
  const { programs, isLoading: loading, error: queryError, saveProgram, deleteProgram } = useCoachPrograms();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [programToShare, setProgramToShare] = useState<Program | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  const canCreateProgram = subscriptionInfo?.type === 'paid' || (programs?.length || 0) < 5;

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const error = opError || (queryError ? 'Failed to load programs' : null);

  return (
    <div className="p-6 max-w-[2000px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Programmes</h1>
          <p className="text-gray-400">
            {programs.length} Programmes Created
          </p>
        </div>
        <button
          onClick={() => {
            if (!canCreateProgram) {
              alert('Vous avez atteint la limite de 5 programmes pour le plan gratuit. Passez à la version Pro pour créer des programmes illimités.');
              return;
            }
            setSelectedProgram(null);
            setIsModalOpen(true);
          }}
          className={`primary-button flex items-center justify-center gap-2 ${!canCreateProgram ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={!canCreateProgram}
        >
          <Plus className="w-5 h-5" />
          <span>Créer un programme</span>
        </button>
      </div>

      {subscriptionInfo?.type === 'free' && (
        <div className="glass-card p-4 border-l-4 border-yellow-500 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-500">Limitations du compte gratuit</h3>
              <p className="text-gray-400 text-sm mt-1">
                Vous pouvez créer jusqu'à 5 programmes avec votre compte gratuit.
                Vous avez créé {programs.length} programme{programs.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-500/5 text-white">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-card p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des programmes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="glass-card p-6 group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{program.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock className="w-3 h-3 mr-1" />
                      {program.duration_weeks} sem
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${program.difficulty_level === 'Débutant'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : program.difficulty_level === 'Intermédiaire'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      <Target className="w-3 h-3 mr-1" />
                      {program.difficulty_level}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setProgramToShare(program);
                      setIsShareModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Partager le programme"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
                        try {
                          await deleteProgram.mutateAsync(program.id);
                        } catch (error) {
                          console.error('Error deleting program:', error);
                          setOpError('Failed to delete program. Please try again.');
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                {program.description || "Aucune description"}
              </p>

              <div className="mt-auto space-y-4">
                <div className="border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Séances incluses</span>
                    <span className="font-semibold text-white">{program.program_sessions?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProgramModal
          program={selectedProgram}
          onClose={() => setIsModalOpen(false)}
          onSave={async (programData: any, selectedSessions: any[]) => {
            try {
              setOpError(null);
              await saveProgram.mutateAsync({
                programData,
                selectedSessions,
                programId: selectedProgram?.id
              });
              setIsModalOpen(false);
            } catch (error: any) {
              console.error('Error saving program:', error);
              setOpError('Failed to save program. Please try again.');
              if (error.message && error.message.includes('Free plan is limited')) {
                alert('Vous avez atteint la limite de 5 programmes pour le plan gratuit. Passez à la version Pro pour créer des programmes illimités.');
              }
            }
          }}
        />
      )}

      {isShareModalOpen && programToShare && (
        <ShareProgramModal
          program={programToShare}
          onClose={() => {
            setIsShareModalOpen(false);
            setProgramToShare(null);
          }}
          onSuccess={() => {
            alert('Programme partagé avec succès !');
          }}
        />
      )}
    </div>
  );
}

// --- Program Modal ---

function ProgramModal({ program, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    description: program?.description || '',
    duration_weeks: program?.duration_weeks || 4,
    difficulty_level: program?.difficulty_level || 'Débutant',
    price: null,
    is_public: false,
  });
  const [selectedSessions, setSelectedSessions] = useState<ProgramSession[]>(
    program?.program_sessions || []
  );
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        name === 'duration_weeks' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSessions.length === 0) {
      setError('Vous devez ajouter au moins une séance au programme.');
      return;
    }

    onSave(formData, selectedSessions);
  };

  const footer = (
    <div className="flex justify-end gap-4 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors touch-target"
      >
        Annuler
      </button>
      <button
        type="submit"
        form="program-form"
        disabled={selectedSessions.length === 0}
        className="primary-button disabled:opacity-50 touch-target"
      >
        {program ? 'Mettre à jour' : 'Créer'}
      </button>
    </div>
  );

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title={program ? 'Modifier le programme' : 'Créer un programme'}
      footer={footer}
    >
      {error && (
        <div className="p-4 rounded-lg mb-6 bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <form id="program-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input-field"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-300">
              Séances <span className="text-primary-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors touch-target"
            >
              <Plus className="w-4 h-4" />
              Ajouter une séance
            </button>
          </div>

          {selectedSessions.length === 0 && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Vous devez ajouter au moins une séance.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {selectedSessions.map((ps: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{ps.session.name}</h4>
                  <p className="text-sm text-gray-400">
                    {ps.session.difficulty_level} • {ps.session.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newSessions = [...selectedSessions];
                      if (index > 0) {
                        [newSessions[index], newSessions[index - 1]] = [newSessions[index - 1], newSessions[index]];
                        setSelectedSessions(newSessions);
                      }
                    }}
                    className={`p-1 rounded transition-colors ${index > 0 ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
                    disabled={index === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newSessions = selectedSessions.filter((_, i) => i !== index);
                      setSelectedSessions(newSessions);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors touch-target"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      {showSessionModal && (
        <SessionSelector
          onSelect={(session: any) => {
            setSelectedSessions([
              ...selectedSessions,
              {
                id: `temp-${Date.now()}`,
                session,
                order_index: selectedSessions.length,
              },
            ]);
            setShowSessionModal(false);
          }}
          onClose={() => setShowSessionModal(false)}
        />
      )}
    </ResponsiveModal>
  );
}

export default ProgramsPage;