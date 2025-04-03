import { useState } from 'react';
import { Itinerary } from '@/lib/types';
import { saveItinerary } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ItineraryCardProps {
  itinerary: Itinerary;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const handleSaveItinerary = async () => {
    setIsSaving(true);
    
    try {
      await saveItinerary(itinerary);
      
      toast({
        title: "Success",
        description: "Itinerary saved successfully!",
      });
    } catch (error) {
      console.error('Error saving itinerary:', error);
      
      toast({
        title: "Error",
        description: "Failed to save itinerary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="glass-lighter p-3 rounded-lg expand">
      <h3 className="text-white font-medium border-b border-[rgba(255,255,255,0.2)] pb-2 mb-2">
        {itinerary.title}
      </h3>
      
      <div className="space-y-4">
        {itinerary.days.map((day) => (
          <div key={day.day}>
            <h4 className="text-[#88CCEE] font-medium">Day {day.day}: {day.title}</h4>
            <ul className="space-y-2 mt-1 text-sm">
              {day.activities.map((activity, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-[#C4C4C4] mr-2">•</span>
                  <div>
                    <span className="text-white">{activity.time}:</span> 
                    <span className="text-[#C4C4C4]">{activity.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <button 
        className="w-full mt-3 bg-[#88CCEE] bg-opacity-20 hover:bg-opacity-30 text-[#88CCEE] py-1.5 rounded-md transition-all disabled:opacity-50"
        onClick={handleSaveItinerary}
        disabled={isSaving}
      >
        <i className="fas fa-save mr-1"></i> {isSaving ? 'Saving...' : 'Save Itinerary'}
      </button>
    </div>
  );
};

export default ItineraryCard;
