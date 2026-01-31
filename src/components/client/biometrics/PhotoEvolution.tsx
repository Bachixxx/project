import React, { useState, useEffect } from 'react';
import { Camera, Grid, Columns, Plus, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
// Removed useClientAuth import
import { ComparisonSlider } from './ComparisonSlider';
import { UploadPhotoModal } from './UploadPhotoModal';
import { PhotoPrivacySettings } from './PhotoPrivacySettings';

interface ClientPhoto {
    id: string;
    photo_url: string;
    pose: 'front' | 'side' | 'back';
    date: string;
}

interface PhotoEvolutionProps {
    clientId: string;
}

export function PhotoEvolution({ clientId }: PhotoEvolutionProps) {
    // const { client } = useClientAuth(); // Removed context usage
    const [photos, setPhotos] = useState<ClientPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'gallery' | 'comparison'>('gallery');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Comparison State
    const [selectedPose, setSelectedPose] = useState<'front' | 'side' | 'back'>('front');
    const [beforePhotoId, setBeforePhotoId] = useState<string>('');
    const [afterPhotoId, setAfterPhotoId] = useState<string>('');

    const fetchPhotos = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('client_photos')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false });

            if (error) throw error;
            setPhotos(data || []);
        } catch (err) {
            console.error('Error fetching photos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [clientId]);

    // Auto-select photos for comparison when pose changes or photos load
    useEffect(() => {
        if (viewMode === 'comparison') {
            const posePhotos = photos.filter(p => p.pose === selectedPose).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (posePhotos.length >= 2) {
                // Default: First vs Last
                if (!beforePhotoId) setBeforePhotoId(posePhotos[0].id); // Oldest
                if (!afterPhotoId) setAfterPhotoId(posePhotos[posePhotos.length - 1].id); // Newest
            }
        }
    }, [viewMode, selectedPose, photos]);

    const handleDelete = async (photoId: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette photo ?')) return;

        try {
            // 1. Delete DB record
            const { error: dbError } = await supabase
                .from('client_photos')
                .delete()
                .eq('id', photoId);

            if (dbError) throw dbError;

            // 2. Delete from storage (optional cleanup)
            // Ideally we would delete from bucket too, but we need the correct path. 
            // Since RLS policies might be tricky for exact path matching of "public" urls, 
            // we skip explicit bucket deletion for now (Supabase doesn't auto-delete).

            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err) {
            console.error('Delete error', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Chargement des photos...</div>;

    const posePhotos = photos.filter(p => p.pose === selectedPose).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const beforePhoto = photos.find(p => p.id === beforePhotoId);
    const afterPhoto = photos.find(p => p.id === afterPhotoId);

    return (
        <div className="space-y-6">
            <UploadPhotoModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={fetchPhotos}
                clientId={clientId}
            />

            {/* Header Controls */}
            <div className="flex flex-col gap-4">
                {/* Privacy Badge/Settings */}
                <PhotoPrivacySettings clientId={clientId} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setViewMode('gallery')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gallery' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Grid className="w-4 h-4" />
                            Galerie
                        </button>
                        <button
                            onClick={() => setViewMode('comparison')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'comparison' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Columns className="w-4 h-4" />
                            Comparaison
                        </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                            <button onClick={() => setSelectedPose('front')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${selectedPose === 'front' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Face</button>
                            <button onClick={() => setSelectedPose('side')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${selectedPose === 'side' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Profil</button>
                            <button onClick={() => setSelectedPose('back')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${selectedPose === 'back' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Dos</button>
                        </div>

                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {photos.length === 0 ? (
                    <div className="glass-card p-12 text-center border border-dashed border-white/20 rounded-3xl flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Camera className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Aucune photo pour le moment</h3>
                        <p className="text-gray-400 max-w-sm mx-auto mb-8">Commencez à documenter votre transformation en ajoutant votre première photo.</p>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter une photo
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {viewMode === 'gallery' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {photos
                                    .filter(p => p.pose === selectedPose)
                                    .map(photo => (
                                        <div key={photo.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/10">
                                            <img src={photo.photo_url} alt={photo.pose} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-white font-medium text-sm flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-blue-400" />
                                                    {new Date(photo.date).toLocaleDateString()}
                                                </p>
                                                <button
                                                    onClick={() => handleDelete(photo.id)}
                                                    className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-400">Ajouter</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {posePhotos.length < 2 ? (
                                    <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10">
                                        <p className="text-gray-300">Il faut au moins 2 photos avec la pose "{selectedPose}" pour comparer.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Main Comparison Area */}
                                        <div className="lg:col-span-2">
                                            {beforePhoto && afterPhoto && (
                                                <ComparisonSlider
                                                    beforeImage={beforePhoto.photo_url}
                                                    afterImage={afterPhoto.photo_url}
                                                    beforeDate={beforePhoto.date}
                                                    afterDate={afterPhoto.date}
                                                />
                                            )}
                                        </div>

                                        {/* Controls Sidebar */}
                                        <div className="space-y-6">
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Sélection</h3>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-blue-400 font-bold uppercase">Photo "Avant"</label>
                                                        <select
                                                            value={beforePhotoId}
                                                            onChange={(e) => setBeforePhotoId(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                                        >
                                                            {posePhotos.map(p => (
                                                                <option key={p.id} value={p.id}>{new Date(p.date).toLocaleDateString()}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <div className="p-2 bg-white/10 rounded-full">
                                                            <ChevronRight className="w-4 h-4 text-white/50 rotate-90 lg:rotate-0" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs text-emerald-400 font-bold uppercase">Photo "Après"</label>
                                                        <select
                                                            value={afterPhotoId}
                                                            onChange={(e) => setAfterPhotoId(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                                                        >
                                                            {posePhotos.map(p => (
                                                                <option key={p.id} value={p.id}>{new Date(p.date).toLocaleDateString()}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20">
                                                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                    Astuce Pro
                                                </h4>
                                                <p className="text-sm text-blue-200/80">
                                                    Pour une comparaison optimale, essayez de garder le même éclairage, la même distance et les mêmes vêtements sur chaque photo.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
        </div>
            );
}
