import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { api } from '../services/api';
import { isAuthenticated } from '../utils/auth';

interface SaveButtonProps {
    internshipId: number;
    className?: string;
}

export function SaveButton({ internshipId, className = '' }: SaveButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
        if (isAuthenticated()) {
            checkSavedStatus();
        }
    }, [internshipId]);

    const checkSavedStatus = async () => {
        try {
            const response = await api.users.checkIfSaved(internshipId);
            setIsSaved(response.is_saved);
        } catch (error) {
            console.error('Error checking saved status:', error);
        }
    };

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation when clicking the button
        e.stopPropagation();

        if (!isLoggedIn) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }

        setIsLoading(true);
        try {
            if (isSaved) {
                await api.users.unsaveInternship(internshipId);
                setIsSaved(false);
            } else {
                await api.users.saveInternship(internshipId);
                setIsSaved(true);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) {
        return null; // Don't show button if not logged in
    }

    return (
        <button
            onClick={handleToggleSave}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-all ${isSaved
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            title={isSaved ? 'Unsave internship' : 'Save internship'}
        >
            <Bookmark
                className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
            />
        </button>
    );
}
