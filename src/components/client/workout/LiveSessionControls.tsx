import { Play, Pause, CheckCircle, SkipForward, ChevronLeft } from 'lucide-react';

interface LiveSessionControlsProps {
    isActive: boolean;
    isResting: boolean;
    restTimeRemaining: number;
    totalDuration: number;
    onToggleTimer: () => void;
    onNext: () => void;
    onPrevious?: () => void;
    onFinish: () => void;
    isLastExercise: boolean;
}

export function LiveSessionControls({
    isActive,
    isResting,
    restTimeRemaining,
    totalDuration,
    onToggleTimer,
    onNext,
    onPrevious,
    onFinish,
    isLastExercise
}: LiveSessionControlsProps) {

    // Format seconds into MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent z-50 safe-area-bottom">
            <div className="max-w-md mx-auto flex items-center gap-4">

                {/* Previous Button */}
                {onPrevious && (
                    <button
                        onClick={onPrevious}
                        className="w-10 h-10 flex text-gray-400 hover:text-white justify-center items-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {/* Timer Display */}
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Durée</span>
                    <div className="font-mono text-xl font-bold text-white tabular-nums">
                        {formatTime(totalDuration)}
                    </div>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={isResting ? onNext : isLastExercise ? onFinish : onNext}
                    className={`
                        flex-1 h-14 rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                        ${isResting
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                            : isLastExercise
                                ? 'bg-green-500 hover:bg-green-400 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }
                    `}
                >
                    {isResting ? (
                        <>
                            <span>Repos: {formatTime(restTimeRemaining)}</span>
                            <SkipForward className="w-5 h-5" />
                        </>
                    ) : isLastExercise ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Terminer</span>
                        </>
                    ) : (
                        <>
                            <span>Prochain Set</span>
                            <Play className="w-5 h-5 fill-current" />
                        </>
                    )}
                </button>

                {/* Pause/Resume Mini Toggle */}
                <button
                    onClick={onToggleTimer}
                    className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/5"
                >
                    {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>

            </div>
        </div>
    );
}
