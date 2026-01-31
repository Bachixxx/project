import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Calendar, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
// Removed useClientAuth import

interface UploadPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId: string;
}

export function UploadPhotoModal({ isOpen, onClose, onSuccess, clientId }: UploadPhotoModalProps) {
    // const { client } = useClientAuth(); // Removed context usage
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pose, setPose] = useState<'front' | 'side' | 'back'>('front');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("L'image est trop volumineuse (max 5 Mo)");
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!file || !clientId) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${clientId}/${Date.now()}_${pose}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('client_progress_photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('client_progress_photos')
                .getPublicUrl(fileName);

            // 3. Save to DB
            const { error: dbError } = await supabase
                .from('client_photos')
                .insert({
                    client_id: clientId,
                    photo_url: publicUrl,
                    pose,
                    date
                });

            if (dbError) throw dbError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || "Erreur lors de l'upload");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white">Ajouter une photo</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Image Preview / Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${previewUrl ? 'border-blue-500/50' : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
                            }`}
                    >
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm">
                                        <Camera className="w-4 h-4" />
                                        Changer la photo
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-white font-medium mb-1">Cliquez pour ajouter une photo</p>
                                <p className="text-sm text-gray-400">JPG, PNG (max 5 Mo)</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Pose Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Pose</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'front', label: 'Face' },
                                { id: 'side', label: 'Profil' },
                                { id: 'back', label: 'Dos' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPose(p.id as any)}
                                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${pose === p.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!file || loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Enregistrer la photo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
