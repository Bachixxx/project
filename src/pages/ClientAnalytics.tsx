import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Calendar, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Bar, ComposedChart } from 'recharts';

function ClientAnalytics() {
  const { clientId } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [workoutData, setWorkoutData] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [dateRange, setDateRange] = useState('month'); // week, month, year, all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && clientId) {
      fetchClientData();
      fetchExercises();
    }
  }, [user, clientId]);

  useEffect(() => {
    if (selectedExercise) {
      fetchWorkoutData();
    }
  }, [selectedExercise, dateRange]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('coach_id', user?.id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      // First get all client programs
      const { data: clientPrograms, error: programsError } = await supabase
        .from('client_programs')
        .select(`
          id,
          program:programs (
            id,
            program_exercises (
              exercise:exercises (
                id,
                name,
                category,
                difficulty_level
              )
            )
          )
        `)
        .eq('client_id', clientId);

      if (programsError) throw programsError;

      // Then get all workout sessions for these programs
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('completed_exercises')
        .in('client_program_id', clientPrograms.map(cp => cp.id));

      if (sessionsError) throw sessionsError;

      // Extract unique exercises that have been used in workouts
      const exerciseMap = new Map();
      
      clientPrograms.forEach(cp => {
        cp.program.program_exercises.forEach(pe => {
          if (pe.exercise) {
            exerciseMap.set(pe.exercise.id, pe.exercise);
          }
        });
      });

      // Only keep exercises that have been used in workouts
      const usedExercises = new Set();
      sessions.forEach(session => {
        Object.keys(session.completed_exercises || {}).forEach(exerciseId => {
          usedExercises.add(exerciseId);
        });
      });

      const filteredExercises = Array.from(exerciseMap.values())
        .filter(exercise => usedExercises.has(exercise.id))
        .sort((a, b) => a.name.localeCompare(b.name));

      setExercises(filteredExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchWorkoutData = async () => {
    if (!selectedExercise) return;

    try {
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          date,
          completed_exercises,
          client_program:client_programs!inner (
            client_id
          )
        `)
        .eq('client_program.client_id', clientId)
        .order('date', { ascending: true });

      if (error) throw error;

      const processedData = processWorkoutData(sessions);
      setWorkoutData(processedData);
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWorkoutData = (sessions) => {
    return sessions.map(session => {
      const exerciseData = session.completed_exercises[selectedExercise.id];
      if (!exerciseData) return null;

      const maxWeight = Math.max(...exerciseData.sets.map(set => set.weight || 0));
      const totalVolume = exerciseData.sets.reduce((sum, set) => {
        return sum + (set.weight || 0) * (set.reps || 0);
      }, 0);

      return {
        date: new Date(session.date).toLocaleDateString(),
        maxWeight,
        totalVolume,
        sets: exerciseData.sets
      };
    }).filter(Boolean);
  };

  if (loading && !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            to={`/clients/${clientId}`}
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour au profil
          </Link>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Analyse des performances</h1>
            <div className="flex items-center gap-4">
              <select
                value={selectedExercise?.id || ''}
                onChange={(e) => {
                  const exercise = exercises.find(ex => ex.id === e.target.value);
                  setSelectedExercise(exercise);
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-lg border border-white/10 rounded-lg text-white"
              >
                <option value="">Sélectionner un exercice</option>
                {exercises.map(exercise => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-lg border border-white/10 rounded-lg text-white"
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="year">12 derniers mois</option>
                <option value="all">Tout l'historique</option>
              </select>
            </div>
          </div>
        </div>

        {selectedExercise ? (
          <div className="grid gap-6">
            {/* Graphique Poids et Volume */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Évolution du poids et du volume</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={workoutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="maxWeight" 
                      stroke="#3b82f6" 
                      name="Poids max (kg)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalVolume"
                      fill="#8b5cf6"
                      name="Volume total (kg)"
                      opacity={0.8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tableau des performances */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Détail des séances</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Poids max</th>
                      <th className="text-left py-3">Volume total</th>
                      <th className="text-left py-3">Séries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutData.map((session, index) => (
                      <tr key={index} className="border-b border-white/10">
                        <td className="py-3">{session.date}</td>
                        <td className="py-3">{session.maxWeight} kg</td>
                        <td className="py-3">{session.totalVolume} kg</td>
                        <td className="py-3">
                          {session.sets.map((set, idx) => (
                            <span key={idx} className="inline-block mr-4">
                              {set.weight}kg × {set.reps}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-12 text-center text-white/60">
            Sélectionnez un exercice pour voir son analyse détaillée
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientAnalytics;