import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

interface SLATimerProps {
    dueDate: string;
}

const SLATimer: React.FC<SLATimerProps> = ({ dueDate }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; isBreached: boolean }>({
        hours: 0,
        minutes: 0,
        isBreached: false
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const due = new Date(dueDate);
            const diff = due.getTime() - now.getTime();

            const isBreached = diff < 0;
            const absDiff = Math.abs(diff);

            // Calculate hours and minutes
            const hours = Math.floor(absDiff / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft({ hours, minutes, isBreached });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [dueDate]);

    if (timeLeft.isBreached) {
        return (
            <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-200" title={`SLA Breached by ${timeLeft.hours}h ${timeLeft.minutes}m`}>
                <AlertOctagon className="h-4 w-4 mr-2" />
                <span className="font-medium text-sm">
                    Breached: -{timeLeft.hours}h {timeLeft.minutes}m
                </span>
            </div>
        );
    }

    // Warning if less than 1 hour left
    const isWarning = timeLeft.hours < 1;

    return (
        <div className={`flex items-center px-3 py-1 rounded-md border ${isWarning ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-green-700 bg-green-50 border-green-200'}`} title={`SLA Due in ${timeLeft.hours}h ${timeLeft.minutes}m`}>
            {isWarning ? <AlertTriangle className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
            <span className="font-medium text-sm">
                SLA: {timeLeft.hours}h {timeLeft.minutes}m
            </span>
        </div>
    );
};

export default SLATimer;
