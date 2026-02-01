import { useAdaptyContext } from '../contexts/AdaptyContext';

// Re-exporting for backward compatibility with components using useAdapty
export function useAdapty() {
    return useAdaptyContext();
}
